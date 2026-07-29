# Domain Placeholder Fields

This is the per-entity manifest for the `@domain-placeholder` marker used in
`client/src/types/index.ts` and `server/src/types.ts` (the two files are
independently maintained mirrors — see this repo's architecture guidance on
why there's no shared types package — and both carry the identical set of
markers listed below).

## What the marker means

`// @domain-placeholder` above a field means: this field's *value*, as
populated in `mock-data/seed.ts` / `mock-data/seed.json`, is illustrative
content invented for this demo (a plausible-sounding CI name, a hazard
description, a part number) — not a real program's data. A CUI deployment
replacing this demo with a real Process/Program-specific Knowledge Model
(PDKM) must repopulate every one of these fields with real program content.

It is deliberately **schema-level**, not applied by rewriting the mock-data
strings themselves (e.g. into `"<PLACEHOLDER>"`). Rewriting the demo values
would make the app unreadable as a demo — the whole point of the illustrative
data is to show what a populated instance looks like. The marker instead
gives a CUI implementation team a grep-able, structural inventory
(`grep -rn "@domain-placeholder" client/src/types/index.ts`) of exactly which
fields need real content, without touching how the demo presents.

This manifest is also rendered live, per current record, on the app's own
**PDKM Promises** tab (`client/src/pages/PromisesPage.tsx`) — the field lists
there must match this document's exactly; update both together.

**Not marked**, by design: `id` fields, foreign-key references (`*Id`,
`*Ids`), fixed enums/union types (status, category, tier, type, etc.),
timestamps (`createdAt`/`updatedAt`), and any field whose value is structural
rather than domain content. Those stay as-is regardless of which program the
app is deployed for.

## Manifest

### Attachment
- `label` — display name for a linked file/document.

### Program
- `name`
- `description`

### Project
- `name`
- `description`

### Baseline
- No placeholder fields. `name` is the fixed `SpecBaseline` enum
  (`"Baseline A" | "Baseline B"`); real baseline naming is a program-specific
  decision but is modeled as a constrained type, not free text, so there's
  nothing to backfill here beyond adding real values to that enum.

### Milestone (added PKM Migration Step 3; broadened Step 9, per PKM Migration Plan v0.3.0 §8)
- `actualDate`
- `plannedDate`
- Not marked: `event` (fixed `MilestoneEvent` enum), `status` (fixed
  `MilestoneStatus` enum), `milestoneType` (fixed `MilestoneType` enum),
  `pathway` (fixed, currently single-valued `AcquisitionPathwayId` or null)
  — all structural, not domain content, even though their *values* reflect
  this program's real progress. One entity now covers both SETR technical
  reviews and AAF acquisition-decision gates (`milestoneType`), consolidating
  the entry formerly listed separately below for `AcquisitionMilestone`.

### AcquisitionMilestone — deprecated, superseded by Milestone (PKM Migration Step 9)
Superseded by: `Milestone` records with `milestoneType: "AcquisitionGate"` (see above). The
type/table itself is still present per the coexist-then-deprecate window (PKM Migration Plan
v0.3.0 §8) but no longer has its own manifest entry — its two placeholder fields (`actualDate`,
`plannedDate`) are identical to and now tracked under `Milestone`'s entry above.

### Requirement (added PKM Migration Step 4)
- `statement`
- Not marked: `satisfiedByCiIds`, `parentRequirementId` (both structural
  references), `baselineId` (reference).

### LogicalSubsystem
- `name`
- `description`

### ConfigurationItem
- `name`
- `consolidationNotes`
- `status` (free-text status note, not the constrained `SpecStatus` enum
  used elsewhere)
- `notes`

### DeltaMatrixRow
- `sfrAllocation`
- `actualDecomposition`
- `delta`
- `rationale`

### AbCompatibilityRow
- `baselineAState`
- `baselineBIntent`
- `riskNote`

### QualifiedAlternate
- `makeModelPartNumber`
- `lifecycleStatus`

### CotsRecord
- `functionalRequirement`
- `interfaceRequirement`
- `formFitConstraints`
- `verificationMethod` (added PKM Migration Step 5 — an earlier pass at
  this manifest incorrectly assumed this was a fixed set of standard
  labels; it is free text, and is now additionally superseded by
  `verificationEventId` for the structural relationship)
- `rationale`
- `partsListEntry`
- `obsolescenceMonitoringNotes`

### VerificationEvent (added PKM Migration Step 5)
- `evidenceSummary`
- Not marked: `method`, `result` (fixed enums), `requirementId` (reference).

### ChecklistItem (added PKM Migration Step 5)
- `criterion`
- Not marked: `domain` (structural attribute, not domain content, despite
  the name — see this entity's own comment), `status` (fixed enum),
  `milestoneId`/`evidenceType`/`evidenceId` (references).

### Gap (added PKM Migration Step 6)
- `description`
- Not marked: `foundInEntityType`/`foundInEntityId` (polymorphic
  reference), `disposition` (fixed enum, reused from `DeltaMatrixRow`),
  `baselineId`/`blocksMilestoneId`/`blocksChecklistItemId` (references).

### Recommendation
- `text`
- Not marked: `owner` (converted to the fixed `RecommendationOwnerRole`
  enum in PKM Migration Step 7 — see that type's own comment on why this
  taxonomy is a starting point, not a definitive one), `resolvesGapId`
  (reference, added Step 7).

### InterfaceRecord
- `description`

### SpecSections (type, used by `Specification.sections`)
- All 12 section values (`scope`, `applicableDocuments`,
  `functionalPerformance`, `interfaces`, `environmental`,
  `designConstraints`, `safety`, `security`, `humanFactors`, `logistics`,
  `verificationProvisions`, `notes`) are program-specific requirement
  content. The 12 keys themselves are the reusable DID-derived structure
  and stay as-is.

### Specification
- `title`

### SafetyDeliverable
- `title`
- `hazardExample`
- `cdrlDescription`
- `deliveryMilestone` — free text today; candidate for a `milestoneId`
  reference once PKM Migration Step 3 (Milestone entity) lands, at which
  point this entry should be removed in favor of a structural FK.

### ProgramPlanningDeliverable
- `title`
- `cdrlDescription`
- `deliveryMilestone` — same Step 3 note as above.

## Entities with no placeholder fields

`ContentEntry`, `ContentEntryHistoryItem` — these hold editable site-copy
overrides for the app's own UI text, not program/domain data, so nothing in
them is CUI-scoped.
