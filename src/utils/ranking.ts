import type { FacilityRanking } from '../api/types';

/**
 * Split a facility ranking into the top-N (best compliance first) and bottom-N (worst first).
 *
 * Computed from ONE list so both slices reflect the same (district-)scoped set — fetching separate
 * `limit=N` desc/asc lists server-side breaks under the global district filter, because the limit is
 * applied before district scoping, so the two lists end up with mismatched counts. With ≤ N
 * facilities, top and bottom both return all of them (in opposite order).
 */
export function splitTopBottom(
  rows: FacilityRanking[],
  count: number,
): { top: FacilityRanking[]; bottom: FacilityRanking[] } {
  const sorted = [...rows].sort((a, b) => b.complianceRate - a.complianceRate);
  const top = sorted.slice(0, count);
  const bottom = sorted.slice(Math.max(0, sorted.length - count)).reverse();
  return { top, bottom };
}
