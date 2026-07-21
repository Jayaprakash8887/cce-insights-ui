import { useQuery } from '@tanstack/react-query';
import {
  getPatientTimeline, getPatientProtocolTracking,
  getPatientProtocolTrackingDetail, getPatientEvents, getPatientDeviations,
  getPatientIntelligenceDeliveries, getAtRiskHotspots, getRepeatDeviations,
  getReferralsReceivedByHie,
} from '../api/patients';
import { useGlobalFilters } from './useGlobalFilters';

/** RI-44 — patients with a referral received by HIE in the selected period. */
export function usePatientReferralsReceived() {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'referrals', 'received-by-hie', filters],
    queryFn: () => getReferralsReceivedByHie(filters),
  });
}

export function usePatientTimeline(patientId: string) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'timeline', patientId, filters],
    queryFn: () => getPatientTimeline(patientId, filters),
    enabled: !!patientId,
  });
}

export function usePatientProtocolTracking(patientId: string) {
  return useQuery({
    queryKey: ['patients', 'tracking', patientId],
    queryFn: () => getPatientProtocolTracking(patientId),
    enabled: !!patientId,
  });
}

export function usePatientProtocolTrackingDetail(patientId: string, protocolInstanceId: string) {
  return useQuery({
    queryKey: ['patients', 'tracking', patientId, protocolInstanceId],
    queryFn: () => getPatientProtocolTrackingDetail(patientId, protocolInstanceId),
    enabled: !!patientId && !!protocolInstanceId,
  });
}

export function usePatientEvents(patientId: string, params?: { resourceType?: string; source?: string; limit?: number }) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'events', patientId, { ...params, ...filters }],
    queryFn: () => getPatientEvents(patientId, { ...params, ...filters }),
    enabled: !!patientId,
  });
}

export function usePatientDeviations(patientId: string, params?: { deviationType?: string }) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'deviations', patientId, { ...params, ...filters }],
    queryFn: () => getPatientDeviations(patientId, { ...params, ...filters }),
    enabled: !!patientId,
  });
}

export function usePatientIntelligenceDeliveries(patientId: string) {
  return useQuery({
    queryKey: ['patients', 'intelligence-deliveries', patientId],
    queryFn: () => getPatientIntelligenceDeliveries(patientId),
    enabled: !!patientId,
  });
}

export function useAtRiskHotspots(params?: { protocolDefinitionId?: string; limit?: number }) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'at-risk-hotspots', { ...params, ...filters }],
    queryFn: () => getAtRiskHotspots({ ...params, ...filters }),
  });
}

export function useRepeatDeviations(params?: { minDeviations?: number; protocolDefinitionId?: string; limit?: number }) {
  const filters = useGlobalFilters();
  return useQuery({
    queryKey: ['patients', 'repeat-deviations', { ...params, ...filters }],
    queryFn: () => getRepeatDeviations({ ...params, ...filters }),
  });
}
