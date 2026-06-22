import { PartyType } from '../enums/party-type.enum';

/**
 * Revenue split percentages expressed in basis points (1 bp = 0.01%).
 * Sum must equal 10_000 (100%).
 */
export const REVENUE_SPLIT_BASIS_POINTS: Record<PartyType, number> = {
  [PartyType.CREATOR_POOL]: 4000,
  [PartyType.CMO]: 1500,
  [PartyType.PLATFORM]: 4500,
};

export const TOTAL_BASIS_POINTS = 10_000;

/**
 * Deterministic remainder allocation priority order.
 * When integer rounding leaves a remainder, parties are credited
 * in this order until the remainder is exhausted.
 */
export const REMAINDER_ALLOCATION_ORDER: PartyType[] = [
  PartyType.CREATOR_POOL,
  PartyType.CMO,
  PartyType.PLATFORM,
];
