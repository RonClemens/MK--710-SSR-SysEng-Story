// Document-Based (DBx) vs Model-Based (MBx) Systems Engineering — how a
// given SE activity is actually executed, independent of which review gate
// or CDRL governs it. DBx treats specifications, ICDs, hazard analyses, and
// plans as the authoritative artifacts, cross-referenced by hand. MBx (per
// the DoD 2018 Digital Engineering Strategy) treats a single connected model
// as the Authoritative Source of Truth (ASoT), with documents — where they
// still exist at all — generated as views into it rather than authored
// independently.
//
// This app is itself a DBx tool, deliberately: it's a relational
// document/database staging tool (CRUD records, cross-references by id), not
// a SysML/MBSE environment. That's an honest thing to say on every tab this
// guidance appears on, not a gap to paper over — see each dimension's
// `thisAppNote` below.
export const DBX_MBX_INTRO =
  "Every SE activity this app models — decomposition, interface management, specification writing, safety " +
  "analysis, and program planning — can be executed as Document-Based Systems Engineering (DBx: text " +
  "specifications, ICDs, and plans as the authoritative artifacts, cross-referenced by hand) or Model-Based " +
  "Systems Engineering (MBx: a single connected model — typically SysML — as the Authoritative Source of Truth, " +
  "per the DoD's 2018 Digital Engineering Strategy, with documents generated as views into it rather than " +
  "authored independently). Neither approach is inherently more rigorous; the difference is where consistency is " +
  "enforced. DBx relies on the people maintaining cross-references correctly — the same discipline this app's " +
  "Delta Matrix exists to check after the fact. MBx enforces it automatically inside the model, at the cost of " +
  "requiring the tooling, trained staff, and Digital Engineering ecosystem maturity to build and sustain that " +
  "model in the first place.";

export interface DbxMbxDimension {
  id: string;
  name: string;
  dbxDescription: string;
  mbxDescription: string;
  tradeoff: string;
  thisAppNote: string;
}

export const DBX_MBX_DIMENSIONS: DbxMbxDimension[] = [
  {
    id: "decomposition",
    name: "Systems Engineering & Decomposition",
    dbxDescription:
      "Logical subsystems and CIs are defined in text, and the allocation between them (which CI serves which " +
      "subsystem) is a manually maintained cross-reference — correct only as long as whoever updates one side " +
      "remembers to check the other.",
    mbxDescription:
      "Subsystems and CIs exist as blocks in a SysML Block Definition Diagram; allocation is a first-class model " +
      "relationship the model itself can validate and query (e.g. \"list every CI with no subsystem allocation\") " +
      "rather than a fact someone has to remember to keep in sync.",
    tradeoff:
      "MBx catches an orphaned or over-decomposed CI automatically, the moment it's entered; DBx catches it only " +
      "when someone runs a reconciliation pass — which is exactly the multi-year gap that produced this program's " +
      "own PDR-reconciliation problem.",
    thisAppNote:
      "This app's Subsystems and CI Inventory tabs are DBx: `subsystemIds` is a manually maintained cross-" +
      "reference, and the over-decomposition flag is a human judgment call recorded in a field, not a model-" +
      "derived fact.",
  },
  {
    id: "interfaceManagement",
    name: "Interface Management",
    dbxDescription:
      "Interfaces are documented in ICDs and N²-style matrices as static records — accurate as of whenever they " +
      "were last written, not automatically kept current as the design changes.",
    mbxDescription:
      "Interfaces are ports and connectors on a SysML Internal Block Diagram; an N² view is a live query over the " +
      "model rather than a separately maintained artifact, and an interface with mismatched types or units on " +
      "either end can be flagged automatically.",
    tradeoff:
      "DBx's N² diagram still requires someone to notice a missing or stale cell; MBx makes an undocumented " +
      "interface structurally impossible to miss, since the connector either exists in the model or it doesn't — " +
      "but only for interfaces the model actually represents, which for hardware-level physical interfaces still " +
      "usually requires the same manual diligence DBx does.",
    thisAppNote:
      "This app's N² Diagram tab is DBx with an MBx-*inspired* assist, not a model: the \"derived hint\" (○) " +
      "cells are computed live from shared-CI/shared-subsystem relationships, but the interfaces themselves are " +
      "still manually authored `InterfaceRecord` text, not model connectors the tool can validate.",
  },
  {
    id: "specificationWriting",
    name: "Specification Writing",
    dbxDescription:
      "Requirements are authored as \"shall\" statements in a DID-structured text document per level (System/" +
      "Subsystem/CI) — the approach this app's Specifications tab models directly, following MIL-STD-961E/" +
      "DI-IPSC-8143x conventions.",
    mbxDescription:
      "Requirements are model elements traced by explicit relationships to the architecture and behavior elements " +
      "that satisfy and verify them (e.g. DOORS-to-SysML traceability, or requirements authored natively in the " +
      "model); a \"shall\" statement's satisfaction and verification status can be queried directly rather than " +
      "hunted down across separate documents.",
    tradeoff:
      "MBx's traced requirements can't silently drift from the architecture the way a text spec can — but only if " +
      "the traceability links are actually maintained as the model evolves; an unmaintained trace link in an MBx " +
      "environment fails exactly as silently as an unmaintained cross-reference does in DBx.",
    thisAppNote:
      "This app is DBx by construction: each Specification's twelve DID sections are free text, and `linkedCiId`/" +
      "`linkedSubsystemId` are the entire traceability mechanism — a single foreign key per spec, not a graph of " +
      "typed model relationships.",
  },
  {
    id: "systemSafetyAnalysis",
    name: "System Safety Analysis",
    dbxDescription:
      "Hazard analyses (FHA/PHA/SSHA/SHA/O&SHA) are authored as standalone reports or spreadsheets per MIL-STD-" +
      "882E/JSSSEH, with hazard-to-requirement traceability maintained as written cross-references in the Hazard " +
      "Tracking Log.",
    mbxDescription:
      "Hazard causal factors are traced as explicit relationships to the functions and components that produce " +
      "them directly in the model (e.g. STPA integrated with a SysML control-structure model), so a hazard's " +
      "status can be queried against the current architecture rather than the architecture as it existed when the " +
      "analysis was last written.",
    tradeoff:
      "Neither MIL-STD-882E nor the JSSSEH mandates a specific execution method — both DBx and MBx hazard " +
      "analyses can satisfy the same CDRLs. MBx's advantage shows up specifically when the architecture changes " +
      "after the hazard analysis was performed: a model-traced hazard is flagged as potentially stale " +
      "automatically, where a document-based one just goes quietly out of date.",
    thisAppNote:
      "This app's Safety Deliverables tab is DBx: each hazard analysis is a CDRL-style record (`hazardExample`, " +
      "`cdrlDescription`) linked to a Subsystem/CI by a single id, the same traceability mechanism as " +
      "Specifications — not a modeled causal-factor graph.",
  },
  {
    id: "programPlanningExecution",
    name: "Program Planning & Execution",
    dbxDescription:
      "The program executes against a set of static planning documents (SEMP, SDP, CMP, STP) as CDRL " +
      "deliverables — the traditional DoD acquisition paradigm this app's Program Planning tab models.",
    mbxDescription:
      "The program executes against an Authoritative Source of Truth model and an Integrated Data Environment; " +
      "planning documents, where still contractually required, are generated views into that environment rather " +
      "than independently authored deliverables — the digital-engineering-transformed version of the same CDRLs.",
    tradeoff:
      "A full MBx transformation is a program-level investment decision (tooling, staff, and process maturity), " +
      "not a tab-level one — most programs run a deliberate DBx/MBx hybrid, digitally engineering the highest-" +
      "payoff artifacts (usually architecture and interfaces) while keeping lower-payoff planning documents in " +
      "DBx form.",
    thisAppNote:
      "This app itself — and its SEMP Migration export — are DBx tooling: a relational CRUD staging tool " +
      "producing a Markdown document, not a connected model. If this program pursues a Digital Engineering " +
      "transformation, this app's role would shift toward being one more document-generating view of an ASoT " +
      "model, not the ASoT itself.",
  },
];
