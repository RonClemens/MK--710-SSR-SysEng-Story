// Technical Data Package (TDP) alignment — MIL-STD-31000 (Technical Data
// Packages), EIA-649 (National Consensus Standard for Configuration
// Management), and ISO/IEC/IEEE 12207 (Software Life Cycle Processes).
//
// This app already tracks most of what a TDP actually needs (specs, CIs,
// baselines, safety/planning CDRLs, attachments) — what it was missing was
// the explicit connective tissue: which MIL-STD-31000 TDP maturity level
// each SETR gate should produce, which EIA-649 configuration-management
// function each existing mechanism (baselines, the Delta Matrix's ECP
// disposition, spec status, FCA/PCA) actually implements, and which IEEE
// 12207 software life-cycle process each Program Planning CDRL documents.
// None of this changes what the app tracks — it reframes the existing
// SETR/spec-maturity/planning-CDRL story in TDP terms so the eventual TDP
// deliverable and this program's own working paper stay the same document,
// not two documents someone has to reconcile by hand.
export const TDP_FRAMEWORK_INTRO =
  "A Technical Data Package (MIL-STD-31000) is the definitive technical description of an item — drawings, " +
  "specifications, standards, software documentation, quality assurance provisions, and packaging details — " +
  "adequate to support production, engineering, and logistics without the original designer. Treating TDP " +
  "alignment as a separate end-of-program exercise is how programs end up with a working paper that says one " +
  "thing and a TDP that says another. Aligning SETR gates, spec maturity, and Program Planning CDRLs to " +
  "MIL-STD-31000's TDP maturity levels, EIA-649's configuration management functions, and IEEE 12207's software " +
  "life-cycle processes means the artifacts this program is already producing at each gate *are* the TDP under " +
  "construction, not a separate deliverable assembled later from scratch.";

export type TdpMaturityLevel = "Conceptual" | "Developmental" | "Product";

export const TDP_MATURITY_LEVELS: TdpMaturityLevel[] = ["Conceptual", "Developmental", "Product"];

export interface TdpMaturityMeta {
  name: string;
  description: string;
  specTypeCorrelation: string;
  setrRange: string;
}

export const TDP_MATURITY_META: Record<TdpMaturityLevel, TdpMaturityMeta> = {
  Conceptual: {
    name: "Conceptual Design TDP",
    description:
      "Requirements and top-level functional/performance data only — no physical design has been committed to " +
      "yet. Adequate for early trade studies and source selection, not for building anything.",
    specTypeCorrelation:
      "Correlates to a System-level Development spec that's still Draft/In Review — before Subsystem-level " +
      "requirements are even baselined, a TDP can't meaningfully exist below the system level yet.",
    setrRange: "SRR through SFR",
  },
  Developmental: {
    name: "Developmental Design TDP",
    description:
      "Preliminary and detailed design data — drawings, specs, and interface data adequate to build and test " +
      "prototype/development articles, but not yet verified as correct through formal test.",
    specTypeCorrelation:
      "Correlates directly to this app's Development spec type at Subsystem and CI level — the same Development " +
      "→ Production transition guidance already given on this tab is the TDP maturity transition, not a separate " +
      "concern.",
    setrRange: "SSR through TRR",
  },
  Product: {
    name: "Product (Production) Design TDP",
    description:
      "As-built, qualification-verified design data — drawings and specs describing the actual article that " +
      "passed test, adequate for competitive re-procurement and sustainment without the original designer.",
    specTypeCorrelation:
      "Correlates directly to this app's Production spec type — a spec shouldn't flip to Production, and its TDP " +
      "content shouldn't be represented as Product-level, until the Functional and Physical Configuration Audits " +
      "described below have actually closed for that item.",
    setrRange: "SVR (FCA) through PRR and beyond (PCA)",
  },
};

// EIA-649's Configuration Verification and Audit function is implemented in
// the DoD SETR sequence as two distinct audits — kept as a named constant
// since both the TDP maturity levels above and the SETR guidance reference
// them by name rather than restating the definition twice.
export const FCA_PCA_NOTE =
  "EIA-649's Configuration Verification and Audit function shows up in this program's SETR sequence as two " +
  "distinct, sequential audits: the Functional Configuration Audit (FCA) — already represented on this tab as " +
  "SVR — verifies, item by item, that test results actually satisfy the Development spec's requirements, and is " +
  "the formal gate that allows a spec to begin its Development → Production transition. The Physical " +
  "Configuration Audit (PCA), performed at or shortly after PRR, verifies the as-built article and its production " +
  "drawing package (see the ASME Y14.100 pointer-spec guidance above) actually match what the Production spec and " +
  "drawings say — it's the gate that closes out Product-level TDP maturity, not FCA.";

export interface TdpContentElement {
  id: string;
  name: string;
  description: string;
  appMapping: string;
}

export const TDP_CONTENT_ELEMENTS: TdpContentElement[] = [
  {
    id: "edal",
    name: "Engineering Drawings and Associated Lists (EDAL)",
    description: "The drawing set (and parts/materials lists) that defines an item's physical configuration.",
    appMapping:
      "Not modeled as structured data in this app — represented via link-only Attachments on the relevant CI, " +
      "pointing at the real drawing package wherever it's actually stored (see ASME Y14.100 guidance above).",
  },
  {
    id: "specifications",
    name: "Specifications",
    description: "The performance and design requirements an item must satisfy.",
    appMapping:
      "Directly modeled — the Specifications tab's System/Subsystem/CI-level Development and Production specs " +
      "are this TDP element, with the Development→Production spec type already tracking TDP maturity for design " +
      "data.",
  },
  {
    id: "standards",
    name: "Standards (Pointer Specifications)",
    description: "Higher-level industry/military standards the design and production must comply with.",
    appMapping:
      "Directly modeled — see the Pointer Specifications guidance above (MIL-STD-882E, JSSSEH, MIL-STD-1472, " +
      "MIL-STD-28800, ASME Y14.100) and each spec's Applicable Documents section.",
  },
  {
    id: "softwareDocs",
    name: "Software Documentation",
    description: "Software design descriptions, test documentation, and version description documents.",
    appMapping:
      "Directly modeled — the Program Planning tab's SDD/STD/VDD CDRLs, aligned below to IEEE 12207 process " +
      "groups.",
  },
  {
    id: "qaProvisions",
    name: "Quality Assurance Provisions",
    description: "Verification methods and acceptance criteria for each requirement.",
    appMapping:
      "Directly modeled — each spec's Verification Provisions section (Section 4), plus the Safety Deliverables " +
      "tab's hazard-verification CDRLs where a QA provision is safety-driven.",
  },
  {
    id: "packaging",
    name: "Packaging Details",
    description: "Preservation, packaging, and marking requirements for shipment and storage.",
    appMapping:
      "Not modeled as structured data — a CI-level Development/Production spec's Logistics/Support Requirements " +
      "section (3.8) is the nearest home for it in this app; treat this as a known gap, not an oversight.",
  },
];

export interface CmFunctionalArea {
  id: string;
  name: string;
  description: string;
  appMapping: string;
}

// EIA-649's five configuration management functional areas, mapped to the
// mechanisms this app already uses for each — CM wasn't a missing feature,
// it just wasn't named as CM.
export const CM_FUNCTIONAL_AREAS: CmFunctionalArea[] = [
  {
    id: "planning",
    name: "CM Planning and Management",
    description: "Establishes the CM process, organization, and tools for the program.",
    appMapping:
      "The Configuration Management Plan (CMP) on the Program Planning tab — System-level, Both-applicability, " +
      "established at/before SRR alongside the SEMP.",
  },
  {
    id: "identification",
    name: "Configuration Identification",
    description: "Selects and defines the configuration items and baselines that will be placed under CM.",
    appMapping:
      "The Logical Subsystems and CI Inventory tabs' independent Baseline A / Baseline B decomposition, plus " +
      "each Specification's baseline and level — this is what \"configuration identification\" concretely means " +
      "in this app.",
  },
  {
    id: "changeManagement",
    name: "Configuration Change Management",
    description: "Controls changes to an established baseline through a formal change process.",
    appMapping:
      "The Delta Matrix's \"ECP required\" disposition — a delta accepted as-is stays outside formal CM change " +
      "control by design; a delta dispositioned ECP required is exactly EIA-649's change-management function " +
      "triggering.",
  },
  {
    id: "statusAccounting",
    name: "Configuration Status Accounting",
    description: "Records and reports the current approved configuration and the status of proposed changes.",
    appMapping:
      "Each Specification's, Safety Deliverable's, and Program Planning Deliverable's status field " +
      "(Draft/In Review/Approved/Under ECP) — the same field already used for the Development→Production " +
      "maturity story is EIA-649 status accounting in practice.",
  },
  {
    id: "verificationAudit",
    name: "Configuration Verification and Audit",
    description: "Confirms the actual, as-built configuration matches its defining documentation.",
    appMapping:
      "The FCA (represented as SVR) and PCA (at/after PRR) described below — see the FCA/PCA note.",
  },
];

export const SOFTWARE_LIFECYCLE_INTRO =
  "ISO/IEC/IEEE 12207 defines the software life-cycle processes a Software Development Plan is required to " +
  "tailor and schedule. This app's five software-relevant Program Planning CDRLs (SDP, SDD, STP, STD, VDD) aren't " +
  "a separate planning taxonomy from 12207 — each one is the planning/output artifact for one or more of 12207's " +
  "technical process groups, mapped below to the SETR range in which that process is actually active on this " +
  "program.";

export interface SoftwareLifecycleGroup {
  id: string;
  name: string;
  description: string;
  setrRange: string;
  planningCdrls: string;
}

// A deliberately condensed subset of ISO/IEC/IEEE 12207's technical
// processes — grouped to match the granularity this app's Program Planning
// CDRLs (SDP/STP/SDD/STD/VDD) already operate at, not a restatement of all
// fourteen 12207 technical processes.
export const SOFTWARE_LIFECYCLE_GROUPS: SoftwareLifecycleGroup[] = [
  {
    id: "reqsDefinition",
    name: "Requirements Definition",
    description:
      "IEEE 12207's Stakeholder Needs and System/Software Requirements Definition processes — establishing what " +
      "the software must do, tailored and planned by the SDP before any CSCI-specific work starts.",
    setrRange: "SRR–SFR",
    planningCdrls: "Software Development Plan (SDP) — establishes process/methodology and candidate CSCI boundaries.",
  },
  {
    id: "architectureDesign",
    name: "Architecture and Design Definition",
    description:
      "IEEE 12207's Architecture Definition and Design Definition processes — allocating requirements to CSCIs " +
      "and defining each CSCI's internal design.",
    setrRange: "SSR–CDR",
    planningCdrls: "Software Design Description (SDD) — documents a specific CSCI's internal design.",
  },
  {
    id: "implementationIntegration",
    name: "Implementation and Integration",
    description: "IEEE 12207's Implementation and Integration processes — building and integrating each CSCI.",
    setrRange: "CDR–TRR",
    planningCdrls:
      "No dedicated CDRL in this app's catalog — implementation/integration status is tracked via each spec's " +
      "status field and the Delta Matrix, not a separate planning document.",
  },
  {
    id: "verificationValidation",
    name: "Verification and Validation",
    description:
      "IEEE 12207's Verification and Validation processes — confirming the software satisfies its requirements " +
      "and is fit for its intended use.",
    setrRange: "TRR–SVR",
    planningCdrls:
      "Software Test Plan (STP) — establishes the test approach; Software Test Description (STD) — the CSCI-" +
      "specific detailed test procedures implementing it.",
  },
  {
    id: "transition",
    name: "Transition",
    description:
      "IEEE 12207's Transition process — establishing the qualified software product's ability to be delivered, " +
      "installed, and operated in its target environment.",
    setrRange: "SVR–PRR",
    planningCdrls: "Version Description Document (VDD) — records the as-built, as-qualified software baseline.",
  },
];
