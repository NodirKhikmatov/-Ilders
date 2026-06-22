import { DataSource } from 'typeorm';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { SettlementBatch } from './entities/settlement-batch.entity';
export declare class SettlementsService {
    private readonly dataSource;
    private readonly settlementCalculator;
    constructor(dataSource: DataSource, settlementCalculator: SettlementCalculatorService);
    executeSettlement(periodStart: Date, periodEnd: Date, idempotencyKey: string): Promise<SettlementBatch>;
    getSettlementById(id: string): Promise<SettlementQueryResponseDto>;
    findById(id: string): Promise<SettlementBatch | null>;
    private findBatchEntityById;
    toSettlementQueryResponse(batch: SettlementBatch): SettlementQueryResponseDto;
    findByIdempotencyKey(idempotencyKey: string): Promise<SettlementBatch | null>;
    private runSettlement;
    private loadUnsettledPlayEvents;
    private groupRevenueBySong;
    private sumPlayEventRevenue;
    private buildAllocations;
    private isUniqueViolation;
}
