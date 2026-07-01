import { describe, it, expect } from 'vitest';
import {
  parseCanonicalUrl,
  classifyComplianceCategory,
  complianceCategoryLabel,
} from './compliance';

describe('parseCanonicalUrl', () => {
  it('splits url, version, and trailing name segment', () => {
    const result = parseCanonicalUrl('https://openphc.org/protocols/anc|1.0');
    expect(result).toEqual({
      url: 'https://openphc.org/protocols/anc',
      version: '1.0',
      name: 'anc',
    });
  });

  it('defaults version to empty string when no pipe present', () => {
    const result = parseCanonicalUrl('https://openphc.org/protocols/rmnch');
    expect(result.version).toBe('');
    expect(result.name).toBe('rmnch');
  });
});

describe('classifyComplianceCategory', () => {
  it('is on_track when there are no deviations', () => {
    expect(classifyComplianceCategory(0)).toBe('on_track');
  });

  it('is non_compliant when there is at least one deviation', () => {
    expect(classifyComplianceCategory(1)).toBe('non_compliant');
    expect(classifyComplianceCategory(42)).toBe('non_compliant');
  });
});

describe('complianceCategoryLabel', () => {
  it('maps on_track to Compliant and anything else to Non-Compliant', () => {
    expect(complianceCategoryLabel('on_track')).toBe('Compliant');
    expect(complianceCategoryLabel('non_compliant')).toBe('Non-Compliant');
  });
});
