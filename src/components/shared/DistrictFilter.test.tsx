import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DistrictFilter } from './DistrictFilter';
import { FilterContext, type FilterContextValue } from '../../context/FilterContext';

// Stub the districts lookup so the dropdown has options without a network/react-query layer.
vi.mock('../../hooks/useLookups', () => ({
  useDistricts: () => ({ data: ['Gasabo', 'Kicukiro'] }),
}));

function renderWithContext(overrides: Partial<FilterContextValue> = {}) {
  const setDistrict = vi.fn();
  const value: FilterContextValue = {
    startDate: '2026-01-01',
    endDate: '2026-07-01',
    facilityId: undefined,
    district: undefined,
    setDateRange: vi.fn(),
    setFacilityId: vi.fn(),
    setDistrict,
    ...overrides,
  };
  render(
    <FilterContext.Provider value={value}>
      <DistrictFilter />
    </FilterContext.Provider>,
  );
  return { setDistrict };
}

describe('DistrictFilter', () => {
  it('renders All Districts plus every district option', () => {
    renderWithContext();
    expect(screen.getByRole('option', { name: 'All Districts' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gasabo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kicukiro' })).toBeInTheDocument();
  });

  it('selecting a district calls setDistrict with that value', () => {
    const { setDistrict } = renderWithContext();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Gasabo' } });
    expect(setDistrict).toHaveBeenCalledWith('Gasabo');
  });

  it('selecting "All Districts" clears the filter (undefined)', () => {
    const { setDistrict } = renderWithContext({ district: 'Gasabo' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(setDistrict).toHaveBeenCalledWith(undefined);
  });
});
