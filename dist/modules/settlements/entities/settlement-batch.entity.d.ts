import { SettlementStatus } from '../../../common/enums/settlement-status.enum';
import type { AuditLog } from '../../audit/entities/audit-log.entity';
import type { SettlementAllocation } from './settlement-allocation.entity';
export declare class SettlementBatch {
    id: string;
    idempotencyKey: string;
    periodStart: Date;
    periodEnd: Date;
    totalRevenue: number;
    status: SettlementStatus;
    createdAt: Date;
    allocations: SettlementAllocation[];
    auditLogs: AuditLog[];
}
