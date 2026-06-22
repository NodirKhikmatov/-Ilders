import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PlayEvent } from '../play-events/entities/play-event.entity';
import { SettlementAllocation } from './entities/settlement-allocation.entity';
import { SettlementBatch } from './entities/settlement-batch.entity';
import { SettlementCalculatorService } from './settlement-calculator.service';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SettlementBatch,
      SettlementAllocation,
      PlayEvent,
      AuditLog,
    ]),
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService, SettlementCalculatorService],
  exports: [SettlementsService, SettlementCalculatorService, TypeOrmModule],
})
export class SettlementsModule {}
