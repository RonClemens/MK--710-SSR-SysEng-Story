import {
  MILESTONE_EVENTS,
  type AcquisitionMilestone,
  type AcquisitionMilestoneEvent,
  type Milestone,
  type ProgramPlanningDeliverable,
  type SafetyDeliverable,
} from "../types";
import {
  AAF_PATHWAYS,
  type AcquisitionPathway,
  type AcquisitionPhaseMeta,
} from "../../../methodology/guidance/aafPhaseGuidance";

// First non-Complete milestone in canonical MILESTONE_EVENTS order for this
// baseline; null if the baseline has no milestones yet or every milestone
// is Complete.
export function deriveCurrentMilestone(milestones: Milestone[], baselineId: string): Milestone | null {
  const byEvent = new Map(milestones.filter((m) => m.baselineId === baselineId).map((m) => [m.event, m]));
  for (const event of MILESTONE_EVENTS) {
    const m = byEvent.get(event);
    if (m && m.status !== "Complete") return m;
  }
  return null;
}

export function phaseForSetrEvent(
  pathway: AcquisitionPathway,
  event: Milestone["event"],
): AcquisitionPhaseMeta | undefined {
  return AAF_PATHWAYS[pathway].find((p) => p.setrEvents.includes(event));
}

// Falls back to the last in-scope phase (Production & Deployment for MCA)
// if every milestone is Complete -- a fully closed-out baseline's "current
// phase" is its terminal phase, not "none".
export function deriveCurrentPhase(
  milestones: Milestone[],
  baselineId: string,
  pathway: AcquisitionPathway = "MCA",
): AcquisitionPhaseMeta | null {
  const current = deriveCurrentMilestone(milestones, baselineId);
  if (current) return phaseForSetrEvent(pathway, current.event) ?? null;
  const inScope = AAF_PATHWAYS[pathway].filter((p) => p.inScope);
  return inScope[inScope.length - 1] ?? null;
}

// PKM Migration Step 8: the occurrence record (status/dates) for one AAF
// decision gate (Milestone A/B/C) on one baseline lineage, if one exists yet
// -- see AcquisitionMilestone's own comment in client/src/types/index.ts for
// why this is a separate lookup from deriveCurrentMilestone() above rather
// than folded into it.
export function acquisitionMilestoneFor(
  acquisitionMilestones: AcquisitionMilestone[],
  baselineId: string,
  event: AcquisitionMilestoneEvent,
): AcquisitionMilestone | null {
  return acquisitionMilestones.find((m) => m.baselineId === baselineId && m.event === event) ?? null;
}

export interface PhaseMilestoneStatus {
  event: Milestone["event"];
  milestone: Milestone | undefined;
}

// Per-phase view for the stepper/detail panel: which of this phase's SETR
// events exist as Milestone records for this baseline, and their status.
export function milestoneStatusesForPhase(
  milestones: Milestone[],
  baselineId: string,
  phase: AcquisitionPhaseMeta,
): PhaseMilestoneStatus[] {
  const byEvent = new Map(milestones.filter((m) => m.baselineId === baselineId).map((m) => [m.event, m]));
  return phase.setrEvents.map((event) => ({ event, milestone: byEvent.get(event) }));
}

export type PhaseCdrl =
  | { kind: "safety"; record: SafetyDeliverable }
  | { kind: "planning"; record: ProgramPlanningDeliverable };

// Which CDRLs (Safety + Program Planning deliverables) are due in this
// phase, for this baseline -- derived entirely from each record's existing
// milestoneId (set during the PKM migration), never a stored field of its
// own. Records with a null milestoneId (deliveryMilestone values that don't
// map onto a known SETR event) are intentionally excluded rather than
// guessed at, matching those entities' own "not forced onto one" comment.
export function cdrlsForPhase(
  safetyDeliverables: SafetyDeliverable[],
  planningDeliverables: ProgramPlanningDeliverable[],
  milestones: Milestone[],
  baselineId: string,
  phase: AcquisitionPhaseMeta,
): PhaseCdrl[] {
  const inPhaseMilestoneIds = new Set(
    milestones
      .filter((m) => m.baselineId === baselineId && phase.setrEvents.includes(m.event))
      .map((m) => m.id),
  );
  const safety: PhaseCdrl[] = safetyDeliverables
    .filter((d) => d.milestoneId && inPhaseMilestoneIds.has(d.milestoneId))
    .map((record) => ({ kind: "safety", record }));
  const planning: PhaseCdrl[] = planningDeliverables
    .filter((d) => d.milestoneId && inPhaseMilestoneIds.has(d.milestoneId))
    .map((record) => ({ kind: "planning", record }));
  return [...safety, ...planning];
}
