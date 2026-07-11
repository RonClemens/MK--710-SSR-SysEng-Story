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

export interface Database {
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  interfaces: InterfaceRecord[];
}

export type CollectionName = keyof Database;
