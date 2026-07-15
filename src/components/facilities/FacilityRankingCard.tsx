import { useEffect, useMemo, useState } from 'react';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import { useFacilityRanking } from '../../hooks/useFacilities';
import { useReferralsKpi } from '../../hooks/useDashboard';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { getFacilityName } from '../../utils/facilityNames';
import { findDuplicateFacilityNames, formatFacilityDisplayName } from '../../utils/facilityDisplay';
import { RANK_BY_OPTIONS, SORT_ORDER_OPTIONS } from '../../config';
import type { RankBy, SortOrder } from '../../api/types';

const TABLE_PAGE_SIZE = 10;

export function FacilityRankingCard() {
  const [rankBy, setRankBy] = useState<RankBy>('complianceRate');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const ranking = useFacilityRanking({
    rankBy,
    order,
    limit: 200,
  });
  const referrals = useReferralsKpi();

  // Per-facility referral counts (same period/event_time) keyed for O(1) row lookup.
  const referralByFacility = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of referrals.data?.byFacility ?? []) m.set(r.facilityId, r.count);
    return m;
  }, [referrals.data]);

  const filteredRows = useMemo(() => {
    if (!ranking.data?.data) return [];
    if (!search.trim()) return ranking.data.data;
    const q = search.toLowerCase();
    return ranking.data.data.filter((f) => {
      const name = (f.facilityName ?? getFacilityName(f.facilityId)).toLowerCase();
      return name.includes(q);
    });
  }, [ranking.data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / TABLE_PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE),
    [filteredRows, page],
  );

  const duplicateFacilityNames = useMemo(
    () => findDuplicateFacilityNames(filteredRows),
    [filteredRows],
  );

  useEffect(() => { setPage(1); }, [rankBy, order, search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex gap-2 items-end">
          {RANK_BY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRankBy(opt.value as RankBy)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                rankBy === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          {SORT_ORDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOrder(opt.value as SortOrder)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                order === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Search Facility</label>
          <input
            type="text"
            placeholder="Enter facility name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card title="Facility Ranking" description="Tracked patients enrolled during the selected period, counted once at their assigned facility. Compliance % reflects deviations detected in the period.">
        {ranking.isPending ? <LoadingSpinner /> : ranking.error ? <ErrorAlert error={ranking.error} /> : ranking.data ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">Rank</th>
                    <th className="pb-2 pr-4">Facility</th>
                    <th className="pb-2 pr-4">Referrals</th>
                    <th className="pb-2 pr-4">Tracked Patients</th>
                    <th className="pb-2 pr-4">Compliance</th>
                    <th className="pb-2 pr-4">Deviations</th>
                    <th className="pb-2">Events (period)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRows.map((f) => (
                    <tr key={`${f.facilityId}-${f.rank}`} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 font-bold text-gray-400">{f.rank}</td>
                      <td className="py-2 pr-4 font-medium text-gray-900">
                        {formatFacilityDisplayName(f, duplicateFacilityNames)}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{formatNumber(referralByFacility.get(f.facilityId) ?? 0)}</td>
                      <td className="py-2 pr-4">{formatNumber(f.totalEnrollments)}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          f.complianceRate >= 80 ? 'bg-green-50 text-green-700' :
                          f.complianceRate >= 50 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {formatPercentage(f.complianceRate)}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{formatNumber(f.activeDeviations)}</td>
                      <td className="py-2 pr-4">{formatNumber(f.totalEvents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginatedRows.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No facilities match the current filters</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="font-medium">Compliance:</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> ≥ 80%</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 50–79%</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> &lt; 50%</span>
            </div>
            <TableRangePagination
              page={page}
              pageSize={TABLE_PAGE_SIZE}
              totalCount={filteredRows.length}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </Card>
    </>
  );
}
