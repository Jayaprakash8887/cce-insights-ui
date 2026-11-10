import type { GroupInstance, GroupPathEntry, JourneyStep, JourneyStepInstance, StepDisplayStatus } from '../api/types';
import { formatDate } from './dates';

// A step group that repeats, such as one visit per day, has one instance per cycle. The journey's
// rows merge every cycle. These helpers show one cycle of each group at a time: the one the user
// picked, else the latest.

/** The instance picked for each group, by the group's actionId. A group with none picked shows its latest. */
export type CycleSelection = Record<string, string>;

/** The journey with one cycle of each group shown, and what that view needs to know. */
export interface CycleView {
  /** The journey rows, each step in a group showing its step instance in the shown cycle. */
  steps: JourneyStep[];
  /**
   * The instances to offer for each group, by its actionId: those inside the shown instance of
   * its parent group, or all of them for a top-level group.
   */
  offeredInstances: Map<string, GroupInstance[]>;
  /** The shown instance of each group, by its actionId. Null when it has none in the shown cycle. */
  shownInstances: Map<string, GroupInstance | null>;
  /**
   * Whether a step instance is in what is shown: in no group, or in a shown group instance. A step
   * instance the journey doesn't list counts as shown.
   */
  isShown: (stepInstanceId: string) => boolean;
}

const BEST_FIRST: StepDisplayStatus[] = ['COMPLETED', 'OVERDUE', 'MISSED', 'NOT_STARTED'];

/**
 * Show one cycle of each group: the picked instance, else the latest. A nested group offers only the
 * instances inside its parent's shown instance.
 *
 * - A group's row takes its shown instance's status. With no instance in the shown cycle, it reads as
 *   not started.
 * - A step in a group takes its step instance in that group's shown instance. With none there, it
 *   reads as not started. A step under another step, such as lab results under lab order, is in the
 *   group around them both.
 * - A step in no group, and every row from an API without `instances`, is left as it is.
 */
export function showCycles(journey: JourneyStep[], selection: CycleSelection): CycleView {
  const groupIds = new Set(journey.filter((row) => row.group).map((row) => row.actionId));
  const parentOf = new Map(journey.map((row) => [row.actionId, row.parentActionId]));

  /** The group a row sits in: its nearest ancestor that is a group. */
  function enclosingGroupOf(actionId: string): string | undefined {
    for (let parentId = parentOf.get(actionId); parentId; parentId = parentOf.get(parentId)) {
      if (groupIds.has(parentId)) return parentId;
    }
    return undefined;
  }

  const offeredInstances = new Map<string, GroupInstance[]>();
  const shownInstances = new Map<string, GroupInstance | null>();
  // A parent group's row comes before its nested groups' rows, so its shown instance is known first.
  for (const row of journey) {
    if (!row.group) continue;
    const all = row.groupInstances ?? [];
    const parentGroupId = enclosingGroupOf(row.actionId);
    const parentInstance = parentGroupId ? shownInstances.get(parentGroupId) ?? null : null;
    const offered = parentGroupId
      ? all.filter((instance) => parentInstance && instance.parentGroupInstanceId === parentInstance.groupInstanceId)
      : all;
    const shown = offered.find((instance) => instance.groupInstanceId === selection[row.actionId])
      ?? offered[offered.length - 1]
      ?? null;
    offeredInstances.set(row.actionId, offered);
    shownInstances.set(row.actionId, shown);
  }

  const steps = journey.map((row): JourneyStep => {
    if (row.group) {
      const shown = shownInstances.get(row.actionId) ?? null;
      return shown ? groupRowFor(row, shown) : notStarted(row);
    }
    const groupId = enclosingGroupOf(row.actionId);
    if (!groupId || !row.instances) return row;
    const shown = shownInstances.get(groupId) ?? null;
    const inShownCycle = shown
      ? row.instances.filter((instance) => instance.groupInstanceId === shown.groupInstanceId)
      : [];
    return inShownCycle.length > 0 ? stepRowFor(row, inShownCycle) : notStarted(row);
  });

  const shownGroupInstanceIds = new Set(
    [...shownInstances.values()].filter((g): g is GroupInstance => g !== null).map((g) => g.groupInstanceId),
  );
  const groupInstanceOfStepInstance = new Map<string, string | null | undefined>();
  for (const row of journey) {
    for (const instance of row.instances ?? []) {
      groupInstanceOfStepInstance.set(instance.stepInstanceId, instance.groupInstanceId);
    }
  }
  const isShown = (stepInstanceId: string) => {
    const groupInstanceId = groupInstanceOfStepInstance.get(stepInstanceId);
    return !groupInstanceId || shownGroupInstanceIds.has(groupInstanceId);
  };

  return { steps, offeredInstances, shownInstances, isShown };
}

/** A group's row for one of its instances. An open instance reads as in progress. */
function groupRowFor(row: JourneyStep, shown: GroupInstance): JourneyStep {
  return {
    ...row,
    status: shown.status,
    stepStatus: shown.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED',
    dueDate: shown.dueDate ?? undefined,
  };
}

/** A step's row for its step instances in one cycle, usually one: the best of them, as the API picks. */
function stepRowFor(row: JourneyStep, inShownCycle: JourneyStepInstance[]): JourneyStep {
  const best = [...inShownCycle].sort(
    (a, b) => BEST_FIRST.indexOf(a.status) - BEST_FIRST.indexOf(b.status),
  )[0];
  return {
    ...row,
    status: best.status,
    stepStatus: best.stepStatus ?? null,
    slaStatus: best.slaStatus ?? null,
    completionCount: inShownCycle.filter((instance) => instance.stepStatus === 'COMPLETED').length,
    effectiveDateTime: best.effectiveDateTime,
    dueDate: best.dueDate,
    source: best.source,
    practitioner: best.practitioner,
    facilityId: best.facilityId,
    facilityName: best.facilityName,
    description: best.description,
  };
}

/** A row with nothing in the shown cycle: not started, as for an action with no step instance yet. */
function notStarted(row: JourneyStep): JourneyStep {
  return {
    ...row,
    status: 'NOT_STARTED',
    stepStatus: null,
    slaStatus: null,
    completionCount: 0,
    effectiveDateTime: undefined,
    dueDate: undefined,
    source: undefined,
    practitioner: undefined,
    facilityId: undefined,
    facilityName: undefined,
    description: undefined,
  };
}

// ── Naming a group instance ──

/**
 * A group instance's name: its number and the day it opened, such as "#2 · Sep 6, 2026", or only the
 * day when its group opened once.
 */
export function groupInstanceName(number: number | null | undefined, openedAt: string): string {
  return number ? `#${number} · ${formatDate(openedAt)}` : formatDate(openedAt);
}

/**
 * Which visit a step instance is in, in words: "Outpatient Visit #2 (Sep 6, 2026) › Clinical
 * Consultation". Only the top-level group gets its day. Empty for a step in no group.
 */
export function groupPathLabel(path: GroupPathEntry[] | null | undefined): string {
  return (path ?? [])
    .map((entry, level) =>
      `${entry.groupName}${entry.number ? ` #${entry.number}` : ''}${level === 0 ? ` (${formatDate(entry.openedAt)})` : ''}`)
    .join(' › ');
}

/** The pick that shows a group path: each of its groups at the instance it names. */
export function selectionFor(path: GroupPathEntry[] | null | undefined): CycleSelection {
  return Object.fromEntries((path ?? []).map((entry) => [entry.groupActionId, entry.groupInstanceId]));
}

/** A pick as a URL value, "visit:id,consultation:id", so a link can open a patient at a visit. */
export function selectionToParam(selection: CycleSelection): string {
  return Object.entries(selection).map(([groupActionId, groupInstanceId]) => `${groupActionId}:${groupInstanceId}`).join(',');
}

/** The pick a URL value names. Anything malformed is left out. */
export function selectionFromParam(value: string | null): CycleSelection {
  const selection: CycleSelection = {};
  for (const part of (value ?? '').split(',')) {
    const separator = part.lastIndexOf(':');
    if (separator > 0 && separator < part.length - 1) {
      selection[part.slice(0, separator)] = part.slice(separator + 1);
    }
  }
  return selection;
}
