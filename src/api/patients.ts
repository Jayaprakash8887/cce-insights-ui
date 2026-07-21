import { apiGet } from './client';
import { apiGetPaginated } from './client';
import type {
  PatientTimeline, ProtocolTracking, ProtocolTrackingDetail,
  PatientEvent, PatientDeviation, PatientIntelligenceDelivery,
  AtRiskHotspot, RepeatDeviationPatient, PatientReferral, GlobalFilters,
} from './types';

/** RI-44 — patients behind the "Referrals Received by HIE" indicator (event_time-scoped). */
export function getReferralsReceivedByHie(filters?: GlobalFilters): Promise<PatientReferral[]> {
  return apiGet('/patients/referrals/received-by-hie', {
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    district: filters?.district,
  });
}

export function getPatientTimeline(
  patientId: string,
  params?: { startDate?: string; endDate?: string },
): Promise<PatientTimeline> {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/compliance-timeline`, {
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
}

export function getPatientProtocolTracking(patientId: string): Promise<ProtocolTracking[]> {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/protocol-tracking`);
}

export function getPatientProtocolTrackingDetail(
  patientId: string,
  protocolInstanceId: string,
): Promise<ProtocolTrackingDetail> {
  return apiGet(
    `/patients/${encodeURIComponent(patientId)}/protocol-tracking/${encodeURIComponent(protocolInstanceId)}`,
  );
}

export function getPatientEvents(
  patientId: string,
  params?: {
    resourceType?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
): Promise<PatientEvent[]> {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/events`, {
    resourceType: params?.resourceType,
    source: params?.source,
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit?.toString(),
  });
}

export function getPatientDeviations(
  patientId: string,
  params?: { deviationType?: string; startDate?: string; endDate?: string },
): Promise<PatientDeviation[]> {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/deviations`, {
    deviationType: params?.deviationType,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
}

export function getPatientIntelligenceDeliveries(patientId: string): Promise<PatientIntelligenceDelivery[]> {
  return apiGet(`/patients/${encodeURIComponent(patientId)}/intelligence-deliveries`);
}

export function getAtRiskHotspots(params?: {
  protocolDefinitionId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}) {
  return apiGetPaginated<AtRiskHotspot>('/patients/at-risk-hotspots', {
    protocolDefinitionId: params?.protocolDefinitionId,
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit?.toString(),
    cursor: params?.cursor,
  });
}

export function getRepeatDeviations(params?: {
  minDeviations?: number;
  facilityId?: string;
  protocolDefinitionId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}) {
  return apiGetPaginated<RepeatDeviationPatient>('/patients/repeat-deviations', {
    minDeviations: params?.minDeviations?.toString(),
    facilityId: params?.facilityId,
    protocolDefinitionId: params?.protocolDefinitionId,
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit?.toString(),
    cursor: params?.cursor,
  });
}
