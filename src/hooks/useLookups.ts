import { useQuery } from '@tanstack/react-query';
import { getProtocols, getFacilities, getDistricts, getPractitioners, getSources, getPatients } from '../api/lookups';

export function useProtocols() {
  return useQuery({
    queryKey: ['lookups', 'protocols'],
    queryFn: getProtocols,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFacilityLookup() {
  return useQuery({
    queryKey: ['lookups', 'facilities'],
    queryFn: getFacilities,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: ['lookups', 'districts'],
    queryFn: getDistricts,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePractitioners() {
  return useQuery({
    queryKey: ['lookups', 'practitioners'],
    queryFn: getPractitioners,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSourcesLookup() {
  return useQuery({
    queryKey: ['lookups', 'sources'],
    queryFn: getSources,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatientLookup() {
  return useQuery({
    queryKey: ['lookups', 'patients'],
    queryFn: getPatients,
    staleTime: 5 * 60 * 1000,
  });
}
