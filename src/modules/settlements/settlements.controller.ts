import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExecuteSettlementDto } from './dto/settlement.dto';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('settlements')
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @ApiOperation({
    summary: 'Execute settlement for a period (idempotent on idempotencyKey)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Settlement batch with per-song, per-party allocations. Re-sending the same idempotencyKey returns the existing batch (no double settlement).',
  })
  execute(@Body() dto: ExecuteSettlementDto) {
    return this.settlementsService.executeSettlement(
      dto.periodStart,
      dto.periodEnd,
      dto.idempotencyKey,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a settlement result with the reconciliation check',
  })
  @ApiResponse({ status: 200, type: SettlementQueryResponseDto })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SettlementQueryResponseDto> {
    return this.settlementsService.getSettlementById(id);
  }
}
