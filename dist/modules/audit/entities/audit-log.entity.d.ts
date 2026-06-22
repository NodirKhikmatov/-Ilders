import { SettlementBatch } from '../../settlements/entities/settlement-batch.entity';
export declare class AuditLog {
    id: string;
    settlementBatchId: string;
    settlementBatch: SettlementBatch;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: Date;
}
