import { useQuery } from '@tanstack/react-query';
import {
  getDeviationTrends, getDeviationsByAction,
  getDeviationResolutionRate, getIntelligenceSummary, getDeviationKpis,
} from '../api/deviations';
import { useGlobalFilters } from './useGlobalFilters';

// RI-49: an explicit facilityId (from the Deviations page's per-page Facility picker) overrides
// the global filter's facilityId; falls back to the global value when not provided.
export function useDeviationKpis(protocolDefinitionId?: string, facilityId?: string) {
  const filters = useGlobalFilters();
  const facility = facilityId ?? filters.facilityId;
  return useQuery({
    queryKey: ['deviations', 'kpis', { protocolDefinitionId, facility, ...filters }],
    queryFn: () => getDeviationKpis({
      protocolDefinitionId,
      facilityId: facility,
      district: filters.district,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    refetchInterval: Number(import.meta.env.VITE_POLLING_INTERVAL || 60000),
  });
}

export function useDeviationTrends(interval = 'weekly', protocolDefinitionId?: string, facilityId?: string) {
  const filters = useGlobalFilters();
  const facility = facilityId ?? filters.facilityId;
  return useQuery({
    queryKey: ['deviations', 'trends', { interval, protocolDefinitionId, facility, ...filters }],
    queryFn: () => getDeviationTrends({ interval, protocolDefinitionId, ...filters, facilityId: facility }),
  });
}

export function useDeviationsByAction(protocolDefinitionId?: string, facilityId?: string) {
  const filters = useGlobalFilters();
  const facility = facilityId ?? filters.facilityId;
  return useQuery({
    queryKey: ['deviations', 'by-action', { protocolDefinitionId, facility, ...filters }],
    queryFn: () => getDeviationsByAction({ protocolDefinitionId, ...filters, facilityId: facility }),
  });
}

export function useDeviationResolution() {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['deviations', 'resolution', filters],
    queryFn: () => getDeviationResolutionRate(filters),
  });
}

export function useIntelligenceSummary() {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['deviations', 'intelligence-summary', filters],
    queryFn: () => getIntelligenceSummary(filters),
    refetchInterval: Number(import.meta.env.VITE_POLLING_INTERVAL || 60000),
  });
}
