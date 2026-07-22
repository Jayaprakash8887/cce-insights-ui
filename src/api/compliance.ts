import { apiGet, apiGetPaginated } from './client';
import type { ComplianceSummary, FacilitySummary, PatientCompliance, GlobalFilters } from './types';

export function getAllProtocolsComplianceSummary(
  filters?: GlobalFilters,
  dateFilterMode?: 'enrollment' | 'eventTime',
): Promise<ComplianceSummary> {
  return apiGet('/protocols/compliance-summary', {
    facilityId: filters?.facilityId,
    district: filters?.district,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    dateFilterMode,
  });
}

export function getProtocolComplianceSummary(
  protocolDefinitionId: string,
  filters?: GlobalFilters,
  dateFilterMode?: 'enrollment' | 'eventTime',
): Promise<ComplianceSummary> {
  return apiGet(`/protocols/${encodeURIComponent(protocolDefinitionId)}/compliance-summary`, {
    facilityId: filters?.facilityId,
    district: filters?.district,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    dateFilterMode,
  });
}

export function getFacilityComplianceSummary(
  facilityId: string,
  params?: { protocolDefinitionId?: string; startDate?: string; endDate?: string },
): Promise<FacilitySummary> {
  return apiGet(`/facilities/${encodeURIComponent(facilityId)}/compliance-summary`, {
    protocolDefinitionId: params?.protocolDefinitionId,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
}

export function getProtocolPatients(
  protocolDefinitionId: string,
  params?: {
    status?: string;
    facilityId?: string;
    district?: string;
    limit?: number;
    cursor?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    dateFilterMode?: 'enrollment' | 'eventTime';
  },
) {
  return apiGetPaginated<PatientCompliance>(
    `/protocols/${encodeURIComponent(protocolDefinitionId)}/patients`,
    {
      status: params?.status,
      facilityId: params?.facilityId,
      district: params?.district,
      limit: (params?.limit ?? 15).toString(),
      cursor: params?.cursor,
      patientId: params?.patientId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      dateFilterMode: params?.dateFilterMode ?? 'enrollment',
    },
  );
}
