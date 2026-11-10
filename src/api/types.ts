// ─── Lookups ─────────────────────────────────────────────────

export interface ProtocolLookup {
  id: string;
  url: string;
  version: string;
  canonical: string;
  status: string;
  title?: string;
}

// ─── Response Envelopes ──────────────────────────────────────

export interface ErrorResponse {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    next_cursor: string | null;
    has_more: boolean;
  };
}

// ─── Global Filters ──────────────────────────────────────────

export interface GlobalFilters {
  startDate?: string;
  endDate?: string;
  facilityId?: string;
}

// ─── Compliance Summaries ────────────────────────────────────

export interface ComplianceSummary {
  protocolDefinitionId: string;
  protocolCanonical: string;
  totalEnrollments: number;
  compliantPatients: number;
  statusBreakdown: {
    active: number;
    completed: number;
    withdrawn: number;
    expired: number;
  };
  complianceRate: number;
  // CCE 2.0.0 two-status model: stepStatus says whether a step was recorded, slaStatus whether it
  // was on time. completed + notStarted split the steps one way, slaMet + overdue + missed +
  // slaUnjudged the other. overdue / missed are SLA verdicts, so they include late completions.
  stepMetrics: {
    totalSteps: number;
    completed: number;
    notStarted: number;
    slaMet: number;
    overdue: number;
    missed: number;
    slaUnjudged: number;
    completedOnTime: number;
    completedLate: number;
  };
  deviationCount: number;
  deviationBreakdown: {
    overdue: number;
    missed: number;
    orderViolation: number;
  };
}

export interface FacilitySummary {
  facilityId: string;
  totalPatients: number;
  totalEnrollments: number;
  overallComplianceRate: number;
  protocolBreakdown: {
    protocolDefinitionId: string;
    protocolCanonical: string;
    enrollments: number;
    complianceRate: number;
    activeDeviations: number;
  }[];
}

export interface PatientCompliance {
  patientId: string;
  protocolInstanceId: string;
  protocolCanonical: string;
  enrolledAt: string;
  status: ProtocolInstanceStatus;
  complianceRate: number;
  complianceCategory: ComplianceCategory;
  stepsCompleted: number;
  totalSteps: number;
  activeDeviations: number;
  facilityId: string;
}

export type ProtocolInstanceStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'EXPIRED';
export type ComplianceCategory = 'on_track' | 'non_compliant';

// ─── Patient Compliance ──────────────────────────────────────

export interface PatientTimeline {
  patientId: string;
  protocols: {
    protocolInstanceId: string;
    protocolCanonical: string;
    status: ProtocolInstanceStatus;
    complianceRate: number;
    journey: JourneyStep[];
    timeline: TimelineEntry[];
  }[];
}

export interface JourneyStep {
  actionId: string;
  parentActionId?: string;
  stepName: string;
  status: StepDisplayStatus;
  stepStatus?: StepStatus | null;   // null when no step instance exists yet
  slaStatus?: SlaStatus | null;     // null = not yet judged
  completionCount: number;
  effectiveDateTime?: string;
  dueDate?: string;
  source?: string;
  practitioner?: string;
  facilityId?: string;
  facilityName?: string;
  requiredBehavior?: 'must' | 'could';
  depth?: number;
  description?: string;
  /**
   * true for a step group, such as a visit: a set of steps that belong together. Its steps follow
   * it, one level deeper. Its status is that of its best instance, on a step's scale.
   */
  group?: boolean;
  /** A group's instances, in the order they opened. A group that repeats has one per cycle. */
  groupInstances?: GroupInstance[] | null;
  /**
   * A step's step instances, one by one, each with the group instance it is in. The row's own fields
   * merge them all; these let the page show one cycle of a group at a time. Null on a group's row,
   * and absent from an API that predates them.
   */
  instances?: JourneyStepInstance[] | null;
}

/** One step instance of a step's journey row, such as the step in one visit. */
export interface JourneyStepInstance {
  stepInstanceId: string;
  groupInstanceId?: string | null;  // the group instance it is in; null for a step in no group
  status: StepDisplayStatus;
  stepStatus?: StepStatus | null;
  slaStatus?: SlaStatus | null;
  effectiveDateTime?: string;
  dueDate?: string;
  source?: string;
  practitioner?: string;
  facilityId?: string;
  facilityName?: string;
  description?: string;             // its deviation, in words
}

/** One occurrence of a step group for the patient, such as one visit. */
export interface GroupInstance {
  groupInstanceId: string;
  parentGroupInstanceId?: string | null; // the enclosing group's instance; null for a top-level group
  cycleIndex: number;                    // 0 for the first cycle, then 1, 2, …
  /** COMPLETED, OVERDUE / MISSED (the group's own deadline), or NOT_STARTED: still open. */
  status: StepDisplayStatus;
  openedAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  completedSteps: number;                // done steps in it, nested groups included
  totalSteps: number;                    // all steps in it so far, nested groups included
}

export interface TimelineEntry {
  timestamp: string;
  type: 'enrollment' | 'step_completed' | 'step_overdue' | 'step_missed' | 'step_not_started';
  description?: string;
  actionId?: string;
  stepName?: string;
  state?: StepDisplayStatus | 'ENROLLED';
  stepStatus?: StepStatus;
  slaStatus?: SlaStatus | null;
  source?: string;
  daysOverdue?: number;
  effectiveDateTime?: string;
  groupActionId?: string | null;  // the step's group; null for a step in no group
  cycleIndex?: number | null;     // which instance of that group
}

export interface RelatedArtifactExtension {
  url: string;
  valueCode: string;
}

export interface RelatedArtifact {
  type: string;
  label: string;
  display: string;
  url: string;
  extension?: RelatedArtifactExtension[];
}

export interface ProtocolTracking {
  protocolInstanceId: string;
  protocolCanonical: string;
  protocolTitle?: string;
  relatedArtifact?: RelatedArtifact[];
  enrolledAt: string;
  status: ProtocolInstanceStatus;
  complianceRate: number;
  stepsCompleted: number;
  totalSteps: number;
}

export interface ProtocolTrackingDetail {
  protocolInstanceId: string;
  patientId: string;
  protocolCanonical: string;
  status: ProtocolInstanceStatus;
  enrolledAt: string;
  complianceRate: number;
  steps: StepInstance[];
  deviations: DeviationRecord[];
}

export interface StepInstance {
  stepInstanceId: string;
  actionId: string;
  stepStatus: StepStatus;
  slaStatus?: SlaStatus;            // absent until the Step SLA Service reaches a verdict
  dueDate: string | null;
  overdueDate?: string;             // scheduled SLA thresholds; mandatory steps only
  missedDate?: string;
  completedAt?: string;
  completedBySource?: string;
  daysOverdue?: number;
  groupPath?: GroupPathEntry[];     // the visit it is in; empty for a step in no group
}

/** Did the expected event arrive? */
export type StepStatus = 'NOT_STARTED' | 'COMPLETED';
/** Was the deadline met? Null / absent until judged. */
export type SlaStatus = 'OVERDUE' | 'MISSED' | 'MET';
/** One badge per step: COMPLETED, else the SLA verdict of an outstanding step, else NOT_STARTED. */
export type StepDisplayStatus = 'COMPLETED' | 'OVERDUE' | 'MISSED' | 'NOT_STARTED';

export interface PatientEvent {
  eventId: string;
  cloudeventsId: string;
  type: string;
  eventTime: string;
  source: string;
  resourceType: string;
  processingStatus: ProcessingStatus;
  facilityId: string | null;
  protocolInstanceId: string | null;
  actionId: string | null;
  matchedStepInstanceId: string | null;
}

export type ProcessingStatus = 'MATCHED' | 'ZERO_MATCH' | 'DUPLICATE';

export interface PatientDeviation {
  deviationId: string;
  protocolInstanceId: string;
  protocolCanonical: string;
  stepInstanceId: string;
  actionId?: string;
  stepName?: string;
  deviationType: DeviationType;
  detectedAt: string;
  metadata?: {
    completedActionId?: string;
    incompletePrerequisites?: string[];
    backfilled?: boolean;
  };
  description?: string;
  groupPath?: GroupPathEntry[];      // the visit its step is in; empty for a step in no group
}

/**
 * One group instance around a step instance, such as "Outpatient Visit #2". A step in a nested
 * group has one entry per level, from the top-level group in.
 */
export interface GroupPathEntry {
  groupActionId: string;
  groupName: string;
  groupInstanceId: string;
  number?: number | null;   // its place among its group's instances in the same parent instance; null when it is the only one
  openedAt: string;
}

export type DeviationType = 'OVERDUE' | 'MISSED' | 'ORDER_VIOLATION';

// ─── Deviations & Intelligence ───────────────────────────────

export interface DeviationRecord {
  deviationId: string;
  patientId: string;
  protocolInstanceId: string;
  protocolCanonical: string;
  stepInstanceId: string;
  actionId: string;
  deviationType: DeviationType;
  occurredAt: string;   // clinical occurrence date (when the deviation happened)
  detectedAt: string;   // system detection date (when we flagged it)
  facilityId: string;
  groupPath?: GroupPathEntry[];  // the visit its step is in; empty for a step in no group
}

export interface DeviationTrend {
  interval: string;
  trends: {
    period: string;
    overdue: number;
    missed: number;
    orderViolation: number;
    total: number;
  }[];
}

export interface DeviationByAction {
  actionId: string;
  protocolDefinitionId: string;
  protocolCanonical: string;
  totalDeviations: number;
  overdueCount: number;
  missedCount: number;
  orderViolationCount: number;
  affectedPatients: number;
}

export interface DeviationResolution {
  totalOverdueDeviations: number;
  resolved: {
    count: number;
    percentage: number;
    avgDaysToResolve: number;
  };
  escalatedToMissed: {
    count: number;
    percentage: number;
  };
  byProtocol: {
    protocolDefinitionId: string;
    protocolCanonical: string;
    totalOverdue: number;
    resolvedCount: number;
    resolutionRate: number;
    escalatedCount: number;
  }[];
}

export interface IntelligenceSummary {
  totalDeviations: number;
  byType: { overdue: number; missed: number; orderViolation: number };
  bySeverity: { warning: number; critical: number };
  recentActivity: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}

// ─── Event Volume ────────────────────────────────────────────

export interface EventVolumeSummary {
  totalEvents: number;
  processingStatusBreakdown: {
    matched?: { count: number; percentage: number };
    zeroMatch?: { count: number; percentage: number };
    duplicate?: { count: number; percentage: number };
  } | null;
  byResourceType: { resourceType: string; count: number }[];
  byFacility: { facilityId: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export interface EventVolumeTrend {
  interval: string;
  trends: {
    period: string;
    total: number;
    byResourceType: Record<string, number>;
  }[];
}

export interface ResourceTypeCount {
  resourceType: string;
  count: number;
  percentage: number;
}

export interface FacilityEventCount {
  facilityId: string;
  totalEvents: number;
  byResourceType: { resourceType: string; count: number }[];
}

export interface PractitionerEventCount {
  practitionerRef: string;
  practitionerDisplay: string | null;
  facilityId: string;
  totalEvents: number;
  byResourceType: { resourceType: string; count: number }[];
}

export interface SourceSystemCount {
  source: string;
  totalEvents: number;
  byResourceType: { resourceType: string; count: number }[];
}

export interface SourceComparison {
  sourceA: string;
  sourceB: string;
  matchWindowSeconds: number;
  sourceASummary: SourceSummary;
  sourceBSummary: SourceSummary;
  overlap: {
    totalOverlappingEvents: number;
    byResourceType: { resourceType: string; count: number }[];
  };
  samples: SourceComparisonSample[];
}

export interface SourceSummary {
  source: string;
  totalEvents: number;
  uniqueEvents: number;
  overlappingEvents: number;
  overlapPercentage: number;
  uniqueByResourceType: { resourceType: string; count: number }[];
}

export interface SourceComparisonSample {
  eventAId: string;
  eventBId: string;
  subject: string;
  resourceType: string;
  eventTimeA: string;
  eventTimeB: string;
  timeDiffSeconds: number;
}

// ─── Protocol Analytics ──────────────────────────────────────

export interface StepAnalytics {
  protocolDefinitionId: string;
  protocolCanonical: string;
  steps: {
    actionId: string;
    totalInstances: number;
    completedCount: number;
    completionRate: number;
    timelinessDistribution: {
      completedOnTime: number;   // completed + SLA met
      completedLate: number;     // completed + SLA overdue | missed
    };
    overdueCount: number;        // SLA verdicts — include steps completed late
    missedCount: number;
    notStartedCount: number;
    slaUnjudgedCount: number;
    avgDaysToComplete: number;
    medianDaysToComplete: number;
    requiredBehavior?: 'must' | 'could';
    stepInstanceCount?: number;            // step instances: one per visit for a step in a repeating group
    completedStepInstanceCount?: number;
  }[];
  /** One per step group, such as a visit, in protocol order. */
  groups?: {
    groupActionId: string;
    title: string;
    patientCount: number;
    instanceCount: number;            // its instances, such as visits
    completedInstanceCount: number;
    completionRate: number;           // 0–1
  }[];
}

export interface ActionOrderEntry {
  actionId: string;
  parentActionId: string | null;
  type: string | null;
  title: string | null;
  /** true for a step group (such as a visit). A group has no step data of its own. */
  group?: boolean;
}

export interface CompletionFunnel {
  protocolDefinitionId: string;
  protocolCanonical: string;
  totalEnrollments: number;
  funnel: {
    actionId: string;
    stepOrder: number;
    reachedCount: number;
    completedCount: number;
    completionRate: number;
    dropOffRate: number;
  }[];
}

export interface OutcomeDistribution {
  protocolDefinitionId: string;
  protocolCanonical: string;
  totalInstances: number;
  distribution: {
    active: { count: number; percentage: number };
    completed: { count: number; percentage: number };
    expired: { count: number; percentage: number };
    withdrawn: { count: number; percentage: number };
  };
}

export interface EnrollmentTrend {
  protocolDefinitionId: string;
  interval: string;
  trends: {
    period: string;
    enrollments: number;
  }[];
}

// ─── Facility Analytics ──────────────────────────────────────

export interface FacilityRanking {
  rank: number;
  facilityId: string;
  facilityName?: string;
  totalEnrollments: number;
  complianceRate: number;
  activeDeviations: number;
  totalEvents: number;
  outboundEvents: number;
  inboundEvents: number;
  patientsFromHIE: number;
}

export type RankBy = 'complianceRate' | 'deviationCount' | 'eventVolume';
export type SortOrder = 'asc' | 'desc';

// ─── Practitioner Analytics ──────────────────────────────────

export interface PractitionerRanking {
  rank: number;
  practitionerRef: string;
  practitionerName: string | null;
  facilityId: string | null;
  facilityName: string | null;
  totalPatients: number;
  complianceRate: number;
  totalSteps: number;
  completedSteps: number;
  activeDeviations: number;
  totalEvents: number;
}

export type PractitionerRankBy = 'complianceRate' | 'totalPatients' | 'totalEvents';

// ─── Processing Quality ──────────────────────────────────────

export interface ProcessingStatusBucket {
  count: number;
  percentage: number;
}

export interface ProcessingQuality {
  totalEvents: number;
  overall: {
    matched?: ProcessingStatusBucket;
    zero_match?: ProcessingStatusBucket;
    duplicate?: ProcessingStatusBucket;
  };
  bySource: {
    source: string;
    totalEvents: number;
    breakdown: {
      matched?: ProcessingStatusBucket;
      zero_match?: ProcessingStatusBucket;
      duplicate?: ProcessingStatusBucket;
    };
  }[];
}

// ─── Patient Risk ────────────────────────────────────────────

export interface FacilityLookup {
  id: string;
  name: string;
}

export interface AtRiskHotspot {
  facilityId: string;
  facilityName?: string;
  totalPatients: number;
  onTrack: { count: number; percentage: number };
  atRisk: { count: number; percentage: number };
  nonCompliant: { count: number; percentage: number };
}

export interface RepeatDeviationPatient {
  patientId: string;
  totalDeviations: number;
  overdueCount: number;
  missedCount: number;
  orderViolationCount: number;
  affectedProtocols: number;
  affectedSteps: number;
  facilityId: string;
  deviations: {
    protocolCanonical: string;
    actionId: string;
    deviationType: DeviationType;
    detectedAt: string;
  }[];
}

// ─── Ingestion Analytics ─────────────────────────────────────

export interface IngestionFunnel {
  totalReceived: number;
  accepted: number;
  rejected: number;
  duplicate: number;
  acceptanceRate: number;
  rejectionRate: number;
  duplicateRate: number;
  breakdown: { status: string; count: number; percentage: number }[];
  trends?: {
    period: string;
    byStatus: Record<string, number>;
    total: number;
  }[];
}

export interface RejectionAnalytics {
  totalRejected: number;
  byReason: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  bySource: {
    source: string;
    totalEvents: number;
    rejectedEvents: number;
    rejectionRate: number;
    topReasons: { reason: string; count: number; percentage: number }[];
  }[];
}

export type RejectionReason =
  | 'INVALID_ENVELOPE'
  | 'INVALID_FHIR'
  | 'INVALID_JSON'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'DUPLICATE'
  | 'MISSING_SUBJECT'
  | 'PAYLOAD_TOO_LARGE'
  | 'DESERIALIZATION_ERROR'
  | 'KAFKA_PUBLISH_FAILURE'
  | 'INTERNAL_ERROR';

export interface SourceDataQuality {
  sources: {
    source: string;
    totalEvents: number;
    accepted: number;
    rejected: number;
    duplicate: number;
    acceptanceRate: number;
    rejectionRate: number;
    duplicateRate: number;
  }[];
}

export interface PipelineLoss {
  totalAcceptedByCollector: number;
  totalInComplianceEventLog: number;
  lostEvents: number;
  lossRate: number;
  bySource: { source: string; lostEvents: number }[];
}
