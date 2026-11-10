import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtocolAnalytics from './ProtocolAnalytics';

// The step-analytics API returns completionRate as a 0–1 fraction (completedCount / totalInstances)
// and avgDaysToComplete as days from the due date to completion (negative = early). Only the step
// table is under test, so the chart hooks return nothing.
vi.mock('../hooks/useProtocols', () => ({
  useStepAnalytics: () => ({
    data: {
      protocolDefinitionId: 'p1',
      protocolCanonical: 'http://x/PD/anc|1.0',
      steps: [{
        actionId: 'anc-visit-1',
        totalInstances: 19,
        completedCount: 5,
        completionRate: 0.26,
        timelinessDistribution: { completedOnTime: 4, completedLate: 1 },
        overdueCount: 1,
        missedCount: 0,
        notStartedCount: 14,
        slaUnjudgedCount: 14,
        avgDaysToComplete: -1.5,
        medianDaysToComplete: -1,
        // One per visit: the 19 patients had 40 visits between them.
        stepInstanceCount: 40,
        completedStepInstanceCount: 12,
      }],
      groups: [{
        groupActionId: 'outpatient-visit', title: 'Outpatient Visit', patientCount: 19,
        instanceCount: 40, completedInstanceCount: 30, completionRate: 0.75,
      }],
    },
    isLoading: false,
    error: null,
  }),
  useCompletionFunnel: () => ({ data: undefined, isLoading: false }),
  useOutcomeDistribution: () => ({ data: undefined, isLoading: false }),
  useEnrollmentTrends: () => ({ data: undefined, isLoading: false }),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/protocols/p1']}>
      <Routes>
        <Route path="/protocols/:id" element={<ProtocolAnalytics />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtocolAnalytics — step table', () => {
  it('shows the fractional completionRate as a percentage (5/19 → 26.0%, not 0.3%)', () => {
    renderPage();
    expect(screen.getByText('26.0%')).toBeInTheDocument();
    expect(screen.queryByText('0.3%')).not.toBeInTheDocument();
  });

  it('labels the day figure as relative to the due date, where negative means early', () => {
    renderPage();
    expect(screen.getByText('Avg Days vs Due')).toBeInTheDocument();
    expect(screen.getByText('-1.5')).toBeInTheDocument();
  });

  it('counts patients and visits apart, for a step in a group that repeats', () => {
    renderPage();
    expect(screen.getByText('Patients Completed')).toBeInTheDocument();
    expect(screen.getByText('5/19')).toBeInTheDocument();
    expect(screen.getByText('Visits Completed')).toBeInTheDocument();
    expect(screen.getByText('12/40')).toBeInTheDocument();
  });

  it('lists each step group with its patients, its instances and how many are completed', () => {
    renderPage();
    expect(screen.getByText('Step Groups')).toBeInTheDocument();
    const row = screen.getByText('Outpatient Visit').closest('tr')!;
    expect(row).toHaveTextContent('19');
    expect(row).toHaveTextContent('40(2.1 per patient)');
    expect(row).toHaveTextContent('30');
    expect(row).toHaveTextContent('75.0%');
  });
});
