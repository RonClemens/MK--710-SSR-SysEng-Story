// Systems Engineering Management Plan (SEMP) section mapping — rebuilt
// around a verified copy of the governing DID (DI-SESS-81785B, approved
// 2025-01-08) AND a verified copy of the document it defers to for content
// when no program-specific government SEP exists: the OSD Systems
// Engineering Plan (SEP) Outline, Version 4.1 (May 2023, OUSD(R&E),
// Distribution Statement A — publicly releasable). Both PDFs were supplied
// by this app's user and read directly, not scraped.
//
// The DID says outright: "The SEMP format shall be selected by the
// contractor... [it] shall address all topics in the government SEP, if
// available. In the absence of a government SEP, the SEMP shall address
// the topics in the OSD SEP Outline active at the time of the RFP." So the
// section list below mirrors the SEP Outline's own real section numbers —
// 1 (Introduction), 2.1-2.6 (Program Technical Definition), 3.1 and
// 3.2.1-3.2.13 (Program Technical Management), plus its Appendices B-E and
// closing References section — not an invented sequence.
//
// One honest caveat: the uploaded SEP Outline PDF is 20 pages, but the
// document's own table of contents runs to page 58 — so body text
// ("Expectation:" requirement language) was only actually read through
// section 2.5 (Design Considerations). Sections 2.6 onward and all of
// Section 3 have their number/title verified against the real table of
// contents, but not their specific required content — flagged per-section
// via `verbatimVerified` below (rendered in the UI) rather than treated as
// equally confirmed. If your program has its own government-furnished SEP,
// the DID requires the SEMP to follow THAT document's structure first —
// this app has no visibility into it.
export interface SempSection {
  id: string;
  defaultNumber: string;
  defaultTitle: string;
  defaultSourceDescription: string;
  // true: this app's user supplied SEP Outline PDF included the actual
  // body/"Expectation:" text for this section, not just its title.
  // false: the section number/title is verified against the real table of
  // contents, but the specific required content beneath it has not been
  // read — treat the source-description mapping below as this app's own
  // reasonable inference from the title and general DoD SE practice, not
  // a citation.
  verbatimVerified: boolean;
}

export const SEMP_SECTIONS: SempSection[] = [
  {
    id: "introduction",
    defaultNumber: "1",
    defaultTitle: "Introduction",
    defaultSourceDescription:
      "Per the SEP Outline: summarize the program, how the PMO tailored the SEP, the plan to align the Prime Contractor's SEMP with the PMO SEP, SEP update cadence, and program phase/entry-exit criteria — none of that is auto-generated. This app's one concrete contribution: the INCOSE/ISO 15288 process-group table below, which is exactly the kind of shared vocabulary a \"plan to align the Prime Contractor's SEMP with the PMO SEP\" needs.",
    verbatimVerified: true,
  },
  {
    id: "requirementsDevelopment",
    defaultNumber: "2.1",
    defaultTitle: "Requirements Development",
    defaultSourceDescription:
      "The SEP Outline's own Table 2.1-1 is literally a \"Requirements Traceability Matrix (mandatory)\" with a per-requirement verification method column — this app's Delta/Traceability Matrix (SFR allocation vs. actual decomposition, deltas, dispositions) and each Specification's Verification Provisions section are the direct analog, plus COTS Records' verification method/rationale fields.",
    verbatimVerified: true,
  },
  {
    id: "architecturesInterfaceControl",
    defaultNumber: "2.2",
    defaultTitle: "Architectures and Interface Control",
    defaultSourceDescription:
      "The SEP Outline asks for architecture diagrams/models and all interfaces (ICDs, IRS) between major system components — this app's Subsystems, CI Inventory, and N² Diagram/Interfaces tabs are a direct match, independently per baseline.",
    verbatimVerified: true,
  },
  {
    id: "specialtyEngineering",
    defaultNumber: "2.3",
    defaultTitle: "Specialty Engineering",
    defaultSourceDescription:
      "The SEP Outline asks for a summary here, with detail in the corresponding 3.2.x Technical Tracking subsections below (Reliability & Maintainability, Manufacturing & Quality, Human Systems Integration, System Safety, Software Engineering). This section is a short index into those; see each for this app's actual coverage.",
    verbatimVerified: true,
  },
  {
    id: "modelingStrategy",
    defaultNumber: "2.4",
    defaultTitle: "Modeling Strategy",
    defaultSourceDescription:
      "The SEP Outline literally asks the program to \"define the modeling strategy to be used (model-supported, model-integrated, or model-centric)\" and explain why — this is the real-document anchor for this app's Document-Based (DBx) vs Model-Based (MBx) guidance, repeated across six tabs. The full six-dimension table is reproduced here.",
    verbatimVerified: true,
  },
  {
    id: "designConsiderations",
    defaultNumber: "2.5",
    defaultTitle: "Design Considerations",
    defaultSourceDescription:
      "The SEP Outline's Table 2.5-1 explicitly includes Parts Management and Diminishing Manufacturing Sources and Material Shortages (DMSMS) rows — this app's COTS Records tab (qualified alternates, obsolescence monitoring notes) is a direct match for those two. CBRN Survivability, Modular Open Systems Approach (MOSA), Digital Ecosystem, System Security Engineering, and Intelligence (the table's other rows) are not modeled by this app — genuine gaps, not oversights.",
    verbatimVerified: true,
  },
  {
    id: "technicalCertifications",
    defaultNumber: "2.6",
    defaultTitle: "Technical Certifications",
    defaultSourceDescription:
      "Section title verified against the real table of contents; the specific required content (typically airworthiness, safety release, interoperability, or similar formal certifications) was not in the portion of the SEP Outline read. Not modeled by this app — the Safety Deliverables tab's CDRL tracking is the closest adjacent content, since certifications often depend on a documented safety release.",
    verbatimVerified: false,
  },
  {
    id: "technicalPlanning",
    defaultNumber: "3.1",
    defaultTitle: "Technical Planning",
    defaultSourceDescription:
      "Title verified against the table of contents (covers Technical Schedule, Maturity Assessment Planning, Technical Structure/Organization including WBS and program office staffing). This is program-management/staffing content this app doesn't track — the SETR event sequence (3.2.13, below) is the closest adjacent content, giving schedule anchor points without the staffing/organizational detail this section actually requires.",
    verbatimVerified: false,
  },
  {
    id: "technicalRiskIssueOpportunity",
    defaultNumber: "3.2.1",
    defaultTitle: "Technical Risk, Issue, and Opportunity Management",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the Recommendations tab and A/B Compatibility risk notes — this app has no dedicated trade-study or formal risk-register entity, so treat this as a partial feed, not a complete one.",
    verbatimVerified: false,
  },
  {
    id: "technicalPerformanceMeasures",
    defaultNumber: "3.2.2",
    defaultTitle: "Technical Performance Measures",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app — no TPM/metric-tracking entity exists here; spec and CI status fields are the nearest (weak) proxy for progress tracking.",
    verbatimVerified: false,
  },
  {
    id: "reliabilityMaintainability",
    defaultNumber: "3.2.3",
    defaultTitle: "Reliability and Maintainability Engineering",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app as a dedicated discipline — COTS Records' obsolescence monitoring is tangentially related but not a substitute.",
    verbatimVerified: false,
  },
  {
    id: "manufacturingQuality",
    defaultNumber: "3.2.4",
    defaultTitle: "Manufacturing and Quality Engineering",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app as a dedicated discipline — the MIL-STD-31000 TDP \"Quality Assurance Provisions\" content element and each Specification's Verification Provisions section are tangentially related.",
    verbatimVerified: false,
  },
  {
    id: "humanSystemsIntegration",
    defaultNumber: "3.2.5",
    defaultTitle: "Human Systems Integration",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the MIL-STD-1472 (Human Engineering) pointer-spec guidance on the Specifications tab — cited at System level and wherever a CI presents an operator interface.",
    verbatimVerified: false,
  },
  {
    id: "systemSafety",
    defaultNumber: "3.2.6",
    defaultTitle: "System Safety",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the full Safety Deliverables tab: the MIL-STD-882E/JSSSEH CDRL catalog by level, hazard category mapping, and every safety deliverable record.",
    verbatimVerified: false,
  },
  {
    id: "corrosionPreventionControl",
    defaultNumber: "3.2.7",
    defaultTitle: "Corrosion Prevention and Control",
    defaultSourceDescription:
      "Title verified against the table of contents (added to the SEP Outline in the May 2023 revision per DoDI 5000.88). Not modeled by this app — the MIL-STD-28800 (equipment ruggedization) pointer-spec guidance is the closest tangential content.",
    verbatimVerified: false,
  },
  {
    id: "softwareEngineering",
    defaultNumber: "3.2.8",
    defaultTitle: "Software Engineering",
    defaultSourceDescription:
      "Title verified against the table of contents (covers Overview, Planning Phase, Execution Phase, and Obsolescence per its own sub-numbering). Sourced from the Program Planning tab's software-specific CDRLs (SDP, STP, SDD, STD, VDD), Software-domain Specifications, and the IEEE 12207 software life-cycle process alignment.",
    verbatimVerified: false,
  },
  {
    id: "technologyInsertionRefresh",
    defaultNumber: "3.2.9",
    defaultTitle: "Technology Insertion and Refresh",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app — COTS Records' obsolescence monitoring is tangentially related but doesn't capture a technology refresh plan.",
    verbatimVerified: false,
  },
  {
    id: "configurationChangeManagement",
    defaultNumber: "3.2.10",
    defaultTitle: "Configuration and Change Management",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the EIA-649 CM functional-area mapping (baselines as Configuration Identification, Delta Matrix ECP disposition as Change Management, status fields as Status Accounting), and the full Program Planning Deliverables table, including the Configuration Management Plan and the Risk/Requirements/Data Management Plans DI-SESS-81785B paragraph 3.7 names explicitly.",
    verbatimVerified: false,
  },
  {
    id: "technicalDataManagement",
    defaultNumber: "3.2.11",
    defaultTitle: "Technical Data Management",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the MIL-STD-31000 Technical Data Package (TDP) Alignment guidance: TDP maturity levels (Conceptual/Developmental/Product) and TDP content elements mapped to this app's entities.",
    verbatimVerified: false,
  },
  {
    id: "systemSecurityEngineering",
    defaultNumber: "3.2.12",
    defaultTitle: "System Security Engineering",
    defaultSourceDescription:
      "Title verified against the table of contents (cybersecurity, Risk Management Framework, program protection). Not modeled by this app — genuinely out of scope; do not infer coverage from anything else on this list.",
    verbatimVerified: false,
  },
  {
    id: "technicalReviewsAuditsActivities",
    defaultNumber: "3.2.13",
    defaultTitle: "Technical Reviews, Audits and Activities",
    defaultSourceDescription:
      "Title verified against the table of contents. Sourced from the full SETR guidance (SRR through PRR, with MIL-STD-31000 TDP Maturity per event) and the FCA (at SVR)/PCA (at/after PRR) note — the review names and entry/exit criteria are this app's own working framework, not yet checked against IEEE 24748-8's defined review/audit set.",
    verbatimVerified: false,
  },
  {
    id: "appendixUii",
    defaultNumber: "Appendix B",
    defaultTitle: "Item Unique Identification Implementation Plan",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app.",
    verbatimVerified: false,
  },
  {
    id: "appendixAgileMetrics",
    defaultNumber: "Appendix C",
    defaultTitle: "Agile and DevSecOps Software Development Metrics",
    defaultSourceDescription:
      "Title verified against the table of contents. Not modeled by this app — see 3.2.8 Software Engineering for what this app does track on the software side.",
    verbatimVerified: false,
  },
  {
    id: "appendixConOps",
    defaultNumber: "Appendix D",
    defaultTitle: "Concept of Operations Description",
    defaultSourceDescription:
      "Title verified against the table of contents. Not auto-generated — carry over from the destination SEMP's existing ConOps material.",
    verbatimVerified: false,
  },
  {
    id: "appendixDigitalEngineering",
    defaultNumber: "Appendix E",
    defaultTitle: "Digital Engineering Implementation Plan",
    defaultSourceDescription:
      "Title verified against the table of contents. This app's Digital Engineering-relevant content lives in 2.4 (Modeling Strategy — the DBx/MBx table) and 3.2.11 (Technical Data Management — TDP maturity/content elements) above, rather than being duplicated here.",
    verbatimVerified: false,
  },
  {
    id: "referenceDocuments",
    defaultNumber: "References",
    defaultTitle: "Reference Documents",
    defaultSourceDescription:
      "The DID's own cited references (OSD SEP Outline; IEEE 24748-7:2019; IEEE 24748-8:2019) plus this app's Pointer Specifications catalog (MIL-STD-882E, JSSSEH, MIL-STD-1472, MIL-STD-28800, ASME Y14.100) and the EIA-649/IEEE 12207/INCOSE frameworks referenced throughout — cross-check against the consolidated Attachments appendix at the end of this file.",
    verbatimVerified: false,
  },
];

export const SEMP_MAPPING_DISCLAIMER =
  "This section list mirrors the real, verified structure of the OSD Systems Engineering Plan (SEP) Outline v4.1 " +
  "(May 2023) — the document DI-SESS-81785B (approved 2025-01-08) directs a SEMP to follow when no program-" +
  "specific government SEP exists — not a fabricated outline. Section numbers/titles through 2.5 (Design " +
  "Considerations) were verified against the outline's actual body text; sections 2.6 onward are verified against " +
  "its real table of contents but not their specific required content (each is marked below). If your program has " +
  "an actual government-furnished SEP, the DID requires this SEMP to be consistent with THAT document first, and " +
  "this app has no visibility into it. IEEE 24748-8's actual defined review/audit set (typically an IEEE-" +
  "subscription-only document) also hasn't been checked against this app's SETR event names. Correct anything " +
  "that doesn't match your program's real governing documents using Edit Mode (the pencil icon) — changes are " +
  "saved here and reflected the next time you export.";

export const SEMP_APPENDIX_NOTE =
  "Two data appendices are always included in the export, outside the numbered section list above: a full CI " +
  "Inventory (every Configuration Item, both baselines) and a consolidated Attachments index (every linked " +
  "document reference across all entities, with which record it came from).";

export const SEMP_DID_CITATION =
  "DI-SESS-81785B, \"Systems Engineering Management Plan (SEMP),\" approved 2025-01-08, superseding " +
  "DI-SESS-81785A (source: https://assist.dla.mil), and Department of Defense Systems Engineering Plan (SEP) " +
  "Outline, Version 4.1, May 2023, OUSD(R&E) (source: https://www.cto.mil, Distribution Statement A — approved " +
  "for public release). Verify both are still the current versions before relying on this mapping.";
