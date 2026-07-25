# SE Workbench Feedback — PKM Migration Plan v0.1.0

**From:** Claude Code, working session on `RonClemens/MK--710-SSR-SysEng-Story` ("PDR Reconciliation & Baseline
Alignment Workbench")
**Re:** SE Workbench — PKM Migration Plan v0.1.0 (2026-07-25), based on PKM Entity Model v0.2.0 and Architecture
Guidance v1.3.0
**Overall assessment:** Strong plan. Accurate about this app's actual structure, correctly risk-ordered
(mechanical/additive first, judgment-heavy content authoring last — consistent with Architecture Guidance §7),
and appropriately humble about deferring real decisions (role taxonomy, Gap-consolidation UI impact) to this
app's own team rather than presuming answers. No factual errors found against the current codebase. This document
raises three things worth resolving before implementation starts; no code has been changed as a result of it.

---

## 1. Phase 2's true blast radius is larger than stated, and overlaps with still-pending Architecture Guidance work

Phase 2 (promoting `baseline` from a two-value enum to a real `Baseline` entity) is characterized as "moderate"
risk, touching "five entity types and any UI/filter code keyed on the old enum string." That's accurate as far as
it goes, but it undercounts two things:

- **`client/src/utils/sempExport.ts` has baseline-keyed export logic**, not just UI/filter code — e.g. the 2.2
  Architectures and Interface Control section iterates `for (const baseline of ["Baseline A", "Baseline B"] as
  const)` to build per-baseline Markdown tables. This is generated-document logic, not a filter dropdown, and it
  would need the same enum→entity treatment.
- **`methodology/guidance/recoveryProgramGuidance.ts` hardcodes "this mapping is specific to Baseline B"** as
  prose in its own scope note (`RECOVERY_DELTA_CLASS_SCOPE_NOTE`). This is exactly the kind of program-specific
  content Architecture Guidance's own still-pending Phase 5 (untangling program-specific narrative from reusable
  methodology inside the guidance files) is meant to address — and that phase hasn't started yet in this repo.

These two migrations aren't independent tracks. Deciding what "Baseline B" *is* — a string literal vs. a
referenceable entity ID — probably needs to happen before, or in lockstep with, deciding what counts as
generic-vs-program-specific guidance text in the same file. Recommend the PKM migration plan and the Architecture
Guidance Phase 5 work be sequenced with explicit awareness of each other, rather than assuming they can proceed on
independent timelines. (Note: this repo uses "Phase" for two different numbering schemes now — Architecture
Guidance's 5 migration phases, and this plan's 7 PKM migration phases. Worth being explicit about which "Phase 2"
or "Phase 5" a given conversation means going forward.)

---

## 2. Phase 3 should state the methodology/data split for Milestone explicitly

The plan correctly identifies that `SETR_EVENTS`/`SETR_GUIDANCE` already exist as structured data in the
methodology layer, making Milestone "promote existing structured content to queryable records" rather than
"invent new structure from prose." That's the right call, but the plan doesn't distinguish two different things
that both currently live under the `SETR_GUIDANCE` name:

- **The generic definition of what SRR/SFR/PDR/etc. *mean*** — this is genuinely program-agnostic methodology
  content and should stay in the methodology layer permanently, regardless of how many Milestone data records
  eventually exist.
- **A specific Baseline's actual Milestone instance** — e.g., "Baseline A's SRR happened on this date, with this
  status" — is real program data (CUI-shaped once real dates/content are involved), and belongs in the data layer
  under the new `Milestone` entity, not the methodology layer.

Given how much of this app's recent work was specifically about enforcing that separation (Architecture Guidance
§1.1's "editable override ≠ real separation" anti-pattern), it would be worth Phase 3 stating this distinction
explicitly, so introducing a new PKM-shaped `Milestone` entity doesn't quietly re-blend methodology and data the
same way the pre-migration guidance files did.

---

## 3. `AbCompatibilityRow` doesn't fit "belongs to one Baseline," and may be useful evidence for PKM's own open question #1

The migration plan doesn't address `AbCompatibilityRow` specifically, but it's a genuine outlier under a
Baseline-as-entity model. Its whole purpose is inherently **cross-baseline**: each record carries both
`baselineAState` and `baselineBIntent` describing the *same* UUT-relevant interface from both baselines'
perspectives simultaneously. Unlike `LogicalSubsystem`, `ConfigurationItem`, or `Specification` — which each
belong cleanly to exactly one Baseline — `AbCompatibilityRow` can't be given a single `baselineId` without losing
what the record actually represents.

This connects directly to PKM's own open question #1 (whether Baseline reconciliation deserves a relationship
field on Baseline itself, or a distinct, auditable `ReconciliationEvent` entity). `AbCompatibilityRow` is, in
effect, a working example of exactly that kind of record already — evidence comparing two baselines' state at a
point in time, with a `compatibilityStatus`, a `riskNote`, and a `lastReviewedDate`. Rather than forcing this
entity into a single-baseline scope during migration, it may be worth treating it as a candidate shape for
whatever `ReconciliationEvent` (or equivalent) ends up looking like when open question #1 is resolved — this app
already has lived experience with what fields that entity needs.

---

## Scope note

This document is feedback on the migration *plan*, not an instruction to change code. As the plan itself states,
each phase should remain independently testable against this app's illustrative/demo dataset before proceeding to
the next; nothing here should be read as approval to begin implementation.
