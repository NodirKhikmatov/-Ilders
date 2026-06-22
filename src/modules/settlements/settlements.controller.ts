import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ExecuteSettlementDto } from './dto/settlement.dto';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  execute(@Body() dto: ExecuteSettlementDto) {
    return this.settlementsService.executeSettlement(
      dto.periodStart,
      dto.periodEnd,
      dto.idempotencyKey,
    );
  }

  @Get(':id')
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SettlementQueryResponseDto> {
    return this.settlementsService.getSettlementById(id);
  }
}
