import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('settlements/:settlementId')
  @ApiOperation({
    summary:
      'Retrieve the immutable audit log (input snapshot) for a settlement',
  })
  @ApiResponse({ status: 200, type: SettlementAuditResponseDto })
  getSettlementAuditHistory(
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
  ): Promise<SettlementAuditResponseDto> {
    return this.auditService.getSettlementAuditHistory(settlementId);
  }
}
