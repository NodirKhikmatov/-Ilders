import { Repository } from 'typeorm';
import { SettlementBatch } from '../settlements/entities/settlement-batch.entity';
import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private readonly auditLogRepository;
    private readonly settlementBatchRepository;
    constructor(auditLogRepository: Repository<AuditLog>, settlementBatchRepository: Repository<SettlementBatch>);
    getSettlementAuditHistory(settlementId: string): Promise<SettlementAuditResponseDto>;
    toSettlementAuditResponse(settlementId: string, auditLogs: AuditLog[]): SettlementAuditResponseDto;
}
