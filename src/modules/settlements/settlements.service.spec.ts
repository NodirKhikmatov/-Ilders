import { NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SettlementStatus } from '../../common/enums/settlement-status.enum';
import { PartyType } from '../../common/enums/party-type.enum';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PlayEvent } from '../play-events/entities/play-event.entity';
import { SettlementAllocation } from './entities/settlement-allocation.entity';
import { SettlementBatch } from './entities/settlement-batch.entity';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { SettlementsService } from './settlements.service';

function uniqueViolationError(): QueryFailedError {
  const error = new QueryFailedError('INSERT', [], new Error('duplicate key'));
  Object.assign(error, {
    driverError: Object.assign(new Error('duplicate key'), { code: '23505' }),
  });
  return error;
}

function createPlayEvent(
  overrides: Partial<PlayEvent> & Pick<PlayEvent, 'songId' | 'unitPrice' | 'playedAt'>,
): PlayEvent {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    songId: overrides.songId,
    storeId: overrides.storeId ?? 'store-1',
    playedAt: overrides.playedAt,
    duration: overrides.duration ?? null,
    unitPrice: overrides.unitPrice,
    settledBatchId: overrides.settledBatchId ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

describe('SettlementsService', () => {
  let service: SettlementsService;
  let calculator: SettlementCalculatorService;

  const periodStart = new Date('2026-01-01T00:00:00.000Z');
  const periodEnd = new Date('2026-01-31T23:59:59.999Z');
  const idempotencyKey = 'settlement-key-1';

  let batches: SettlementBatch[];
  let allocations: SettlementAllocation[];
  let auditLogs: AuditLog[];
  let playEvents: PlayEvent[];

  let batchSaveDelayMs = 0;

  const batchRepo = {
    findOne: jest.fn(async ({ where }: { where: { id?: string; idempotencyKey?: string } }) => {
      if (where.id) {
        const batch = batches.find((item) => item.id === where.id);
        return batch ? { ...batch, allocations: allocations.filter((a) => a.settlementBatchId === batch.id) } : null;
      }
      if (where.idempotencyKey) {
        const batch = batches.find((item) => item.idempotencyKey === where.idempotencyKey);
        return batch ? { ...batch, allocations: allocations.filter((a) => a.settlementBatchId === batch.id) } : null;
      }
      return null;
    }),
    create: jest.fn((data: Partial<SettlementBatch>) => ({
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...data,
    })),
    save: jest.fn(async (batch: SettlementBatch) => {
      if (batchSaveDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, batchSaveDelayMs));
      }

      const duplicate = batches.find(
        (item) => item.idempotencyKey === batch.idempotencyKey && item.id !== batch.id,
      );
      if (duplicate) {
        throw uniqueViolationError();
      }

      const existingIndex = batches.findIndex((item) => item.id === batch.id);
      if (existingIndex >= 0) {
        batches[existingIndex] = { ...batches[existingIndex], ...batch };
        return batches[existingIndex];
      }

      batches.push(batch);
      return batch;
    }),
    update: jest.fn(async (id: string, data: Partial<SettlementBatch>) => {
      const index = batches.findIndex((item) => item.id === id);
      if (index >= 0) {
        batches[index] = { ...batches[index], ...data };
      }
    }),
  };

  const allocationRepo = {
    save: jest.fn(async (rows: SettlementAllocation | SettlementAllocation[]) => {
      const items = Array.isArray(rows) ? rows : [rows];
      for (const row of items) {
        allocations.push({
          ...row,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        });
      }
      return items;
    }),
    create: jest.fn((data: Partial<SettlementAllocation>) => data),
  };

  const auditRepo = {
    save: jest.fn(async (row: AuditLog) => {
      const saved = { ...row, id: crypto.randomUUID(), createdAt: new Date() };
      auditLogs.push(saved);
      return saved;
    }),
    create: jest.fn((data: Partial<AuditLog>) => data),
  };

  const playEventRepo = {
    createQueryBuilder: jest.fn(() => ({
      setLock: jest.fn().mockReturnThis(),
      setOnLocked: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () =>
        playEvents.filter(
          (event) =>
            event.playedAt >= periodStart &&
            event.playedAt <= periodEnd &&
            event.settledBatchId == null,
        ),
      ),
    })),
    update: jest.fn(async (ids: string[], partial: Partial<PlayEvent>) => {
      for (const id of ids) {
        const event = playEvents.find((item) => item.id === id);
        if (event) {
          Object.assign(event, partial);
        }
      }
    }),
  };

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === SettlementBatch) return batchRepo;
      if (entity === SettlementAllocation) return allocationRepo;
      if (entity === AuditLog) return auditRepo;
      if (entity === PlayEvent) return playEventRepo;
      throw new Error(`Unexpected repository entity: ${String(entity)}`);
    }),
  };

  const dataSource = {
    transaction: jest.fn(async (work: (em: typeof manager) => Promise<SettlementBatch>) =>
      work(manager),
    ),
    getRepository: jest.fn((entity: unknown) => {
      if (entity === SettlementBatch) return batchRepo;
      throw new Error(`Unexpected root repository entity: ${String(entity)}`);
    }),
  };

  beforeEach(() => {
    batches = [];
    allocations = [];
    auditLogs = [];
    playEvents = [];
    batchSaveDelayMs = 0;

    calculator = new SettlementCalculatorService();
    service = new SettlementsService(dataSource as never, calculator);

    jest.clearAllMocks();
  });

  describe('executeSettlement', () => {
    it('creates a completed settlement with allocations grouped by song', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 100, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
        createPlayEvent({ songId: 'song-a', unitPrice: 1, playedAt: new Date('2026-01-11T12:00:00.000Z') }),
        createPlayEvent({ songId: 'song-b', unitPrice: 50, playedAt: new Date('2026-01-12T12:00:00.000Z') }),
      ];

      const result = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      expect(result.status).toBe(SettlementStatus.COMPLETED);
      expect(result.totalRevenue).toBe(151);
      expect(result.idempotencyKey).toBe(idempotencyKey);
      expect(result.allocations).toHaveLength(6);

      const songAAllocations = result.allocations!.filter((a) => a.songId === 'song-a');
      expect(songAAllocations).toHaveLength(3);
      expect(
        songAAllocations.reduce((sum, row) => sum + row.allocatedAmount, 0),
      ).toBe(101);

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].eventType).toBe('SETTLEMENT_COMPLETED');
      expect(auditLogs[0].payload.totalRevenue).toBe(151);
    });

    it('returns existing settlement when idempotency key already exists', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 10, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
      ];

      const first = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );
      const second = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      expect(second.id).toBe(first.id);
      expect(batches.filter((batch) => batch.idempotencyKey === idempotencyKey)).toHaveLength(1);
      expect(allocationRepo.save).toHaveBeenCalledTimes(1);
      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });

    it('handles unique constraint violation by returning the existing batch', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 10, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
      ];

      batchRepo.save.mockImplementationOnce(async (batch: SettlementBatch) => {
        batches.push(batch);
        throw uniqueViolationError();
      });

      const result = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      expect(result.idempotencyKey).toBe(idempotencyKey);
      expect(batches.filter((batch) => batch.idempotencyKey === idempotencyKey)).toHaveLength(1);
    });

    it('creates zero-revenue settlement when no play events exist in period', async () => {
      const result = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      expect(result.status).toBe(SettlementStatus.COMPLETED);
      expect(result.totalRevenue).toBe(0);
      expect(result.allocations).toEqual([]);
      expect(allocationRepo.save).not.toHaveBeenCalled();
    });

    it('creates allocation rows for each party type per song', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 101, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
      ];

      const result = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      expect(result.allocations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            songId: 'song-a',
            partyType: PartyType.CREATOR_POOL,
            allocatedAmount: 40,
          }),
          expect.objectContaining({
            songId: 'song-a',
            partyType: PartyType.CMO,
            allocatedAmount: 15,
          }),
          expect.objectContaining({
            songId: 'song-a',
            partyType: PartyType.PLATFORM,
            allocatedAmount: 46,
          }),
        ]),
      );
    });
  });

  describe('concurrent idempotency', () => {
    it('creates exactly one SettlementBatch for concurrent requests with the same idempotency key', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 100, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
      ];
      batchSaveDelayMs = 50;

      const [first, second] = await Promise.all([
        service.executeSettlement(periodStart, periodEnd, idempotencyKey),
        service.executeSettlement(periodStart, periodEnd, idempotencyKey),
      ]);

      expect(first.id).toBe(second.id);
      expect(batches.filter((batch) => batch.idempotencyKey === idempotencyKey)).toHaveLength(1);
      expect(allocationRepo.save).toHaveBeenCalledTimes(1);
      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('double-settlement prevention across periods', () => {
    it('never settles the same play event twice, even with a different idempotency key', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 100, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
      ];

      const first = await service.executeSettlement(
        periodStart,
        periodEnd,
        'settlement-key-A',
      );
      const second = await service.executeSettlement(
        periodStart,
        periodEnd,
        'settlement-key-B',
      );

      expect(first.totalRevenue).toBe(100);
      // Events were claimed by the first batch, so the second batch finds none.
      expect(second.totalRevenue).toBe(0);
      expect(second.allocations).toEqual([]);

      const totalSettled = batches.reduce(
        (sum, batch) => sum + batch.totalRevenue,
        0,
      );
      expect(totalSettled).toBe(100);
      expect(playEvents[0].settledBatchId).toBe(first.id);
    });
  });

  describe('audit input snapshot', () => {
    it('records the exact play event ids and split config used for the settlement', async () => {
      playEvents = [
        createPlayEvent({ id: 'pe-1', songId: 'song-a', unitPrice: 100, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
        createPlayEvent({ id: 'pe-2', songId: 'song-b', unitPrice: 50, playedAt: new Date('2026-01-12T12:00:00.000Z') }),
      ];

      await service.executeSettlement(periodStart, periodEnd, idempotencyKey);

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].payload.playEventIds).toEqual(['pe-1', 'pe-2']);
      expect(auditLogs[0].payload.revenueSplitBasisPoints).toEqual({
        [PartyType.CREATOR_POOL]: 4000,
        [PartyType.CMO]: 1500,
        [PartyType.PLATFORM]: 4500,
      });
    });
  });

  describe('getSettlementById', () => {
    it('returns settlement query response with allocation totals', async () => {
      playEvents = [
        createPlayEvent({ songId: 'song-a', unitPrice: 100, playedAt: new Date('2026-01-10T12:00:00.000Z') }),
        createPlayEvent({ songId: 'song-a', unitPrice: 1, playedAt: new Date('2026-01-11T12:00:00.000Z') }),
        createPlayEvent({ songId: 'song-b', unitPrice: 50, playedAt: new Date('2026-01-12T12:00:00.000Z') }),
      ];

      const created = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      const result = await service.getSettlementById(created.id);

      expect(result).toEqual({
        settlementId: created.id,
        periodStart,
        periodEnd,
        totalRevenue: 151,
        status: SettlementStatus.COMPLETED,
        allocations: expect.arrayContaining([
          { songId: 'song-a', partyType: PartyType.CREATOR_POOL, allocatedAmount: 40 },
          { songId: 'song-a', partyType: PartyType.CMO, allocatedAmount: 15 },
          { songId: 'song-a', partyType: PartyType.PLATFORM, allocatedAmount: 46 },
          { songId: 'song-b', partyType: PartyType.CREATOR_POOL, allocatedAmount: 20 },
          { songId: 'song-b', partyType: PartyType.CMO, allocatedAmount: 8 },
          { songId: 'song-b', partyType: PartyType.PLATFORM, allocatedAmount: 22 },
        ]),
        partyTotals: [
          { partyType: PartyType.CMO, totalAmount: 23 },
          { partyType: PartyType.CREATOR_POOL, totalAmount: 60 },
          { partyType: PartyType.PLATFORM, totalAmount: 68 },
        ],
        trackTotals: [
          { songId: 'song-a', totalAmount: 101 },
          { songId: 'song-b', totalAmount: 50 },
        ],
        allocationTotal: 151,
        matchesOriginalRevenue: true,
      });
      expect(result.allocations).toHaveLength(6);
    });

    it('throws NotFoundException when settlement does not exist', async () => {
      await expect(
        service.getSettlementById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets matchesOriginalRevenue to false when totals diverge', () => {
      const batch = {
        id: 'batch-1',
        idempotencyKey: 'key-1',
        periodStart,
        periodEnd,
        totalRevenue: 100,
        status: SettlementStatus.COMPLETED,
        createdAt: new Date(),
        allocations: [
          {
            id: 'alloc-1',
            settlementBatchId: 'batch-1',
            songId: 'song-a',
            partyType: PartyType.CREATOR_POOL,
            allocatedAmount: 40,
            createdAt: new Date(),
          } as SettlementAllocation,
        ],
      } as SettlementBatch;

      const result = service.toSettlementQueryResponse(batch);

      expect(result.allocationTotal).toBe(40);
      expect(result.matchesOriginalRevenue).toBe(false);
    });

    it('returns zero totals for settlement with no allocations', async () => {
      const result = await service.executeSettlement(
        periodStart,
        periodEnd,
        idempotencyKey,
      );

      const query = await service.getSettlementById(result.id);

      expect(query.allocationTotal).toBe(0);
      expect(query.matchesOriginalRevenue).toBe(true);
      expect(query.totalRevenue).toBe(0);
    });
  });
});
