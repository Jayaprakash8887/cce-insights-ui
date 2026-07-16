import { PageHeader } from '../components/shared/PageHeader';
import { MetricCard } from '../components/shared/MetricCard';
import { Card } from '../components/shared/Card';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { DeviationTrendChart } from '../components/charts/DeviationTrendChart';
import { EventTrendChart } from '../components/charts/EventTrendChart';
import { useState } from 'react';
import { ClickableMetricGroup } from '../components/shared/ClickableMetricGroup';
import { EbuzimaAdoptionCard } from '../components/facilities/EbuzimaAdoptionCard';
import { FacilityActivityCards } from '../components/facilities/FacilityActivityCards';
import { ReferralMetricsCard } from '../components/facilities/ReferralMetricsCard';
import { ComplianceFacilityBreakdown } from '../components/facilities/ComplianceFacilityBreakdown';
import { useEventTrends } from '../hooks/useEventVolume';
import { useDeviationTrends } from '../hooks/useDeviations';
import { useDashboardComplianceSummary } from '../hooks/useDashboard';
import { formatNumber, formatPercentage } from '../utils/formatters';

export default function Dashboard() {
  const deviationTrends = useDeviationTrends('daily');
  const eventTrends = useEventTrends('daily');
  const complianceSummary = useDashboardComplianceSummary();
  // RI-35: clicking a Service Compliance card reveals the per-facility breakdown inline.
  const [showComplianceDetail, setShowComplianceDetail] = useState(false);

  if (complianceSummary.isLoading) return <LoadingSpinner />;

  if (complianceSummary.error) return <ErrorAlert error={complianceSummary.error} />;

  const compliance = complianceSummary.data;
  const patients = compliance?.patients;
  const toggleCompliance = () => setShowComplianceDetail((v) => !v);

  return (
    <>
      <PageHeader title="Dashboard" description="High-level operational metrics for the selected period" />

      {/* Service Compliance — click the card to reveal the per-facility breakdown (RI-35) */}
      <ClickableMetricGroup
        title="Service Compliance"
        description="Patient care-journey compliance for the selected period. Click for the per-facility breakdown."
        open={showComplianceDetail}
        onToggle={toggleCompliance}
        detail={<ComplianceFacilityBreakdown />}
      >
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
          description="Compliant patients as a percentage of the tracked patients in the selected period."
          value={formatPercentage(patients?.complianceRate ?? 0)}
        />
      </ClickableMetricGroup>

      {/* Referral Metrics — received by HIE + compliant/non-compliant split, drill down to facilities (RI-35) */}
      <ReferralMetricsCard className="mt-4" />

      {/* Facility Status — click the card to reveal the facility list (RI-35) */}
      <FacilityActivityCards className="mt-4" />

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
