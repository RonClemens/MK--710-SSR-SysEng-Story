import type { SpecLevel } from "../types";

// System safety analysis (MIL-STD-882E, extended for software by the Joint
// Software Systems Safety Engineering Handbook / JSSSEH) is not a parallel
// activity to system decomposition — it's a structured walk of the same
// architecture. A hazard analysis performed against an unvalidated or
// over-decomposed structure inherits that structure's weaknesses: hazards
// with no clean functional owner, or the same causal factor analyzed
// redundantly under multiple CIs. This module ties the hazard analysis
// types most commonly cited under 882E/JSSSEH to the System/Subsystem/
// HWCI-CSCI hierarchy this app already models.
export type HazardAnalysisType = "FHA" | "PHA / SRHA" | "SSHA" | "SHA" | "O&SHA";

export const HAZARD_ANALYSIS_META: Record<HazardAnalysisType, { name: string; summary: string }> = {
  FHA: {
    name: "Functional Hazard Analysis",
    summary:
      "Identifies hazards from the loss, malfunction, or incorrect operation of a function — scoped against the functional/logical decomposition, not the physical one. Its validity depends entirely on that functional decomposition being real, not inherited from a physical grouping.",
  },
  "PHA / SRHA": {
    name: "Preliminary Hazard Analysis / System Requirements Hazard Analysis",
    summary:
      "Identifies system-level hazards early and allocates the resulting safety requirements down through subsystems to configuration items, verifying the allocation is complete and traceable.",
  },
  SSHA: {
    name: "Subsystem Hazard Analysis",
    summary:
      "Examines a subsystem's design — including software — for hazards introduced by its own operation, failure modes, or interfaces with other subsystems, once that subsystem's design is mature enough to analyze.",
  },
  SHA: {
    name: "System Hazard Analysis",
    summary:
      "Verifies that subsystem-level hazard causal factors and mitigations, once integrated, don't introduce new hazards at the interfaces between subsystems or CIs — the hazard-analysis analog of an N² diagram.",
  },
  "O&SHA": {
    name: "Operating & Support Hazard Analysis",
    summary:
      "Identifies hazards introduced by operational and maintenance procedures — the as-operated system, not just the as-designed one.",
  },
};

export const SAFETY_FRAMEWORK_INTRO =
  "MIL-STD-882E and the JSSSEH require hazard analysis and safety-requirements flow-down to ride on the system's " +
  "structural decomposition, not run alongside it as a separate exercise. A hazard analysis performed against an " +
  "unvalidated or over-decomposed structure inherits that structure's weaknesses — hazards with no clean functional " +
  "owner, or the same causal factor analyzed redundantly under multiple CIs. Each decomposition level below carries " +
  "a different mix of hazard analysis types and a different kind of safety-requirement content.";

export const SAFETY_BY_LEVEL: Record<
  SpecLevel,
  { analyses: HazardAnalysisType[]; safetyContent: string; decompositionDependency: string }
> = {
  System: {
    analyses: ["PHA / SRHA"],
    safetyContent:
      "System-level hazards (loss of mission, loss of life, catastrophic failure conditions) and top-level mitigation policy — not yet allocated to a specific subsystem or CI.",
    decompositionDependency:
      "PHA/SRHA can proceed with only a system-level requirements baseline, so it's the least sensitive of these analyses to decomposition quality — but the requirements it hands down are only as traceable as the hierarchy they flow into.",
  },
  Subsystem: {
    analyses: ["FHA", "SSHA"],
    safetyContent:
      "Functional hazard causes and cross-subsystem interface hazards — this is where a validated functional decomposition matters most, since FHA is scoped against exactly this layer.",
    decompositionDependency:
      "Most decomposition-sensitive level: FHA is only as good as the functional boundary it's scoped against. A subsystem sourced \"Inherited from SSDD structure — unverified\" produces FHA results that inherit that same unverified boundary.",
  },
  CI: {
    analyses: ["SHA", "O&SHA"],
    safetyContent:
      "Design-specific, verifiable safety requirements traceable to a specific hazard causal factor (e.g. a watchdog timer, an interlock, a defined fail-safe state) — the level where a hazard mitigation becomes a testable \"shall\" statement.",
    decompositionDependency:
      "Over-decomposition doesn't invalidate CI-level hazard analysis the way an unverified subsystem invalidates FHA, but it does fragment it — the same causal factor gets analyzed redundantly across CIs that should have been one.",
  },
};

export const INTERFACE_HAZARD_NOTE =
  "Documented interfaces aren't just an integration record — they're also where interface hazard causal factors " +
  "live (the SHA's core concern). A derived-only cell here is also an unassessed interface hazard boundary, not " +
  "just an undocumented interface.";

export const TRACEABILITY_HAZARD_NOTE =
  "This matrix is also where PHA/SRHA-derived safety requirements get verified as correctly allocated from system " +
  "level down to the CI that's actually responsible for satisfying them — a delta here can mean a safety " +
  "requirement lost the same traceability everything else in this matrix tracks.";

export const UNVERIFIED_SUBSYSTEM_SAFETY_NOTE =
  "This subsystem's functional boundary hasn't been independently validated. Any Functional Hazard Analysis " +
  "scoped to it inherits that same unverified boundary — treat its hazard findings as provisional until the " +
  "subsystem itself is validated.";

export const OVER_DECOMPOSITION_SAFETY_NOTE =
  "Over-decomposition flagged: a Subsystem/System Hazard Analysis scoped to this CI risks analyzing the same " +
  "causal factor redundantly across CIs that should have been consolidated — check whether this CI's hazard " +
  "findings duplicate another CI's before treating them as independent.";
