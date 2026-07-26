// A link-only reference to a file/document the record relates to — no file
// content is stored or uploaded, just a label and a URL (SharePoint, DOORS,
// a network share, wherever the real CM system already hosts it). This app
// is a staging tool, not a CM system of record, and storing real program
// files here — especially in the public static/Pages build — would be a CUI
// exposure this app is explicitly built to avoid.
export interface Attachment {
  label: string;
  url: string;
}

// PKM Migration Step 1 (additive): explicit Program/Project entities, per the
// Process Knowledge Model's Program -> Project -> Baseline hierarchy. This app
// currently has exactly one Program and one Project — see mock-data/seed.ts —
// but the entities exist as real, referenceable records rather than assumed
// implicitly, so later steps (Baseline as an entity, Step 2) have something
// to scope to.
export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

export type LogicalSubsystemSource =
  | "Validated"
  | "Proposed"
  | "Inherited from SSDD structure — unverified";

export interface LogicalSubsystem {
  id: string;
  name: string;
  description: string;
  source: LogicalSubsystemSource;
  // Which baseline's decomposition this subsystem belongs to. Baseline A and
  // Baseline B are independently-decomposed architectures, not one shared
  // structure with two states — a Baseline B subsystem is its own record,
  // even if its name/function mirrors a Baseline A subsystem.
  baseline: SpecBaseline;
  // PKM Migration Step 1 (additive): optional until backfilled everywhere, per
  // the migration plan's own transition recommendation.
  projectId: string | null;
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
  // (see LogicalSubsystem) — not modeled as a single foreign key. Should only
  // reference subsystems of this same CI's baseline.
  subsystemIds: string[];
  baseline: SpecBaseline;
  projectId: string | null;
  overDecompositionFlag: boolean;
  consolidationNotes: string;
  status: string;
  notes: string;
  attachments: Attachment[];
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
  attachments: Attachment[];
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
// description when a cell has no InterfaceRecord yet — they are hints, not a
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
  projectId: string | null;
  status: SpecStatus;
  linkedSubsystemId: string | null;
  linkedCiId: string | null;
  sections: SpecSections;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// System safety CDRLs (MIL-STD-882E / JSSSEH), one record per deliverable
// instance. hazardCategory is not stored — it's 1:1 with level (System
// Hazard/Functional Hazard/Physical Hazard ↔ System/Subsystem/CI), so it's
// derived via hazardCategoryForLevel() in ../data/safetyGuidance rather than
// duplicated here as a field that could drift out of sync.
export type SafetyApplicability = "Development" | "Production" | "Both";

export interface SafetyDeliverable {
  id: string;
  title: string;
  level: SpecLevel;
  cdrlType: string;
  applicability: SafetyApplicability;
  baseline: SpecBaseline;
  projectId: string | null;
  status: SpecStatus;
  // Set when level === "Subsystem"; null otherwise.
  linkedSubsystemId: string | null;
  // Set when level === "CI"; null otherwise.
  linkedCiId: string | null;
  hazardExample: string;
  cdrlDescription: string;
  deliveryMilestone: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// General (non-safety) program/software planning CDRLs — SEMP, SDP, STP, etc.
// Deliberately a separate entity from SafetyDeliverable rather than folded
// into its CDRL catalog: SafetyDeliverable is scoped to safety-specific
// artifacts (hazard analyses, safety plans), and this covers the broader
// program/software planning documents SETR events also gate on.
export interface ProgramPlanningDeliverable {
  id: string;
  title: string;
  level: SpecLevel;
  cdrlType: string;
  applicability: SafetyApplicability;
  baseline: SpecBaseline;
  projectId: string | null;
  status: SpecStatus;
  // Set when level === "Subsystem"; null otherwise.
  linkedSubsystemId: string | null;
  // Set when level === "CI"; null otherwise.
  linkedCiId: string | null;
  cdrlDescription: string;
  deliveryMilestone: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// A site-wide editable-prose entry. Keyed by a stable string `key` chosen at
// each call site (not a random id), so a save is always an upsert: "does an
// override for this key exist yet, or does the UI still fall back to the
// hardcoded defaultValue at that call site." `history` holds every value this
// entry has ever held before its current one, oldest first — full version
// history rather than only last-edit-wins.
export interface ContentEntryHistoryItem {
  value: string;
  updatedAt: string;
}

export interface ContentEntry {
  key: string;
  value: string;
  history: ContentEntryHistoryItem[];
  updatedAt: string;
}

export interface Database {
  programs: Program[];
  projects: Project[];
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  interfaces: InterfaceRecord[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  programPlanningDeliverables: ProgramPlanningDeliverable[];
  content: ContentEntry[];
}

export const LOGICAL_SUBSYSTEM_SOURCES: LogicalSubsystemSource[] = [
  "Validated",
  "Proposed",
  "Inherited from SSDD structure — unverified",
];
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

export const SPEC_LEVELS: SpecLevel[] = ["System", "Subsystem", "CI"];
export const SPEC_DOMAINS: SpecDomain[] = ["Hardware", "Software"];
export const SPEC_TYPES: SpecType[] = ["Development", "Production"];
export const SPEC_BASELINES: SpecBaseline[] = ["Baseline A", "Baseline B"];
export const SPEC_STATUSES: SpecStatus[] = ["Draft", "In Review", "Approved", "Under ECP"];

export const SAFETY_APPLICABILITIES: SafetyApplicability[] = ["Development", "Production", "Both"];
