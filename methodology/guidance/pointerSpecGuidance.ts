import type { SpecLevel } from "../../client/src/types";

// "Pointer specifications" — the industry/military standards a spec's
// Applicable Documents section cites and the design/production is required
// to comply with (MIL-STDs, ASME/ANSI standards, handbooks like the JSSSEH)
// — are a different documentation problem than the spec's own "shall"
// statements. A pointer spec isn't restated into the citing document; it's
// referenced by designator/revision, scoped (tailored) to the paragraphs
// that actually apply, and then flowed down into verifiable requirements the
// same way any other applicable-document requirement is. Handling this badly
// shows up as one of two failure modes: standards cited but never actually
// flowed into a testable requirement ("compliance theater"), or the same
// tailoring judgment re-derived independently at every level, drifting out
// of sync with itself.
export const POINTER_SPEC_INTRO =
  "A pointer specification is a standard, handbook, or higher-level document a spec's Applicable Documents " +
  "section (SECTION 2) cites and requires compliance with — MIL-STDs, ASME/ANSI standards, JSSSEH-style handbooks " +
  "— rather than an original requirement this program is authoring itself. Citing one is not the same as " +
  "complying with it: a designator sitting in a document list with no tailoring, no flow-down into a verifiable " +
  "requirement, and no assigned verification method is compliance theater, not compliance. The recommended " +
  "approach below treats every pointer spec as something to tailor once and flow down, not something to " +
  "re-interpret independently at every level.";

export interface PointerSpecPrinciple {
  title: string;
  text: string;
}

export const POINTER_SPEC_PRINCIPLES: PointerSpecPrinciple[] = [
  {
    title: "Cite by reference, don't restate",
    text:
      "List the designator, revision/date, and the specific applicable paragraphs in Section 2 (Applicable " +
      "Documents) — never copy the standard's text into the spec body. Restated text drifts out of sync the " +
      "moment the standard is revised; a citation doesn't.",
  },
  {
    title: "Tailor explicitly, once, at the highest applicable level",
    text:
      "Most MIL-STDs are written to be tailored, not applied wholesale. Produce one tailoring/compliance matrix " +
      "per pointer spec (paragraph-by-paragraph: Applicable / Not Applicable / Tailored, with rationale) at the " +
      "System or Subsystem level where the standard first becomes relevant, and have lower-level specs reference " +
      "that tailoring decision rather than re-deriving their own.",
  },
  {
    title: "Flow down into a verifiable \"shall,\" every time",
    text:
      "A pointer-spec citation with no corresponding requirement in Sections 3.x and no verification method in " +
      "Section 4 is not enforceable. If a tailored paragraph applies, it needs to land as an actual requirement " +
      "statement traceable back to the standard, with a verification method (inspection/analysis/demonstration/" +
      "test) — same discipline as any other requirement this program originates itself.",
  },
  {
    title: "Track revision level as a configuration-managed fact",
    text:
      "Record which revision of the standard applies (e.g. MIL-STD-882E, not just \"MIL-STD-882\") in Section 2, " +
      "and treat a revision change the same as any other applicable-document change under configuration " +
      "management — it can silently change what \"compliant\" means.",
  },
  {
    title: "Don't over-cite at every level",
    text:
      "Not every pointer spec belongs in every spec's Applicable Documents list — cite a standard at the level " +
      "where it actually drives that level's requirements (see the per-standard level guidance below), and let " +
      "lower-level specs reference the higher-level spec's applicable-documents list rather than duplicating the " +
      "full citation set downward by default.",
  },
];

export type PointerSpecDomain =
  | "System Safety"
  | "Human Factors"
  | "Environmental / Ruggedization"
  | "Engineering Drawings";

export interface PointerSpecEntry {
  id: string;
  designator: string;
  title: string;
  domain: PointerSpecDomain;
  levels: SpecLevel[];
  whyItMatters: string;
  recommendedApproach: string;
}

// A representative, non-exhaustive set of pointer specs this kind of test-set
// program commonly cites. Not every program cites all of these, and most
// programs cite others not listed here (EMI/EMC standards, TEMPEST, cybersecurity
// RMF controls, etc.) — treat this as a starting catalog to extend, not a
// complete applicable-documents list for any real program.
export const POINTER_SPEC_CATALOG: PointerSpecEntry[] = [
  {
    id: "milStd882",
    designator: "MIL-STD-882E",
    title: "Department of Defense Standard Practice: System Safety",
    domain: "System Safety",
    levels: ["System", "Subsystem", "CI"],
    whyItMatters:
      "Establishes the hazard analysis, risk assessment, and risk-acceptance framework this app's own Safety " +
      "Deliverables tab and hazard-category mapping (System/Functional/Physical Hazard) are already built against " +
      "— it's the parent standard behind the CDRLs the Safety Deliverables tab tracks, not a separate compliance " +
      "obligation layered on top.",
    recommendedApproach:
      "Cite once at System level with the program's risk-acceptance authority and risk matrix tailoring; " +
      "Subsystem and CI specs reference that System-level tailoring rather than re-deriving risk categories. Flow " +
      "down as the Safety Requirements (Section 3.5) content already called out in this app's Safety Deliverables " +
      "guidance — the hazard analysis types (FHA/PHA/SSHA/SHA/O&SHA) are how 882E's process actually gets applied " +
      "at each level.",
  },
  {
    id: "jsssehSw",
    designator: "JSSSEH",
    title: "Joint Software Systems Safety Engineering Handbook",
    domain: "System Safety",
    levels: ["Subsystem", "CI"],
    whyItMatters:
      "Extends MIL-STD-882E's process into software-specific hazard causal analysis (software contribution to " +
      "system hazards, software criticality/level of rigor) — 882E alone doesn't tell a CSCI-level spec how to " +
      "analyze software-induced hazards.",
    recommendedApproach:
      "Cite alongside MIL-STD-882E wherever a spec's domain is Software (see the Domain filter on this tab) and " +
      "the level is Subsystem or CI — a System-level spec is usually too abstract for JSSSEH's software-specific " +
      "guidance to apply directly. Flow down as software criticality/level-of-rigor requirements in Section 3.5, " +
      "verified through the software safety analysis artifacts the Safety Deliverables tab already tracks.",
  },
  {
    id: "milStd1472",
    designator: "MIL-STD-1472",
    title: "Department of Defense Design Criteria Standard: Human Engineering",
    domain: "Human Factors",
    levels: ["System", "CI"],
    whyItMatters:
      "Governs human-system interface design (controls, displays, workspace, workload, safety-critical operator " +
      "interaction) — directly relevant wherever an operator interacts with this test set (e.g. the Test Set's " +
      "MHC/MCC operator console), essentially irrelevant to a CI with no human interface at all.",
    recommendedApproach:
      "Cite at System level for overall human-factors policy, and at the specific CI level(s) that present an " +
      "operator interface — don't cite it reflexively on every CI. Flow down into Section 3.7 (Human Factors / " +
      "Personnel & Training) requirements; a CI spec with \"Typically N/A\" flagged for that section (see the " +
      "Level guidance above) usually shouldn't be citing MIL-STD-1472 either.",
  },
  {
    id: "milStd28800",
    designator: "MIL-STD-28800",
    title: "Design, Construction, and General Requirements for Basic and Fabricated Electronic and Electrical Equipment",
    domain: "Environmental / Ruggedization",
    levels: ["CI"],
    whyItMatters:
      "Sets the equipment ruggedization class (e.g. Class 5/6/7/8, environmental severity level) that drives " +
      "environmental design and qualification requirements for hardware CIs — it's a design-and-construction " +
      "standard, not a system-level performance requirement, so it belongs at the level where physical design " +
      "decisions actually get made.",
    recommendedApproach:
      "Cite at CI level for Hardware-domain specs, with the specific equipment class selected and stated " +
      "explicitly (don't leave the class implicit). Flow down into Section 3.3 (Environmental Requirements) and " +
      "Section 3.4 (Design and Construction Constraints) as the specific temperature/vibration/EMI/enclosure " +
      "requirements that class implies, verified via the qualification test methods the standard specifies.",
  },
  {
    id: "asmeY14100",
    designator: "ASME Y14.100",
    title: "Engineering Drawing Practices",
    domain: "Engineering Drawings",
    levels: ["CI"],
    whyItMatters:
      "Governs the format and practice of the engineering drawings that become the authoritative as-built " +
      "definition of a hardware CI once a spec transitions from Development to Production — relevant exactly " +
      "where this app's Development/Production spec-type distinction (see the guidance above) matters most.",
    recommendedApproach:
      "Cite at CI level for Hardware-domain specs, and treat it as a Production-spec-era concern in practice — " +
      "a Development-type spec is unlikely to have final drawings yet. Flow down as a requirement that the CI's " +
      "engineering drawing package (referenced, not restated, in Section 5/Notes or as an Attachment) conforms to " +
      "Y14.100 practice, verified by drawing review/inspection rather than test.",
  },
];
