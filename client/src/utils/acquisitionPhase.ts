import { MILESTONE_EVENTS, type Milestone } from "../types";
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
