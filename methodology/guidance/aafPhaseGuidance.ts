import type { SetrEvent } from "./setrGuidance";

// Only MCA (Major Capability Acquisition) is populated today. This is
// deliberately extensible -- adding a second pathway (e.g. the Software
// Acquisition Pathway) later means adding a new key to AAF_PATHWAYS, not
// changing this shape or touching any MCA content. No `pathway` field
// exists anywhere in the entity schema yet; every consumer of this module
// hardcodes "MCA" until a program actually needs to choose between
// pathways.
export type AcquisitionPathway = "MCA";

export type AcquisitionPhaseId = "msa" | "tmrr" | "emd" | "pd" | "os";

export type AcquisitionMilestoneId = "MS-A" | "MS-B" | "MS-C";

export interface AcquisitionMilestoneMeta {
  id: AcquisitionMilestoneId;
  name: string;
  decisionSummary: string;
}

export const MCA_MILESTONE_GATES: Record<AcquisitionMilestoneId, AcquisitionMilestoneMeta> = {
  "MS-A": {
    id: "MS-A",
    name: "Milestone A",
    decisionSummary:
      "Authorizes entry into Technology Maturation & Risk Reduction -- approves pursuing one or more specific technology/design approaches.",
  },
  "MS-B": {
    id: "MS-B",
    name: "Milestone B",
    decisionSummary:
      "Authorizes entry into Engineering & Manufacturing Development -- the program commits to a specific design approach and enters detailed design.",
  },
  "MS-C": {
    id: "MS-C",
    name: "Milestone C",
    decisionSummary:
      "Authorizes entry into Production & Deployment -- Low-Rate Initial Production and/or fielding, gated by developmental test results from EMD.",
  },
};

export interface AcquisitionPhaseMeta {
  id: AcquisitionPhaseId;
  name: string;
  summary: string;
  entryMilestone: AcquisitionMilestoneId | null;
  exitMilestone: AcquisitionMilestoneId | null;
  // The SETR events (from setrGuidance.ts) this phase bands together --
  // empty for stub phases, since this app has no represented content
  // outside SRR through PRR.
  setrEvents: SetrEvent[];
  inScope: boolean;
  outOfScopeNote?: string;
  // Sub-process names from incoseGuidance.ts's INCOSE_GROUP_META (Technical
  // Processes and Technical Management Processes groups only -- Agreement
  // and Organizational Project-Enabling Processes are already flagged
  // out-of-scope there). Manually kept in sync by name, the same
  // hand-mirrored-string convention this app already uses elsewhere (e.g.
  // MilestoneEvent/SetrEvent) since there's no shared type to import
  // through. Empty for stub phases.
  emphasizedIncoseSubProcesses: string[];
  // Optional deeper framing paragraph grounded in the INCOSE Handbook
  // citations in incoseGuidance.ts (Vee model, DoD phase naming, baseline
  // maturity) -- populated where that grounding adds real explanatory
  // value, not on every phase.
  incoseFraming?: string;
}

export const MCA_PHASES: AcquisitionPhaseMeta[] = [
  {
    id: "msa",
    name: "Materiel Solution Analysis",
    summary:
      "Analysis of Alternatives (AoA) and initial requirements development, prior to committing to a technology approach.",
    entryMilestone: null,
    exitMilestone: "MS-A",
    setrEvents: [],
    inScope: false,
    outOfScopeNote: "This app's SETR modeling begins at SRR (TMRR-era); Materiel Solution Analysis has no represented content here.",
    emphasizedIncoseSubProcesses: [],
  },
  {
    id: "tmrr",
    name: "Technology Maturation & Risk Reduction",
    summary:
      "Reduces technology risk and validates the system's functional architecture before committing to detailed design.",
    entryMilestone: "MS-A",
    exitMilestone: "MS-B",
    setrEvents: ["SRR", "SFR"],
    inScope: true,
    emphasizedIncoseSubProcesses: ["Stakeholder Needs / System Requirements Definition", "Architecture Definition"],
    incoseFraming:
      "In the SEH 5th Edition's Vee model (§2.2.1), this phase is squarely on the left side, which INCOSE names " +
      "\"system definition\": top-down elaboration from stakeholder needs through system requirements toward a " +
      "validated functional architecture -- the same arc SRR and SFR close out in this app's SETR sequence.",
  },
  {
    id: "emd",
    name: "Engineering & Manufacturing Development",
    summary:
      "Detailed design and build-to/code-to maturity -- from software/CI-level specification review through critical design. In INCOSE's own terms, this is where system definition gives way to system realization: architecture and design close out, and implementation, integration, and early verification activity ramp up.",
    entryMilestone: "MS-B",
    exitMilestone: "MS-C",
    setrEvents: ["SSR", "PDR", "CDR"],
    inScope: true,
    emphasizedIncoseSubProcesses: [
      "Architecture Definition",
      "Design Definition",
      "Implementation / Integration",
      "Configuration Management",
    ],
    incoseFraming:
      "This phase is where the SEH 5th Edition's Vee model pivots. System definition (architecture, largely " +
      "closed out by SSR/PDR) gives way to what the Handbook calls system realization: \"the evolving baseline " +
      "of system elements that are implemented, integrated, verified, and validated\" (§2.2.1). PDR establishes " +
      "the Allocated Baseline and CDR an initial Product Baseline (§2.1.4, Figure 2.4) -- independently " +
      "corroborating this app's existing OSD SEP Outline baseline-maturity citation (see DBx/MBx guidance) from " +
      "a second source. INCOSE's own DoD comparison figure (Figure 2.2) names \"Engineering and Manufacturing " +
      "Development\" explicitly, though — consistent with the Handbook's deliberately acquisition-neutral " +
      "posture since its 2004/2006 editions — without further DoD-specific elaboration beyond that naming; the " +
      "SSR/PDR/CDR banding used here is this app's own synthesis, not an INCOSE claim.",
  },
  {
    id: "pd",
    name: "Production & Deployment",
    summary:
      "Test readiness, verification against requirements, and production readiness -- from developmental test through the production decision.",
    entryMilestone: "MS-C",
    exitMilestone: null,
    setrEvents: ["TRR", "SVR", "PRR"],
    inScope: true,
    emphasizedIncoseSubProcesses: ["Verification / Validation", "Transition", "Configuration Management"],
    incoseFraming:
      "System realization continues here: Verification and Transition (SEH 5th Ed. §2.3.5.9–10) carry the " +
      "Product Baseline from CDR through FCA/PCA to a final Product Baseline (§2.1.4, Figure 2.4) -- the same " +
      "TRR/SVR/PRR range this app already tracks.",
  },
  {
    id: "os",
    name: "Operations & Support",
    summary: "Sustainment of the fielded system after production.",
    entryMilestone: null,
    exitMilestone: null,
    setrEvents: [],
    inScope: false,
    outOfScopeNote: "This app's SETR modeling ends at PRR; Operations & Support has no represented content here.",
    emphasizedIncoseSubProcesses: [],
  },
];

export const AAF_PATHWAYS: Record<AcquisitionPathway, AcquisitionPhaseMeta[]> = {
  MCA: MCA_PHASES,
};

export const AAF_PHASE_FRAMEWORK_INTRO =
  "The Major Capability Acquisition (MCA) pathway's five phases aren't a separate taxonomy from the SRR-PRR " +
  "SETR sequence this app already tracks -- they're a coarser lens over the same eight events, the same way " +
  "MIL-STD-31000 TDP maturity and IEEE 12207 software life-cycle groups already band the identical eight events " +
  "at a different granularity for a different purpose (see tdpGuidance.ts). Technology Maturation & Risk " +
  "Reduction's SRR-SFR range matches Conceptual TDP maturity's own range exactly; Engineering & Manufacturing " +
  "Development and Production & Deployment split what TDP guidance treats as one continuous " +
  "Developmental-to-Product transition into the two acquisition-decision phases (Milestone B and C) that " +
  "actually gate it programmatically.";
