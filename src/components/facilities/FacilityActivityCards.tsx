import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '../shared/MetricCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import { ClickableMetricGroup } from '../shared/ClickableMetricGroup';
import {
  DistrictFacilityFilter, filterByDistrictFacility, LabeledSelect,
  ALL_DISTRICTS, ALL_FACILITIES,
} from '../shared/DistrictSelect';
import { useFacilityActivitySummary, useFacilityActivityDetail } from '../../hooks/useFacilities';
import { formatNumber } from '../../utils/formatters';
import { findDuplicateFacilityNames, formatFacilityDisplayName } from '../../utils/facilityDisplay';

const PAGE_SIZE = 10;

/**
 * Facility Status (RI-35): Total / Active / Inactive metrics in one white card. Clicking the card
 * reveals the facility list inside the same card, with Status (All/Active/Inactive), District and
 * Facility filters. Shared by the Dashboard and Facilities pages.
 */
export function FacilityActivityCards({ className }: { className?: string }) {
  const summary = useFacilityActivitySummary();
  const detail = useFacilityActivityDetail();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [district, setDistrict] = useState<string>(ALL_DISTRICTS);
  const [facility, setFacility] = useState<string>(ALL_FACILITIES);
  const [page, setPage] = useState(1);

  const items = detail.data ?? [];
  // Append the facility id when two facilities share a display name.
  const duplicateNames = useMemo(() => findDuplicateFacilityNames(items), [items]);

  const list = useMemo(() => {
    let r = filterByDistrictFacility(items, district, facility);
    if (status === 'active') r = r.filter((f) => f.active);
    else if (status === 'inactive') r = r.filter((f) => !f.active);
    return r;
  }, [items, district, facility, status]);

  useEffect(() => { setPage(1); }, [detail.data, status, district, facility]);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page],
  );

  const cardValue = (n: number | undefined) =>
    summary.isLoading ? '…' : summary.error ? '—' : formatNumber(n ?? 0);

  const detailContent = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">Facility Status Details ({list.length})</h3>
        <div className="flex flex-wrap items-center gap-2">
          <LabeledSelect
            id="fac-activity-status"
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <DistrictFacilityFilter
            idPrefix="fac-activity"
            options={items}
            district={district}
            facility={facility}
            onDistrictChange={setDistrict}
            onFacilityChange={setFacility}
          />
        </div>
      </div>

      {detail.isLoading ? (
        <LoadingSpinner />
      ) : detail.error ? (
        <ErrorAlert error={detail.error} />
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No facilities to display for this selection.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-4">District</th>
                  <th className="pb-2 pr-4">Facility</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((f) => (
                  <tr key={f.facilityId} className="hover:bg-gray-50">
                    <td className="truncate py-2 pr-4 font-medium text-gray-900">{f.district || '—'}</td>
                    <td className="truncate py-2 pr-4 font-medium text-gray-900" title={formatFacilityDisplayName(f, duplicateNames)}>{formatFacilityDisplayName(f, duplicateNames)}</td>
                    <td className={`py-2 pr-4 font-medium ${f.active ? 'text-green-700' : 'text-red-700'}`}>
                      {f.active ? 'Active' : 'Inactive'}
                    </td>
                    <td className="py-2 text-gray-600">{f.lastActivity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableRangePagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={list.length}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );

  return (
    <>
      {summary.error && <ErrorAlert error={summary.error} />}
      <ClickableMetricGroup
        title="Facility Status"
        description="Active vs inactive facilities for the selected period. Click for the facility list."
        cols={3}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        className={className}
        detail={detailContent}
      >
        <MetricCard
          title="Total Facilities"
          description="All in-scope healthcare facilities in the facility reference list."
          value={cardValue(summary.data?.totalInScope)}
        />
        <MetricCard
          title="Active Facilities"
          description="Facilities with at least one protocol-tracked event (an HIE event matched to a protocol / tracked care journey) within the selected period. Reconciles with the tracked patients in the Facility Ranking."
          value={cardValue(summary.data?.activeFacilities)}
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Inactive Facilities"
          description="In-scope facilities with no protocol-tracked events within the selected period (a facility may still be transmitting HIE events that are not matched to any protocol)."
          value={cardValue(summary.data?.inactiveFacilities)}
          bgColor="bg-red-50"
        />
      </ClickableMetricGroup>
    </>
  );
}
