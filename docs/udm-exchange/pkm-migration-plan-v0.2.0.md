# SE Workbench — PKM Migration Plan

**Version:** 0.2.0 (Draft — for Workbench repo feedback)
**Target repo:** `RonClemens/MK--710-SSR-SysEng-Story` ("PDR Reconciliation & Baseline Alignment Workbench")
**Based on:** PKM Entity & Relationship Model v0.2.0, Architecture Guidance v1.3.0

**Changelog:**
- **v0.2.0** — Renamed this plan's numbered units from "Phase" to "Step" to resolve terminology collision with Architecture Guidance §7's own migration-sequencing phases. Expanded Step 2's blast radius to include `sempExport.ts` and `recoveryProgramGuidance.ts`, and flagged its dependency on Architecture Guidance's pending content-split step. Carved `AbCompatibilityRow` out of Step 2's single-`baselineId` treatment. Added explicit methodology/data split note to Step 3. All per SE Workbench's round-2 feedback.
- **v0.1.0** — Initial draft.
**Purpose:** A concrete, phased plan for migrating this app's schema toward PKM conformance, sequenced by regression risk per Architecture Guidance §7 (mechanical/low-risk first, judgment-heavy content work last). This is a plan for feedback, not an implementation instruction — no code should change as a direct result of this document alone.

---

## 0. Already conformant — no action needed

- **ID/reference conventions** — already matches PKM §4, confirmed in both prior reviews.
- **CI↔LogicalSubsystem many-to-many** — `ConfigurationItem.subsystemIds: string[]` already matches PKM v0.2.0's corrected model exactly. This was a genuine app-ahead-of-doc case; no migration needed here, just note it in the app's own changelog as "already PKM v0.2.0 conformant."

---

## 1. Step 1 — Program & Project entities (additive, mechanical)

**Why first:** the app currently assumes exactly one Program and one Project implicitly. Making that explicit is pure addition — no existing field changes shape, nothing is removed, and every current entity keeps working unmodified while gaining an optional parent reference.

- Add `Program` and `Project` records (likely exactly one of each, given this app's current single-program scope).
- Add `projectId` as a new, optional field on the five Baseline-tagged entity types (`LogicalSubsystem`, `ConfigurationItem`, `Specification`, `SafetyDeliverable`, `ProgramPlanningDeliverable`). Optional at first so nothing breaks; can be made required once backfilled.
- **Risk:** low. **Regression surface:** none — purely additive schema, no existing behavior touched.

---

## 2. Step 2 — Promote Baseline from enum to entity

**Why second:** this is the single biggest structural gap identified, but it's still largely mechanical — a find/replace of a string literal with a foreign key — rather than a content-authoring problem. **This step's actual blast radius is larger than a first pass suggests — see the dependency note below before starting.**

- Create a `Baseline` entity/table with `baselineType`, `establishedAtMilestoneId` (nullable until Step 3), `projectId`, and reserve `reconciledFromBaselineId`/`reconciledIntoBaselineId` per PKM §5 open question #1.
- Create two records: `BASELINE-A` and `BASELINE-B`, matching current data.
- Replace `baseline: "Baseline A" | "Baseline B"` enum fields across all five entity types with `baselineId` foreign keys. Recommend a transition period where both fields coexist (`baseline` deprecated but not removed) so existing UI/filtering code isn't broken mid-migration — remove the enum only after all reads/writes are confirmed migrated.
- **Full blast radius, confirmed against the codebase:** beyond the five entity types and general UI/filter code, this also touches `client/src/utils/sempExport.ts` (baseline-keyed document-generation logic, e.g. iterating `["Baseline A", "Baseline B"]` to build per-baseline export tables) and `methodology/guidance/recoveryProgramGuidance.ts` (which hardcodes a Baseline-B-specific scope note as methodology-layer prose).
- **Dependency on Architecture Guidance work:** `recoveryProgramGuidance.ts`'s Baseline-B-specific content is exactly what Architecture Guidance §7's own pending content-split step (untangling program-specific narrative from reusable methodology) is meant to address, and that work hasn't started in this repo yet. Deciding what "Baseline B" *is* structurally (this step) and deciding what in that file is generic vs. program-specific (the Architecture Guidance step) are not independent — **do not start this step until there's an explicit decision on whether the two are sequenced together or in a defined order.** Don't let them proceed on separate, uncoordinated timelines.
- **`AbCompatibilityRow` is explicitly out of scope for the single-`baselineId` treatment above.** Its purpose is inherently cross-baseline — each record carries both `baselineAState` and `baselineBIntent` describing the same interface from both baselines' perspectives at once. Forcing it onto a single `baselineId` would lose what the record represents. Leave it unmigrated in this step; it's flagged as candidate real-world evidence for PKM §5 open question #1 (see PKM Entity Model changelog) and should be revisited once that question resolves, not folded into Step 2's mechanical conversion.
- **Risk:** moderate, and larger in scope than originally stated. **Regression surface:** five entity types, general UI/filter code, `sempExport.ts` document generation, and a hard dependency on Architecture Guidance's content-split sequencing.

---

## 3. Step 3 — Milestone entity

**Why third:** the SETR catalog already exists as structured data in the methodology layer (`SETR_EVENTS`/`SETR_GUIDANCE`) — this phase is "promote existing structured content to queryable records," not "invent new structure from prose."

- Create `Milestone` records from the existing `SETR_EVENTS` catalog (SRR, SFR, PDR, CDR, TRR, etc.), each with a stable ID.
- Link `Baseline.establishedAtMilestoneId` (from Step 2) to these records.
- Convert `deliveryMilestone` free-text fields on `SafetyDeliverable`/`ProgramPlanningDeliverable` into `milestoneId` references.
- **Explicit methodology/data split for this entity:** `SETR_GUIDANCE` currently blends two different things under one name — keep them separate as this step proceeds. (1) The generic definition of what SRR/SFR/PDR/etc. *mean* is program-agnostic methodology content and stays in the methodology layer permanently, unchanged by this migration. (2) A specific Baseline's actual milestone instance (e.g., "Baseline A's SRR occurred on this date, with this status") is real program data and belongs in the new data-layer `Milestone` entity, not the methodology layer. Given this app's own Architecture Guidance §1.1 anti-pattern (editable override ≠ real separation), this step should not quietly re-blend the two under the new entity's name.
- **Risk:** low-moderate. **Regression surface:** the catalog itself doesn't change, just becomes referenceable; deliverable free-text fields need a one-time mapping to the new IDs (mechanical, since the milestone names are already a closed, known set).

---

## 4. Step 4 — Requirement entity

**Why fourth, ahead of ChecklistItem/VerificationEvent:** this unblocks the most existing functionality — `DeltaMatrixRow` already implies requirement-level structure, it's just not yet a first-class node.

- Introduce a `Requirement` entity with `baselineId`, `satisfiedByCiId` (or many, if applicable — check against real data whether a Requirement can be satisfied by multiple CIs), `parentRequirementId`.
- Decompose `DeltaMatrixRow.sfrAllocation` / `.actualDecomposition` free text into actual Requirement records where the content supports it; where it doesn't cleanly decompose, it's acceptable for a Requirement record to carry a single descriptive field short-term rather than force premature structure.
- `Specification.sections` decomposition into individually-addressable requirement records is the higher-effort part of this phase — recommend treating it as a separate, later sub-phase rather than blocking the rest of Step 4 on it.
- **Risk:** moderate-high. **Regression surface:** this is the first phase requiring judgment calls about how existing prose maps to discrete records — expect this to take longer than Steps 1–3 combined.

---

## 5. Step 5 — ChecklistItem and VerificationEvent entities

**Why paired:** both convert prose guidance into structured, evaluable records, and both benefit from Requirement already existing (Step 4) since they reference it.

- `ChecklistItem`: convert DID/TDP/DBx-MBx guidance content from prose into individually evaluable criteria, each referencing the Milestone it belongs to and the Requirement/CI/Deliverable it evaluates.
- `VerificationEvent`: convert `CotsRecord.verificationMethod` and `Specification.sections.verificationProvisions` text into actual event records with a result and evidence trail, linked to the Requirement(s) they verify.
- **Risk:** high — this is genuine content authoring, not mechanical conversion. Recommend doing this incrementally per guidance-content file rather than as one pass, consistent with Architecture Guidance §7's sequencing principle.

---

## 6. Step 6 — Unify Gap representation

**Why late:** this consolidates three existing, functioning mechanisms (`DeltaMatrixRow`, `overDecompositionFlag`/`consolidationNotes`, `Recommendation`) into one polymorphic `Gap` entity — a structural risk best taken once the entities Gap needs to reference (Requirement, ChecklistItem, Milestone) already exist from earlier phases.

- Define `Gap` with a `foundInEntityType` + `foundInEntityId` polymorphic reference (or three nullable typed reference fields, whichever fits the app's existing patterns better).
- Migrate `DeltaMatrixRow` findings, `overDecompositionFlag`/`consolidationNotes`, and applicable `Recommendation` records into `Gap` instances — but only after confirming with the app's maintainers whether each of the three has behavior (UI, filtering, reporting) that would break if consolidated. This phase is the one most likely to need its own sub-plan once scoped.
- **Risk:** high, mainly due to breadth (three existing mechanisms, unknown coupling to UI) rather than conceptual difficulty.

---

## 7. Step 7 — ActionItem role-assignment enforcement

**Why last:** smallest technical change, but it's a governance/taxonomy decision (what roles exist, how they're named) more than a code change, and benefits from Gap already existing so `resolvesGapId` has something to point at.

- Convert `Recommendation.owner` from free-text `string` to a constrained role type (enum or reference to a Role catalog — worth a short separate discussion on what that catalog should contain, e.g. "Lead Systems Engineer," "CM Lead," rather than named individuals).
- Add `resolvesGapId` reference field, replacing the current generic `relatedCiId` linkage where a `Recommendation` is actually resolving a specific Gap.
- **Risk:** low technically, but needs a decision on the role taxonomy before implementation — flag as an open question for Workbench's own team, not something this plan should presume.

---

## 8. Sequencing summary

| Step | Entity/Change | Risk | Depends on |
|---|---|---|---|
| 0 | (none — already conformant) | — | — |
| 1 | Program, Project | Low | — |
| 2 | Baseline (enum → entity) | Moderate | Step 1 |
| 3 | Milestone | Low-moderate | Step 2 |
| 4 | Requirement | Moderate-high | Step 2, 3 |
| 5 | ChecklistItem, VerificationEvent | High | Step 3, 4 |
| 6 | Gap (unification) | High | Step 3, 4, 5 |
| 7 | ActionItem role enforcement | Low (tech), open (governance) | Step 6 |

Each phase should be independently testable against the app's existing illustrative/demo dataset before moving to the next — consistent with Architecture Guidance §7's incremental-testing principle. No phase requires a prior phase to be 100% complete across the whole app, only functionally sound for the slice being migrated next.

---

## 9. Open questions for Workbench's team before implementation starts

1. Does a `Requirement` in this app's real data ever get satisfied by more than one CI, or is that always one-to-one? (Affects Step 4's `satisfiedByCiId` cardinality.)
2. For Gap unification (Step 6): are there UI features, filters, or reports built specifically against `DeltaMatrixRow`, `overDecompositionFlag`, or `Recommendation` as distinct types that would need parallel updates, or can they be safely generalized?
3. What role taxonomy should `ActionItem`/`Recommendation.owner` constrain to? (Step 7 — needs an answer from whoever owns this program's actual RACI/role conventions, not something to invent here.)
4. **Blocking, resolve before Step 2 starts:** should Step 2 (Baseline enum→entity) and Architecture Guidance's pending content-split step (untangling `recoveryProgramGuidance.ts`'s Baseline-B-specific prose from generic methodology) run as one coordinated effort, or in an explicit order? Both touch the same file; proceeding independently risks rework.

---

*This plan is Workbench-specific and does not modify the PKM Entity Model or Architecture Guidance documents themselves. If implementation surfaces a PKM modeling gap (as CI↔LogicalSubsystem cardinality did), that should route back as conformance feedback the same way this round did.*
