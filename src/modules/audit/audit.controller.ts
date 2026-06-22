import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('settlements/:settlementId')
  getSettlementAuditHistory(
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
  ): Promise<SettlementAuditResponseDto> {
    return this.auditService.getSettlementAuditHistory(settlementId);
  }
}
