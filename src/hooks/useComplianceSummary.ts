import { useQuery } from '@tanstack/react-query';
import { getAllProtocolsComplianceSummary, getProtocolComplianceSummary, getFacilityComplianceSummary, getProtocolPatients } from '../api/compliance';
import { useGlobalFilters } from './useGlobalFilters';

export function useProtocolComplianceSummary(
  protocolDefinitionId: string,
  facilityId?: string,
  dateFilterMode: 'enrollment' | 'eventTime' = 'enrollment',
) {
  const filters = useGlobalFilters();
  const effectiveFilters = { ...filters, ...(facilityId ? { facilityId } : {}) };
  return useQuery({
    queryKey: ['compliance', 'summary', protocolDefinitionId || 'all', dateFilterMode, effectiveFilters],
    queryFn: () => protocolDefinitionId
      ? getProtocolComplianceSummary(protocolDefinitionId, effectiveFilters, dateFilterMode)
      : getAllProtocolsComplianceSummary(effectiveFilters, dateFilterMode),
  });
}

export function useFacilityComplianceSummary(facilityId: string) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['compliance', 'facility', facilityId, filters],
    queryFn: () => getFacilityComplianceSummary(facilityId, filters),
    enabled: !!facilityId,
  });
}

export function useProtocolPatients(
  protocolDefinitionId: string,
  params?: {
    status?: string;
    facilityId?: string;
    limit?: number;
    cursor?: string;
    patientId?: string;
    dateFilterMode?: 'enrollment' | 'eventTime';
  },
) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['compliance', 'patients', protocolDefinitionId, params, filters],
    queryFn: () => getProtocolPatients(protocolDefinitionId, {
      ...params,
      startDate: filters.startDate,
      endDate: filters.endDate,
      facilityId: params?.facilityId ?? filters.facilityId,
      district: filters.district,
      dateFilterMode: params?.dateFilterMode ?? 'enrollment',
    }),
    enabled: !!protocolDefinitionId,
  });
}
