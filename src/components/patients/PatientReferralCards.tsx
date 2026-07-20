import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../shared/MetricCard';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TableRangePagination } from '../shared/TableRangePagination';
import { usePatientReferralsReceived } from '../../hooks/usePatients';
import { formatNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import type { PatientReferral } from '../../api/types';

const PAGE_SIZE = 12; // divisible by 2 and 3 — fills the drill-down grid rows evenly

/** Compliance badge for a patient's referrals (matched = completed a Referral step). */
function referralBadge(p: PatientReferral): { label: string; className: string } {
  if (p.referralCount > 0 && p.matchedCount >= p.referralCount) {
    return { label: 'Compliant', className: 'bg-green-50 text-green-700' };
  }
  if (p.matchedCount > 0) {
    return { label: 'Partial', className: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'Received', className: 'bg-gray-100 text-gray-600' };
}

/**
 * RI-44: Referral indicators on the Patients page — Created / Received by HIE / Failed. Each is a
 * clickable indicator; today only "Referrals Received by HIE" is data-backed and opens a drill-down
 * of the patients behind it (→ patient detail). "Created" and "Failed" are placeholders pending a
 * product definition (non-clickable, value "—").
 */
export function PatientReferralCards({ className }: { className?: string }) {
  const received = usePatientReferralsReceived();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const patients = useMemo(() => received.data ?? [], [received.data]);
  const receivedCount = patients.length;

  // Reset paging when the data changes or the drill-down toggles.
  useEffect(() => { setPage(1); }, [received.data, open]);
  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = useMemo(
    () => patients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [patients, page],
  );

  const receivedValue = received.isLoading ? '…' : received.error ? '—' : formatNumber(receivedCount);

  return (
    <Card
      title="Referrals"
      description="Referral indicators for the selected period. Click an indicator for its patient list."
      className={className}
    >
      {received.error && <ErrorAlert error={received.error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Created Referrals"
          value="—"
          description="Referrals created / ordered by a facility. Definition pending — indicator placeholder."
        />
        <MetricCard
          title="Referrals Received by HIE"
          value={receivedValue}
          bgColor="bg-green-50"
          description="Distinct patients with a referral received by HIE in the selected period (by clinical event date). Click for the patient list."
          onClick={() => setOpen((o) => !o)}
          selected={open}
        />
        <MetricCard
          title="Failed Referrals"
          value="—"
          description="Referrals that failed to complete. Definition pending — indicator placeholder."
        />
      </div>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Referrals Received by HIE ({receivedCount})</h3>
          </div>

          {received.isLoading ? (
            <LoadingSpinner />
          ) : received.error ? (
            <ErrorAlert error={received.error} />
          ) : patients.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No patients with referrals received in this period.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((p) => {
                  const badge = referralBadge(p);
                  const facility = p.facilityName || p.facilityId || '—';
                  const sub = p.lastReferral ? `${facility} · ${formatDate(p.lastReferral)}` : facility;
                  return (
                    <Link
                      key={p.patientId}
                      to={`/compliance/patients/${encodeURIComponent(p.patientId)}`}
                      className="flex items-center justify-between gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-blue-600" title={p.patientId}>{p.patientId}</p>
                        <p className="truncate text-xs text-gray-500" title={sub}>{sub}</p>
                      </div>
                      <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <TableRangePagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={patients.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
