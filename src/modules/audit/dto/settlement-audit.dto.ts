import { ApiProperty } from '@nestjs/swagger';

export class AuditEventDto {
  @ApiProperty({ example: 'SETTLEMENT_COMPLETED' })
  eventType: string;

  @ApiProperty({
    description:
      'Immutable input snapshot: playEventIds, totalRevenue, period and revenueSplitBasisPoints used to compute the settlement.',
    example: {
      idempotencyKey: 'apr-2026',
      periodStart: '2026-04-01T00:00:00.000Z',
      periodEnd: '2026-04-30T23:59:59.999Z',
      playEventIds: ['11111111-1111-1111-1111-111111111111'],
      playEventCount: 1,
      songCount: 1,
      totalRevenue: 101,
      revenueSplitBasisPoints: { CREATOR_POOL: 4000, CMO: 1500, PLATFORM: 4500 },
    },
  })
  payload: Record<string, unknown>;

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z' })
  createdAt: string;
}

export class SettlementAuditResponseDto {
  @ApiProperty({ format: 'uuid' })
  settlementId: string;

  @ApiProperty({ type: [AuditEventDto] })
  events: AuditEventDto[];
}
