import {
  MILESTONE_EVENTS,
  type AcquisitionGateEvent,
  type Milestone,
  type ProgramPlanningDeliverable,
  type SafetyDeliverable,
  type SetrMilestoneEvent,
} from "../types";
import {
  AAF_PATHWAYS,
  type AcquisitionPathway,
  type AcquisitionPhaseMeta,
} from "../../../methodology/guidance/aafPhaseGuidance";

// First non-Complete milestone in canonical MILESTONE_EVENTS order for this
// baseline; null if the baseline has no milestones yet or every milestone
// is Complete. Scoped to milestoneType: "SETR" records only (PKM Migration
// Step 9, per PKM Migration Plan v0.3.0 §8) -- MILESTONE_EVENTS' canonical
// SRR-PRR ordering has no meaning for "AcquisitionGate" records, and this
// function's behavior is explicitly unchanged by that consolidation.
export function deriveCurrentMilestone(milestones: Milestone[], baselineId: string): Milestone | null {
  const byEvent = new Map(
    milestones
      .filter((m) => m.baselineId === baselineId && m.milestoneType === "SETR")
      .map((m) => [m.event, m]),
  );
  for (const event of MILESTONE_EVENTS) {
    const m = byEvent.get(event);
    if (m && m.status !== "Complete") return m;
  }
  return null;
}

// Takes a SetrMilestoneEvent specifically, not the broader Milestone["event"]
// (PKM Migration Step 9): this function only ever makes sense for SETR
// events, since `AcquisitionPhaseMeta.setrEvents` never contains an
// AcquisitionGate event string.
export function phaseForSetrEvent(
  pathway: AcquisitionPathway,
  event: SetrMilestoneEvent,
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
  // Safe cast: deriveCurrentMilestone() above already scopes its lookup to
  // milestoneType: "SETR" records, so `current.event`, though statically
  // typed as the broader MilestoneEvent, is always a SetrMilestoneEvent here.
  if (current) return phaseForSetrEvent(pathway, current.event as SetrMilestoneEvent) ?? null;
  const inScope = AAF_PATHWAYS[pathway].filter((p) => p.inScope);
  return inScope[inScope.length - 1] ?? null;
}

// PKM Migration Step 9 (per PKM Migration Plan v0.3.0 §8): the occurrence
// record (status/dates) for one AAF decision gate (Milestone A/B/C) on one
// baseline lineage, if one exists yet -- reads from the consolidated
// Milestone entity (milestoneType: "AcquisitionGate"), superseding the
// deprecated acquisitionMilestoneFor()/AcquisitionMilestone[] lookup this
// function replaces. Kept as a separate lookup from deriveCurrentMilestone()
// above rather than folded into it, same reasoning as before consolidation:
// gate progress isn't part of the SRR-PRR ordering that function reasons
// about.
export function gateMilestoneFor(
  milestones: Milestone[],
  baselineId: string,
  event: AcquisitionGateEvent,
): Milestone | null {
  return (
    milestones.find(
      (m) => m.baselineId === baselineId && m.milestoneType === "AcquisitionGate" && m.event === event,
    ) ?? null
  );
}

export interface PhaseMilestoneStatus {
  event: Milestone["event"];
  milestone: Milestone | undefined;
}

// Per-phase view for the stepper/detail panel: which of this phase's SETR
// events exist as Milestone records for this baseline, and their status.
// Scoped to milestoneType: "SETR" records for the same reason as
// deriveCurrentMilestone() above (harmless without the filter too, since
// `phase.setrEvents` never contains an AcquisitionGate event string, but
// explicit per PKM Migration Step 9's own instruction not to blur the two).
export function milestoneStatusesForPhase(
  milestones: Milestone[],
  baselineId: string,
  phase: AcquisitionPhaseMeta,
): PhaseMilestoneStatus[] {
  const byEvent = new Map(
    milestones
      .filter((m) => m.baselineId === baselineId && m.milestoneType === "SETR")
      .map((m) => [m.event, m]),
  );
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
      .filter(
        (m) =>
          m.baselineId === baselineId &&
          m.milestoneType === "SETR" &&
          // Safe cast: milestoneType: "SETR" already checked above.
          phase.setrEvents.includes(m.event as SetrMilestoneEvent),
      )
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
