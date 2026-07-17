import { PageHeader } from '../components/shared/PageHeader';
import { EbuzimaAdoptionCard } from '../components/facilities/EbuzimaAdoptionCard';

export default function Adoption() {
  return (
    <>
      <PageHeader title="e-Buzima Adoption" description="Facility reporting adoption vs. the expected baseline for the selected period" />
      <EbuzimaAdoptionCard />
    </>
  );
}
