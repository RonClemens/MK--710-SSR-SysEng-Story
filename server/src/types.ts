export type LogicalSubsystemSource =
  | "Validated"
  | "Proposed"
  | "Inherited from SSDD structure — unverified";

export interface LogicalSubsystem {
  id: string;
  name: string;
  description: string;
  source: LogicalSubsystemSource;
  createdAt: string;
  updatedAt: string;
}

export type CiType = "developmental" | "COTS";
export type CiTier = "Tier 1" | "Tier 2" | "Tier 3";

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CiType;
  tier: CiTier;
  // Many-to-many: a CI can legitimately serve more than one logical subsystem
  // (see LogicalSubsystem) — not modeled as a single foreign key.
  subsystemIds: string[];
  overDecompositionFlag: boolean;
  consolidationNotes: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type DeltaSource = "Design reality vs. model" | "Model unvalidated vs. design" | "None";
export type Disposition = "Accept as-is" | "ECP required" | "TBD pending analysis";

export interface DeltaMatrixRow {
  id: string;
  ciId: string;
  sfrAllocation: string;
  actualDecomposition: string;
  delta: string;
  deltaSource: DeltaSource;
  rationale: string;
  disposition: Disposition;
  createdAt: string;
  updatedAt: string;
}

export type CompatibilityStatus = "Aligned" | "Diverging" | "Divergence accepted with mitigation";

export interface AbCompatibilityRow {
  id: string;
  ciId: string;
  baselineAState: string;
  baselineBIntent: string;
  compatibilityStatus: CompatibilityStatus;
  riskNote: string;
  lastReviewedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualifiedAlternate {
  makeModelPartNumber: string;
  lifecycleStatus: string;
}

export interface CotsRecord {
  id: string;
  ciId: string;
  functionalRequirement: string;
  interfaceRequirement: string;
  formFitConstraints: string;
  verificationMethod: string;
  rationale: string;
  partsListEntry: string;
  qualifiedAlternates: QualifiedAlternate[];
  obsolescenceMonitoringNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationCategory =
  | "CI structure"
  | "COTS"
  | "delta matrix"
  | "A-B alignment"
  | "culture-tooling"
  | "other";
export type RecommendationStatus = "open" | "in progress" | "done";

export interface Recommendation {
  id: string;
  text: string;
  category: RecommendationCategory;
  status: RecommendationStatus;
  owner: string;
  relatedCiId: string | null;
  createdAt: string;
  updatedAt: string;
}

// A documented interface between two elements of the same type, for N² diagrams.
// "Derived" links (two subsystems sharing a CI, or two CIs sharing a subsystem)
// are computed live from existing data and only used to pre-fill a suggested
// description when a cell has no Interface record yet — they are hints, not a
// substitute for an actual documented interface.
export type InterfaceScope = "subsystem" | "ci";

export interface InterfaceRecord {
  id: string;
  scope: InterfaceScope;
  aId: string;
  bId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// DID-style requirement specification templates (see MIL-STD-961E System/
// Subsystem/CI specification conventions and DI-IPSC-8143x SRS/SSS DIDs,
// adapted). Level determines which physical/logical element (if any) the
// spec is scoped to; specType distinguishes a still-evolving Development
// specification from a design-validated Production specification, per
// baseline, since Baseline A and Baseline B mature through these states on
// different timelines while influencing each other (see A/B Compatibility).
export type SpecLevel = "System" | "Subsystem" | "CI";
export type SpecDomain = "Hardware" | "Software";
export type SpecType = "Development" | "Production";
export type SpecBaseline = "Baseline A" | "Baseline B";
export type SpecStatus = "Draft" | "In Review" | "Approved" | "Under ECP";

export const SPEC_SECTION_KEYS = [
  "scope",
  "applicableDocuments",
  "functionalPerformance",
  "interfaces",
  "environmental",
  "designConstraints",
  "safety",
  "security",
  "humanFactors",
  "logistics",
  "verificationProvisions",
  "notes",
] as const;
export type SpecSectionKey = (typeof SPEC_SECTION_KEYS)[number];

export type SpecSections = Record<SpecSectionKey, string>;

export interface Specification {
  id: string;
  title: string;
  level: SpecLevel;
  domain: SpecDomain;
  specType: SpecType;
  baseline: SpecBaseline;
  status: SpecStatus;
  // Set when level === "Subsystem"; null otherwise.
  linkedSubsystemId: string | null;
  // Set when level === "CI"; null otherwise.
  linkedCiId: string | null;
  sections: SpecSections;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  interfaces: InterfaceRecord[];
  specifications: Specification[];
}

export type CollectionName = keyof Database;
