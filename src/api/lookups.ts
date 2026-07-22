import { apiGet } from './client';
import type { ProtocolLookup, FacilityLookup } from './types';

export function getProtocols() {
  return apiGet<ProtocolLookup[]>('/lookups/protocols');
}

export function getFacilities() {
  return apiGet<FacilityLookup[]>('/lookups/facilities');
}

export function getDistricts() {
  return apiGet<string[]>('/lookups/districts');
}

export function getPractitioners() {
  return apiGet<string[]>('/lookups/practitioners');
}

export function getSources() {
  return apiGet<string[]>('/lookups/sources');
}

export function getPatients() {
  return apiGet<string[]>('/lookups/patients');
}
