import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiParam({
    name: 'settlementId',
    format: 'uuid',
    example: 'e711a661-1ba8-489b-9e93-fcd762265eb7',
    description: 'Settlement UUID returned by POST /settlements',
  })
  @ApiResponse({ status: 200, type: SettlementAuditResponseDto })
  getSettlementAuditHistory(
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
  ): Promise<SettlementAuditResponseDto> {
    return this.auditService.getSettlementAuditHistory(settlementId);
  }
}
