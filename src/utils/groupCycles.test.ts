import { describe, it, expect } from 'vitest';
import type { GroupInstance, JourneyStep } from '../api/types';
import { showCycles } from './groupCycles';

// An outpatient visit, one per day, with a consultation group nested in it. The patient came twice.
// Visit 1 is done. Visit 2 has its patient-visit step done and its vitals still awaited, and its
// consultation has not opened. Lab results sit under lab order, a step, in the consultation group.
const visit1: GroupInstance = {
  groupInstanceId: 'v1', cycleIndex: 0, status: 'COMPLETED', openedAt: '2026-09-05T08:00:00Z', completedSteps: 4, totalSteps: 4,
};
const visit2: GroupInstance = {
  groupInstanceId: 'v2', cycleIndex: 1, status: 'NOT_STARTED', openedAt: '2026-09-06T08:00:00Z', completedSteps: 1, totalSteps: 2,
};
const consultationInVisit1: GroupInstance = {
  groupInstanceId: 'c1', parentGroupInstanceId: 'v1', cycleIndex: 0, status: 'COMPLETED',
  openedAt: '2026-09-05T09:00:00Z', completedSteps: 2, totalSteps: 2,
};

const journey: JourneyStep[] = [
  { actionId: 'registration', stepName: 'Registration', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 1, depth: 0,
    instances: [{ stepInstanceId: 's-reg', groupInstanceId: null, status: 'COMPLETED', stepStatus: 'COMPLETED' }] },
  { actionId: 'visit', stepName: 'Outpatient Visit', status: 'COMPLETED', stepStatus: 'COMPLETED', completionCount: 1, depth: 0,
    group: true, groupInstances: [visit1, visit2] },
  { actionId: 'patient-visit', parentActionId: 'visit', stepName: 'Patient Visit', status: 'COMPLETED', stepStatus: 'COMPLETED',
    completionCount: 2, depth: 1, effectiveDateTime: '2026-09-05T08:00:00Z',
    instances: [
      { stepInstanceId: 's-pv1', groupInstanceId: 'v1', status: 'COMPLETED', stepStatus: 'COMPLETED', effectiveDateTime: '2026-09-05T08:00:00Z', practitioner: 'Dr. A' },
      { stepInstanceId: 's-pv2', groupInstanceId: 'v2', status: 'COMPLETED', stepStatus: 'COMPLETED', effectiveDateTime: '2026-09-06T08:00:00Z', practitioner: 'Dr. B' },
    ] },
  { actionId: 'vitals', parentActionId: 'visit', stepName: 'Vitals', status: 'COMPLETED', stepStatus: 'COMPLETED',
    completionCount: 1, depth: 1, slaStatus: 'MET',
    instances: [
      { stepInstanceId: 's-vit1', groupInstanceId: 'v1', status: 'COMPLETED', stepStatus: 'COMPLETED', slaStatus: 'MET' },
      { stepInstanceId: 's-vit2', groupInstanceId: 'v2', status: 'NOT_STARTED', stepStatus: 'NOT_STARTED', dueDate: '2026-09-07T08:00:00Z' },
    ] },
  { actionId: 'consultation', parentActionId: 'visit', stepName: 'Clinical Consultation', status: 'COMPLETED', stepStatus: 'COMPLETED',
    completionCount: 1, depth: 1, group: true, groupInstances: [consultationInVisit1] },
  { actionId: 'lab-order', parentActionId: 'consultation', stepName: 'Lab Order', status: 'COMPLETED', stepStatus: 'COMPLETED',
    completionCount: 1, depth: 2,
    instances: [{ stepInstanceId: 's-lo1', groupInstanceId: 'c1', status: 'COMPLETED', stepStatus: 'COMPLETED' }] },
  { actionId: 'lab-results', parentActionId: 'lab-order', stepName: 'Lab Results', status: 'MISSED', stepStatus: 'NOT_STARTED',
    slaStatus: 'MISSED', completionCount: 0, depth: 3, description: 'Step missed',
    instances: [{ stepInstanceId: 's-lr1', groupInstanceId: 'c1', status: 'MISSED', stepStatus: 'NOT_STARTED', slaStatus: 'MISSED', description: 'Step missed' }] },
];

const row = (steps: JourneyStep[], actionId: string) => steps.find((s) => s.actionId === actionId)!;

describe('showCycles', () => {
  it('shows the latest visit by default, with each step as it stands in that visit', () => {
    const view = showCycles(journey, {});

    expect(view.shownInstances.get('visit')).toBe(visit2);
    expect(row(view.steps, 'visit').status).toBe('NOT_STARTED');
    expect(row(view.steps, 'visit').stepStatus).toBe('NOT_STARTED'); // open: reads "In progress"
    expect(row(view.steps, 'patient-visit')).toMatchObject({
      status: 'COMPLETED', completionCount: 1, effectiveDateTime: '2026-09-06T08:00:00Z', practitioner: 'Dr. B',
    });
    expect(row(view.steps, 'vitals')).toMatchObject({
      status: 'NOT_STARTED', stepStatus: 'NOT_STARTED', slaStatus: null, dueDate: '2026-09-07T08:00:00Z',
    });
  });

  it('shows a picked visit instead', () => {
    const view = showCycles(journey, { visit: 'v1' });

    expect(row(view.steps, 'visit').status).toBe('COMPLETED');
    expect(row(view.steps, 'patient-visit')).toMatchObject({ effectiveDateTime: '2026-09-05T08:00:00Z', practitioner: 'Dr. A' });
    expect(row(view.steps, 'vitals')).toMatchObject({ status: 'COMPLETED', slaStatus: 'MET' });
  });

  it('offers a nested group only the instances inside the shown visit', () => {
    const latest = showCycles(journey, {});
    expect(latest.offeredInstances.get('consultation')).toEqual([]);
    expect(latest.shownInstances.get('consultation')).toBeNull();
    // Visit 2 has no consultation yet: it and its steps read as not started, with nothing from visit 1.
    expect(row(latest.steps, 'consultation')).toMatchObject({ status: 'NOT_STARTED', stepStatus: null });
    expect(row(latest.steps, 'lab-order')).toMatchObject({ status: 'NOT_STARTED', stepStatus: null, completionCount: 0 });
    expect(row(latest.steps, 'lab-results')).toMatchObject({ status: 'NOT_STARTED', stepStatus: null, description: undefined });

    const first = showCycles(journey, { visit: 'v1' });
    expect(first.offeredInstances.get('consultation')).toEqual([consultationInVisit1]);
    expect(row(first.steps, 'consultation').status).toBe('COMPLETED');
    // Lab results sits under lab order, a step: it is in the consultation group too.
    expect(row(first.steps, 'lab-results')).toMatchObject({ status: 'MISSED', description: 'Step missed' });
  });

  it('leaves a step in no group as it is', () => {
    const view = showCycles(journey, { visit: 'v1' });
    expect(row(view.steps, 'registration')).toBe(journey[0]);
  });

  it('counts a step instance as shown only in a shown cycle, or in no group', () => {
    const latest = showCycles(journey, {});
    expect(latest.isShown('s-reg')).toBe(true);
    expect(latest.isShown('s-vit2')).toBe(true);
    expect(latest.isShown('s-vit1')).toBe(false);
    expect(latest.isShown('s-lr1')).toBe(false);
    expect(latest.isShown('unknown')).toBe(true);

    expect(showCycles(journey, { visit: 'v1' }).isShown('s-lr1')).toBe(true);
  });

  it('ignores a pick that is no longer offered', () => {
    const view = showCycles(journey, { visit: 'gone', consultation: 'c1' });
    expect(view.shownInstances.get('visit')).toBe(visit2);
    expect(view.shownInstances.get('consultation')).toBeNull();
  });

  it('leaves step rows from an API without instances as they are', () => {
    const older = journey.map(({ instances: _instances, ...rest }) => rest);
    const view = showCycles(older, {});
    expect(row(view.steps, 'patient-visit')).toBe(older[2]);
  });
});
