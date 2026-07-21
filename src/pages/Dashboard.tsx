import { useMemo } from 'react';
import {
  ClipboardDocumentCheckIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { KpiCard, rateTone } from '../components/shared/KpiCard';
import { useFacilityActivitySummary, useAdoptionKpis, useFacilityRanking } from '../hooks/useFacilities';
import { usePatientReferralsReceived } from '../hooks/usePatients';
import { formatNumber, formatPercentage } from '../utils/formatters';

// RI-38 — the Dashboard is only high-level NATIONAL indicators. Every card links into the Facilities
// page, where the per-facility breakdowns live. Cards carry a supporting context line + health colour
// so the page still reads as an insights overview rather than a single row of bare numbers.
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
  const referralCount = referrals.data?.length ?? 0;

  return (
    <>
      <PageHeader title="Dashboard" description="High-level national indicators for the selected period" />

      {complianceRanking.error && <ErrorAlert error={complianceRanking.error} />}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">National Indicators</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Service Compliance Rate"
          value={formatPercentage(svc.rate)}
          tone={rateTone(svc.rate)}
          context={complianceRanking.data ? `avg across ${formatNumber(svc.facilities)} ${svc.facilities === 1 ? 'facility' : 'facilities'}` : undefined}
          icon={ClipboardDocumentCheckIcon}
          iconClass="bg-emerald-50 text-emerald-600"
          linkTo="/facilities"
          linkLabel="View facilities"
          description="Simple average of each facility's compliance rate, across all in-scope facilities."
          loading={complianceRanking.isLoading}
        />
        <KpiCard
          title="Total Facilities"
          value={formatNumber(f?.totalInScope ?? 0)}
          tone="neutral"
          context={f ? `${formatNumber(f.activeFacilities)} active · ${formatNumber(f.inactiveFacilities)} inactive` : undefined}
          icon={BuildingOffice2Icon}
          iconClass="bg-blue-50 text-blue-600"
          linkTo="/facilities"
          linkLabel="View facilities"
          description="All in-scope facilities. Active = facilities with a protocol-tracked event in the period."
          loading={facilities.isLoading}
        />
        <KpiCard
          title="eBuzima Adoption Rate"
          value={formatPercentage(adopt.rate)}
          tone={rateTone(adopt.rate)}
          context={adoption.data ? `avg across ${formatNumber(adopt.facilities)} ${adopt.facilities === 1 ? 'facility' : 'facilities'}` : undefined}
          icon={ArrowTrendingUpIcon}
          iconClass="bg-violet-50 text-violet-600"
          linkTo="/facilities"
          linkLabel="View facilities"
          description="Simple average of each facility's daily reporting rate, across all in-scope facilities."
          loading={adoption.isLoading}
        />
        <KpiCard
          title="Total Referral Count"
          value={formatNumber(referralCount)}
          tone="neutral"
          context={referrals.data ? 'referrals received by HIE' : undefined}
          icon={ArrowsRightLeftIcon}
          iconClass="bg-amber-50 text-amber-600"
          linkTo="/facilities"
          linkLabel="View facilities"
          description="Total referrals received by HIE in the selected period — the same figure as the Patients page 'Referrals Received by HIE'."
          loading={referrals.isLoading}
        />
      </div>
    </>
  );
}
