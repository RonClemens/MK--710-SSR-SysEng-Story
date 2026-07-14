import type { SpecDomain, SpecLevel, SpecSectionKey, SpecSections, SpecType } from "../types";
import { SPEC_SECTION_KEYS } from "../types";

export type SectionRelevance = "Required" | "Recommended" | "Typically N/A";

export function emptySections(): SpecSections {
  return Object.fromEntries(SPEC_SECTION_KEYS.map((key) => [key, ""])) as SpecSections;
}

// "CI" reads ambiguously on its own (and is a real word in French/Italian,
// which machine-translation tools happily mangle) — spell out the
// domain-specific DoD term instead: HWCI (Hardware Configuration Item) or
// CSCI (Computer Software Configuration Item). Falls back to "HWCI / CSCI"
// when the domain isn't known yet (e.g. a domain-agnostic guidance card).
export function levelLabel(level: SpecLevel, domain?: SpecDomain): string {
  if (level !== "CI") return level;
  if (domain === "Software") return "CSCI";
  if (domain === "Hardware") return "HWCI";
  return "HWCI / CSCI";
}

export const SECTION_META: Record<SpecSectionKey, { label: string; description: string }> = {
  scope: { label: "1. Scope", description: "Identification and purpose of the item; what this spec governs." },
  applicableDocuments: {
    label: "2. Applicable Documents",
    description: "Higher-level specs, ICDs, and standards this spec is subordinate to or references.",
  },
  functionalPerformance: {
    label: "3.1 Functional / Performance Requirements",
    description: "What the item must do, and how well — the core \"shall\" statements.",
  },
  interfaces: {
    label: "3.2 Interface Requirements",
    description: "External and internal interfaces — reference an ICD rather than restating it where one exists.",
  },
  environmental: {
    label: "3.3 Environmental Requirements",
    description: "Temperature, vibration, EMI, and other environmental design/qualification conditions.",
  },
  designConstraints: {
    label: "3.4 Design and Construction Constraints",
    description: "Physical form/fit constraints, materials, parts — design-solution language belongs here, not above.",
  },
  safety: { label: "3.5 Safety Requirements", description: "Hazard-driven requirements and safe-state behavior." },
  security: { label: "3.6 Security Requirements", description: "Information/physical/cyber security requirements, as applicable." },
  humanFactors: {
    label: "3.7 Human Factors / Personnel & Training",
    description: "Operator workload, usability, and training-driven requirements, as applicable.",
  },
  logistics: {
    label: "3.8 Logistics / Support Requirements",
    description: "Maintainability, obsolescence, sparing, and support-equipment requirements.",
  },
  verificationProvisions: {
    label: "4. Verification Provisions",
    description: "Verification method per requirement (inspection, analysis, demonstration, or test).",
  },
  notes: { label: "5. Notes", description: "Glossary, acronyms, and any other supporting information." },
};

export const LEVEL_GUIDANCE: Record<SpecLevel, { summary: string; pros: string[]; cons: string[] }> = {
  System: {
    summary:
      "Defines what the overall system must do and how it interacts with its operational environment and external systems — independent of how it's physically decomposed.",
    pros: [
      "Single authoritative source for mission/operational performance, supporting acquisition strategy and traceability to the CDD/ORD/ConOps.",
      "Establishes external interfaces and system-wide constraints (safety, security, RAM) before internal decomposition is finalized, avoiding premature design lock-in.",
      "Natural basis for contract-level and integrated DT&E/OT&E verification.",
    ],
    cons: [
      "Too abstract to be independently verifiable/testable at the hardware or software level — must be flowed down before it's actionable.",
      "Risk of scope creep into design-prescriptive language, which constrains subsystem/CI trade space unnecessarily.",
      "On this program specifically: with no validated logical subsystem layer until recently, system-to-CI traceability skipped a level, making system-spec requirements hard to verify without an intermediate allocation.",
    ],
  },
  Subsystem: {
    summary:
      "Allocates system-level requirements to a functional/logical subsystem (see the Subsystems tab), independent of which physical CI(s) implement it.",
    pros: [
      "Fills the missing functional decomposition layer this program's CI allocation skipped — gives requirements a stable home that doesn't move every time physical CI boundaries are reorganized or consolidated.",
      "Natural unit for integration planning and interface definition — subsystem specs are what the N² Diagram's subsystem-level interfaces should ultimately trace to.",
      "Supports make/buy and CI-boundary decisions independent of vendor or part choices.",
    ],
    cons: [
      "Only as good as the underlying subsystem validation — a subsystem sourced \"Inherited from SSDD structure — unverified\" produces a spec built on an unconfirmed boundary.",
      "A subsystem is often satisfied by multiple CIs jointly (many-to-many), so verification ownership isn't always a clean 1:1 — a subsystem-level requirement may need a qualification strategy spanning several CI specs (use the N² drill-down to see how many).",
      "Another document layer to keep synchronized if the logical architecture is still being validated concurrently with detailed design, as on this program.",
    ],
  },
  CI: {
    summary:
      "The buildable, procurable, and independently verifiable unit — a Prime/Critical Item Development Specification (hardware) or Software Requirements Specification for one Configuration Item.",
    pros: [
      "Directly supports procurement (COTS sourcing, ICDs), configuration management (CIs are the unit under formal CM control), and TRR-level verification with a specific method per requirement.",
      "Most concrete and testable level — where \"shall\" statements become pass/fail test procedures.",
      "Necessary for sustainment: parts, obsolescence, and interface control all live here.",
    ],
    cons: [
      "Highest documentation volume and maintenance burden — one per CI, and this program's own over-decomposition issue (see CI Inventory) means some \"CIs\" don't need an independent spec at all.",
      "Hardest level to keep synchronized with as-built reality — this is exactly the Delta/Traceability Matrix problem already tracked elsewhere in this tool.",
      "Writing a full CI spec for something that should really be a COTS item record (capability-based requirement + vendor data sheet) is wasted effort — check the CI's type and over-decomposition flag before defaulting to a full spec.",
    ],
  },
};

export const SPEC_TYPE_GUIDANCE: Record<SpecType, { summary: string; whenUsed: string }> = {
  Development: {
    summary:
      "Written as verifiable \"shall\" requirements the item is designed against — used from concept through CDR/TRR, before the design is fixed.",
    whenUsed:
      "Baseline B is entirely in this phase today. Baseline A's CI-level specs should also still be Development type until TRR closes them out.",
  },
  Production: {
    summary:
      "References the validated, as-built design (drawings, part numbers, software version description) rather than restating abstract requirements — becomes the basis for replication and sustainment acceptance.",
    whenUsed:
      "Only appropriate once a design has passed CDR/FCA/PCA and is stable. As Baseline A approaches System TRR, its specs should transition Development → Production one CI/subsystem at a time — don't flip a spec to Production before its qualification evidence exists.",
  },
};

// Which sections genuinely matter at each level. This is guidance, not a hard
// requirement enforced by the app — the point is to help a user decide what
// to actually write, not to gate saving.
export const SECTION_RELEVANCE: Record<SpecLevel, Record<SpecSectionKey, SectionRelevance>> = {
  System: {
    scope: "Required",
    applicableDocuments: "Required",
    functionalPerformance: "Required",
    interfaces: "Required",
    environmental: "Recommended",
    designConstraints: "Typically N/A",
    safety: "Required",
    security: "Recommended",
    humanFactors: "Recommended",
    logistics: "Typically N/A",
    verificationProvisions: "Recommended",
    notes: "Recommended",
  },
  Subsystem: {
    scope: "Required",
    applicableDocuments: "Required",
    functionalPerformance: "Required",
    interfaces: "Required",
    environmental: "Recommended",
    designConstraints: "Recommended",
    safety: "Recommended",
    security: "Recommended",
    humanFactors: "Typically N/A",
    logistics: "Typically N/A",
    verificationProvisions: "Recommended",
    notes: "Recommended",
  },
  CI: {
    scope: "Required",
    applicableDocuments: "Required",
    functionalPerformance: "Required",
    interfaces: "Required",
    environmental: "Required",
    designConstraints: "Required",
    safety: "Recommended",
    security: "Recommended",
    humanFactors: "Typically N/A",
    logistics: "Required",
    verificationProvisions: "Required",
    notes: "Recommended",
  },
};

export const ORDERED_SECTION_KEYS: SpecSectionKey[] = [...SPEC_SECTION_KEYS];
