"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const party_type_enum_1 = require("../../common/enums/party-type.enum");
const settlement_status_enum_1 = require("../../common/enums/settlement-status.enum");
const revenue_split_constants_1 = require("../../common/constants/revenue-split.constants");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const play_event_entity_1 = require("../play-events/entities/play-event.entity");
const settlement_calculator_service_1 = require("./settlement-calculator.service");
const settlement_allocation_entity_1 = require("./entities/settlement-allocation.entity");
const settlement_batch_entity_1 = require("./entities/settlement-batch.entity");
const SETTLEMENT_COMPLETED_EVENT = 'SETTLEMENT_COMPLETED';
let SettlementsService = class SettlementsService {
    constructor(dataSource, settlementCalculator) {
        this.dataSource = dataSource;
        this.settlementCalculator = settlementCalculator;
    }
    async executeSettlement(periodStart, periodEnd, idempotencyKey) {
        const existing = await this.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            return existing;
        }
        try {
            return await this.dataSource.transaction((manager) => this.runSettlement(manager, periodStart, periodEnd, idempotencyKey));
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                const duplicate = await this.findByIdempotencyKey(idempotencyKey);
                if (duplicate) {
                    return duplicate;
                }
            }
            throw error;
        }
    }
    async getSettlementById(id) {
        const batch = await this.findBatchEntityById(id);
        if (!batch) {
            throw new common_1.NotFoundException(`Settlement ${id} not found`);
        }
        return this.toSettlementQueryResponse(batch);
    }
    async findById(id) {
        return this.findBatchEntityById(id);
    }
    async findBatchEntityById(id) {
        return this.dataSource.getRepository(settlement_batch_entity_1.SettlementBatch).findOne({
            where: { id },
            relations: ['allocations'],
        });
    }
    toSettlementQueryResponse(batch) {
        const allocations = (batch.allocations ?? []).map((allocation) => ({
            songId: allocation.songId,
            partyType: allocation.partyType,
            allocatedAmount: allocation.allocatedAmount,
        }));
        const allocationTotal = allocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);
        const partyTotalsMap = new Map();
        const trackTotalsMap = new Map();
        for (const allocation of allocations) {
            partyTotalsMap.set(allocation.partyType, (partyTotalsMap.get(allocation.partyType) ?? 0) +
                allocation.allocatedAmount);
            trackTotalsMap.set(allocation.songId, (trackTotalsMap.get(allocation.songId) ?? 0) +
                allocation.allocatedAmount);
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
    async findByIdempotencyKey(idempotencyKey) {
        return this.dataSource.getRepository(settlement_batch_entity_1.SettlementBatch).findOne({
            where: { idempotencyKey },
            relations: ['allocations'],
        });
    }
    async runSettlement(manager, periodStart, periodEnd, idempotencyKey) {
        const batchRepo = manager.getRepository(settlement_batch_entity_1.SettlementBatch);
        const batch = await batchRepo.save(batchRepo.create({
            idempotencyKey,
            periodStart,
            periodEnd,
            totalRevenue: 0,
            status: settlement_status_enum_1.SettlementStatus.PENDING,
        }));
        const playEvents = await this.loadUnsettledPlayEvents(manager, periodStart, periodEnd);
        const revenueBySong = this.groupRevenueBySong(playEvents);
        const allocationRepo = manager.getRepository(settlement_allocation_entity_1.SettlementAllocation);
        const allocations = this.buildAllocations(allocationRepo, batch.id, revenueBySong);
        const totalRevenue = this.sumPlayEventRevenue(playEvents);
        if (allocations.length > 0) {
            await allocationRepo.save(allocations);
        }
        const playEventIds = playEvents.map((event) => event.id);
        if (playEventIds.length > 0) {
            await manager
                .getRepository(play_event_entity_1.PlayEvent)
                .update(playEventIds, { settledBatchId: batch.id });
        }
        await batchRepo.update(batch.id, {
            totalRevenue,
            status: settlement_status_enum_1.SettlementStatus.COMPLETED,
        });
        await manager.getRepository(audit_log_entity_1.AuditLog).save(manager.getRepository(audit_log_entity_1.AuditLog).create({
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
                revenueSplitBasisPoints: revenue_split_constants_1.REVENUE_SPLIT_BASIS_POINTS,
            },
        }));
        const completed = await batchRepo.findOne({
            where: { id: batch.id },
            relations: ['allocations'],
        });
        if (!completed) {
            throw new Error(`Settlement batch ${batch.id} not found after commit`);
        }
        return completed;
    }
    loadUnsettledPlayEvents(manager, periodStart, periodEnd) {
        return manager
            .getRepository(play_event_entity_1.PlayEvent)
            .createQueryBuilder('play_event')
            .setLock('pessimistic_write')
            .setOnLocked('skip_locked')
            .where('play_event.played_at >= :periodStart', { periodStart })
            .andWhere('play_event.played_at <= :periodEnd', { periodEnd })
            .andWhere('play_event.settled_batch_id IS NULL')
            .getMany();
    }
    groupRevenueBySong(playEvents) {
        const revenueBySong = new Map();
        for (const event of playEvents) {
            revenueBySong.set(event.songId, (revenueBySong.get(event.songId) ?? 0) + event.unitPrice);
        }
        return revenueBySong;
    }
    sumPlayEventRevenue(playEvents) {
        return playEvents.reduce((sum, event) => sum + event.unitPrice, 0);
    }
    buildAllocations(allocationRepo, settlementBatchId, revenueBySong) {
        const allocations = [];
        const sortedSongIds = [...revenueBySong.keys()].sort();
        for (const songId of sortedSongIds) {
            const songRevenue = revenueBySong.get(songId);
            const split = this.settlementCalculator.calculate(songRevenue);
            allocations.push(allocationRepo.create({
                settlementBatchId,
                songId,
                partyType: party_type_enum_1.PartyType.CREATOR_POOL,
                allocatedAmount: split.creatorPool,
            }), allocationRepo.create({
                settlementBatchId,
                songId,
                partyType: party_type_enum_1.PartyType.CMO,
                allocatedAmount: split.cmo,
            }), allocationRepo.create({
                settlementBatchId,
                songId,
                partyType: party_type_enum_1.PartyType.PLATFORM,
                allocatedAmount: split.platform,
            }));
        }
        return allocations;
    }
    isUniqueViolation(error) {
        return (error instanceof typeorm_2.QueryFailedError &&
            error
                .driverError?.code === '23505');
    }
};
exports.SettlementsService = SettlementsService;
exports.SettlementsService = SettlementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        settlement_calculator_service_1.SettlementCalculatorService])
], SettlementsService);
//# sourceMappingURL=settlements.service.js.map