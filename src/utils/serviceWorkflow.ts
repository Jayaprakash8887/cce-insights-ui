/**
 * Builds the Service Workflow Compliance tree from the flat step-analytics rows + the protocol's
 * action order. Returns the top-level nodes (in action order), each with its data-bearing
 * sub-actions nested.
 *
 * RI-50: a data-bearing **sub-action** whose parent step has **no data of its own** (e.g. a patient
 * who only completed a `referral` step, with no `consultation` step) was previously orphaned —
 * excluded from the top level (it has a parent) yet never rendered as a child (its parent isn't
 * shown). Such parents are now **synthesized** as grouping containers so the sub-action is always
 * visible. A synthetic parent has no measurement of its own (`synthetic: true`, `totalInstances: 0`)
 * and should render as a header + nested children, without its own progress bar.
 */
export interface WorkflowStepInput {
  actionId: string;
  totalInstances: number;
  completedCount: number;
}

export interface WorkflowOrderEntry {
  actionId: string;
  parentActionId: string | null;
}

export interface WorkflowNode<T extends WorkflowStepInput> {
  actionId: string;
  totalInstances: number;
  completedCount: number;
  /** true when this parent had no data of its own and was synthesized to host orphaned sub-actions. */
  synthetic: boolean;
  children: T[];
}

export function buildWorkflowTree<T extends WorkflowStepInput>(
  steps: T[],
  order: WorkflowOrderEntry[],
): WorkflowNode<T>[] {
  const orderMap = new Map(order.map((e, i) => [e.actionId, i] as const));
  const parentOf = new Map(order.map((e) => [e.actionId, e.parentActionId ?? null] as const));
  const orderIdx = (id: string) => orderMap.get(id) ?? 999;

  const withData = steps.filter((s) => s.totalInstances > 0);
  const haveData = new Set(withData.map((s) => s.actionId));

  const childrenOf = (parentId: string): T[] =>
    withData
      .filter((s) => parentOf.get(s.actionId) === parentId)
      .sort((a, b) => orderIdx(a.actionId) - orderIdx(b.actionId));

  // Real top-level steps: have data and no parent.
  const realTop: WorkflowNode<T>[] = withData
    .filter((s) => !parentOf.get(s.actionId))
    .map((s) => ({
      actionId: s.actionId,
      totalInstances: s.totalInstances,
      completedCount: s.completedCount,
      synthetic: false,
      children: childrenOf(s.actionId),
    }));

  // RI-50: parents referenced by a data-bearing sub-action but which have no data themselves.
  const orphanParents = [
    ...new Set(
      withData
        .map((s) => parentOf.get(s.actionId))
        .filter((pid): pid is string => !!pid && !haveData.has(pid)),
    ),
  ];
  const syntheticTop: WorkflowNode<T>[] = orphanParents.map((pid) => ({
    actionId: pid,
    totalInstances: 0,
    completedCount: 0,
    synthetic: true,
    children: childrenOf(pid),
  }));

  return [...realTop, ...syntheticTop].sort(
    (a, b) => orderIdx(a.actionId) - orderIdx(b.actionId),
  );
}
