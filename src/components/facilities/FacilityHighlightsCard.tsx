import { useMemo } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { useFacilityRanking } from '../../hooks/useFacilities';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { findDuplicateFacilityNames, formatFacilityDisplayName } from '../../utils/facilityDisplay';
import { splitTopBottom } from '../../utils/ranking';
import type { FacilityRanking } from '../../api/types';

const HIGHLIGHT_COUNT = 5;

export function FacilityHighlightsCard({ className }: { className?: string }) {
  // Fetch the full (district-scoped) ranking once, then slice top/bottom client-side. Fetching
  // separate limit=5 desc/asc lists breaks under the global district filter (the server limit is
  // applied before district scoping), which is why Top-5 and Bottom-5 could show different counts.
  const ranking = useFacilityRanking({
    rankBy: 'complianceRate',
    order: 'desc',
    limit: 200,
  });

  const isLoading = ranking.isPending;
  const error = ranking.error;

  const { top: topFacilities, bottom: bottomFacilities } = useMemo(
    () => splitTopBottom(ranking.data?.data ?? [], HIGHLIGHT_COUNT),
    [ranking.data],
  );

  const duplicateNames = useMemo(
    () => findDuplicateFacilityNames([...topFacilities, ...bottomFacilities]),
    [topFacilities, bottomFacilities],
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;
  if (topFacilities.length === 0 && bottomFacilities.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${className ?? ''}`}>
      <Card title={`Top ${HIGHLIGHT_COUNT} Facilities`} subtitle="by compliance rate in the selected period">
        <div className="space-y-3">
          {topFacilities.map((f, i) => (
            <FacilityRow key={f.facilityId} facility={f} index={i} variant="top" duplicateNames={duplicateNames} />
          ))}
          {topFacilities.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No facility data available</p>
          )}
        </div>
      </Card>
      <Card title={`Bottom ${HIGHLIGHT_COUNT} Facilities`} subtitle="by compliance rate in the selected period">
        <div className="space-y-3">
          {bottomFacilities.map((f, i) => (
            <FacilityRow key={f.facilityId} facility={f} index={i} variant="bottom" duplicateNames={duplicateNames} />
          ))}
          {bottomFacilities.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No facility data available</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function FacilityRow({
  facility,
  index,
  variant,
  duplicateNames,
}: {
  facility: FacilityRanking;
  index: number;
  variant: 'top' | 'bottom';
  duplicateNames: ReadonlySet<string>;
}) {
  const Icon = variant === 'top' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const accentColor = variant === 'top' ? 'text-green-600' : 'text-red-600';
  const badgeBg = variant === 'top' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeBg}`}>
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">
            {formatFacilityDisplayName(facility, duplicateNames)}
          </p>
          <p className="text-xs text-gray-500">
            {formatNumber(facility.totalEvents)} events · {formatNumber(facility.activeDeviations)} deviations
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-xs">
        <div className="text-center">
          <p className="text-gray-500">Tracked</p>
          <p className="font-semibold text-gray-700">{formatNumber(facility.totalEnrollments)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Events</p>
          <p className="font-semibold text-gray-700">{formatNumber(facility.totalEvents)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Compliance</p>
          <div className="flex items-center justify-center gap-1">
            <Icon className={`h-4 w-4 ${accentColor}`} />
            <span className={`font-semibold ${accentColor}`}>
              {formatPercentage(facility.complianceRate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
