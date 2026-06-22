import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementBatch } from '../settlements/entities/settlement-batch.entity';
import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(SettlementBatch)
    private readonly settlementBatchRepository: Repository<SettlementBatch>,
  ) {}

  async getSettlementAuditHistory(
    settlementId: string,
  ): Promise<SettlementAuditResponseDto> {
    const settlement = await this.settlementBatchRepository.findOne({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement ${settlementId} not found`);
    }

    const auditLogs = await this.auditLogRepository.find({
      where: { settlementBatchId: settlementId },
      order: { createdAt: 'ASC' },
    });

    return this.toSettlementAuditResponse(settlementId, auditLogs);
  }

  toSettlementAuditResponse(
    settlementId: string,
    auditLogs: AuditLog[],
  ): SettlementAuditResponseDto {
    return {
      settlementId,
      events: auditLogs.map((log) => ({
        eventType: log.eventType,
        payload: log.payload,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }
}
