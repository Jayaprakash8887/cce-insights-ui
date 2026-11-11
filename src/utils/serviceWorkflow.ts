/**
 * Builds the Service Workflow Compliance tree from the flat step-analytics rows + the protocol's
 * action order. Returns the top-level nodes (in action order), each with its children nested to any
 * depth, as the protocol nests them.
 *
 * RI-50: a data-bearing **sub-action** whose parent step has **no data of its own** (e.g. a patient
 * who only completed a `referral` step, with no `consultation` step) was previously orphaned. Such
 * parents are **synthesized** as grouping containers so the sub-action is always visible. A synthetic
 * parent has no measurement of its own (`synthetic: true`, `totalInstances: 0`) and should render as
 * a header + nested children, without its own progress bar.
 *
 * A **step group**, such as a visit, never has step data of its own, so it is always a synthetic
 * container (`group: true`). A group inside a group, such as a consultation inside a visit, is
 * nested inside it, not shown beside it.
 */
export interface WorkflowStepInput {
  actionId: string;
  totalInstances: number;
  completedCount: number;
}

export interface WorkflowOrderEntry {
  actionId: string;
  parentActionId: string | null;
  /** true for a step group, such as a visit. */
  group?: boolean;
}

export interface WorkflowNode<T extends WorkflowStepInput> {
  actionId: string;
  totalInstances: number;
  completedCount: number;
  /** Its own step-analytics row; null for a synthetic container. */
  step: T | null;
  /** true when this node had no data of its own and was synthesized to host its children. */
  synthetic: boolean;
  /** true for a step group, such as a visit. */
  group: boolean;
  /** Its children, in action order, each with its own children. */
  children: WorkflowNode<T>[];
}

export function buildWorkflowTree<T extends WorkflowStepInput>(
  steps: T[],
  order: WorkflowOrderEntry[],
): WorkflowNode<T>[] {
  const orderMap = new Map(order.map((e, i) => [e.actionId, i] as const));
  const parentOf = new Map(order.map((e) => [e.actionId, e.parentActionId ?? null] as const));
  const groupIds = new Set(order.filter((e) => e.group).map((e) => e.actionId));
  const orderIdx = (id: string) => orderMap.get(id) ?? 999;

  const dataOf = new Map(steps.filter((s) => s.totalInstances > 0).map((s) => [s.actionId, s] as const));

  // Every action with data, and every action above one: those above become containers.
  const shown = new Set<string>();
  for (const actionId of dataOf.keys()) {
    const seen = new Set<string>();
    for (let id: string | null = actionId; id && !seen.has(id); id = parentOf.get(id) ?? null) {
      seen.add(id);
      shown.add(id);
    }
  }

  const byOrder = (ids: Iterable<string>) => [...ids].sort((a, b) => orderIdx(a) - orderIdx(b));
  const childIdsOf = new Map<string, string[]>();
  const rootIds: string[] = [];
  for (const id of shown) {
    const parentId = parentOf.get(id) ?? null;
    if (parentId && shown.has(parentId)) {
      childIdsOf.set(parentId, [...(childIdsOf.get(parentId) ?? []), id]);
    } else {
      rootIds.push(id);
    }
  }

  const nodeOf = (id: string, ancestors: Set<string>): WorkflowNode<T> => {
    const step = dataOf.get(id) ?? null;
    const below = new Set(ancestors).add(id);
    return {
      actionId: id,
      totalInstances: step?.totalInstances ?? 0,
      completedCount: step?.completedCount ?? 0,
      step,
      synthetic: step === null,
      group: groupIds.has(id),
      children: byOrder(childIdsOf.get(id) ?? [])
        .filter((childId) => !below.has(childId)) // guards against a cycle in a malformed order
        .map((childId) => nodeOf(childId, below)),
    };
  };

  return byOrder(rootIds).map((id) => nodeOf(id, new Set()));
}

/** Whether an action sits inside a step group, at any depth: its step can repeat, once per visit. */
export function isInAGroup(actionId: string, order: WorkflowOrderEntry[]): boolean {
  const parentOf = new Map(order.map((e) => [e.actionId, e.parentActionId ?? null] as const));
  const groupIds = new Set(order.filter((e) => e.group).map((e) => e.actionId));
  const seen = new Set<string>();
  for (let id = parentOf.get(actionId) ?? null; id && !seen.has(id); id = parentOf.get(id) ?? null) {
    if (groupIds.has(id)) return true;
    seen.add(id);
  }
  return false;
}
