// INCOSE Systems Engineering Handbook alignment. The INCOSE Handbook itself
// is a purchased publication — this app has not been checked against a
// verified copy of it, and doesn't quote it directly. What IS on stable,
// well-documented public ground is the process taxonomy the Handbook is
// explicitly built around: ISO/IEC/IEEE 15288's four SE process groups.
// That taxonomy is what this module maps this app's content against, and
// it's also the natural vocabulary for DI-SESS-81785B paragraph 3.3's
// required "annotated mapping between contractor and government SE
// processes" — most government SEPs and INCOSE-trained SE organizations
// already think in these four groups, so mapping to them is mapping to a
// shared language, not inventing a new one.
export const INCOSE_FRAMEWORK_INTRO =
  "ISO/IEC/IEEE 15288 — the technical standard the INCOSE Systems Engineering Handbook is built around — " +
  "organizes systems engineering into four process groups. This app was never designed against that taxonomy " +
  "explicitly, but nearly everything it already tracks falls cleanly into one of the four groups once named — " +
  "which is exactly the point of DI-SESS-81785B paragraph 3.3's required contractor/government process mapping: " +
  "showing the correspondence between how this program actually works and the standard vocabulary a government " +
  "SE process, or an INCOSE-trained reviewer, will expect. Two of the four groups are also this app's most honest " +
  "gaps — Agreement Processes and Organizational Project-Enabling Processes sit above the level of individual " +
  "technical artifacts this app models, and are called out below as gaps rather than stretched to fit.";

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
      "Business/Mission Analysis, Stakeholder Needs and Requirements Definition, System Requirements Definition, " +
      "Architecture Definition, Design Definition, System Analysis, Implementation, Integration, Verification, " +
      "Transition, Validation, Operation, Maintenance, Disposal — the technical work of building the system.",
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
