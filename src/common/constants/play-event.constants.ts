/**
 * Default per-play royalty in KRW used when a PlayEvent is recorded
 * without an explicit `unitPrice`. Kept as an integer so all downstream
 * settlement math stays in whole KRW (no floating point).
 */
export const DEFAULT_UNIT_PRICE_KRW = 10;
