import { describe, it, expect } from 'vitest';
import { buildWorkflowTree } from './serviceWorkflow';

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
