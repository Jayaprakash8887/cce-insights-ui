import { useMemo, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentCheckIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { rateTone, type Tone } from '../components/shared/KpiCard';
import { useFacilityActivitySummary, useAdoptionKpis, useFacilityRanking } from '../hooks/useFacilities';
import { usePatientReferralsReceived } from '../hooks/usePatients';
import { formatNumber, formatPercentage } from '../utils/formatters';

const TONE_COLOR: Record<Tone, string> = {
  good: 'text-green-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
  neutral: 'text-gray-900',
};

interface Indicator {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  value: string;
  tone: Tone;
  context: string;
}

// RI-38 — the Dashboard is only high-level NATIONAL indicators. Since every indicator drills into the
// same Facilities page, the four tiles are grouped into ONE card that navigates there on click.
export default function Dashboard() {
  // Per-facility compliance rates (same cohort/rates the Facilities → Ranking page shows) — the
  // national Service Compliance Rate is the simple average of these.
  const complianceRanking = useFacilityRanking({ rankBy: 'complianceRate', order: 'desc', limit: 1000 });
  const facilities = useFacilityActivitySummary();
  const adoption = useAdoptionKpis();
  // Total Referral Count = the same "Referrals Received by HIE" list the Patients page shows.
  const referrals = usePatientReferralsReceived();

  // National Service Compliance Rate = simple (equal-weight) average of each facility's own
  // compliance rate across ALL in-scope facilities (facility-level aggregation, not the pooled
  // distinct-patient ratio). Every facility counts once and the divisor is the full facility count —
  // a facility with no tracked patients contributes 0%, same treatment as the Adoption Rate tile.
  const svc = useMemo(() => {
    const rows = complianceRanking.data?.data ?? [];
    const rate = rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.complianceRate, 0) / rows.length) * 10) / 10
      : 0;
    return { rate, facilities: rows.length };
  }, [complianceRanking.data]);

  // National eBuzima Adoption Rate = simple (equal-weight) average of each facility's own adoption
  // rate, exactly as shown in the Adoption breakdown table — every in-scope facility counts once.
  // (We do NOT drop facilities with a zero expected baseline: the backend still gives them a defined
  // rate — 0% when not reporting, 100% when reporting above a zero baseline — so excluding them would
  // wipe out the whole average in environments where no baseline is configured.)
  const adopt = useMemo(() => {
    const rows = adoption.data ?? [];
    const rate = rows.length > 0
      ? Math.round((rows.reduce((s, f) => s + f.adoptionRate, 0) / rows.length) * 10) / 10
      : 0;
    return { rate, facilities: rows.length };
  }, [adoption.data]);

  const f = facilities.data;
  const loading = complianceRanking.isLoading || facilities.isLoading || adoption.isLoading || referrals.isLoading;

  const indicators: Indicator[] = [
    {
      icon: ClipboardDocumentCheckIcon,
      iconClass: 'bg-emerald-50 text-emerald-600',
      title: 'Service Compliance Rate',
      value: formatPercentage(svc.rate),
      tone: rateTone(svc.rate),
      context: `avg across ${formatNumber(svc.facilities)} ${svc.facilities === 1 ? 'facility' : 'facilities'}`,
    },
    {
      icon: BuildingOffice2Icon,
      iconClass: 'bg-blue-50 text-blue-600',
      title: 'Total Facilities',
      value: formatNumber(f?.totalInScope ?? 0),
      tone: 'neutral',
      context: f ? `${formatNumber(f.activeFacilities)} active · ${formatNumber(f.inactiveFacilities)} inactive` : '',
    },
    {
      icon: ArrowTrendingUpIcon,
      iconClass: 'bg-violet-50 text-violet-600',
      title: 'eBuzima Adoption Rate',
      value: formatPercentage(adopt.rate),
      tone: rateTone(adopt.rate),
      context: `avg across ${formatNumber(adopt.facilities)} ${adopt.facilities === 1 ? 'facility' : 'facilities'}`,
    },
    {
      icon: ArrowsRightLeftIcon,
      iconClass: 'bg-amber-50 text-amber-600',
      title: 'Total Referrals',
      value: formatNumber(referrals.data?.length ?? 0),
      tone: 'neutral',
      context: 'referrals received by HIE',
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="High-level national indicators for the selected period" />

      {complianceRanking.error && <ErrorAlert error={complianceRanking.error} />}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">National Indicators</p>

      {/* One card grouping all indicators — clicking anywhere navigates to the Facilities page. */}
      <Link
        to="/facilities"
        className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {indicators.map(({ icon: Icon, iconClass, title, value, tone, context }) => (
            <div key={title} className="flex flex-col py-4 first:pt-0 last:pb-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>
              <p className={`mt-1 text-4xl font-bold tabular-nums ${loading ? 'text-gray-300' : TONE_COLOR[tone]}`}>
                {loading ? '—' : value}
              </p>
              <p className="mt-1 min-h-[16px] text-xs text-gray-500">{loading ? '' : context}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold text-blue-600 opacity-70 transition-opacity group-hover:opacity-100">
            View facilities <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </Link>
    </>
  );
}
