export interface SettlementAllocationResult {
    creatorPool: number;
    cmo: number;
    platform: number;
    totalAllocated: number;
}
export declare class SettlementCalculatorService {
    calculate(songRevenue: number): SettlementAllocationResult;
    private computeFloorsAndRemainders;
    private distributeRemainder;
}
