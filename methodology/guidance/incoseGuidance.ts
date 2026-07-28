// INCOSE Systems Engineering Handbook alignment. This module was originally
// built without access to a verified copy of the Handbook. It has since
// been checked against the actual INCOSE Systems Engineering Handbook, 5th
// Edition (2023) [INCOSE-TP-2003-002-05] -- specifically its Section 1,
// Section 2.1 through 2.3.1 front matter, and the full Technical Processes
// list with section numbers (Section 2.3.5, processes 1-14). Coverage is
// partial, not exhaustive: the individual Purpose/Description text for
// Technical Processes #3-14 (System Requirements Definition through
// Disposal) was not available for direct verification, so the
// process-to-app-tab mappings below remain this app's own synthesis, not
// quotes from the Handbook. Per the Handbook's own copyright terms, no
// extended verbatim text is reproduced here -- citations below are to
// section/figure numbers and short paraphrase only.
//
// What's on stable, well-documented public ground either way is the
// process taxonomy the Handbook is built around: ISO/IEC/IEEE 15288's four
// SE process groups. That taxonomy is what this module maps this app's
// content against, and it's also the natural vocabulary for DI-SESS-81785B
// paragraph 3.3's required "annotated mapping between contractor and
// government SE processes" — most government SEPs and INCOSE-trained SE
// organizations already think in these four groups, so mapping to them is
// mapping to a shared language, not inventing a new one.
export const INCOSE_FRAMEWORK_INTRO =
  "ISO/IEC/IEEE 15288 — the technical standard the INCOSE Systems Engineering Handbook is built around — " +
  "organizes systems engineering into four process groups. This app was never designed against that taxonomy " +
  "explicitly, but nearly everything it already tracks falls cleanly into one of the four groups once named — " +
  "which is exactly the point of DI-SESS-81785B paragraph 3.3's required contractor/government process mapping: " +
  "showing the correspondence between how this program actually works and the standard vocabulary a government " +
  "SE process, or an INCOSE-trained reviewer, will expect. Two of the four groups are also this app's most honest " +
  "gaps — Agreement Processes and Organizational Project-Enabling Processes sit above the level of individual " +
  "technical artifacts this app models, and are called out below as gaps rather than stretched to fit.";

// Verified against SEH 5th Edition §2.3.5 intro ("The ISO/IEC/IEEE 15288
// includes 14 Technical Processes") and the section's own numbering
// (§2.3.5.1 through §2.3.5.14). This app's Technical Processes sub-process
// list below is a deliberately collapsed 7-item grouping of these 14 for
// app-tab-mapping purposes, not a 1:1 restatement -- the full 14, in the
// Handbook's own order, are: Business or Mission Analysis (§2.3.5.1),
// Stakeholder Needs and Requirements Definition (§2.3.5.2), System
// Requirements Definition (§2.3.5.3), System Architecture Definition
// (§2.3.5.4), Design Definition (§2.3.5.5), System Analysis (§2.3.5.6),
// Implementation (§2.3.5.7), Integration (§2.3.5.8), Verification
// (§2.3.5.9), Transition (§2.3.5.10), Validation (§2.3.5.11), Operation
// (§2.3.5.12), Maintenance (§2.3.5.13), Disposal (§2.3.5.14).
export const INCOSE_TECHNICAL_PROCESSES_CITATION =
  "SEH 5th Edition §2.3.5 lists all 14 ISO/IEC/IEEE 15288 Technical Processes by name, each following a fixed " +
  "template (Purpose, Description, Inputs/Outputs, Activities). The Handbook's own version history (front " +
  "matter) records that it has deliberately stayed acquisition-pathway-neutral since the 2004 and 2006 " +
  "editions, which reduced and then removed DoD-specific material — the AAF-phase-to-process mapping used " +
  "elsewhere in this app's guidance is this app's own synthesis, not an INCOSE claim.";

// Verified against SEH 5th Edition §2.2.1 ("Sequential Methods" / the Vee
// model discussion). Directly useful for framing what EMD-band SETR events
// (SSR/PDR/CDR) are really about: the shift from defining the system to
// building it.
export const INCOSE_VEE_MODEL_NOTE =
  "The SEH 5th Edition's Vee model discussion (§2.2.1) names the left side of the Vee \"system definition\" " +
  "(stakeholder requirements → system requirements → architecture → element definition, top-down) and states " +
  "plainly: \"the bottom and right side of the Vee are called system realization\" — the evolving baseline of " +
  "system elements that are implemented, integrated, verified, and validated. Architecture Definition and " +
  "Design Definition close out system definition; Implementation, Integration, and Verification carry system " +
  "realization forward. That's the same transition this app's Engineering & Manufacturing Development phase " +
  "represents.";

// Verified against SEH 5th Edition Figure 2.2 (§2.1.2, "Generic life cycle
// stages compared to other life cycle viewpoints") and Table 2.1 (§2.1.4,
// technical reviews by domain). Figure 2.2's "US Department of Defense
// (DoD)" comparison row names "Engineering and Manufacturing Development"
// explicitly as a DoD acquisition sub-phase, alongside Materiel Solution
// Analysis, Technology Development, Production and Deployment, and
// Operations and Support -- confirming this app's AAF phase names align
// with how INCOSE's own comparison figure names them, even though the
// Handbook itself doesn't elaborate on DoD-specific phase content further.
export const INCOSE_DOD_PHASE_CITATION =
  "SEH 5th Edition Figure 2.2 places \"Engineering and Manufacturing Development\" in its DoD life cycle " +
  "comparison row -- INCOSE names the phase, but only as one column in a cross-domain comparison, consistent " +
  "with the Handbook's deliberately acquisition-neutral posture (see INCOSE_TECHNICAL_PROCESSES_CITATION). " +
  "Table 2.1's \"Defense Projects\" column separately lists ASR/SRR/SFR/PDR/CDR/TRR/FCA/SVR/PRR/PCA as the " +
  "technical reviews this app already models, sourced there from ISO/IEC 24748-8 / IEEE 15288.2:2014.";

// Verified against SEH 5th Edition Figure 2.4 (§2.1.4). Independent
// corroboration of the same baseline-maturity progression this app's
// DBx/MBx guidance already cites from a different source (the OSD SEP
// Outline's Figure 2.1-1) -- two standards agreeing on the same sequence
// from different angles, not a new or conflicting claim.
export const INCOSE_BASELINE_MATURITY_CITATION =
  "SEH 5th Edition Figure 2.4 maps technical reviews to baseline maturity: ASR/SRR toward the Functional " +
  "Baseline, PDR establishing the Allocated Baseline, CDR establishing an initial Product Baseline, and " +
  "TRR/SVR/FCA/PRR/PCA carrying verification through to a final Product Baseline. This lines up with — and " +
  "independently corroborates — the OSD SEP Outline's own Figure 2.1-1 baseline-maturity sequence already " +
  "cited in this app's DBx/MBx guidance.";

export type IncoseProcessGroup =
  | "Agreement Processes"
  | "Organizational Project-Enabling Processes"
  | "Technical Management Processes"
  | "Technical Processes";

export const INCOSE_PROCESS_GROUPS: IncoseProcessGroup[] = [
  "Agreement Processes",
  "Organizational Project-Enabling Processes",
  "Technical Management Processes",
  "Technical Processes",
];

export interface IncoseSubProcess {
  name: string;
  appMapping: string;
}

export interface IncoseGroupMeta {
  description: string;
  subProcesses: IncoseSubProcess[];
}

export const INCOSE_GROUP_META: Record<IncoseProcessGroup, IncoseGroupMeta> = {
  "Agreement Processes": {
    description:
      "Acquisition and Supply — establishing agreements between acquirer and supplier organizations for products " +
      "or services.",
    subProcesses: [
      {
        name: "Acquisition / Supply",
        appMapping:
          "Not modeled — this sits at the contract/subcontract level, above the technical-artifact level this " +
          "app tracks. The COTS Records tab's vendor sourcing fields are the nearest adjacent content, but they " +
          "aren't a substitute for actual agreement/contract management.",
      },
    ],
  },
  "Organizational Project-Enabling Processes": {
    description:
      "Life Cycle Model Management, Infrastructure Management, Portfolio Management, Human Resource Management, " +
      "Quality Management, Knowledge Management — organizational capabilities that enable projects, not project-" +
      "specific technical work.",
    subProcesses: [
      {
        name: "(all six sub-processes)",
        appMapping:
          "Not modeled — organizational-level, not technical-artifact-level. Genuinely out of scope for a tool " +
          "like this one; don't force a mapping here.",
      },
    ],
  },
  "Technical Management Processes": {
    description:
      "Project Planning, Project Assessment and Control, Decision Management, Risk Management, Configuration " +
      "Management, Information Management, Measurement, Quality Assurance — managing the technical effort itself.",
    subProcesses: [
      {
        name: "Project Planning",
        appMapping: "Program Planning Deliverables tab (SEMP, SDP, STP, and the newly added Risk/Requirements/Data Management Plans).",
      },
      {
        name: "Decision Management / Risk Management",
        appMapping: "Recommendations tab (open/in-progress/done items) and A/B Compatibility risk notes — a partial feed, not a formal decision or risk register.",
      },
      {
        name: "Configuration Management",
        appMapping: "The EIA-649 CM functional-area mapping (Specifications tab TDP Alignment guidance): baselines as Configuration Identification, Delta Matrix ECP disposition as Change Management, status fields as Status Accounting, FCA/PCA as Verification and Audit.",
      },
      {
        name: "Information Management",
        appMapping: "The link-only Attachments mechanism across CIs, COTS Records, Specifications, Safety Deliverables, and Planning Deliverables — this app points at where information lives rather than storing it.",
      },
      {
        name: "Measurement / Quality Assurance",
        appMapping: "Not modeled as a dedicated entity — spec/CI status fields and the Delta Matrix are the closest proxies for tracking progress against a plan, not a formal TPM (Technical Performance Measure) or QA program.",
      },
    ],
  },
  "Technical Processes": {
    description:
      "Business or Mission Analysis, Stakeholder Needs and Requirements Definition, System Requirements " +
      "Definition, System Architecture Definition, Design Definition, System Analysis, Implementation, " +
      "Integration, Verification, Transition, Validation, Operation, Maintenance, Disposal (SEH 5th Ed. " +
      "§2.3.5.1–14) — the technical work of building the system.",
    subProcesses: [
      {
        name: "Stakeholder Needs / System Requirements Definition",
        appMapping: "Specifications tab (System-level Development specs) and the SETR guidance's SRR/SFR-era expectations.",
      },
      {
        name: "Architecture Definition",
        appMapping: "Subsystems and N² Diagram tabs — the functional/logical decomposition and documented interfaces, independently per baseline.",
      },
      {
        name: "Design Definition",
        appMapping: "CI Inventory tab and CI-level Specifications — the physical/detailed design layer.",
      },
      {
        name: "Implementation / Integration",
        appMapping: "No dedicated CDRL or entity — tracked indirectly via spec status and the Delta Matrix, same gap already noted in the IEEE 12207 alignment on the Program Planning tab.",
      },
      {
        name: "Verification / Validation",
        appMapping: "Each Specification's Verification Provisions section, COTS Records' verification method/rationale, and the Safety Deliverables tab's hazard-verification CDRLs.",
      },
      {
        name: "Transition",
        appMapping: "The Version Description Document (VDD) CDRL and a spec's Development → Production status transition.",
      },
      {
        name: "Operation / Maintenance / Disposal",
        appMapping: "Not modeled — this app is scoped to the acquisition/development side of the lifecycle (SRR through PRR), not sustainment.",
      },
    ],
  },
};

// Looks up a sub-process by name across all four groups -- used by
// aafPhaseGuidance.ts's emphasizedIncoseSubProcesses (which references
// sub-processes by name, not group) to resolve the full appMapping text.
export function findIncoseSubProcess(name: string): IncoseSubProcess | undefined {
  for (const group of INCOSE_PROCESS_GROUPS) {
    const match = INCOSE_GROUP_META[group].subProcesses.find((sp) => sp.name === name);
    if (match) return match;
  }
  return undefined;
}
