import { apiGet } from './client';
import type { StepAnalytics, CompletionFunnel, OutcomeDistribution, EnrollmentTrend, ActionOrderEntry } from './types';

export function getStepAnalytics(
  protocolDefinitionId: string,
  params?: { facilityId?: string; district?: string; startDate?: string; endDate?: string },
): Promise<StepAnalytics> {
  return apiGet(`/protocols/${encodeURIComponent(protocolDefinitionId)}/step-analytics`, params);
}

export function getCompletionFunnel(
  protocolDefinitionId: string,
  params?: { facilityId?: string; startDate?: string; endDate?: string },
): Promise<CompletionFunnel> {
  return apiGet(`/protocols/${encodeURIComponent(protocolDefinitionId)}/completion-funnel`, params);
}

export function getActionOrder(
  protocolDefinitionId: string,
): Promise<ActionOrderEntry[]> {
  return apiGet(`/protocols/${encodeURIComponent(protocolDefinitionId)}/action-order`);
}

export function getOutcomeDistribution(
  protocolDefinitionId: string,
  params?: { facilityId?: string; startDate?: string; endDate?: string },
): Promise<OutcomeDistribution> {
  return apiGet(
    `/protocols/${encodeURIComponent(protocolDefinitionId)}/outcome-distribution`,
    params,
  );
}

export function getEnrollmentTrends(
  protocolDefinitionId: string,
  params?: {
    interval?: string;
    facilityId?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<EnrollmentTrend> {
  return apiGet(
    `/protocols/${encodeURIComponent(protocolDefinitionId)}/enrollment-trends`,
    params,
  );
}
