// Field marker convention: `@domain-placeholder` above a field means its
// *value* in this app's mock-data is illustrative/fictional content a real
// CUI deployment's PDKM must replace — as opposed to structural fields (ids,
// foreign-key references, fixed enums, timestamps) that stay as-is
// regardless of which program the app serves. See
// data-schema/DOMAIN_PLACEHOLDER_FIELDS.md for the full per-entity manifest.
// Deliberately schema-level, not applied to the mock-data strings themselves
// — see that manifest's own note for why.

// A link-only reference to a file/document the record relates to — no file
// content is stored or uploaded, just a label and a URL (SharePoint, DOORS,
// a network share, wherever the real CM system already hosts it). This app
// is a staging tool, not a CM system of record, and storing real program
// files here — especially in the public static/Pages build — would be a CUI
// exposure this app is explicitly built to avoid.
export interface Attachment {
  // @domain-placeholder
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
  // @domain-placeholder
  name: string;
  // @domain-placeholder
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  // @domain-placeholder
  name: string;
  // @domain-placeholder
  description: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
}

// PKM Migration Step 2 (coordinated with the recoveryProgramGuidance.ts content
// split — see that file): promotes "Baseline A"/"Baseline B" from a plain
// enum tag to a real, referenceable entity. `baseline: SpecBaseline` is kept
// on every tagged entity during the transition (migration plan's own
// recommendation) — `baselineId` is additive, not a replacement, until every
// read/write path is confirmed migrated.
//
// Simplification, stated explicitly rather than left implicit: per PKM's own
// definition, a technical Baseline (Functional/Allocated/Product) is "a
// configuration state at a point in time," meaning a fully literal reading
// would give this app three separate Baseline records per lineage (one per
// technical-baseline-type snapshot). This app instead has one Baseline
// record per lineage ("Baseline A", "Baseline B"), with `baselineType`
// reflecting that lineage's current overall maturity -- matching how this
// app has used "Baseline A"/"Baseline B" everywhere else since it was built.
// Re-splitting each lineage into per-snapshot records is a bigger, separate
// change than Step 2 was ever scoped to make.
export type BaselineType = "Functional" | "Allocated" | "Product" | "Acquisition-Program";

export interface Baseline {
  id: string;
  name: SpecBaseline;
  baselineType: BaselineType;
  projectId: string;
  // References a Milestone below — the last Complete gate that currently
  // defines this baseline's state (see Milestone's own comment for why
  // "last Complete," not "current," gate). Nullable pending backfill.
  establishedAtMilestoneId: string | null;
  // Per PKM Entity Model §5 open question #1. Set on the newer/reconciling
  // baseline; the corresponding sibling should set reconciledIntoBaselineId
  // to point back, though nothing enforces that symmetry structurally yet.
  reconciledFromBaselineId: string | null;
  reconciledIntoBaselineId: string | null;
  createdAt: string;
  updatedAt: string;
}

// PKM Migration Step 9 (per PKM Migration Plan v0.3.0 §8) broadened this
// entity to also cover AAF acquisition-decision gates, consolidating this
// app's own prior "Step 8" (a standalone AcquisitionMilestone entity, since
// fully retired -- see this app's PKM Migration Status Report v1.5.0 §7 for
// the removal) per the canonical model's own correction: one Milestone
// entity with a `milestoneType` discriminator, not two parallel entities.
// `SetrMilestoneEvent` mirrors ../../../methodology/guidance/setrGuidance.ts's
// `SetrEvent` values exactly (same independently-maintained-mirror pattern
// this file already has with server/src/types.ts); `AcquisitionGateEvent`
// mirrors aafPhaseGuidance.ts's `AcquisitionMilestoneId` the same way.
export type SetrMilestoneEvent = "SRR" | "SFR" | "SSR" | "PDR" | "CDR" | "TRR" | "SVR" | "PRR";

// Deliberately scoped to SETR events only, unchanged by Step 9 --
// deriveCurrentMilestone()'s "first non-Complete gate in canonical order"
// logic (client/src/utils/acquisitionPhase.ts) depends on this array
// containing exactly the SRR-PRR sequence and nothing else; it filters to
// `milestoneType: "SETR"` records before consulting this ordering.
export const MILESTONE_EVENTS: SetrMilestoneEvent[] = ["SRR", "SFR", "SSR", "PDR", "CDR", "TRR", "SVR", "PRR"];

export type AcquisitionGateEvent = "MS-A" | "MS-B" | "MS-C";

export type MilestoneEvent = SetrMilestoneEvent | AcquisitionGateEvent;

export type MilestoneType = "SETR" | "AcquisitionGate";

export type MilestoneStatus = "Not Started" | "In Progress" | "Complete";

// PKM Migration Step 3 (additive): promotes SETR gate occurrences from the
// `deliveryMilestone` free-text fields below to real, referenceable records.
//
// Explicit methodology/data split, per the migration plan's own instruction
// for this step: `SETR_GUIDANCE` in the methodology layer stays the
// permanent, generic definition of what SRR/SFR/PDR/etc. *mean* — nothing
// about that moves here. This entity holds only this Project's actual
// per-baseline instance data (status, dates) for each gate.
//
// Baseline A and Baseline B are independent timelines (see Baseline above),
// so the same event (e.g. SRR) occurs as two distinct Milestone records, one
// per baseline lineage, not one shared record. PKM's own model states a
// Milestone "establishes one or more Baselines," which would allow a single
// shared record; this app simplifies to exactly one baseline per Milestone
// record, consistent with how Baseline's own per-lineage simplification
// above already treats Baseline A and B as fully independent timelines.
//
// PKM Migration Step 9 (additive): adds `milestoneType` and `pathway` so
// this one entity also covers AAF acquisition-decision gates (Milestone
// A/B/C), per PKM Migration Plan v0.3.0 §8. `milestoneType: "SETR"` is
// backfilled on every pre-existing record (the only value that ever existed
// for this entity); `"AcquisitionGate"` records were a 1:1 migration of the
// former standalone AcquisitionMilestone entity's rows, which coexisted
// briefly then was fully retired once the UI cutover was verified (see
// this app's PKM Migration Status Report v1.5.0 §7). `pathway` is
// populated only for AcquisitionGate records (e.g. `"MCA"`); null for SETR
// records, which have no pathway concept.
//
// `establishesBaselineId` semantics differ by type per PKM v0.3.1 §3 (a
// SETR milestone may establish the Baseline it belongs to; an
// AcquisitionGate milestone gates progress within one already established
// and never does) — but this app already models that relationship in the
// *reverse* direction on Baseline itself (`Baseline.establishedAtMilestoneId`,
// added Step 2) rather than a forward field here, so no new field is added
// for it. That reverse reference is only ever populated with a
// `milestoneType: "SETR"` record's id in practice.
export interface Milestone {
  id: string;
  milestoneType: MilestoneType;
  event: MilestoneEvent;
  projectId: string;
  baselineId: string;
  // Populated only for `milestoneType: "AcquisitionGate"` records; null for
  // "SETR" records, which have no pathway concept.
  pathway: AcquisitionPathwayId | null;
  status: MilestoneStatus;
  // @domain-placeholder
  actualDate: string | null;
  // @domain-placeholder
  plannedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// AcquisitionPathway (the methodology-layer union in aafPhaseGuidance.ts,
// mirrored here as AcquisitionPathwayId below) is NOT promoted to a
// data-layer entity: it's already PKM-conformant as a plain, stable,
// external, human-meaningful ID ("MCA") per Architecture Guidance §9 / PKM
// §4 — the pathway's name, definition, and phase banding are DoD Adaptive
// Acquisition Framework doctrine, identical for every program that uses
// MCA, not per-program data the way a Program or Project record's
// name/description is. Nothing about it needs a stored record; only a
// stable id to reference, which the existing type union already provides.
// Flagged explicitly here (rather than left to be rediscovered) as an
// "already conformant, no entity needed" finding — the same category PKM
// Migration Step 0 recorded for CI↔LogicalSubsystem cardinality. Confirmed
// unchanged by PKM v0.3.0/v0.3.1 (§4: "a stable external id can itself be
// structural... e.g. Milestone.pathway = 'MCA'").
//
// AcquisitionPhase (Materiel Solution Analysis, TMRR, EMD, Production &
// Deployment, Operations & Support) is also NOT promoted to a stored
// entity. A baseline's "current phase" is already fully and cheaply
// derived from its own Milestone records (see deriveCurrentPhase() in
// client/src/utils/acquisitionPhase.ts, added with the Acquisition Phase
// Workbench) — storing it as a field would create a second source of
// truth that could silently drift from the Milestone records that already
// determine it, with no new information gained. This app's existing
// "derived, not stored" design choice for current-phase is kept as-is,
// not revisited by Step 9 or since.
//
// This app previously had a standalone AcquisitionMilestone entity here
// (Step 8), consolidated into Milestone by Step 9 above, then fully
// retired once the coexist-then-deprecate window closed (UI cutover
// verified, nothing left referencing it) — see this app's PKM Migration
// Status Report v1.5.0 §7 for the removal record.

// Mirrors methodology/guidance/aafPhaseGuidance.ts's `AcquisitionPathway`
// union exactly (same independently-maintained-mirror pattern as
// MilestoneEvent/SetrEvent above) — kept as a distinct name in this file
// since a data-schema type shouldn't import from /methodology directly.
export type AcquisitionPathwayId = "MCA";

export type LogicalSubsystemSource =
  | "Validated"
  | "Proposed"
  | "Inherited from SSDD structure — unverified";

export interface LogicalSubsystem {
  id: string;
  // @domain-placeholder
  name: string;
  // @domain-placeholder
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
  baselineId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CiType = "developmental" | "COTS";
export type CiTier = "Tier 1" | "Tier 2" | "Tier 3";

export interface ConfigurationItem {
  id: string;
  // @domain-placeholder
  name: string;
  type: CiType;
  tier: CiTier;
  // Many-to-many: a CI can legitimately serve more than one logical subsystem
  // (see LogicalSubsystem) — not modeled as a single foreign key. Should only
  // reference subsystems of this same CI's baseline.
  subsystemIds: string[];
  baseline: SpecBaseline;
  projectId: string | null;
  baselineId: string | null;
  overDecompositionFlag: boolean;
  // @domain-placeholder
  consolidationNotes: string;
  // @domain-placeholder
  status: string;
  // @domain-placeholder
  notes: string;
  attachments: Attachment[];
  // PKM Migration Step 6 (additive): unifies this CI's own
  // overDecompositionFlag/consolidationNotes finding with a real Gap
  // record where one exists -- see Gap's own comment (below DeltaMatrixRow)
  // for why overDecompositionFlag/consolidationNotes stay as-is.
  gapId: string | null;
  createdAt: string;
  updatedAt: string;
}

// PKM Migration Step 4 (additive): promotes the requirement-level structure
// `DeltaMatrixRow` already implied (an SFR-agreed allocation vs. an as-built
// decomposition) into a first-class, referenceable node. Per PKM's own
// definition a Requirement is "a structural requirement node (not the
// requirement text itself)" — real requirement content belongs in a
// program's PDKM — but this app follows the same pragmatic pattern already
// used for Specification/SafetyDeliverable/etc.: it stores illustrative
// content directly (`statement`) rather than only a bare reference, marked
// `@domain-placeholder` like those other entities' content fields.
export interface Requirement {
  id: string;
  baselineId: string;
  // @domain-placeholder
  statement: string;
  // Many-to-many, for the same reason `ConfigurationItem.subsystemIds` is:
  // `delta-001`'s own over-decomposition finding is a real-world case of one
  // requirement whose as-built satisfaction spans three separate CIs, not
  // the single CI its SFR-agreed allocation named. Reflects the *current*
  // as-built truth, not the historical paper allocation -- DeltaMatrixRow
  // below is what tracks the gap between the two.
  satisfiedByCiIds: string[];
  // Supports requirement decomposition (e.g. req-002 below is implicitly
  // part of req-001, per its own statement) -- not yet used for anything
  // beyond a plain reference; no cycle/depth enforcement.
  parentRequirementId: string | null;
  // PKM Migration Step 10 (additive): traces a Requirement back to the
  // Specification section it was decomposed from, closing the gap Steps 4
  // and 5 both explicitly deferred ("the higher-effort part of this phase
  // ... a separate, later sub-phase"). Both null for requirements that
  // didn't originate from a Specification section (e.g. req-001/002, which
  // predate this step and came from DeltaMatrixRow instead -- see this
  // entity's own header comment). Explicit reference fields, not
  // denormalized text, per PKM §4 -- same convention as every other
  // cross-entity link in this file.
  sourceSpecificationId: string | null;
  sourceSpecSection: SpecSectionKey | null;
  createdAt: string;
  updatedAt: string;
}

export type VerificationMethod = "Test" | "Analysis" | "Inspection" | "Demonstration";
export type VerificationResult = "Pass" | "Fail" | "Pending";

// PKM Migration Step 5 (additive, first slice): promotes CotsRecord's own
// `verificationMethod` free text into a real, referenceable record -- see
// that field's own comment below. Per the migration plan's explicit risk
// note for this step ("genuine content authoring, not mechanical
// conversion... do incrementally per guidance-content file"), this first
// slice covers only CotsRecord; `Specification.sections.verificationProvisions`
// is a separate, later slice, not addressed here.
export interface VerificationEvent {
  id: string;
  requirementId: string;
  method: VerificationMethod;
  result: VerificationResult;
  // @domain-placeholder
  evidenceSummary: string;
  eventDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChecklistItemStatus = "Not Evaluated" | "Met" | "Not Met" | "Waived";

// Polymorphic single-reference evidence pointer -- one piece of evidence per
// criterion, not a full evidence graph. The same pattern PKM's own model
// proposes for Gap (Step 6: `foundInEntityType` + `foundInEntityId`), reused
// here proactively for consistency across both entities.
export type ChecklistItemEvidenceType =
  | "Requirement"
  | "ConfigurationItem"
  | "SafetyDeliverable"
  | "ProgramPlanningDeliverable"
  | "VerificationEvent"
  | "Specification";

// PKM Migration Step 5 (additive, first slice): promotes a small, real set
// of DID/TDP/DBx-MBx-style readiness criteria from guidance prose into
// individually evaluable records, each belonging to a Milestone and
// evaluated against a piece of existing evidence. Per this step's risk
// note, only a representative slice is seeded (Baseline A's TRR and
// Baseline B's SFR -- both currently in-progress milestones), not a full
// sweep of every guidance-content file.
//
// `domain` is a plain string attribute, not a first-class PKM entity --
// deliberately provisional pending PKM Entity Model §5 open question #2
// ("should Domain be first-class?"), which is still unresolved upstream.
//
// Forward-compatibility note: this entity's shape (a discrete,
// user-answerable criterion with a toggleable status and a structured
// evidence reference) is what a future wizard/guided-form interface is
// meant to read and write directly -- the same criterion catalog that
// drives this app's tables today is intended to also drive a prompted,
// "TurboTax-style" flow later, toggling which CDRLs apply as each
// criterion is answered. Nothing here assumes that UI exists yet; the
// structure just shouldn't need to change when it does.
export interface ChecklistItem {
  id: string;
  milestoneId: string;
  domain: string;
  // @domain-placeholder
  criterion: string;
  status: ChecklistItemStatus;
  evidenceType: ChecklistItemEvidenceType | null;
  evidenceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeltaSource = "Design reality vs. model" | "Model unvalidated vs. design" | "None";
export type Disposition = "Accept as-is" | "ECP required" | "TBD pending analysis";

export interface DeltaMatrixRow {
  id: string;
  ciId: string;
  // @domain-placeholder
  sfrAllocation: string;
  // @domain-placeholder
  actualDecomposition: string;
  // @domain-placeholder
  delta: string;
  deltaSource: DeltaSource;
  // @domain-placeholder
  rationale: string;
  disposition: Disposition;
  // PKM Migration Step 4 (additive): superseded by requirementId for the
  // structural relationship; sfrAllocation/actualDecomposition stay as the
  // historical free-text record of the gap itself, per the same
  // coexist-then-deprecate pattern Step 2 used for baseline/baselineId.
  requirementId: string | null;
  // PKM Migration Step 6 (additive): this row's finding, unified under a
  // Gap record where one exists -- see Gap's own comment below for why
  // this row's fields stay as-is rather than being replaced.
  gapId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GapEntityType =
  | "ConfigurationItem"
  | "DeltaMatrixRow"
  | "Requirement"
  | "Specification"
  | "SafetyDeliverable"
  | "ProgramPlanningDeliverable"
  | "LogicalSubsystem";

// PKM Migration Step 6 (additive, first slice): consolidates three
// existing, still-functioning mechanisms (DeltaMatrixRow findings,
// ConfigurationItem.overDecompositionFlag/consolidationNotes, and
// Recommendation) into one polymorphic Gap entity, per PKM's own proposed
// shape for this entity ("foundInEntityType + foundInEntityId"). Per this
// step's own risk note ("high, mainly due to breadth... most likely to
// need its own sub-plan once scoped"), this is additive only: the three
// existing mechanisms keep their current fields, UI, and behavior
// untouched (CisPage's over-decomposition badge, DeltaMatrixPage's table,
// filtering, and the SEMP export all still read them directly) -- Gap
// coexists alongside them via a new gapId reference on ConfigurationItem
// and DeltaMatrixRow (see those fields' own comments), not a replacement.
//
// Recommendation is deliberately not migrated here: PKM's own model has
// Recommendation/ActionItem *resolve* a Gap, not *be* one -- that
// relationship is Step 7's resolvesGapId, not this step's. This also
// means a single real finding can now be tracked by more than one
// mechanism at once (e.g. ci-003's own over-decomposition flag and
// delta-002 both describe the same underlying gap below) -- exactly the
// duplication Gap unification exists to eventually resolve.
export interface Gap {
  id: string;
  baselineId: string;
  foundInEntityType: GapEntityType;
  foundInEntityId: string;
  // @domain-placeholder
  description: string;
  disposition: Disposition;
  blocksMilestoneId: string | null;
  blocksChecklistItemId: string | null;
  // PKM Migration Step 12 (additive, per PKM Migration Plan v0.5.0 Step 10 /
  // PKM Entity Model v0.6.0): the bridge to RiskItem when a Gap's real
  // consequence extends beyond its immediate SE/CM finding (e.g. a
  // supply-chain-driven schedule slip has zero SE/CM-conformance dimension
  // of its own). Gap keeps its narrow, precise conformance-finding meaning;
  // this is a reference, not a merge -- populated only when a real
  // escalation occurs, no migration of existing records required.
  escalatedToRiskItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

// PKM Migration Step 12 (per PKM Migration Plan v0.5.0 Step 10 / PKM Entity
// Model v0.6.0 §2-§3): a tracked risk, issue, or opportunity, grounded in
// the DoD RIO (Risk/Issue/Opportunity) Management Guide (Dec 2023) and
// INCOSE SE Handbook §2.3.4.4-2.3.4.5. One entity with an `itemType`
// discriminator, the same pattern as Milestone's `SETR`/`AcquisitionGate`
// split -- RIO's own guide suggests programs may combine all three
// registers into one, and INCOSE treats opportunity management as risk
// management with terminology substituted.
//
// `likelihood` is null specifically for `itemType: "Issue"`, not defaulted
// to a value -- RIO treats issue probability as 1 by definition (an issue
// has already occurred), so it isn't independently scored. `riskLevel` is
// NOT a stored field -- see deriveRiskLevel() in
// client/src/utils/riskItem.ts, the same derived-not-stored pattern already
// used for Acquisition Phase and Baseline reconciliation status. That
// function's own comment documents this app's specific interpretation of
// "likelihood x max consequence" for the Issue case (probability treated as
// 1 in the multiplication, per the RIO Guide's own framing), flagged there
// as a pragmatic reading of the PKM model's text, not a literal quote from
// it -- worth confirming upstream if it doesn't match real RIO practice.
//
// `category` is a plain string, structural taxonomy like ChecklistItem's
// own `domain` field -- not `@domain-placeholder` tagged, and deliberately
// left as an open string rather than a fixed union, since neither PKM nor
// the RIO Guide proposes a closed taxonomy for it.
//
// `description` is not named in PKM's own entity-table listing, but is
// added here following this app's established pattern for entities that
// hold illustrative content directly rather than only bare structure (see
// Requirement.statement's own comment for the precedent) -- a RiskItem
// with no description of what the risk/issue/opportunity actually *is*
// would be structurally complete but practically unusable.
export type RiskItemType = "Risk" | "Issue" | "Opportunity";
export type RiskMitigationStrategy = "Accept" | "Avoid" | "Transfer" | "Control";
export type RiskItemStatus = "Identified" | "Approved" | "Mitigating" | "Closed";

export const RISK_ITEM_TYPES: RiskItemType[] = ["Risk", "Issue", "Opportunity"];
export const RISK_MITIGATION_STRATEGIES: RiskMitigationStrategy[] = ["Accept", "Avoid", "Transfer", "Control"];
export const RISK_ITEM_STATUSES: RiskItemStatus[] = ["Identified", "Approved", "Mitigating", "Closed"];
export const RISK_SCORE_VALUES = [1, 2, 3, 4, 5] as const;
export type RiskScoreValue = (typeof RISK_SCORE_VALUES)[number];

export interface RiskItem {
  id: string;
  projectId: string;
  itemType: RiskItemType;
  category: string;
  // Null only for itemType: "Issue" -- see this type's own header comment.
  likelihood: RiskScoreValue | null;
  consequenceCost: RiskScoreValue;
  consequenceSchedule: RiskScoreValue;
  consequencePerformance: RiskScoreValue;
  mitigationStrategy: RiskMitigationStrategy;
  // References the Role entity (PKM Migration Step 11) -- null means not
  // yet assigned, same convention as Recommendation.assignedRoleId.
  ownerRoleId: string | null;
  linkedMilestoneId: string | null;
  linkedCiId: string | null;
  // @domain-placeholder
  description: string;
  identifiedDate: string | null;
  approvalDate: string | null;
  plannedClosureDate: string | null;
  actualClosureDate: string | null;
  status: RiskItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type CompatibilityStatus = "Aligned" | "Diverging" | "Divergence accepted with mitigation";

export interface AbCompatibilityRow {
  id: string;
  ciId: string;
  // @domain-placeholder
  baselineAState: string;
  // @domain-placeholder
  baselineBIntent: string;
  compatibilityStatus: CompatibilityStatus;
  // @domain-placeholder
  riskNote: string;
  lastReviewedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualifiedAlternate {
  // @domain-placeholder
  makeModelPartNumber: string;
  // @domain-placeholder
  lifecycleStatus: string;
}

export interface CotsRecord {
  id: string;
  ciId: string;
  // @domain-placeholder
  functionalRequirement: string;
  // @domain-placeholder
  interfaceRequirement: string;
  // @domain-placeholder
  formFitConstraints: string;
  // PKM Migration Step 5 (additive): superseded by verificationEventId for
  // the structural relationship, per the same coexist-then-deprecate
  // pattern used elsewhere in this migration. This field's own value is
  // domain-specific free text (see data-schema/DOMAIN_PLACEHOLDER_FIELDS.md
  // -- an earlier pass at that manifest incorrectly assumed this was a
  // fixed set of standard labels; it is not).
  // @domain-placeholder
  verificationMethod: string;
  verificationEventId: string | null;
  // @domain-placeholder
  rationale: string;
  // @domain-placeholder
  partsListEntry: string;
  qualifiedAlternates: QualifiedAlternate[];
  // @domain-placeholder
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

// PKM Migration Step 7: a starting SE program role taxonomy, per PKM's own
// model (ActionItem assigned to a role, not a named person, by default).
// Per the migration plan's own explicit deferral on this step ("worth a
// short separate discussion... flag as an open question for Workbench's
// own team, not something this plan should presume"), this is a
// pragmatic first cut, not a definitive taxonomy -- a real deployment's
// actual RACI conventions should replace it. "Lead Systems Engineer" is
// the one role already referenced throughout this app's own guidance
// content (see e.g. methodology/guidance/recoveryProgramGuidance.ts).
export type RecommendationOwnerRole =
  | "Lead Systems Engineer"
  | "CM Lead"
  | "Software Lead"
  | "Safety Lead"
  | "Program Manager";

export const RECOMMENDATION_OWNER_ROLES: RecommendationOwnerRole[] = [
  "Lead Systems Engineer",
  "CM Lead",
  "Software Lead",
  "Safety Lead",
  "Program Manager",
];

// PKM Migration Step 11 (per PKM Migration Plan v0.4.0 §9 / PKM Entity
// Model v0.5.0 §2-§3): promotes role assignment from the fixed
// `RecommendationOwnerRole` union above into a real, tailorable entity.
// The union satisfied "general enough as a default" but not "roles
// addable/removable per program" -- Ron's confirmed requirement -- since a
// hardcoded TS type can't be edited by a program without a code change.
// `Role` is scoped to Project (PKM's own choice, §3: "the same granularity
// as every other program-specific entity in this model"), with `isDefault`
// distinguishing the standard starting taxonomy (seeded below, one record
// per existing RecommendationOwnerRole value) from roles a program adds of
// its own. `authorityDescription` is optional, SEMP-facing content (a
// role's actual authority/responsibility language) -- structure, per PKM's
// own note, same treatment as `Requirement.statement`.
export interface Role {
  id: string;
  projectId: string;
  // @domain-placeholder
  name: string;
  // @domain-placeholder
  authorityDescription: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  // @domain-placeholder
  text: string;
  category: RecommendationCategory;
  status: RecommendationStatus;
  // PKM Migration Step 7: constrained to RecommendationOwnerRole (was free
  // text) -- null means not yet assigned to a role. Superseded by
  // assignedRoleId below (Step 11); kept as-is, not backfilled further, per
  // the coexist-then-deprecate discipline every prior step has used --
  // this field simply stops being the UI's edited surface going forward
  // (see RecommendationsPage.tsx).
  owner: RecommendationOwnerRole | null;
  // PKM Migration Step 11 (additive): references a real Role record
  // instead of a fixed union value -- null means not yet assigned. Backfilled
  // once, at this step, for every pre-existing Recommendation whose `owner`
  // already names one of the seeded default Roles (a safe, unambiguous
  // one-time mapping, not an ongoing sync) -- see mock-data/seed.ts's own
  // comment on this array.
  assignedRoleId: string | null;
  relatedCiId: string | null;
  // PKM Migration Step 7 (additive): the Gap this recommendation proposes
  // to resolve, where one exists -- a single reference, not an array, per
  // the same one-primary-reference simplification used elsewhere in this
  // migration (see e.g. Requirement.parentRequirementId). relatedCiId is
  // kept as-is rather than replaced, since it still carries information
  // resolvesGapId doesn't (recommendations with no associated Gap, like
  // rec-003's A/B alignment risk, still need a CI reference).
  resolvesGapId: string | null;
  // PKM Migration Step 12 (additive, per PKM Migration Plan v0.5.0 Step 10):
  // a risk's mitigation implementation plan (RIO's four options: Accept,
  // Avoid, Transfer, Control) is the same kind of remediation task a Gap's
  // ActionItem already represents -- coexists with resolvesGapId, but a
  // given Recommendation resolves a Gap *or* a RiskItem, not both.
  resolvesRiskItemId: string | null;
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
  // @domain-placeholder
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

// @domain-placeholder -- every section's text is program-specific requirement
// content, not generic structure. The 12 keys themselves (scope, safety,
// etc.) are the reusable DID-derived structure and stay as-is.
export type SpecSections = Record<SpecSectionKey, string>;

export interface Specification {
  id: string;
  // @domain-placeholder
  title: string;
  level: SpecLevel;
  domain: SpecDomain;
  specType: SpecType;
  baseline: SpecBaseline;
  projectId: string | null;
  baselineId: string | null;
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
  // @domain-placeholder
  title: string;
  level: SpecLevel;
  cdrlType: string;
  applicability: SafetyApplicability;
  baseline: SpecBaseline;
  projectId: string | null;
  baselineId: string | null;
  status: SpecStatus;
  // Set when level === "Subsystem"; null otherwise.
  linkedSubsystemId: string | null;
  // Set when level === "CI"; null otherwise.
  linkedCiId: string | null;
  // @domain-placeholder
  hazardExample: string;
  // @domain-placeholder
  cdrlDescription: string;
  // PKM Migration Step 3 (additive): superseded by milestoneId below for the
  // closed set of known SETR events; kept during the transition per the
  // same coexist-then-deprecate pattern Step 2 used for `baseline`/
  // `baselineId`. A handful of pre-existing values here (e.g. "TBD pending
  // subsystem validation") don't map to any single gate and are left with a
  // null milestoneId rather than forced onto one.
  deliveryMilestone: string;
  // Null where deliveryMilestone's value isn't one of the known SETR events.
  milestoneId: string | null;
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
  // @domain-placeholder
  title: string;
  level: SpecLevel;
  cdrlType: string;
  applicability: SafetyApplicability;
  baseline: SpecBaseline;
  projectId: string | null;
  baselineId: string | null;
  status: SpecStatus;
  // Set when level === "Subsystem"; null otherwise.
  linkedSubsystemId: string | null;
  // Set when level === "CI"; null otherwise.
  linkedCiId: string | null;
  // @domain-placeholder
  cdrlDescription: string;
  // PKM Migration Step 3 (additive): see the same field on SafetyDeliverable
  // above for the coexist-then-deprecate rationale and the null-mapping note.
  deliveryMilestone: string;
  milestoneId: string | null;
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
  baselines: Baseline[];
  milestones: Milestone[];
  requirements: Requirement[];
  verificationEvents: VerificationEvent[];
  checklistItems: ChecklistItem[];
  gaps: Gap[];
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  roles: Role[];
  riskItems: RiskItem[];
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

export const MILESTONE_STATUSES: MilestoneStatus[] = ["Not Started", "In Progress", "Complete"];

export const CHECKLIST_ITEM_STATUSES: ChecklistItemStatus[] = ["Not Evaluated", "Met", "Not Met", "Waived"];
export const CHECKLIST_ITEM_EVIDENCE_TYPES: ChecklistItemEvidenceType[] = [
  "Requirement",
  "ConfigurationItem",
  "SafetyDeliverable",
  "ProgramPlanningDeliverable",
  "VerificationEvent",
  "Specification",
];
