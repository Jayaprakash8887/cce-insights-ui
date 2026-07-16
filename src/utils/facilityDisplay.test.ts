import { describe, it, expect } from 'vitest';
import { getFacilityLabel, findDuplicateFacilityNames, formatFacilityDisplayName } from './facilityDisplay';

describe('getFacilityLabel', () => {
  it('prefers the trimmed name', () => {
    expect(getFacilityLabel({ facilityId: '0022', facilityName: '  Kacyiru DH ' })).toBe('Kacyiru DH');
  });
  it('falls back to id when name is empty/missing', () => {
    expect(getFacilityLabel({ facilityId: '0022', facilityName: '' })).toBe('0022');
    expect(getFacilityLabel({ facilityId: '0022' })).toBe('0022');
  });
});

describe('findDuplicateFacilityNames', () => {
  const rows = [
    { facilityId: '0022', facilityName: 'Kacyiru DH' },
    { facilityId: '0035', facilityName: 'Kacyiru DH' }, // same name, different id → duplicate
    { facilityId: '0001', facilityName: 'Masaka DH' },
  ];
  it('returns names shared by 2+ distinct ids', () => {
    expect(findDuplicateFacilityNames(rows)).toEqual(new Set(['Kacyiru DH']));
  });
  it('does not treat one facility repeated (same id) as a collision', () => {
    const repeated = [
      { facilityId: '0022', facilityName: 'Kacyiru DH' },
      { facilityId: '0022', facilityName: 'Kacyiru DH' },
    ];
    expect(findDuplicateFacilityNames(repeated).size).toBe(0);
  });
});

describe('formatFacilityDisplayName', () => {
  const dupes = new Set(['Kacyiru DH']);
  it('appends the id for duplicate names', () => {
    expect(formatFacilityDisplayName({ facilityId: '0035', facilityName: 'Kacyiru DH' }, dupes)).toBe('Kacyiru DH (0035)');
  });
  it('leaves unique names untouched', () => {
    expect(formatFacilityDisplayName({ facilityId: '0001', facilityName: 'Masaka DH' }, dupes)).toBe('Masaka DH');
  });
});
