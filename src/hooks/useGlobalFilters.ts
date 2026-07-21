import { useContext, useMemo } from 'react';
import { FilterContext } from '../context/FilterContext';
import { toStartOfDayISO, toEndOfDayISO } from '../utils/dates';
import type { GlobalFilters } from '../api/types';

export function useGlobalFilters(): GlobalFilters {
  const ctx = useContext(FilterContext);
  return useMemo(() => ({
    startDate: toStartOfDayISO(ctx.startDate),
    endDate: toEndOfDayISO(ctx.endDate),
    facilityId: ctx.facilityId,
    district: ctx.district,
  }), [ctx.startDate, ctx.endDate, ctx.facilityId, ctx.district]);
}
