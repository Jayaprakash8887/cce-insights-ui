import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '../shared/MetricCard';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import { useFacilityActivitySummary, useFacilityActivityDetail } from '../../hooks/useFacilities';
import { formatNumber } from '../../utils/formatters';

type Drill = 'active' | 'inactive' | null;

const MODAL_PAGE_SIZE = 10;

/**
 * Total / Active / Inactive facility cards with a drill-down (RI-29): clicking Active or Inactive
 * opens a modal listing the affected facilities for the selected date range. Shared by the
 * Dashboard and Facilities pages so the behaviour is identical in both.
 */
export function FacilityActivityCards({ className }: { className?: string }) {
  const summary = useFacilityActivitySummary();
  const detail = useFacilityActivityDetail();
  const [drill, setDrill] = useState<Drill>(null);
  const [page, setPage] = useState(1);

  const items = detail.data ?? [];
  const list = useMemo(
    () => items.filter((f) => (drill === 'active' ? f.active : drill === 'inactive' ? !f.active : false)),
    [items, drill],
  );

  // Reset to the first page whenever the drill target (or its data) changes.
  useEffect(() => { setPage(1); }, [drill, detail.data]);

  const totalPages = Math.max(1, Math.ceil(list.length / MODAL_PAGE_SIZE));
  const paginated = useMemo(
    () => list.slice((page - 1) * MODAL_PAGE_SIZE, page * MODAL_PAGE_SIZE),
    [list, page],
  );
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const cardValue = (n: number | undefined) =>
    summary.isLoading ? '…' : summary.error ? '—' : formatNumber(n ?? 0);

  return (
    <>
      {summary.error && <ErrorAlert error={summary.error} />}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className ?? ''}`}>
        <MetricCard
          title="Total Facilities"
          description="All in-scope healthcare facilities in the facility reference list."
          value={cardValue(summary.data?.totalInScope)}
        />
        <MetricCard
          title="Active Facilities"
          description="Facilities that transmitted at least one HIE event within the selected period. Click to list them."
          value={cardValue(summary.data?.activeFacilities)}
          bgColor="bg-green-50"
          onClick={() => setDrill('active')}
        />
        <MetricCard
          title="Inactive Facilities"
          description="In-scope facilities with no HIE events transmitted within the selected period. Click to list them."
          value={cardValue(summary.data?.inactiveFacilities)}
          bgColor="bg-red-50"
          onClick={() => setDrill('inactive')}
        />
      </div>

      <Modal
        open={drill !== null}
        onClose={() => setDrill(null)}
        title={`${drill === 'active' ? 'Active' : 'Inactive'} Facilities (${list.length})`}
      >
        {detail.isLoading ? (
          <LoadingSpinner />
        ) : detail.error ? (
          <ErrorAlert error={detail.error} />
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No facilities to display for this period.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">Facility</th>
                    <th className="pb-2 pr-4">District</th>
                    <th className="pb-2">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((f) => (
                    <tr key={f.facilityId} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-900">{f.facilityName || f.facilityId}</td>
                      <td className="py-2 pr-4 text-gray-600">{f.district || '—'}</td>
                      <td className="py-2 text-gray-600">{f.lastActivity ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableRangePagination
              page={page}
              pageSize={MODAL_PAGE_SIZE}
              totalCount={list.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Modal>
    </>
  );
}
