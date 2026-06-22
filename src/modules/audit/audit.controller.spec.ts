import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettlementAuditResponseDto } from './dto/settlement-audit.dto';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<Pick<AuditService, 'getSettlementAuditHistory'>>;

  const settlementId = '11111111-1111-1111-1111-111111111111';
  const auditResponse: SettlementAuditResponseDto = {
    settlementId,
    events: [
      {
        eventType: 'SETTLEMENT_COMPLETED',
        payload: { totalRevenue: 100 },
        createdAt: '2026-01-15T10:01:00.000Z',
      },
    ],
  };

  beforeEach(async () => {
    service = {
      getSettlementAuditHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    }).compile();

    controller = module.get(AuditController);
  });

  describe('GET /audit/settlements/:settlementId', () => {
    it('returns audit history', async () => {
      service.getSettlementAuditHistory.mockResolvedValue(auditResponse);

      const result = await controller.getSettlementAuditHistory(settlementId);

      expect(service.getSettlementAuditHistory).toHaveBeenCalledWith(settlementId);
      expect(result).toEqual(auditResponse);
    });

    it('propagates NotFoundException for unknown settlement', async () => {
      service.getSettlementAuditHistory.mockRejectedValue(
        new NotFoundException(`Settlement ${settlementId} not found`),
      );

      await expect(
        controller.getSettlementAuditHistory(settlementId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
