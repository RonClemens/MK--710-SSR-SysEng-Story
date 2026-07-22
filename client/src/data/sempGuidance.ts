// Best-effort Systems Engineering Management Plan (SEMP) outline, styled
// after a typical modern DoD SEMP built to DI-SESS-81785B. This app has not
// been checked against a verified copy of that DID — the section numbers,
// titles, and source-description text below are a working assumption, not a
// citation. Every number/title/description is wired through
// EditableText/SiteContentContext (see SempMigrationPage) so the person
// running the real migration can correct any of it in place before
// exporting, without needing a code change.
export interface SempSection {
  id: string;
  defaultNumber: string;
  defaultTitle: string;
  defaultSourceDescription: string;
}

export const SEMP_SECTIONS: SempSection[] = [
  {
    id: "scope",
    defaultNumber: "1",
    defaultTitle: "Scope",
    defaultSourceDescription:
      "Program/system identification. Not generated from this app's data — carry over from the destination SEMP's existing front matter.",
  },
  {
    id: "applicableDocuments",
    defaultNumber: "2",
    defaultTitle: "Applicable Documents",
    defaultSourceDescription:
      "Not generated from this app's data. The Attachments appendix (below) lists every linked document reference captured across all tabs, which is a useful cross-check against this section's document list but isn't a substitute for it.",
  },
  {
    id: "seIntegration",
    defaultNumber: "3",
    defaultTitle: "Systems Engineering Integration",
    defaultSourceDescription:
      "SETR framework intro and the full SRR → PRR event guidance (Specifications tab) — what System Decomposition, System Safety Planning, System Software Planning, Spec Generation, and MIL-STD-31000 TDP Maturity is expected at each gate.",
  },
  {
    id: "requirementsManagement",
    defaultNumber: "4",
    defaultTitle: "Requirements Management",
    defaultSourceDescription:
      "Delta/Traceability Matrix (SFR allocation vs. actual decomposition, deltas, dispositions) — the record of how requirements stayed or drifted from their allocated baseline.",
  },
  {
    id: "architectureDecomposition",
    defaultNumber: "5",
    defaultTitle: "System Architecture and Decomposition",
    defaultSourceDescription:
      "Logical Subsystems and CI Inventory for both Baseline A and Baseline B, each baseline's independent decomposition, over-decomposition flags/consolidation notes, and the A/B Compatibility matrix.",
  },
  {
    id: "interfaceManagement",
    defaultNumber: "6",
    defaultTitle: "Interface Management",
    defaultSourceDescription:
      "Documented interface records from the N² tabs (subsystem-to-subsystem and CI-to-CI), separately per baseline.",
  },
  {
    id: "configurationManagement",
    defaultNumber: "7",
    defaultTitle: "Configuration Management",
    defaultSourceDescription:
      "Configuration Management Plan (CM) entries from Program Planning Deliverables, the Delta Matrix and A/B Compatibility rows this app treats as CM-relevant baseline records, and the EIA-649 configuration management functional-area mapping (Specifications tab TDP Alignment guidance).",
  },
  {
    id: "technicalRiskManagement",
    defaultNumber: "8",
    defaultTitle: "Technical Risk Management",
    defaultSourceDescription:
      "Recommendations tab (open/in-progress/done items by category), and A/B Compatibility risk notes — this app doesn't run a formal risk register, so treat this section as a partial feed, not a complete one.",
  },
  {
    id: "technicalReviews",
    defaultNumber: "9",
    defaultTitle: "Technical Reviews (SETR)",
    defaultSourceDescription:
      "Full SETR guidance (SRR through PRR) as captured on the Specifications and Program Planning tabs, including the working assumption flagged on SSR's name.",
  },
  {
    id: "technicalDataPackage",
    defaultNumber: "10",
    defaultTitle: "Technical Data Package (TDP) Management",
    defaultSourceDescription:
      "MIL-STD-31000 TDP maturity levels (Conceptual/Developmental/Product) mapped to the SRR → PRR SETR sequence and this app's Development/Production spec types, the TDP content-element-to-entity mapping, and the FCA/PCA (EIA-649 Configuration Verification and Audit) note — all from the Specifications tab's TDP Alignment guidance.",
  },
  {
    id: "verificationValidation",
    defaultNumber: "11",
    defaultTitle: "Verification and Validation",
    defaultSourceDescription:
      "Specification verificationProvisions sections, and COTS Records verification method / rationale fields.",
  },
  {
    id: "systemSafetyEngineering",
    defaultNumber: "12",
    defaultTitle: "System Safety Engineering",
    defaultSourceDescription:
      "Safety Deliverables (CDRL catalog by level, hazard category mapping, applicability, status) and the hazard-analysis-to-decomposition-level guidance this app ties to MIL-STD-882E/JSSSEH.",
  },
  {
    id: "softwareEngineering",
    defaultNumber: "13",
    defaultTitle: "Software Engineering",
    defaultSourceDescription:
      "Program Planning Deliverables' software-specific CDRLs (SDP, STP, SDD, STD, VDD), each Specification's Software-domain records, and the IEEE 12207 software life-cycle process alignment (Program Planning tab).",
  },
  {
    id: "baselineManagement",
    defaultNumber: "14",
    defaultTitle: "Baseline Management (Baseline A / Baseline B)",
    defaultSourceDescription:
      "Cross-baseline summary: independent Baseline A and Baseline B decomposition counts, Delta Matrix, and A/B Compatibility status — this app's central reconciliation story.",
  },
  {
    id: "cotsPartsManagement",
    defaultNumber: "15",
    defaultTitle: "COTS and Parts Management",
    defaultSourceDescription:
      "COTS Records tab: functional/interface requirements, form-fit constraints, qualified alternates, and obsolescence monitoring notes.",
  },
];

export const SEMP_MAPPING_DISCLAIMER =
  "This section outline is a best-effort mapping to a typical modern DoD SEMP structure, written to the general " +
  "intent of DI-SESS-81785B — it has not been verified against your program's actual DID or your CUI-side SEMP's " +
  "real table of contents. Check every section number and title below against your governing document before " +
  "relying on the exported package, and correct anything that doesn't match using Edit Mode (the pencil icon) — " +
  "changes are saved here and reflected the next time you export.";

export const SEMP_APPENDIX_NOTE =
  "Two appendices are always included in the export, outside the numbered section list above: a full CI Inventory " +
  "(every Configuration Item, both baselines) and a consolidated Attachments index (every linked document " +
  "reference across all entities, with which record it came from).";
