import type { SafetyApplicability, SpecLevel } from "../../client/src/types";

// General (non-safety) program and software planning CDRLs — SEMP, SDP, STP,
// etc. These gate the same SETR events (SRR/SFR/SSR) as the Specifications
// and Safety Deliverables tabs, but aren't safety-specific, so they get their
// own catalog rather than stretching SafetyDeliverable's CDRL list.
export interface PlanningCatalogItem {
  name: string;
  applicability: SafetyApplicability;
  description: string;
}

export const PLANNING_CDRL_CATALOG: Record<SpecLevel, PlanningCatalogItem[]> = {
  System: [
    {
      name: "Systems Engineering Management Plan (SEMP)",
      applicability: "Both",
      description:
        "Governs the overall SE process (reviews, baselines, decomposition approach) across both baselines — established at/before SRR, updated rather than re-issued per baseline.",
    },
    {
      name: "Software Development Plan (SDP)",
      applicability: "Development",
      description:
        "Establishes software process/methodology and candidate CSCI boundaries at SRR; updated at SFR once those boundaries are allocated against the validated functional architecture, not before.",
    },
    {
      name: "Configuration Management Plan (CMP)",
      applicability: "Both",
      description:
        "Governs CM process for both baselines — the same discipline the Delta/Traceability Matrix and CI over-decomposition tracking in this app ultimately feed into.",
    },
    {
      name: "Risk Management Plan (RMP)",
      applicability: "Both",
      description:
        "Governs the risk identification/mitigation process — named explicitly in DI-SESS-81785B paragraph 3.7 as a referenced lower-level plan. This app has no formal risk register; the Recommendations tab and A/B Compatibility risk notes are the closest existing feed until this plan's own tracking is established.",
    },
    {
      name: "Requirements Management Plan (RqMP)",
      applicability: "Both",
      description:
        "Governs how requirements are captured, allocated, and kept traceable through change — named explicitly in DI-SESS-81785B paragraph 3.7. The Delta/Traceability Matrix is this app's concrete evidence of that process actually being followed (or not) for Baseline A.",
    },
    {
      name: "Data Management Plan (DMP)",
      applicability: "Both",
      description:
        "Governs how technical data (specs, drawings, analyses) is identified, controlled, and delivered — named explicitly in DI-SESS-81785B paragraph 3.7. The link-only Attachments mechanism across this app's entities is the nearest adjacent content, though it's a pointer mechanism, not a data management process in itself.",
    },
  ],
  Subsystem: [
    {
      name: "Software Test Plan (STP)",
      applicability: "Development",
      description:
        "Establishes the test approach for a subsystem's software elements once its functional boundary is validated at SFR — drafted too early (before SFR) and it's testing against a boundary that might still move.",
    },
  ],
  CI: [
    {
      name: "Software Design Description (SDD)",
      applicability: "Development",
      description:
        "Documents a specific CSCI's internal design — a PDR/CDR-era artifact, not due at SSR, but worth planning for once CI-level decomposition begins.",
    },
    {
      name: "Software Test Description (STD)",
      applicability: "Development",
      description:
        "The CSCI-specific detailed test procedures implementing the subsystem-level Software Test Plan's approach.",
    },
    {
      name: "Version Description Document (VDD)",
      applicability: "Production",
      description:
        "Records the as-built software baseline (build identification, files, known issues) at release — depends on a stable, qualified build, so it's necessarily a Production-era artifact.",
    },
  ],
};

export const PLANNING_DELIVERABLES_INTRO =
  "Software and program planning CDRLs mature on the same SRR → SFR → SSR timeline as the Specifications and " +
  "Safety Deliverables tabs, but aren't safety-specific — a Software Development Plan or Test Plan is about how " +
  "software gets built and verified, not what hazards it introduces. Like the Safety Deliverables tab, each " +
  "planning CDRL's applicability should track its corresponding specification's maturity rather than run ahead of " +
  "or behind it.";
