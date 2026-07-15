import { PageHeader } from '../components/shared/PageHeader';
import { MetricCard } from '../components/shared/MetricCard';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { DeviationTrendChart } from '../components/charts/DeviationTrendChart';
import { EventTrendChart } from '../components/charts/EventTrendChart';
import { EbuzimaAdoptionCard } from '../components/facilities/EbuzimaAdoptionCard';
import { FacilityActivityCards } from '../components/facilities/FacilityActivityCards';
import { useEventTrends } from '../hooks/useEventVolume';
import { useDeviationTrends } from '../hooks/useDeviations';
import { useDashboardComplianceSummary, useReferralsKpi } from '../hooks/useDashboard';
import { formatNumber, formatPercentage } from '../utils/formatters';

export default function Dashboard() {
  const deviationTrends = useDeviationTrends('daily');
  const eventTrends = useEventTrends('daily');
  const complianceSummary = useDashboardComplianceSummary();
  const referrals = useReferralsKpi();

  if (complianceSummary.isLoading) return <LoadingSpinner />;

  if (complianceSummary.error) return <ErrorAlert error={complianceSummary.error} />;

  const compliance = complianceSummary.data;
  const patients = compliance?.patients;

  return (
    <>
      <PageHeader title="Dashboard" description="High-level operational metrics for the selected period" />

      {/* Patient Compliance Metrics */}
      <div className="rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Patients received in HIE"
          description="Distinct patients received via the HIE (enrolled) during the selected period."
          value={formatNumber(patients?.trackedPatients ?? 0)}
        />
        <MetricCard
          title="Compliant Care Journeys"
          description="Enrolled patients with no deviations detected in the selected period."
          value={formatNumber(patients?.compliantPatients ?? 0)}
          denomination={formatNumber(patients?.trackedPatients ?? 0)}
        />
        <MetricCard
          title="Non-Compliant Care Journeys"
          description="Enrolled patients with at least one deviation detected in the selected period."
          value={formatNumber(patients?.nonCompliantPatients ?? 0)}
          denomination={formatNumber(patients?.trackedPatients ?? 0)}
        />
        <MetricCard
          title="Compliance Rate"
          description="Compliant patients as a percentage of the tracked cohort in the selected period."
          value={formatPercentage(patients?.complianceRate ?? 0)}
        />
        <MetricCard
          title="Total Referrals"
          description="Referral forms successfully received by HIE across all in-scope facilities in the selected period (by inbound event event_time)."
          value={referrals.isLoading ? '…' : formatNumber(referrals.data?.totalReferralsReceived ?? 0)}
        />
      </div>
      </div>

      {/* Facility Activity Metrics — Active/Inactive drill down to a facility list (RI-29) */}
      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <FacilityActivityCards />
      </div>

      <EbuzimaAdoptionCard className="mt-6" />

      {/* Trend Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Deviation Trends">
          {deviationTrends.isLoading ? (
            <LoadingSpinner />
          ) : deviationTrends.data ? (
            <DeviationTrendChart data={deviationTrends.data.trends} height={240} />
          ) : null}
        </Card>
        <Card title="Event Volume">
          {eventTrends.isLoading ? (
            <LoadingSpinner />
          ) : eventTrends.data ? (
            <EventTrendChart data={eventTrends.data.trends} height={240} />
          ) : null}
        </Card>
      </div>
    </>
  );
}
