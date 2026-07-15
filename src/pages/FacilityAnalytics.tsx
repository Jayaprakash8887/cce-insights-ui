import { PageHeader } from '../components/shared/PageHeader';
import { FacilityActivityCards } from '../components/facilities/FacilityActivityCards';
import { FacilityHighlightsCard } from '../components/facilities/FacilityHighlightsCard';
import { FacilityRankingCard } from '../components/facilities/FacilityRankingCard';

export default function FacilityAnalytics() {
  return (
    <>
      <PageHeader title="Facility Analytics" description="Facility leaderboard and compliance ranking" />

      <FacilityActivityCards className="mb-6" />

      <FacilityHighlightsCard className="mb-6" />

      <FacilityRankingCard />
    </>
  );
}
