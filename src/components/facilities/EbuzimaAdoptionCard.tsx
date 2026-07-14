import { useEffect, useMemo, useState } from 'react';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import { useAdoptionKpis } from '../../hooks/useFacilities';
import { useReferralsKpi } from '../../hooks/useDashboard';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { findDuplicateFacilityNames, formatFacilityDisplayName } from '../../utils/facilityDisplay';

const TABLE_PAGE_SIZE = 10;

export function EbuzimaAdoptionCard({ className }: { className?: string }) {
  const adoption = useAdoptionKpis();
  const referrals = useReferralsKpi();
  const [page, setPage] = useState(1);

  // Per-facility referral counts (same period/event_time as adoption) keyed for O(1) row lookup.
  const referralByFacility = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of referrals.data?.byFacility ?? []) m.set(r.facilityId, r.count);
    return m;
  }, [referrals.data]);

  const adoptionRows = adoption.data ?? [];
  const paginatedRows = useMemo(
    () => adoptionRows.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE),
    [adoptionRows, page],
  );
  const totalPages = Math.max(1, Math.ceil(adoptionRows.length / TABLE_PAGE_SIZE));

  const duplicateNames = useMemo(
    () => findDuplicateFacilityNames(adoption.data ?? []),
    [adoption.data],
  );

  useEffect(() => { setPage(1); }, [adoption.data]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <Card
      title="e-Buzima Adoption"
      description="Average daily reporting vs. expected baseline over the selected period. Each day a patient reports at a facility counts once (not unique patients across days)."
      className={className}
    >
      {adoption.isLoading ? <LoadingSpinner /> : adoption.error ? <ErrorAlert error={adoption.error} /> : adoption.data ? (
        adoption.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No adoption data available for this period</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">Facility</th>
                    <th className="pb-2 pr-4 text-center">Referrals</th>
                    <th className="pb-2 pr-4 text-center">Expected Visits / Day</th>
                    <th className="pb-2 pr-4 text-center">Actual Visits / Day</th>
                    <th className="pb-2 pr-4 text-center">Reporting Gap / Day</th>
                    <th className="pb-2 pr-4 text-center">Adoption Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRows.map((f) => {
                    const rate = f.adoptionRate;
                    const rateColor = rate >= 80 ? 'text-green-700' : rate >= 50 ? 'text-amber-700' : 'text-red-700';
                    const barColor = rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <tr key={f.facilityId} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-900 truncate">
                          {formatFacilityDisplayName(f, duplicateNames)}
                        </td>
                        <td className="py-2.5 pr-4 text-center tabular-nums text-gray-700">{formatNumber(referralByFacility.get(f.facilityId) ?? 0)}</td>
                        <td className="py-2.5 pr-4 text-center text-gray-600">{formatNumber(f.expectedVisitsPerDay)}</td>
                        <td className="py-2.5 pr-4 text-center">{formatNumber(f.actualVisitsPerDay)}</td>
                        <td className={`py-2.5 pr-4 text-center font-medium ${f.reportingGapPerDay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {f.reportingGapPerDay > 0 ? `−${formatNumber(f.reportingGapPerDay)}` : `+${formatNumber(Math.abs(f.reportingGapPerDay))}`}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="mx-auto flex max-w-[12rem] items-center justify-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                            </div>
                            <span className={`w-12 shrink-0 text-xs font-semibold ${rateColor}`}>
                              {formatPercentage(rate, 2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TableRangePagination
              page={page}
              pageSize={TABLE_PAGE_SIZE}
              totalCount={adoptionRows.length}
              onPageChange={setPage}
            />
          </>
        )
      ) : null}
    </Card>
  );
}
