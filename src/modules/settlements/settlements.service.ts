import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { PartyType } from '../../common/enums/party-type.enum';
import { SettlementStatus } from '../../common/enums/settlement-status.enum';
import { REVENUE_SPLIT_BASIS_POINTS } from '../../common/constants/revenue-split.constants';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PlayEvent } from '../play-events/entities/play-event.entity';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { SettlementAllocation } from './entities/settlement-allocation.entity';
import { SettlementBatch } from './entities/settlement-batch.entity';

const SETTLEMENT_COMPLETED_EVENT = 'SETTLEMENT_COMPLETED';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly settlementCalculator: SettlementCalculatorService,
  ) {}

  async executeSettlement(
    periodStart: Date,
    periodEnd: Date,
    idempotencyKey: string,
  ): Promise<SettlementBatch> {
    // Fast path: a settlement with this key already exists, so we can
    // return it without opening a transaction at all.
    const existing = await this.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    try {
      return await this.dataSource.transaction((manager) =>
        this.runSettlement(manager, periodStart, periodEnd, idempotencyKey),
      );
    } catch (error) {
      // Race path: a concurrent request inserted the same idempotency key
      // first, so our insert hit the unique constraint and the transaction
      // rolled back. Read the winning settlement on a *fresh* connection
      // (the transaction's connection is now in an aborted state).
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.findByIdempotencyKey(idempotencyKey);
        if (duplicate) {
          return duplicate;
        }
      }
      throw error;
    }
  }

  async getSettlementById(id: string): Promise<SettlementQueryResponseDto> {
    const batch = await this.findBatchEntityById(id);
    if (!batch) {
      throw new NotFoundException(`Settlement ${id} not found`);
    }
    return this.toSettlementQueryResponse(batch);
  }

  async findById(id: string): Promise<SettlementBatch | null> {
    return this.findBatchEntityById(id);
  }

  private async findBatchEntityById(id: string): Promise<SettlementBatch | null> {
    return this.dataSource.getRepository(SettlementBatch).findOne({
      where: { id },
      relations: ['allocations'],
    });
  }

  toSettlementQueryResponse(batch: SettlementBatch): SettlementQueryResponseDto {
    const allocations = (batch.allocations ?? []).map((allocation) => ({
      songId: allocation.songId,
      partyType: allocation.partyType,
      allocatedAmount: allocation.allocatedAmount,
    }));

    const allocationTotal = allocations.reduce(
      (sum, allocation) => sum + allocation.allocatedAmount,
      0,
    );

    const partyTotalsMap = new Map<PartyType, number>();
    const trackTotalsMap = new Map<string, number>();
    for (const allocation of allocations) {
      partyTotalsMap.set(
        allocation.partyType,
        (partyTotalsMap.get(allocation.partyType) ?? 0) +
          allocation.allocatedAmount,
      );
      trackTotalsMap.set(
        allocation.songId,
        (trackTotalsMap.get(allocation.songId) ?? 0) +
          allocation.allocatedAmount,
      );
    }

    const partyTotals = [...partyTotalsMap.entries()]
      .map(([partyType, totalAmount]) => ({ partyType, totalAmount }))
      .sort((a, b) => a.partyType.localeCompare(b.partyType));

    const trackTotals = [...trackTotalsMap.entries()]
      .map(([songId, totalAmount]) => ({ songId, totalAmount }))
      .sort((a, b) => a.songId.localeCompare(b.songId));

    return {
      settlementId: batch.id,
      periodStart: batch.periodStart,
      periodEnd: batch.periodEnd,
      totalRevenue: batch.totalRevenue,
      status: batch.status,
      allocations,
      partyTotals,
      trackTotals,
      allocationTotal,
      matchesOriginalRevenue: allocationTotal === batch.totalRevenue,
    };
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SettlementBatch | null> {
    return this.dataSource.getRepository(SettlementBatch).findOne({
      where: { idempotencyKey },
      relations: ['allocations'],
    });
  }

  private async runSettlement(
    manager: EntityManager,
    periodStart: Date,
    periodEnd: Date,
    idempotencyKey: string,
  ): Promise<SettlementBatch> {
    const batchRepo = manager.getRepository(SettlementBatch);

    // Insert the batch first. The unique constraint on idempotency_key is the
    // single source of truth that prevents a duplicate settlement: a racing
    // transaction inserting the same key here will fail and roll back. We let
    // that error propagate to executeSettlement, which resolves the winner.
    const batch = await batchRepo.save(
      batchRepo.create({
        idempotencyKey,
        periodStart,
        periodEnd,
        totalRevenue: 0,
        status: SettlementStatus.PENDING,
      }),
    );

    // Load + lock unsettled play events in the period. FOR UPDATE SKIP LOCKED
    // means a concurrent settlement over an overlapping period cannot grab the
    // same rows, so no play event is ever counted twice.
    const playEvents = await this.loadUnsettledPlayEvents(
      manager,
      periodStart,
      periodEnd,
    );
    const revenueBySong = this.groupRevenueBySong(playEvents);
    const allocationRepo = manager.getRepository(SettlementAllocation);
    const allocations = this.buildAllocations(
      allocationRepo,
      batch.id,
      revenueBySong,
    );
    const totalRevenue = this.sumPlayEventRevenue(playEvents);

    if (allocations.length > 0) {
      await allocationRepo.save(allocations);
    }

    // Claim the events for this batch so they cannot be settled again.
    const playEventIds = playEvents.map((event) => event.id);
    if (playEventIds.length > 0) {
      await manager
        .getRepository(PlayEvent)
        .update(playEventIds, { settledBatchId: batch.id });
    }

    await batchRepo.update(batch.id, {
      totalRevenue,
      status: SettlementStatus.COMPLETED,
    });

    // Immutable input snapshot: records exactly which events and which split
    // configuration produced this settlement, so it can be independently
    // recomputed and verified later.
    await manager.getRepository(AuditLog).save(
      manager.getRepository(AuditLog).create({
        settlementBatchId: batch.id,
        eventType: SETTLEMENT_COMPLETED_EVENT,
        payload: {
          idempotencyKey,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          playEventCount: playEvents.length,
          songCount: revenueBySong.size,
          totalRevenue,
          playEventIds,
          revenueSplitBasisPoints: REVENUE_SPLIT_BASIS_POINTS,
        },
      }),
    );

    const completed = await batchRepo.findOne({
      where: { id: batch.id },
      relations: ['allocations'],
    });

    if (!completed) {
      throw new Error(`Settlement batch ${batch.id} not found after commit`);
    }

    return completed;
  }

  private loadUnsettledPlayEvents(
    manager: EntityManager,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PlayEvent[]> {
    return manager
      .getRepository(PlayEvent)
      .createQueryBuilder('play_event')
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .where('play_event.played_at >= :periodStart', { periodStart })
      .andWhere('play_event.played_at <= :periodEnd', { periodEnd })
      .andWhere('play_event.settled_batch_id IS NULL')
      .getMany();
  }

  private groupRevenueBySong(playEvents: PlayEvent[]): Map<string, number> {
    const revenueBySong = new Map<string, number>();

    for (const event of playEvents) {
      revenueBySong.set(
        event.songId,
        (revenueBySong.get(event.songId) ?? 0) + event.unitPrice,
      );
    }

    return revenueBySong;
  }

  private sumPlayEventRevenue(playEvents: PlayEvent[]): number {
    return playEvents.reduce((sum, event) => sum + event.unitPrice, 0);
  }

  private buildAllocations(
    allocationRepo: Repository<SettlementAllocation>,
    settlementBatchId: string,
    revenueBySong: Map<string, number>,
  ): SettlementAllocation[] {
    const allocations: SettlementAllocation[] = [];

    const sortedSongIds = [...revenueBySong.keys()].sort();

    for (const songId of sortedSongIds) {
      const songRevenue = revenueBySong.get(songId)!;
      const split = this.settlementCalculator.calculate(songRevenue);

      allocations.push(
        allocationRepo.create({
          settlementBatchId,
          songId,
          partyType: PartyType.CREATOR_POOL,
          allocatedAmount: split.creatorPool,
        }),
        allocationRepo.create({
          settlementBatchId,
          songId,
          partyType: PartyType.CMO,
          allocatedAmount: split.cmo,
        }),
        allocationRepo.create({
          settlementBatchId,
          songId,
          partyType: PartyType.PLATFORM,
          allocatedAmount: split.platform,
        }),
      );
    }

    return allocations;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    );
  }
}
