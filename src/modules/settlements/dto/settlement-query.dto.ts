import { ApiProperty } from '@nestjs/swagger';
import { SettlementStatus } from '../../../common/enums/settlement-status.enum';
import { PartyType } from '../../../common/enums/party-type.enum';

export class SettlementAllocationItemDto {
  @ApiProperty({ example: 'song-1' })
  songId: string;

  @ApiProperty({ enum: PartyType, example: PartyType.PLATFORM })
  partyType: PartyType;

  @ApiProperty({ example: 46, description: 'Allocated amount in whole KRW' })
  allocatedAmount: number;
}

export class PartyTotalDto {
  @ApiProperty({ enum: PartyType, example: PartyType.PLATFORM })
  partyType: PartyType;

  @ApiProperty({ example: 46 })
  totalAmount: number;
}

export class TrackTotalDto {
  @ApiProperty({ example: 'song-1' })
  songId: string;

  @ApiProperty({ example: 101 })
  totalAmount: number;
}

export class SettlementQueryResponseDto {
  @ApiProperty({ format: 'uuid' })
  settlementId: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  periodStart: Date;

  @ApiProperty({ example: '2026-04-30T23:59:59.999Z' })
  periodEnd: Date;

  @ApiProperty({ example: 101, description: 'Original revenue settled (KRW)' })
  totalRevenue: number;

  @ApiProperty({ enum: SettlementStatus, example: SettlementStatus.COMPLETED })
  status: SettlementStatus;

  @ApiProperty({ type: [SettlementAllocationItemDto] })
  allocations: SettlementAllocationItemDto[];

  @ApiProperty({ type: [PartyTotalDto] })
  partyTotals: PartyTotalDto[];

  @ApiProperty({ type: [TrackTotalDto] })
  trackTotals: TrackTotalDto[];

  @ApiProperty({ example: 101, description: 'Sum of all allocatedAmount values' })
  allocationTotal: number;

  @ApiProperty({
    example: true,
    description: 'Reconciliation check: allocationTotal === totalRevenue',
  })
  matchesOriginalRevenue: boolean;
}
