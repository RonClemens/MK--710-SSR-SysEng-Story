// Systems Engineering Management Plan (SEMP) section mapping — rebuilt
// against a verified copy of the governing DID (DI-SESS-81785B, approved
// 2025-01-08, superseding DI-SESS-81785A; PDF supplied by the app's user
// and read directly, not scraped). Unlike most DIDs, DI-SESS-81785B does
// NOT prescribe a fixed table of contents:
//
//   "2. Format. The SEMP format shall be selected by the contractor."
//   "3. Content. The SEMP shall be consistent with and address all topics
//   in the government SEP, if available. In the absence of a government
//   SEP, the SEMP shall address the topics in the OSD SEP Outline active
//   at the time of the Request for Proposal (RFP). Minimally, the SEMP
//   shall: [paragraphs 3.1 through 3.8]."
//
// So the section list below is organized around the DID's actual eight
// numbered content requirements (3.1-3.8, with 3.5 split into its four
// lettered sub-requirements a-d) rather than a fabricated generic-DoD-SEMP
// outline — every defaultNumber below is the DID's own paragraph number,
// not an invented sequence. Two things remain genuinely unverified and are
// flagged as such rather than guessed at:
//   1. If this program has an actual government-furnished SEP, the DID
//      requires the SEMP to be consistent with THAT document's structure
//      first — this app has no visibility into it and can't substitute for
//      it. In its absence, the DID falls back to the OSD SEP Outline
//      (v4.1 as of this writing, https://www.cto.mil/wp-content/uploads/
//      2023/06/SEP-Outline-4.1.pdf) — not yet verified against this app's
//      structure either.
//   2. IEEE 24748-7:2019 and IEEE 24748-8:2019 (the DID's cited reference
//      standards for SE application and technical reviews/audits,
//      respectively) are typically available only via an IEEE subscription
//      — this app's SETR event names/entry-exit criteria (SRR/SFR/SSR/
//      PDR/CDR/TRR/SVR/PRR) have not been checked against 24748-8's actual
//      defined review/audit set.
// Every number/title/description below is wired through EditableText/
// SiteContentContext (see SempMigrationPage) so both of the above can be
// corrected in place once verified, without a code change.
export interface SempSection {
  id: string;
  defaultNumber: string;
  defaultTitle: string;
  defaultSourceDescription: string;
}

export const SEMP_SECTIONS: SempSection[] = [
  {
    id: "useRelationshipScope",
    defaultNumber: "1",
    defaultTitle: "Use/Relationship and Scope",
    defaultSourceDescription:
      "Not generated from this app's data — carry over program/system identification and scope from the destination SEMP's existing front matter. Per the DID: \"The SEMP describes the contractor's technical approach and proposed plan for the conduct, management, and control of the integrated systems engineering (SE) effort. It reflects the scope, purpose, and life-cycle phase(s) of the program.\"",
  },
  {
    id: "referenceDocuments",
    defaultNumber: "2",
    defaultTitle: "Reference Documents",
    defaultSourceDescription:
      "The DID's own cited references (OSD SEP Outline; IEEE 24748-7:2019; IEEE 24748-8:2019) plus this app's Pointer Specifications catalog (MIL-STD-882E, JSSSEH, MIL-STD-1472, MIL-STD-28800, ASME Y14.100), the MIL-STD-31000/EIA-649/IEEE 12207 TDP Alignment guidance, and the INCOSE/ISO 15288 process mapping below — cross-check against the consolidated Attachments appendix at the end of this file.",
  },
  {
    id: "engineeringApproach",
    defaultNumber: "3.1",
    defaultTitle: "Planned Engineering Approach and Overall Technical/Management Approach",
    defaultSourceDescription:
      "DID 3.1: \"Describe the contractor's planned engineering approach to meeting the program's contract, objectives, and overall technical and management approach.\" Sourced from this app's own framing (Baseline A/B reconciliation story), the SETR framework intro, and the Program Planning & Execution DBx/MBx dimension.",
  },
  {
    id: "operationalPlanSpecialtyIntegration",
    defaultNumber: "3.2",
    defaultTitle: "Detailed Operational Plan for Executing SE, Including Specialty Engineering Discipline Integration",
    defaultSourceDescription:
      "DID 3.2: \"Describe the contractor's detailed operational plan for executing systems engineering, including integration of the specialty engineering disciplines.\" Sourced from the Safety Deliverables tab (System Safety specialty engineering, MIL-STD-882E/JSSSEH), Software-domain Specifications and Program Planning's software CDRLs (Software specialty engineering, IEEE 12207), and the MIL-STD-1472 Human Factors pointer-spec guidance (Human Factors specialty engineering).",
  },
  {
    id: "processMapping",
    defaultNumber: "3.3",
    defaultTitle: "Mapping Between Contractor and Government SE Processes",
    defaultSourceDescription:
      "DID 3.3: \"Contain an annotated mapping between contractor and government SE processes. Identify any technical or technical management processes not mapped, including rationale for why they are not needed.\" This app supplies the contractor-side half via the INCOSE/ISO 15288 process-group mapping below, the SETR event sequence, EIA-649 CM functional areas, and MIL-STD-31000 TDP maturity — the government-side column and any not-needed-process rationale still require your program's actual government SE process documentation, which this app has no visibility into.",
  },
  {
    id: "subcontractorAlignment",
    defaultNumber: "3.4",
    defaultTitle: "Alignment of Contractor and Subcontractor SE Processes",
    defaultSourceDescription:
      "DID 3.4: \"Show alignment of SE processes of the contractor and subcontractors providing engineering effort.\" Sourced from the COTS Records tab (vendor/subcontractor sourcing, qualified alternates) — this is a genuinely thin area in this app's current data; treat this section as a gap to fill from your program's actual subcontractor management records, not a complete feed.",
  },
  {
    id: "architectureInterfaces",
    defaultNumber: "3.5.a",
    defaultTitle: "System Architecture Development, Documentation, and Interfaces",
    defaultSourceDescription:
      "DID 3.5.a: \"Development, documentation, maintenance, and communication of the system architecture, including both internal and external interfaces.\" Sourced from the Subsystems, CI Inventory, and N² Diagram/Interfaces tabs — both baselines' independent decomposition, over-decomposition flags, and documented interface records.",
  },
  {
    id: "technicalReviewsAudits",
    defaultNumber: "3.5.b",
    defaultTitle: "Formal Technical Reviews and Audits (Entry/Exit Criteria)",
    defaultSourceDescription:
      "DID 3.5.b: \"Formal technical reviews and audits, as defined in IEEE 24748-8 or by the specific and discrete task requirements delineated in the contract, including the entry and exit criteria for each review/audit.\" Sourced from the full SETR guidance (SRR through PRR, Specifications and Program Planning tabs) and the FCA/PCA note — the review names and entry/exit-criteria content here are this app's own working framework, not yet checked against IEEE 24748-8's actual defined review/audit set.",
  },
  {
    id: "tradeStudies",
    defaultNumber: "3.5.c",
    defaultTitle: "Trade Studies (Requirements, Architecture, Design, Integration, V&V Decisions)",
    defaultSourceDescription:
      "DID 3.5.c: \"Trade studies for system requirements definition, architecture definition, design definition, integration, and verification/validation decisions.\" This app has no dedicated trade-study entity — the Recommendations tab and Delta Matrix/A-B Compatibility dispositions are the closest existing proxies; treat this section as a partial feed, not a complete one.",
  },
  {
    id: "integrationVerificationValidation",
    defaultNumber: "3.5.d",
    defaultTitle: "Integration, Verification, and Validation to System Element Level",
    defaultSourceDescription:
      "DID 3.5.d: \"Integration, verification, and validation down to the appropriate system element level.\" Sourced from each Specification's Verification Provisions section and COTS Records' verification method/rationale fields.",
  },
  {
    id: "tailoredProcessPlanning",
    defaultNumber: "3.6",
    defaultTitle: "Related Planning for Tailored SE Process Application (Including Supplier/COTS Communication)",
    defaultSourceDescription:
      "DID 3.6: \"Describe related planning associated with application of the contractor's systems engineering processes as tailored to meet the needs of the program... Details of process integration and communication with suppliers (i.e., subcontractors of engineered system elements and COTS vendors) shall be provided.\" Sourced from Program Planning Deliverables broadly, the Pointer Specifications tailoring guidance, the EIA-649/MIL-STD-31000 TDP Alignment guidance, and COTS Records vendor-facing fields.",
  },
  {
    id: "referencedTechnicalPlans",
    defaultNumber: "3.7",
    defaultTitle: "Referenced Lower-Level and Subcontractor Technical Plans",
    defaultSourceDescription:
      "DID 3.7: \"Include referenced lower-level and subcontractor technical plans (e.g., risk management plan, requirements management plan, data management plan, and configuration management plan) as determined necessary...\" Sourced from Program Planning Deliverables — the Configuration Management Plan was already modeled; Risk Management Plan, Requirements Management Plan, and Data Management Plan were added to the System-level CDRL catalog specifically because this DID paragraph names them.",
  },
  {
    id: "otherNecessaryAreas",
    defaultNumber: "3.8",
    defaultTitle: "Other Areas Necessary to Execute Systems Engineering",
    defaultSourceDescription:
      "DID 3.8: \"Provide detail related to other areas deemed necessary to execute systems engineering to meet the program's contract, objectives, and overall technical and management approach.\" This app's catch-all for content that doesn't map to one specific DID paragraph above: Baseline Management (Baseline A/B), Technical Data Package (TDP) Management (MIL-STD-31000), Digital Engineering/MBSE Strategy (DBx/MBx), and COTS and Parts Management.",
  },
];

export const SEMP_MAPPING_DISCLAIMER =
  "This section list mirrors the actual paragraph numbers and topics required by DI-SESS-81785B (approved " +
  "2025-01-08) — not a fabricated generic outline. Two things remain unverified, though: if your program has an " +
  "actual government-furnished SEP, the DID requires this SEMP to be consistent with THAT document first, and " +
  "this app has no visibility into it; in its absence, the DID falls back to the OSD SEP Outline, which hasn't " +
  "been checked against this app's structure either. The review names and entry/exit criteria under 3.5.b also " +
  "haven't been checked against IEEE 24748-8's actual defined review/audit set (typically an IEEE-subscription-" +
  "only document). Correct anything that doesn't match your program's real governing documents using Edit Mode " +
  "(the pencil icon) — changes are saved here and reflected the next time you export.";

export const SEMP_APPENDIX_NOTE =
  "Two appendices are always included in the export, outside the numbered section list above: a full CI Inventory " +
  "(every Configuration Item, both baselines) and a consolidated Attachments index (every linked document " +
  "reference across all entities, with which record it came from).";

export const SEMP_DID_CITATION =
  "DI-SESS-81785B, \"Systems Engineering Management Plan (SEMP),\" approved 2025-01-08, superseding " +
  "DI-SESS-81785A. Source: https://assist.dla.mil — verify this is still the current version before relying on " +
  "this mapping.";
