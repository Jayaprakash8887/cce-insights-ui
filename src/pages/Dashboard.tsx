import { useMemo } from 'react';
import {
  ClipboardDocumentCheckIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/shared/PageHeader';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { KpiCard, rateTone } from '../components/shared/KpiCard';
import { useFacilityActivitySummary, useAdoptionKpis, useFacilityRanking } from '../hooks/useFacilities';
import { useIngestionFunnel } from '../hooks/useIngestion';
import { formatNumber, formatPercentage } from '../utils/formatters';

// RI-38 — the Dashboard is only high-level NATIONAL indicators. Each card links into the side
// menu where its detail lives; per-facility / per-protocol breakdowns and trend charts were moved
// to those pages (Compliance, Facilities, the new Adoption menu, Patients, Ingestion, Deviations,
// Events). Cards carry a supporting context line + health colour so the page still reads as an
// insights overview rather than a single row of bare numbers.
export default function Dashboard() {
  // Per-facility compliance rates (same cohort/rates the Facilities → Ranking page shows) — the
  // national Service Compliance Rate is the simple average of these.
  const complianceRanking = useFacilityRanking({ rankBy: 'complianceRate', order: 'desc', limit: 1000 });
  const facilities = useFacilityActivitySummary();
  const adoption = useAdoptionKpis();
  const ingestion = useIngestionFunnel();

  // National Service Compliance Rate = simple (equal-weight) average of each facility's own
  // compliance rate — every facility counts once regardless of patient volume (facility-level
  // aggregation, not the pooled distinct-patient ratio). Facilities with no tracked patients in the
  // period are excluded, since their rate is undefined rather than 0.
  const svc = useMemo(() => {
    const rows = (complianceRanking.data?.data ?? []).filter((r) => r.totalEnrollments > 0);
    const rate = rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.complianceRate, 0) / rows.length) * 10) / 10
      : 0;
    return { rate, facilities: rows.length };
  }, [complianceRanking.data]);

  // National eBuzima Adoption Rate = simple (equal-weight) average of each facility's own adoption
  // rate. Facilities with no expected baseline (expectedVisitsPerDay = 0) are excluded, since their
  // rate is undefined rather than 0.
  const adopt = useMemo(() => {
    const rows = (adoption.data ?? []).filter((f) => f.expectedVisitsPerDay > 0);
    const rate = rows.length > 0
      ? Math.round((rows.reduce((s, f) => s + f.adoptionRate, 0) / rows.length) * 10) / 10
      : 0;
    return { rate, facilities: rows.length };
  }, [adoption.data]);

  const f = facilities.data;
  const i = ingestion.data;

  return (
    <>
      <PageHeader title="Dashboard" description="High-level national indicators for the selected period" />

      {complianceRanking.error && <ErrorAlert error={complianceRanking.error} />}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">National Indicators</p>
      {/* 6-col grid: row 1 = three col-span-2 cards, row 2 = two col-span-3 cards — both rows fill
          the full width, so the odd (5) count has no orphaned gap. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          className="lg:col-span-2"
          title="Service Compliance Rate"
          value={formatPercentage(svc.rate)}
          tone={rateTone(svc.rate)}
          context={complianceRanking.data ? `avg across ${formatNumber(svc.facilities)} ${svc.facilities === 1 ? 'facility' : 'facilities'}` : undefined}
          icon={ClipboardDocumentCheckIcon}
          iconClass="bg-emerald-50 text-emerald-600"
          linkTo="/compliance"
          linkLabel="View compliance"
          description="Simple average of each facility's compliance rate (facilities with tracked patients)."
          loading={complianceRanking.isLoading}
        />
        <KpiCard
          className="lg:col-span-2"
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
          className="lg:col-span-2"
          title="eBuzima Adoption Rate"
          value={formatPercentage(adopt.rate)}
          tone={rateTone(adopt.rate)}
          context={adoption.data ? `avg across ${formatNumber(adopt.facilities)} ${adopt.facilities === 1 ? 'facility' : 'facilities'}` : undefined}
          icon={ArrowTrendingUpIcon}
          iconClass="bg-violet-50 text-violet-600"
          linkTo="/adoption"
          linkLabel="View adoption"
          description="Simple average of each facility's daily reporting rate (facilities with an expected baseline)."
          loading={adoption.isLoading}
        />
        <KpiCard
          className="lg:col-span-3"
          title="Referral Rate"
          value={formatPercentage(0)}
          tone="neutral"
          context="Definition pending"
          icon={ArrowsRightLeftIcon}
          iconClass="bg-amber-50 text-amber-600"
          linkTo="/compliance/patients"
          linkLabel="View patients"
          description="Referral Rate definition is being finalised — shown as 0% for now."
        />
        <KpiCard
          className="lg:col-span-3"
          title="Ingestion Rate"
          value={formatPercentage(i?.acceptanceRate ?? 0)}
          tone={rateTone(i?.acceptanceRate)}
          context={i ? `${formatNumber(i.accepted)} of ${formatNumber(i.totalReceived)} events accepted` : undefined}
          icon={InboxArrowDownIcon}
          iconClass="bg-cyan-50 text-cyan-600"
          linkTo="/ingestion"
          linkLabel="View ingestion"
          description="Events accepted as a percentage of events received by the ingestion pipeline."
          loading={ingestion.isLoading}
        />
      </div>
    </>
  );
}
