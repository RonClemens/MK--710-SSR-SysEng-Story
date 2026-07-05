export type CiType = "developmental" | "COTS";
export type CiTier = "Tier 1" | "Tier 2" | "Tier 3";

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CiType;
  tier: CiTier;
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

export interface Database {
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
}

export const CI_TYPES: CiType[] = ["developmental", "COTS"];
export const CI_TIERS: CiTier[] = ["Tier 1", "Tier 2", "Tier 3"];
export const DELTA_SOURCES: DeltaSource[] = [
  "Design reality vs. model",
  "Model unvalidated vs. design",
  "None",
];
export const DISPOSITIONS: Disposition[] = ["Accept as-is", "ECP required", "TBD pending analysis"];
export const COMPATIBILITY_STATUSES: CompatibilityStatus[] = [
  "Aligned",
  "Diverging",
  "Divergence accepted with mitigation",
];
export const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = [
  "CI structure",
  "COTS",
  "delta matrix",
  "A-B alignment",
  "culture-tooling",
  "other",
];
export const RECOMMENDATION_STATUSES: RecommendationStatus[] = ["open", "in progress", "done"];
