import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { JourneyStep } from '../api/types';
import PatientDetail from './PatientDetail';

// A visit is a step group: a set of steps that belong together. This patient had two visits. The
// first is done, and the second has one of its two steps done.
const journey: JourneyStep[] = [
  { actionId: 'registration', stepName: 'Registration', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 1, depth: 0 },
  {
    actionId: 'visit', stepName: 'Visit', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 1, depth: 0,
    group: true,
    groupInstances: [
      { groupInstanceId: 'g0', cycleIndex: 0, status: 'COMPLETED', openedAt: '2026-11-02T09:00:00Z', completedSteps: 2, totalSteps: 2 },
      { groupInstanceId: 'g1', cycleIndex: 1, status: 'NOT_STARTED', openedAt: '2026-11-03T09:00:00Z', completedSteps: 1, totalSteps: 2 },
    ],
  },
  { actionId: 'history', stepName: 'History', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 2, depth: 1 },
  { actionId: 'bp', stepName: 'Blood Pressure', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 1, depth: 1 },
];

const none = { data: undefined, isLoading: false, error: null };

vi.mock('../hooks/usePatients', () => ({
  usePatientTimeline: () => ({
    data: {
      patientId: 'P-1',
      protocols: [{
        protocolInstanceId: 'pi-1',
        protocolCanonical: 'http://x/PlanDefinition/visits|1.0',
        status: 'ACTIVE',
        complianceRate: 75,
        journey,
        timeline: [],
      }],
    },
    isLoading: false,
    error: null,
  }),
  usePatientProtocolTracking: () => ({ data: [], isLoading: false, error: null }),
  usePatientProtocolTrackingDetail: () => none,
  usePatientDeviations: () => ({ data: [], isLoading: false, error: null }),
  usePatientIntelligenceDeliveries: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('../hooks/useProtocols', () => ({ useActionOrder: () => none }));

function renderPage() {
  // jsdom has no matchMedia. The page reads it to pick its desktop layout.
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  // Nor ResizeObserver. The page measures its sticky header with it.
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  render(
    <MemoryRouter initialEntries={['/patients/P-1']}>
      <Routes>
        <Route path="/patients/:id" element={<PatientDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PatientDetail — step groups in the Protocol Journey', () => {
  it('shows a group as a step group, with each of its visits and how many steps are done', () => {
    renderPage();
    const visitRow = screen.getByText('Visit').parentElement!.parentElement!;
    expect(within(visitRow).getByText('Step group')).toBeInTheDocument();
    expect(within(visitRow).getByText('#1')).toBeInTheDocument();
    expect(within(visitRow).getByText('#2')).toBeInTheDocument();
    expect(within(visitRow).getByText('· 2/2 steps')).toBeInTheDocument();
    expect(within(visitRow).getByText('· 1/2 steps')).toBeInTheDocument();
    expect(within(visitRow).getByText('In progress')).toBeInTheDocument();
  });

  it('counts steps only, not the group, in the protocol header', () => {
    renderPage();
    // registration, history and bp are steps. The visit is not.
    expect(screen.getAllByText('3/3 steps').length).toBeGreaterThan(0);
    expect(screen.queryByText('4/4 steps')).not.toBeInTheDocument();
  });
});
