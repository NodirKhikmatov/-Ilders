import { Injectable } from '@nestjs/common';
import {
  REVENUE_SPLIT_BASIS_POINTS,
  REMAINDER_ALLOCATION_ORDER,
  TOTAL_BASIS_POINTS,
} from '../../common/constants/revenue-split.constants';
import { PartyType } from '../../common/enums/party-type.enum';

export interface SettlementAllocationResult {
  creatorPool: number;
  cmo: number;
  platform: number;
  totalAllocated: number;
}

interface PartyShare {
  party: PartyType;
  floor: number;
  remainder: number;
}

@Injectable()
export class SettlementCalculatorService {
  calculate(songRevenue: number): SettlementAllocationResult {
    if (!Number.isInteger(songRevenue) || songRevenue < 0) {
      throw new Error('songRevenue must be a non-negative integer');
    }

    const shares = this.computeFloorsAndRemainders(songRevenue);
    const allocated = this.distributeRemainder(songRevenue, shares);

    const creatorPool = allocated.get(PartyType.CREATOR_POOL)!;
    const cmo = allocated.get(PartyType.CMO)!;
    const platform = allocated.get(PartyType.PLATFORM)!;

    return {
      creatorPool,
      cmo,
      platform,
      totalAllocated: creatorPool + cmo + platform,
    };
  }

  private computeFloorsAndRemainders(songRevenue: number): PartyShare[] {
    return REMAINDER_ALLOCATION_ORDER.map((party) => {
      const product = songRevenue * REVENUE_SPLIT_BASIS_POINTS[party];
      return {
        party,
        floor: Math.floor(product / TOTAL_BASIS_POINTS),
        remainder: product % TOTAL_BASIS_POINTS,
      };
    });
  }

  /**
   * Largest Remainder Method: credit leftover KRW one unit at a time
   * to parties with the highest fractional remainder, breaking ties
   * by REMAINDER_ALLOCATION_ORDER for deterministic results.
   */
  private distributeRemainder(
    songRevenue: number,
    shares: PartyShare[],
  ): Map<PartyType, number> {
    const allocated = new Map<PartyType, number>(
      shares.map(({ party, floor }) => [party, floor]),
    );

    const totalFloor = shares.reduce((sum, { floor }) => sum + floor, 0);
    const leftover = songRevenue - totalFloor;

    const ranked = [...shares].sort((a, b) => {
      if (b.remainder !== a.remainder) {
        return b.remainder - a.remainder;
      }
      return (
        REMAINDER_ALLOCATION_ORDER.indexOf(a.party) -
        REMAINDER_ALLOCATION_ORDER.indexOf(b.party)
      );
    });

    for (let i = 0; i < leftover; i++) {
      const party = ranked[i].party;
      allocated.set(party, allocated.get(party)! + 1);
    }

    return allocated;
  }
}
