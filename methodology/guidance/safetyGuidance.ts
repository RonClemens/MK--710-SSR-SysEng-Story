import type { SafetyApplicability, SpecLevel } from "../../client/src/types";

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

// The three hazard categories below aren't a separate taxonomy from
// System/Subsystem/CI — they're the same three decomposition levels renamed
// in safety-domain vocabulary, so the mapping is 1:1 and derived rather than
// stored as an independent field on SafetyDeliverable.
export type HazardCategory = "System Hazard" | "Functional Hazard" | "Physical Hazard";

export function hazardCategoryForLevel(level: SpecLevel): HazardCategory {
  if (level === "System") return "System Hazard";
  if (level === "Subsystem") return "Functional Hazard";
  return "Physical Hazard";
}

export const HAZARD_CATEGORY_META: Record<HazardCategory, { level: SpecLevel; description: string; examples: string[] }> = {
  "System Hazard": {
    level: "System",
    description:
      "Mission/operational-level consequence — loss of the platform, loss of life, or failure of the operational mission — identified independent of which subsystem or CI ultimately causes it.",
    examples: [
      "Loss of the Unit Under Test (UUT) due to an uncontrolled stimulus applied by the test set",
      "Operator exposure to hazardous voltage during normal test-set operation",
      "An erroneous pass/fail result released to the customer, masking a real UUT defect",
    ],
  },
  "Functional Hazard": {
    level: "Subsystem",
    description:
      "Hazard from the loss, malfunction, or incorrect operation of a function — scoped against the functional decomposition, independent of which CI implements it.",
    examples: [
      "Stimulus generation function applies an out-of-tolerance signal to the UUT interface",
      "Diagnostic messaging function silently drops a fault report instead of escalating it",
      "Power conditioning function fails to isolate a downstream fault before it propagates upstream",
    ],
  },
  "Physical Hazard": {
    level: "CI",
    description:
      "Hazard traceable to a specific hardware or software design implementation — a particular HWCI/CSCI failure mode, defect, or design margin.",
    examples: [
      "Power supply capacitor failure mode produces an overvoltage condition at the UUT interface connector",
      "Buffer overflow in the diagnostic messaging CSCI corrupts an unrelated memory region",
      "Connector mis-mate between two CIs energizes a pin neither CI's design assumes is live",
    ],
  },
};

export interface CdrlCatalogItem {
  name: string;
  applicability: SafetyApplicability;
  description: string;
}

// Reconciled with SAFETY_BY_LEVEL above: the CDRL types listed per level are
// the deliverable form of the same hazard analyses already mapped there,
// plus a few program-wide artifacts (SSPP, Hazard Log, SAR) that aren't tied
// to one analysis type but are still owned at System level.
export const CDRL_CATALOG: Record<SpecLevel, CdrlCatalogItem[]> = {
  System: [
    {
      name: "System Safety Program Plan (SSPP)",
      applicability: "Both",
      description:
        "Governs the safety program's process, organization, and hazard-tracking approach across both baselines — established early and updated, not re-issued per baseline.",
    },
    {
      name: `${HAZARD_ANALYSIS_META["PHA / SRHA"].name} Report`,
      applicability: "Development",
      description:
        "Identifies candidate system-level hazards and allocates the resulting safety requirements before detailed design is fixed — feeds the System-level Development spec's Safety Requirements section.",
    },
    {
      name: "Hazard Tracking System (HTS) / Hazard Log",
      applicability: "Both",
      description:
        "The living record of every identified hazard, its status, and its closure rationale — one program-wide log, not duplicated per baseline, though entries reference which baseline they were found or closed against.",
    },
    {
      name: "Safety Assessment Report (SAR)",
      applicability: "Both",
      description:
        "Summarizes residual risk and open hazards. Produced as an interim report at Development milestones (CDR/TRR) and finalized before a Production release.",
    },
  ],
  Subsystem: [
    {
      name: `${HAZARD_ANALYSIS_META.FHA.name} Report`,
      applicability: "Development",
      description:
        "Performed against the validated functional decomposition before subsystem design is fixed — only as trustworthy as that functional decomposition (see the Subsystems tab).",
    },
    {
      name: `${HAZARD_ANALYSIS_META.SSHA.name} Report`,
      applicability: "Both",
      description:
        "Starts once a subsystem's design is mature enough to analyze (Development) and is finalized once its Production spec and as-built design are stable.",
    },
  ],
  CI: [
    {
      name: `${HAZARD_ANALYSIS_META.SHA.name} Report`,
      applicability: "Production",
      description:
        "Verifies integrated CI designs don't introduce new hazards at their interfaces — requires CI designs mature enough to integrate, so it typically can't close out until close to Production.",
    },
    {
      name: `${HAZARD_ANALYSIS_META["O&SHA"].name} Report`,
      applicability: "Production",
      description:
        "Identifies hazards from operational and maintenance procedures — depends on stable procedures, which usually aren't finalized until Production.",
    },
    {
      name: "Health Hazard Assessment (HHA) Report",
      applicability: "Production",
      description:
        "Assesses toxic, noise, radiation, or ergonomic hazards tied to the final material and design choices of a specific CI.",
    },
  ],
};

export const SAFETY_DELIVERABLES_INTRO =
  "Each decomposition level produces a different category of hazard and a different set of contractually " +
  "deliverable safety artifacts — CDRLs, typically drawn from the DI-SAFT-801xx System Safety Data Item " +
  "Description series under MIL-STD-882E. System Hazards, Functional Hazards, and Physical Hazards aren't three " +
  "unrelated hazard types — they're the same hazard-analysis discipline applied at System, Subsystem, and " +
  "HWCI/CSCI level respectively, and each CDRL's maturity should track its corresponding Development or " +
  "Production specification, not run ahead of or behind it.";
