import { describe, it, expect } from 'vitest';
import { splitTopBottom } from './ranking';
import type { FacilityRanking } from '../api/types';

const fac = (id: string, rate: number): FacilityRanking =>
  ({ facilityId: id, complianceRate: rate } as FacilityRanking);

describe('splitTopBottom', () => {
  it('returns the N best (desc) and N worst (worst-first) when there are more than N', () => {
    const rows = [fac('a', 90), fac('b', 80), fac('c', 70), fac('d', 60), fac('e', 50), fac('f', 40), fac('g', 30)];
    const { top, bottom } = splitTopBottom(rows, 5);
    expect(top.map((f) => f.facilityId)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(bottom.map((f) => f.facilityId)).toEqual(['g', 'f', 'e', 'd', 'c']);
  });

  it('returns all facilities in both lists (opposite order) when there are N or fewer', () => {
    const rows = [fac('x', 66.7), fac('y', 50), fac('z', 0)];
    const { top, bottom } = splitTopBottom(rows, 5);
    expect(top.map((f) => f.facilityId)).toEqual(['x', 'y', 'z']);   // best first
    expect(bottom.map((f) => f.facilityId)).toEqual(['z', 'y', 'x']); // worst first
    expect(top).toHaveLength(3);
    expect(bottom).toHaveLength(3);
  });

  it('does not mutate the input array', () => {
    const rows = [fac('a', 10), fac('b', 90)];
    splitTopBottom(rows, 5);
    expect(rows.map((f) => f.facilityId)).toEqual(['a', 'b']);
  });

  it('handles an empty ranking', () => {
    const { top, bottom } = splitTopBottom([], 5);
    expect(top).toEqual([]);
    expect(bottom).toEqual([]);
  });
});
