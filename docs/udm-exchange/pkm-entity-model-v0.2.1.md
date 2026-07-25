# Process Knowledge Model (PKM) — Entity & Relationship Model

**Version:** 0.2.1 (Exploratory / Draft — not yet implemented in any app)
**Last updated:** 2026-07-25
**Companion to:** Reusable SE Webapp Architecture Guidance v1.3.0 (§9, Forward Compatibility with a UDM)

**Changelog:**
- **v0.2.1** — Added SE Workbench's `AbCompatibilityRow` as real-world evidence toward open question #1 (§5). No structural change; documentation note only.
- **v0.2.0** — Corrected CI↔LogicalSubsystem relationship from one-to-many to many-to-many (§2, §3), per standard SE allocation-matrix practice (SEBoK Physical Architecture process). Resolves the conflict flagged in SE Workbench's v0.1.0 conformance review.
- **v0.1.0** — Initial draft.

**Scope:** This document defines the **Process Knowledge Model (PKM)** only — the public-safe, cross-program ontology of SE/PM/CM structure. It does **not** define the Product/Domain Knowledge Model (PDKM), which holds real CUI content and is out of scope here. No entity in this document may ever contain program-identifying content (real program names, real CI names, real requirement text) — those live only in a program's PDKM, linked by reference ID.

**Status note:** This is a draft for review, not a system to implement yet. It's being shared across apps (starting with the SE Workbench) to get implementation-level feedback before it hardens into something apps build against.

---

## 1. Grounding

This model draws on three disciplines, kept intentionally distinct because they define different things:

- **Program/Project Management (PMI):** a Program coordinates two or more Projects to realize benefits not achievable by managing them individually; Projects are temporary efforts focused on delivering defined outputs, while Programs focus on outcomes.
- **Configuration Management (EIA-649 / MIL-HDBK-61A):** a Baseline is a formally controlled configuration state at a point in time. Baselines progress through three technical types — Functional (performance requirements), Allocated (requirements distributed to elements), and Product (as-built, verified attributes) — each established at a specific lifecycle milestone (SFR, PDR/CDR-family reviews, PCA respectively). A separate Acquisition Program Baseline (APB) tracks cost/schedule/performance at the program level and is not a technical baseline.
- **Real-world CM practice:** more than one Baseline can legitimately coexist under the same Project — most visibly in modernization/obsolescence programs, where a mature legacy baseline and a new baseline under development run in parallel until reconciled. The model must support this as a normal case, not an edge case.

---

## 2. Entity Table

| Entity | Represents | Key relationships |
|---|---|---|
| **Program** | Coordinated benefit realization across Projects | has many Projects |
| **Project** | A temporary effort delivering a defined output | belongs to Program; has one or more Baselines over time |
| **Baseline** | A formally controlled configuration state at a point in time | belongs to Project; has `baselineType` (Functional / Allocated / Product / Acquisition-Program); established at a Milestone; may coexist with sibling Baselines under the same Project |
| **Milestone** | SETR gate (SRR, SFR, PDR, CDR, TRR, etc.) | belongs to Project; establishes one or more Baselines; has many ChecklistItems |
| **ChecklistItem** | A discrete readiness criterion within an SE domain | belongs to Milestone; evaluated against evidence from Requirement / CI / Deliverable / VerificationEvent |
| **LogicalSubsystem** | Functional decomposition layer | belongs to Baseline; allocated to/from CI(s) (many-to-many, see §3); may map to a physical enclosure/structure |
| **CI (Configuration Item)** | A structural node in the CI decomposition | belongs to Baseline; allocated to one or more LogicalSubsystems (many-to-many, see §3); satisfies Requirement(s); has Deliverables |
| **Requirement** | A structural requirement node (not the requirement text itself) | belongs to Baseline; satisfiedBy CI; traces to ParentRequirement; verifiedBy VerificationEvent |
| **Deliverable** | A document/artifact type (SSDD, RTM, TDP, SEMP, etc.) | required by Milestone; produced for CI or Project |
| **Gap** | A finding — missing, inconsistent, or non-compliant item | belongs to Baseline; blocks Milestone or ChecklistItem; references the entity it was found in |
| **ActionItem** | A remediation task | resolves Gap; assigned to a role (not a named person, by default) |
| **VerificationEvent** | Test / inspection / analysis / demonstration record | verifies Requirement; produces evidence for ChecklistItem |

---

## 3. Why Baseline sits between Project and everything technical, and why CI↔LogicalSubsystem is many-to-many

This is one structural change from the earlier sketch, and it matters: **CI, Requirement, and LogicalSubsystem are scoped to a Baseline, not directly to a Project.** Without this, "Baseline A's CI-042" and "Baseline B's CI-042" would collide on the same identity. With Baseline as an explicit parent, they're representable as related-but-distinct entities — which is exactly the reconciliation problem that shows up in real modernization/dueling-baseline programs.

A second correction from the initial draft: **CI and LogicalSubsystem relate many-to-many, not one-to-many.** Standard SE architecture practice (SEBoK's Physical Architecture process, consistent with INCOSE SE Handbook and ISO/IEC/IEEE 15288) treats function/logical-to-physical allocation as a matrix, not a tree — a physical architecture's expected output is an allocation matrix of functional/logical elements to physical elements, precisely because one physical element commonly serves multiple functions and vice versa. A CI mapping to more than one LogicalSubsystem is standard, expected architecture, not an anomaly to constrain away. This also means an "over-decomposition" or "integration bloat" signal — a CI carrying unusually many subsystem allocations — is a legitimate, representable finding, not something the model should structurally prevent. If a "primary" or "home" subsystem concept is still wanted for a given CI, express it as an attribute (e.g., a `primarySubsystemId` pointer alongside the full `subsystemIds` set), not by constraining the relationship itself.

```
Program
 └── Project
      ├── Baseline (Legacy / mature, e.g. near Product Baseline)
      │    ├── LogicalSubsystem ⇄ CI (many-to-many) → Requirement
      │    └── Milestone → ChecklistItem
      └── Baseline (New / in development, e.g. Functional→Allocated)
           ├── LogicalSubsystem ⇄ CI (many-to-many) → Requirement
           └── Milestone → ChecklistItem
```

A `reconciledFromBaselineId` / `reconciledIntoBaselineId` pair of reference fields is worth reserving on Baseline itself, to represent the eventual merge point without needing a special-case entity — open question, see §5.

---

## 4. ID & Reference Conventions (per Architecture Guidance §9)

- Every entity carries a stable, external ID meaningful outside any single app's database (e.g., `BASELINE-A`, `CI-042`, `REQ-118`), not just an internal auto-increment key.
- All relationships are explicit typed reference fields (`belongsToBaselineId`, `satisfiesRequirementId`, `blocksMilestoneId`), never denormalized text.
- No entity in this model holds content — only structure and references. Real content (what CI-042 actually is, what REQ-118 actually says) lives in a program's PDKM, keyed by these same IDs.

---

## 5. Open Questions for Next Discussion

1. **Baseline reconciliation** — does "reconciled into" deserve to be a relationship on Baseline (as sketched above), or a distinct event/entity (e.g., a `ReconciliationEvent`) given it's a significant, auditable act with its own evidence trail? **Real-world evidence:** the SE Workbench app's `AbCompatibilityRow` is a working example of this exact shape — each record compares the same interface across two baselines simultaneously (`baselineAState`, `baselineBIntent`), with a `compatibilityStatus`, `riskNote`, and `lastReviewedDate`, and cannot be assigned to a single Baseline without losing meaning. This is a strong signal toward a distinct `ReconciliationEvent`-style entity rather than a simple field on Baseline, though not yet a final decision.
2. **ChecklistItem domain tagging** — the earlier PDR readiness app groups checklist items into 7 SE domains. Should "Domain" be a first-class PKM entity, or just an attribute on ChecklistItem?
3. **Role model for ActionItem assignment** — "assigned to a role, not a person" was stated above as a default; worth confirming this holds across Program Management too (where accountability is often named), not just SE/CM.
4. **Program-level parallel Projects** — the model currently allows multiple Baselines per Project, but should it also explicitly allow a Program to run parallel Projects targeting the *same* eventual system (rather than only nesting parallelism inside one Project's Baselines)? This may matter for very large modernization Programs.

---

*This document is a companion artifact to the Architecture Guidance doc, not a replacement. Apps should continue following the Architecture Guidance for provider abstraction, vendoring, and directory conventions; this PKM model is what §9 of that document anticipates apps eventually consuming.*
