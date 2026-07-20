import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '../shared/MetricCard';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import {
  DistrictFacilityFilter,
  filterByDistrictFacility,
  ALL_DISTRICTS,
  ALL_FACILITIES,
} from '../shared/DistrictSelect';
import { useFacilityActivitySummary, useFacilityActivityDetail } from '../../hooks/useFacilities';
import { formatNumber } from '../../utils/formatters';
import { findDuplicateFacilityNames, formatFacilityDisplayName } from '../../utils/facilityDisplay';

const PAGE_SIZE = 12;  // divisible by 2 and 3 — fills the grid rows evenly

type OpenStatus = 'all' | 'active' | 'inactive';
const STATUS_LABEL: Record<OpenStatus, string> = {
  all: 'All Facilities',
  active: 'Active Facilities',
  inactive: 'Inactive Facilities',
};

/**
 * Facility Status (RI-42): Total / Active / Inactive indicators in one card. Each indicator is
 * individually clickable and opens ITS OWN drill-down — clicking "Active Facilities" lists the
 * active facilities, "Inactive Facilities" lists the inactive ones (Total → all). The open list is
 * refinable by District + Facility (shared DistrictFacilityFilter, same as the Adoption page).
 * Facilities page only.
 */
export function FacilityActivityCards({ className }: { className?: string }) {
  const summary = useFacilityActivitySummary();
  const detail = useFacilityActivityDetail();
  const [openStatus, setOpenStatus] = useState<OpenStatus | null>(null);
  const [page, setPage] = useState(1);
  const [district, setDistrict] = useState<string>(ALL_DISTRICTS);
  const [facility, setFacility] = useState<string>(ALL_FACILITIES);

  const items = detail.data ?? [];
  const duplicateNames = useMemo(() => findDuplicateFacilityNames(items), [items]);

  // Base list for the open indicator (before the district/facility cascade).
  const statusList = useMemo(() => {
    if (openStatus === 'active') return items.filter((f) => f.active);
    if (openStatus === 'inactive') return items.filter((f) => !f.active);
    return items;
  }, [items, openStatus]);

  // Displayed list = open indicator, narrowed by District + Facility.
  const list = useMemo(
    () => filterByDistrictFacility(statusList, district, facility),
    [statusList, district, facility],
  );

  // Reset the cascade + paging when the open indicator or the data changes.
  useEffect(() => { setDistrict(ALL_DISTRICTS); setFacility(ALL_FACILITIES); }, [openStatus]);
  useEffect(() => { setPage(1); }, [detail.data, openStatus, district, facility]);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page],
  );

  const cardValue = (n: number | undefined) =>
    summary.isLoading ? '…' : summary.error ? '—' : formatNumber(n ?? 0);

  // Toggle a card's drill-down: click the open one to close.
  const toggle = (s: OpenStatus) => setOpenStatus((prev) => (prev === s ? null : s));

  return (
    <Card
      title="Facility Status"
      description="Active vs inactive facilities for the selected period. Click an indicator for its facility list."
      className={className}
    >
      {summary.error && <ErrorAlert error={summary.error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Facilities"
          description="All in-scope healthcare facilities in the facility reference list."
          value={cardValue(summary.data?.totalInScope)}
          onClick={() => toggle('all')}
          selected={openStatus === 'all'}
        />
        <MetricCard
          title="Active Facilities"
          description="Facilities that transmitted at least one HIE event within the selected period. Click for the list."
          value={cardValue(summary.data?.activeFacilities)}
          bgColor="bg-green-50"
          onClick={() => toggle('active')}
          selected={openStatus === 'active'}
        />
        <MetricCard
          title="Inactive Facilities"
          description="In-scope facilities with no HIE events transmitted within the selected period. Click for the list."
          value={cardValue(summary.data?.inactiveFacilities)}
          bgColor="bg-red-50"
          onClick={() => toggle('inactive')}
          selected={openStatus === 'inactive'}
        />
      </div>

      {openStatus && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">{STATUS_LABEL[openStatus]} ({list.length})</h3>
            {!detail.isLoading && !detail.error && items.length > 0 && (
              <DistrictFacilityFilter
                idPrefix="facility-status"
                options={items}
                district={district}
                facility={facility}
                onDistrictChange={setDistrict}
                onFacilityChange={setFacility}
              />
            )}
          </div>

          {detail.isLoading ? (
            <LoadingSpinner />
          ) : detail.error ? (
            <ErrorAlert error={detail.error} />
          ) : statusList.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No facilities to display for this selection.</p>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No facilities match the selected filters.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((f) => {
                  const name = formatFacilityDisplayName(f, duplicateNames);
                  return (
                    <div
                      key={f.facilityId}
                      className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <span
                        className={`h-2.5 w-2.5 flex-none rounded-full ${f.active ? 'bg-green-500' : 'bg-red-400'}`}
                        title={f.active ? 'Active' : 'Inactive'}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900" title={name}>{name}</p>
                        <p className="truncate text-xs text-gray-500">{f.district || '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <TableRangePagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={list.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
