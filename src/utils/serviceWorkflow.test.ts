import { describe, it, expect } from 'vitest';
import { buildWorkflowTree, isInAGroup } from './serviceWorkflow';

const ORDER = [
  { actionId: 'visit-encounter', parentActionId: null },
  { actionId: 'vitals-recording', parentActionId: null },
  { actionId: 'consultation', parentActionId: null },
  { actionId: 'chief-complaints', parentActionId: 'consultation' },
  { actionId: 'diagnosis', parentActionId: 'consultation' },
  { actionId: 'referral', parentActionId: 'consultation' },
];

const step = (actionId: string, total: number, completed: number) => ({
  actionId, totalInstances: total, completedCount: completed,
});

describe('buildWorkflowTree', () => {
  it('nests data-bearing sub-actions under their (data-bearing) parent, in action order', () => {
    const tree = buildWorkflowTree(
      [step('consultation', 10, 7), step('diagnosis', 10, 9), step('chief-complaints', 10, 10)],
      ORDER,
    );
    expect(tree.map((n) => n.actionId)).toEqual(['consultation']);
    expect(tree[0].synthetic).toBe(false);
    // children ordered by the protocol action order (chief-complaints before diagnosis)
    expect(tree[0].children.map((c) => c.actionId)).toEqual(['chief-complaints', 'diagnosis']);
  });

  it('RI-50: renders an orphaned sub-action by synthesizing its parent container', () => {
    // The Tare case: the only step is `referral` (a sub-action of `consultation`, which has no data).
    const tree = buildWorkflowTree([step('referral', 1, 1)], ORDER);

    expect(tree).toHaveLength(1);
    const node = tree[0];
    expect(node.actionId).toBe('consultation');   // parent synthesized
    expect(node.synthetic).toBe(true);
    expect(node.totalInstances).toBe(0);          // no measurement of its own
    expect(node.completedCount).toBe(0);
    expect(node.children.map((c) => c.actionId)).toEqual(['referral']);   // the sub-action is visible
  });

  it('drops steps with zero instances', () => {
    const tree = buildWorkflowTree(
      [step('visit-encounter', 5, 5), step('vitals-recording', 0, 0)],
      ORDER,
    );
    expect(tree.map((n) => n.actionId)).toEqual(['visit-encounter']);
  });

  it('does not synthesize a parent that already has data of its own', () => {
    const tree = buildWorkflowTree(
      [step('consultation', 4, 3), step('referral', 2, 2)],
      ORDER,
    );
    expect(tree).toHaveLength(1);
    expect(tree[0].synthetic).toBe(false);            // real parent, not synthesized
    expect(tree[0].completedCount).toBe(3);           // parent's own stats retained
    expect(tree[0].children.map((c) => c.actionId)).toEqual(['referral']);
  });

  it('keeps real top-level steps and synthetic parents together, in action order', () => {
    const tree = buildWorkflowTree(
      [step('visit-encounter', 3, 3), step('referral', 1, 1)],
      ORDER,
    );
    // visit-encounter (real, idx 0) then consultation (synthetic, idx 2)
    expect(tree.map((n) => n.actionId)).toEqual(['visit-encounter', 'consultation']);
    expect(tree.map((n) => n.synthetic)).toEqual([false, true]);
  });

  it('returns empty for no data', () => {
    expect(buildWorkflowTree([], ORDER)).toEqual([]);
  });
});

// The Rwanda outpatient protocol: a visit group, with a consultation group inside it, and lab
// results under lab order, a step.
const GROUPED = [
  { actionId: 'outpatient-visit', parentActionId: null, group: true },
  { actionId: 'visit-encounter', parentActionId: 'outpatient-visit' },
  { actionId: 'vitals-recording', parentActionId: 'outpatient-visit' },
  { actionId: 'clinical-consultation', parentActionId: 'outpatient-visit', group: true },
  { actionId: 'consultation', parentActionId: 'clinical-consultation' },
  { actionId: 'lab-order', parentActionId: 'clinical-consultation' },
  { actionId: 'lab-results', parentActionId: 'lab-order' },
  { actionId: 'diagnosis', parentActionId: 'clinical-consultation' },
  { actionId: 'registration', parentActionId: null },
];

describe('buildWorkflowTree with step groups', () => {
  const tree = buildWorkflowTree(
    [step('visit-encounter', 97, 97), step('vitals-recording', 105, 21), step('consultation', 83, 73),
      step('lab-order', 31, 31), step('lab-results', 20, 12), step('diagnosis', 82, 27)],
    GROUPED,
  );

  it('nests a group inside the group around it, not beside it', () => {
    expect(tree.map((n) => n.actionId)).toEqual(['outpatient-visit']);
    const visit = tree[0];
    expect(visit.group).toBe(true);
    expect(visit.synthetic).toBe(true);
    expect(visit.children.map((c) => c.actionId)).toEqual(['visit-encounter', 'vitals-recording', 'clinical-consultation']);
    const consultationGroup = visit.children[2];
    expect(consultationGroup.group).toBe(true);
    expect(consultationGroup.children.map((c) => c.actionId)).toEqual(['consultation', 'lab-order', 'diagnosis']);
  });

  it('shows a step under a step, at any depth', () => {
    const labOrder = tree[0].children[2].children[1];
    expect(labOrder.synthetic).toBe(false);
    expect(labOrder.step?.completedCount).toBe(31);
    expect(labOrder.children.map((c) => c.actionId)).toEqual(['lab-results']);
    expect(labOrder.children[0].step?.totalInstances).toBe(20);
  });

  it('synthesizes every level above a step with data, and nothing else', () => {
    const only = buildWorkflowTree([step('lab-results', 3, 1)], GROUPED);
    expect(only.map((n) => n.actionId)).toEqual(['outpatient-visit']);
    const consultationGroup = only[0].children[0];
    expect(consultationGroup.actionId).toBe('clinical-consultation');
    expect(consultationGroup.children.map((c) => c.actionId)).toEqual(['lab-order']);
    expect(consultationGroup.children[0].synthetic).toBe(true);   // lab-order has no data: a container
    expect(consultationGroup.children[0].group).toBe(false);
  });

  it('knows which actions sit inside a step group, at any depth', () => {
    expect(isInAGroup('vitals-recording', GROUPED)).toBe(true);
    expect(isInAGroup('lab-results', GROUPED)).toBe(true);
    expect(isInAGroup('clinical-consultation', GROUPED)).toBe(true);
    expect(isInAGroup('outpatient-visit', GROUPED)).toBe(false);
    expect(isInAGroup('registration', GROUPED)).toBe(false);
  });
});
