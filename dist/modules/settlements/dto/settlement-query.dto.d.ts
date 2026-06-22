import { SettlementStatus } from '../../../common/enums/settlement-status.enum';
import { PartyType } from '../../../common/enums/party-type.enum';
export declare class SettlementAllocationItemDto {
    songId: string;
    partyType: PartyType;
    allocatedAmount: number;
}
export declare class PartyTotalDto {
    partyType: PartyType;
    totalAmount: number;
}
export declare class TrackTotalDto {
    songId: string;
    totalAmount: number;
}
export declare class SettlementQueryResponseDto {
    settlementId: string;
    periodStart: Date;
    periodEnd: Date;
    totalRevenue: number;
    status: SettlementStatus;
    allocations: SettlementAllocationItemDto[];
    partyTotals: PartyTotalDto[];
    trackTotals: TrackTotalDto[];
    allocationTotal: number;
    matchesOriginalRevenue: boolean;
}
