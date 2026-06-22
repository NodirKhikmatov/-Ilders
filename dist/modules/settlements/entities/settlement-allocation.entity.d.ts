import { PartyType } from '../../../common/enums/party-type.enum';
import { SettlementBatch } from './settlement-batch.entity';
export declare class SettlementAllocation {
    id: string;
    settlementBatchId: string;
    settlementBatch: SettlementBatch;
    songId: string;
    partyType: PartyType;
    allocatedAmount: number;
    createdAt: Date;
}
