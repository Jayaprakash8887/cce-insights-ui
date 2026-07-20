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
import { useDashboardComplianceSummary } from '../hooks/useDashboard';
import { useFacilityActivitySummary, useAdoptionKpis } from '../hooks/useFacilities';
import { useIngestionFunnel } from '../hooks/useIngestion';
import { formatNumber, formatPercentage } from '../utils/formatters';

// RI-38 — the Dashboard is only high-level NATIONAL indicators. Each card links into the side
// menu where its detail lives; per-facility / per-protocol breakdowns and trend charts were moved
// to those pages (Compliance, Facilities, the new Adoption menu, Patients, Ingestion, Deviations,
// Events). Cards carry a supporting context line + health colour so the page still reads as an
// insights overview rather than a single row of bare numbers.
export default function Dashboard() {
  const compliance = useDashboardComplianceSummary();
  const facilities = useFacilityActivitySummary();
  const adoption = useAdoptionKpis();
  const ingestion = useIngestionFunnel();

  // National adoption roll-up = Σ actual ÷ Σ expected across facilities — same formula as the
  // Adoption card's country summary, so the tile and the Adoption page agree.
  const adopt = useMemo(() => {
    const rows = adoption.data ?? [];
    const expected = rows.reduce((s, f) => s + f.expectedVisitsPerDay, 0);
    const actual = rows.reduce((s, f) => s + f.actualVisitsPerDay, 0);
    const rate = expected > 0 ? Math.round((actual * 1000) / expected) / 10 : 0;
    return { expected, actual, rate };
  }, [adoption.data]);

  const p = compliance.data?.patients;
  const f = facilities.data;
  const i = ingestion.data;

  return (
    <>
      <PageHeader title="Dashboard" description="High-level national indicators for the selected period" />

      {compliance.error && <ErrorAlert error={compliance.error} />}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">National Indicators</p>
      {/* 6-col grid: row 1 = three col-span-2 cards, row 2 = two col-span-3 cards — both rows fill
          the full width, so the odd (5) count has no orphaned gap. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          className="lg:col-span-2"
          title="Service Compliance Rate"
          value={formatPercentage(p?.complianceRate ?? 0)}
          tone={rateTone(p?.complianceRate)}
          context={p ? `${formatNumber(p.compliantPatients)} of ${formatNumber(p.trackedPatients)} patients compliant` : undefined}
          icon={ClipboardDocumentCheckIcon}
          iconClass="bg-emerald-50 text-emerald-600"
          linkTo="/compliance"
          linkLabel="View compliance"
          description="Compliant patients as a percentage of tracked patients."
          loading={compliance.isLoading}
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
          context={adoption.data ? `${formatNumber(adopt.actual)} actual vs ${formatNumber(adopt.expected)} expected / day` : undefined}
          icon={ArrowTrendingUpIcon}
          iconClass="bg-violet-50 text-violet-600"
          linkTo="/adoption"
          linkLabel="View adoption"
          description="Actual vs. expected daily reporting across facilities."
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
