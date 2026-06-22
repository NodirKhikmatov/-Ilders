import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettlementStatus } from '../../common/enums/settlement-status.enum';
import { PartyType } from '../../common/enums/party-type.enum';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

describe('SettlementsController', () => {
  let controller: SettlementsController;
  let service: jest.Mocked<Pick<SettlementsService, 'getSettlementById' | 'executeSettlement'>>;

  const settlementId = '11111111-1111-1111-1111-111111111111';
  const queryResponse: SettlementQueryResponseDto = {
    settlementId,
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-01-31T23:59:59.999Z'),
    totalRevenue: 101,
    status: SettlementStatus.COMPLETED,
    allocations: [
      { songId: 'song-a', partyType: PartyType.CREATOR_POOL, allocatedAmount: 40 },
      { songId: 'song-a', partyType: PartyType.CMO, allocatedAmount: 15 },
      { songId: 'song-a', partyType: PartyType.PLATFORM, allocatedAmount: 46 },
    ],
    partyTotals: [
      { partyType: PartyType.CMO, totalAmount: 15 },
      { partyType: PartyType.CREATOR_POOL, totalAmount: 40 },
      { partyType: PartyType.PLATFORM, totalAmount: 46 },
    ],
    trackTotals: [{ songId: 'song-a', totalAmount: 101 }],
    allocationTotal: 101,
    matchesOriginalRevenue: true,
  };

  beforeEach(async () => {
    service = {
      getSettlementById: jest.fn(),
      executeSettlement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [{ provide: SettlementsService, useValue: service }],
    }).compile();

    controller = module.get(SettlementsController);
  });

  describe('GET /settlements/:id', () => {
    it('returns settlement query response', async () => {
      service.getSettlementById.mockResolvedValue(queryResponse);

      const result = await controller.getById(settlementId);

      expect(service.getSettlementById).toHaveBeenCalledWith(settlementId);
      expect(result).toEqual(queryResponse);
      expect(result.allocationTotal).toBe(101);
      expect(result.matchesOriginalRevenue).toBe(true);
    });

    it('propagates NotFoundException when settlement is missing', async () => {
      service.getSettlementById.mockRejectedValue(
        new NotFoundException(`Settlement ${settlementId} not found`),
      );

      await expect(controller.getById(settlementId)).rejects.toThrow(NotFoundException);
    });
  });
});
