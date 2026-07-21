import { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { FacilityActivityCards, type FacilityStatusFilter } from '../components/facilities/FacilityActivityCards';
import { FacilityHighlightsCard } from '../components/facilities/FacilityHighlightsCard';
import { FacilityRankingCard } from '../components/facilities/FacilityRankingCard';

export default function FacilityAnalytics() {
  // Facility Status indicator (Active/Inactive/All) filters the Facility Ranking table below.
  const [statusFilter, setStatusFilter] = useState<FacilityStatusFilter>('all');

  return (
    <>
      <PageHeader title="Facility Analytics" description="Facility leaderboard and compliance ranking" />

      <FacilityActivityCards className="mb-6" value={statusFilter} onChange={setStatusFilter} />

      <div className="mb-6">
        <FacilityRankingCard statusFilter={statusFilter} />
      </div>

      <FacilityHighlightsCard />
    </>
  );
}
