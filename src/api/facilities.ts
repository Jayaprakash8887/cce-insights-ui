import { apiGet, apiGetPaginated } from './client';
import type {
  FacilityRanking, RankBy, SortOrder,
  FacilityActivitySummary, FacilityActivityItem, FacilityReference, AdoptionKpi,
} from './types';

export function getFacilityActivitySummary(params?: {
  startDate?: string;
  endDate?: string;
  facilityId?: string;
}): Promise<FacilityActivitySummary> {
  return apiGet('/facilities/activity-summary', {
    startDate: params?.startDate ? params.startDate.substring(0, 10) : undefined,
    endDate:   params?.endDate   ? params.endDate.substring(0, 10)   : undefined,
    facilityId: params?.facilityId,
  });
}

export function getFacilityReference(): Promise<FacilityReference[]> {
  return apiGet('/facilities/reference');
}

export function getFacilityActivityDetail(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<FacilityActivityItem[]> {
  return apiGet('/facilities/activity-detail', {
    startDate: params?.startDate ? params.startDate.substring(0, 10) : undefined,
    endDate:   params?.endDate   ? params.endDate.substring(0, 10)   : undefined,
  });
}

// The adoption endpoint accepts plain LocalDate (YYYY-MM-DD), not ISO datetime.
// Extract the date portion from the ISO strings the global filters provide.
export function getAdoptionKpis(params?: {
  startDate?: string;
  endDate?: string;
  facilityId?: string;
}): Promise<AdoptionKpi[]> {
  return apiGet('/facilities/adoption', {
    startDate: params?.startDate ? params.startDate.substring(0, 10) : undefined,
    endDate:   params?.endDate   ? params.endDate.substring(0, 10)   : undefined,
    facilityId: params?.facilityId,
  });
}

export function getFacilityRanking(params?: {
  protocolDefinitionId?: string;
  facilityId?: string;
  rankBy?: RankBy;
  order?: SortOrder;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}) {
  return apiGetPaginated<FacilityRanking>('/facilities/ranking', {
    protocolDefinitionId: params?.protocolDefinitionId,
    facilityId: params?.facilityId,
    rankBy: params?.rankBy,
    order: params?.order,
    startDate: params?.startDate ? params.startDate.substring(0, 10) : undefined,
    endDate: params?.endDate ? params.endDate.substring(0, 10) : undefined,
    limit: params?.limit?.toString(),
    cursor: params?.cursor,
  });
}
