# SE Workbench Conformance Review — Process Knowledge Model (PKM) v0.1.0

**From:** Claude Code, working session on `RonClemens/MK--710-SSR-SysEng-Story` ("PDR Reconciliation & Baseline
Alignment Workbench")
**Re:** PKM Entity & Relationship Model v0.1.0 (2026-07-25, exploratory draft, companion to Architecture Guidance
v1.3.0 §9)
**Purpose:** This app is offered as the first real-world conformance check the PKM doc's own status note asked
for ("shared across apps... to get implementation-level feedback before it hardens"). This is an analysis
document only — no code has been changed as a result of it.

---

## 1. Where this app already conforms

- **ID and reference conventions (PKM §4).** Every entity in this app's schema (`client/src/types/index.ts`)
  already carries a stable, meaningful external ID (`ci-001`, `spec-003`, `safety-009`, `sub-b-002`), not a raw
  database auto-increment key, and every relationship is an explicit typed reference field (`ciId`,
  `relatedCiId`, `linkedSubsystemId` / `linkedCiId`, `aId` / `bId`, `subsystemIds`) rather than denormalized
  prose. This was independently verified during this app's Architecture Guidance v1.3.0 §9 forward-compatibility
  check, and holds up against PKM §4's restatement of the same rule.
- **LogicalSubsystem and CI are genuine structural nodes**, not just labels — matching PKM's intent that these
  carry real identity rather than being embedded as description text.
- **Baseline coexistence is already a lived reality in this app's data, not an edge case.** Baseline A (mature,
  Product-Baseline-adjacent) and Baseline B (early, Functional/Allocated-adjacent) run in parallel today, with
  independent Logical Subsystem decompositions — exactly the scenario PKM §1/§3 insists the model must treat as
  normal, not exceptional. This app is a working example of the case PKM is designed around.

---

## 2. Where this app does not conform

### 2.1 Baseline is a tag, not an entity — the single biggest gap

PKM wants `Baseline` as a first-class node: its own stable ID, a `baselineType` (Functional / Allocated / Product
/ Acquisition-Program-Baseline), an established-at-Milestone reference, and reconciliation pointers
(`reconciledFromBaselineId` / `reconciledIntoBaselineId`).

This app instead has `baseline: "Baseline A" | "Baseline B"` as a plain two-value enum field, repeated across five
different entity types (`LogicalSubsystem`, `ConfigurationItem`, `Specification`, `SafetyDeliverable`,
`ProgramPlanningDeliverable`). There is no Baseline record for `LogicalSubsystem.baseline` etc. to point *at* —
"Baseline A" is a string literal, not a foreign key.

### 2.2 No Program or Project entity

The app implicitly assumes exactly one program and one project; nothing in the schema represents either tier.
Every entity that PKM would scope under a Project (via Baseline) has no parent Project reference at all today.

### 2.3 No Milestone entity

SRR/SFR/PDR/CDR/TRR/SVR/PRR exist only as a hardcoded catalog in the *methodology* layer
(`methodology/guidance/setrGuidance.ts`'s `SETR_EVENTS`/`SETR_GUIDANCE`), not as data records other entities can
reference. `deliveryMilestone` on the CDRL-style deliverables (`SafetyDeliverable`, `ProgramPlanningDeliverable`)
is a free-text label, not a reference to a Milestone record.

### 2.4 No ChecklistItem entity

The DID / TDP / DBx-MBx guidance content is prose (methodology-layer guidance text), not structured, individually
evaluable readiness criteria with evidence linkage back to a Requirement, CI, Deliverable, or VerificationEvent.

### 2.5 No structural Requirement entity

`DeltaMatrixRow.sfrAllocation` and `.actualDecomposition` are free-text fields describing requirement content —
there is no Requirement *node* with its own stable ID that a CI "satisfies" via a reference field, no
`ParentRequirement` traceability chain, and no link to a verifying event. `Specification.sections` (scope,
functional/performance, interfaces, etc.) are prose blocks per spec, not decomposed, individually-addressable
requirement records either.

### 2.6 No VerificationEvent entity

Verification is represented only as descriptive text: `CotsRecord.verificationMethod`,
`Specification.sections.verificationProvisions`. Nothing in this app records an actual executed test, inspection,
analysis, or demonstration as its own instance with a result and evidence trail.

### 2.7 Gap is scattered across three non-uniform mechanisms

PKM's Gap is a single, polymorphic "missing, inconsistent, or non-compliant item" entity that references whatever
it was found in. This app instead has three different, non-unified stand-ins:
- `DeltaMatrixRow` — specifically for CI decomposition/allocation mismatches.
- `ConfigurationItem.overDecompositionFlag` + `.consolidationNotes` — a boolean+text pair bolted directly onto CI,
  rather than a separate referencing record.
- `Recommendation` — a broader, general-purpose finding/action-item hybrid.

None of these share a common shape, and none of them generalize to "a Gap found in a Milestone, a ChecklistItem,
or a Requirement" the way PKM's single Gap entity is meant to.

### 2.8 ActionItem's role-assignment default isn't enforced

`Recommendation.owner` is an untyped free-text `string` field. PKM's stated default — "assigned to a role, not a
named person" — has nothing in this app's schema enforcing it. In this app's current illustrative/demo data
that's a non-issue, but if this pattern were carried into a real CUI deployment as-is, there is no schema-level
barrier stopping a real name from landing in that field. Also, `Recommendation` links to a CI generically
(`relatedCiId`), not to a specific Gap it resolves — the `resolves Gap` edge PKM specifies isn't structurally
present.

---

## 3. One concrete conflict worth resolving before the model hardens

**PKM's entity table states CI "belongs to LogicalSubsystem"** — phrasing that implies a one-to-many relationship
(each CI belongs to exactly one LogicalSubsystem).

**This app deliberately models that relationship as many-to-many** (`ConfigurationItem.subsystemIds: string[]`),
because a CI serving two or more subsystems is a real, intentionally-surfaced finding in this app — the UI
visually flags CIs with 2+ subsystem links specifically because that overlap is signal (integration bloat, a CI
doing more than one subsystem's job), not noise to be hidden or disallowed.

If the PKM entity table hardens around a strict one-to-one CI→LogicalSubsystem relationship as currently drafted,
it would make this app's actual, working over-decomposition-detection feature unrepresentable in PKM terms. Given
the doc's own status note explicitly asks for implementation-level feedback before hardening, this seems like
exactly the kind of finding worth surfacing now: **recommend PKM model CI↔LogicalSubsystem as many-to-many**, with
the "primary" or "home" subsystem (if that concept is still wanted) expressed as an additional flag/attribute
rather than by constraining the relationship itself to one-to-one.

---

## 4. Secondary observation: this app already has lived experience relevant to PKM's open question #1

PKM §5 open question #1 asks whether Baseline reconciliation deserves to be a relationship field on Baseline
itself, or a distinct auditable `ReconciliationEvent` entity. This app's `recoveryProgramGuidance.ts` (Baseline
B's CI-Tier-as-delta-classification: Class 1 Carry Forward / Class 2 Modified / Class 3 Re-Architected, mapped to
Tier 3/2/1) is, informally, an existing answer to a version of that same question — a program-specific
classification of how much of a prior baseline's design reconciles into a new one. It is not yet expressed as
structured PKM-shaped data (it lives in the methodology layer as guidance text describing this program's actual
tiering convention), but it may be useful, real-world input if/when open question #1 gets resolved — this app is
a working example of a program in the middle of exactly the reconciliation problem PKM is trying to model.

---

## 5. Scope note

This app has not been changed to conform to PKM in any way — this is a read-only conformance analysis, produced
at v0.1.0's explicit invitation for early implementation-level feedback. No decision about whether or how this
app should eventually adopt a PKM-shaped schema has been made; that's a larger, separate decision once the PKM
model itself stabilizes.
