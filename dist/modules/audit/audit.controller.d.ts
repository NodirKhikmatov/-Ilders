import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getSettlementAuditHistory(settlementId: string): Promise<SettlementAuditResponseDto>;
}
