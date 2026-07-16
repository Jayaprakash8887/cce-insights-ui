import { describe, it, expect } from 'vitest';
import {
  districtOptions,
  filterByDistrictFacility,
  ALL_DISTRICTS,
  ALL_FACILITIES,
} from './DistrictSelect';

const rows = [
  { facilityId: 'A', facilityName: 'Alpha', district: 'North' },
  { facilityId: 'B', facilityName: 'Bravo', district: 'South' },
  { facilityId: 'C', facilityName: 'Charlie', district: 'North' },
  { facilityId: 'D', facilityName: 'Delta', district: '' }, // no district
];

describe('districtOptions', () => {
  it('returns distinct, non-empty districts sorted case-insensitively', () => {
    expect(districtOptions(rows)).toEqual(['North', 'South']);
  });

  it('is empty when no rows carry a district', () => {
    expect(districtOptions([{}, { district: '' }])).toEqual([]);
  });
});

describe('filterByDistrictFacility', () => {
  it('returns all rows when both filters are "all"', () => {
    expect(filterByDistrictFacility(rows, ALL_DISTRICTS, ALL_FACILITIES)).toHaveLength(4);
  });

  it('filters by district', () => {
    const r = filterByDistrictFacility(rows, 'North', ALL_FACILITIES);
    expect(r.map((x) => x.facilityId)).toEqual(['A', 'C']);
  });

  it('filters by a single facility', () => {
    const r = filterByDistrictFacility(rows, ALL_DISTRICTS, 'B');
    expect(r.map((x) => x.facilityId)).toEqual(['B']);
  });

  it('applies district and facility together', () => {
    // Facility A is in North → matches; facility B is in South → excluded by district.
    expect(filterByDistrictFacility(rows, 'North', 'A').map((x) => x.facilityId)).toEqual(['A']);
    expect(filterByDistrictFacility(rows, 'North', 'B')).toHaveLength(0);
  });
});
