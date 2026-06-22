import { NotFoundException } from '@nestjs/common';
import { SettlementStatus } from '../../common/enums/settlement-status.enum';
import { SettlementBatch } from '../settlements/entities/settlement-batch.entity';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  const settlementId = '11111111-1111-1111-1111-111111111111';
  const periodStart = new Date('2026-01-01T00:00:00.000Z');
  const periodEnd = new Date('2026-01-31T23:59:59.999Z');

  const settlement: SettlementBatch = {
    id: settlementId,
    idempotencyKey: 'settlement-key-1',
    periodStart,
    periodEnd,
    totalRevenue: 100,
    status: SettlementStatus.COMPLETED,
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    allocations: [],
    auditLogs: [],
  };

  const auditLogRepository = {
    find: jest.fn(),
  };

  const settlementBatchRepository = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    service = new AuditService(
      auditLogRepository as never,
      settlementBatchRepository as never,
    );
    jest.clearAllMocks();
  });

  describe('getSettlementAuditHistory', () => {
    it('returns audit history for a settlement', async () => {
      settlementBatchRepository.findOne.mockResolvedValue(settlement);
      auditLogRepository.find.mockResolvedValue([
        {
          id: 'log-1',
          settlementBatchId: settlementId,
          eventType: 'SETTLEMENT_COMPLETED',
          payload: { totalRevenue: 100 },
          createdAt: new Date('2026-01-15T10:01:00.000Z'),
        },
      ]);

      const result = await service.getSettlementAuditHistory(settlementId);

      expect(settlementBatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: settlementId },
      });
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { settlementBatchId: settlementId },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual({
        settlementId,
        events: [
          {
            eventType: 'SETTLEMENT_COMPLETED',
            payload: { totalRevenue: 100 },
            createdAt: '2026-01-15T10:01:00.000Z',
          },
        ],
      });
    });

    it('returns events sorted by createdAt ascending', async () => {
      settlementBatchRepository.findOne.mockResolvedValue(settlement);
      auditLogRepository.find.mockResolvedValue([
        {
          id: 'log-1',
          settlementBatchId: settlementId,
          eventType: 'SETTLEMENT_REQUESTED',
          payload: { step: 1 },
          createdAt: new Date('2026-01-15T10:00:00.000Z'),
        },
        {
          id: 'log-2',
          settlementBatchId: settlementId,
          eventType: 'SETTLEMENT_COMPLETED',
          payload: { step: 2 },
          createdAt: new Date('2026-01-15T10:05:00.000Z'),
        },
      ]);

      const result = await service.getSettlementAuditHistory(settlementId);

      expect(result.events.map((event) => event.eventType)).toEqual([
        'SETTLEMENT_REQUESTED',
        'SETTLEMENT_COMPLETED',
      ]);
      expect(result.events[0].createdAt).toBe('2026-01-15T10:00:00.000Z');
      expect(result.events[1].createdAt).toBe('2026-01-15T10:05:00.000Z');
    });

    it('returns empty events array when no audit logs exist', async () => {
      settlementBatchRepository.findOne.mockResolvedValue(settlement);
      auditLogRepository.find.mockResolvedValue([]);

      const result = await service.getSettlementAuditHistory(settlementId);

      expect(result).toEqual({
        settlementId,
        events: [],
      });
    });

    it('returns 404 for unknown settlement', async () => {
      settlementBatchRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getSettlementAuditHistory('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
