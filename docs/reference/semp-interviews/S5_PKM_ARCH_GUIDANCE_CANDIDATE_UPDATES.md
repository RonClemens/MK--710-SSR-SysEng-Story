# PKM Candidate Updates — S5, §2.3 Specialty Engineering

**Staging note (added by SE Workbench, not part of the original document):** This is an **interim copy**, held here only because it hasn't yet been committed to the canonical `udm-exchange` repo by that session. This document's own content-boundary declaration (below) says it's PKM-safe/generic — no real program content — so keeping a copy here poses no PDKM-exposure risk, but **this file is not the authoritative destination**. It is not implemented in this app's data model, and none of the entities/amendments below should be treated as canonical PKM until `udm-exchange` actually commits them and self-verifies per its own §3.1 discipline. Delete or mark superseded once the real commit lands.

---

**From:** Design Chat, Session 5
**Covers:** DoD SEP Outline v4.1 §2.3 interview arc, all ten Specialty Engineering topics
**Baseline for these candidates:** PKM Entity Model v0.8.0 / Architecture Guidance v1.8.0 (commit `85fceed`)
**Content-boundary status:** All items below pass the "same regardless of which program" test — no real program names, requirement text, or findings included.

---

## New entities

### 1. `Hazard` (Topic 1: System Safety; amended by Topic 5: ESOH)
Distinct from `RiskItem` — hazard causation/mitigation (physical/functional hazard → causal factor → order-of-precedence mitigation → residual risk) is a different analytical shape than program risk (likelihood × cost/schedule/performance consequence).

- `hazardType`: `Functional` | `Physical` | `Environmental` | `Occupational Health`
- `description`, `causalFactors`
- `severityCategory`, `probabilityLevel`, `riskLevel` (derived) — all **nullable**, populated only at formal-scoring scale
- `mitigationApproach`
- `residualRiskAcceptanceRoleId` (FK `Role`)
- `status`: `Open` | `Mitigated` | `Accepted` | `Closed` — own lifecycle, **excluded** from `LifecycleState` (same category as `RiskItem`/`Comment`/`ReconciliationEvent`/`ChecklistItem`)
- `escalatedToRiskItemId` (FK `RiskItem`, bridge — nullable)
- `submittedToAuthorityId` (FK `CertificationAuthority`, nullable)

**Grounding:** MIL-STD-882E hazard analysis process and safety order of precedence; DoD RIO Management Guide (for the `escalatedToRiskItemId` bridge pattern, consistent with `Gap.escalatedToRiskItemId` precedent).

### 2. `CertificationAuthority` (Topic 1: System Safety; generalized by Topic 6: Cybersecurity)
Originally scoped as `SafetyReviewAuthority`; generalized after a second domain (Cybersecurity's Authorizing Official) confirmed the same shape — a fixed, non-program-tailorable external certifying body, structurally distinct from `Role`.

- `authorityType` (open/extensible — e.g., "Explosives/Weapons Safety," "Software System Safety," "Cybersecurity Authorization")
- `parentAuthority` (self-FK — nullable; e.g., a service-specific board reporting to a higher technical authority)
- `serviceBranch`
- `applicabilityCondition` (why a given program is/isn't subject to it)
- `customerPointOfContactTitle` (descriptive string — a customer-side compliance-officer-equivalent role that interfaces between contractor and authority; not a `Role` reference, since it belongs to the customer's organization, not the program's own SE org)

**Grounding:** MIL-STD-882E (system safety certification boards); DoDI 8510.01 / NIST SP 800-37 RMF (Authorizing Official).

### 3. `FailureEvent` (Topic 2: RAM)
A recurring operational-loop entity (occur → report → analyze → corrective action → verify closed) — structurally distinct from `Gap`'s one-time finding.

- `failureMode`, `criticality`, `detectionMethod`, `rootCause`
- `occurredDate`, `reportedDate`
- `linkedCiId` (FK `CI`)
- `status`: `Reported` | `Analyzing` | `Corrective Action Assigned` | `Verified Closed`
- `resolvedByActionItemId` (FK `ActionItem`)
- `verifiedByVerificationEventId` (FK `VerificationEvent`)

**Grounding:** DoD Guide for Achieving Reliability, Availability, and Maintainability (RAM); RAM-C Manual (FMECA, FRACAS).

### 4. `AuthorizationEvent` (Topic 6: Cybersecurity)
Distinct from `Hazard.submittedToAuthorityId`'s simple one-time-concurrence shape — this is time-bounded, recurring, and can multiply by site at final stage.

- `certificationAuthorityId` (FK `CertificationAuthority`)
- `baselineId` (FK `Baseline`)
- `authorizationType`: `Temporary/Interim` | `Full/Final`
- `siteReference` (plain string, nullable — populated only at final multi-site stage; deliberately not a first-class `Site` entity pending further evidence)
- `issuedDate`, `expirationDate`
- `status`: `Active` | `Expired` | `Revoked` | `Pending Recertification`
- `submittedPackageDeliverableId` (FK `Deliverable`)

**Grounding:** DoDI 8510.01, NIST SP 800-37 (RMF: Categorize → Select → Implement → Assess → Authorize → Monitor).

### 5. `TraceableUnit` (Topic 8: Quality)
Physical/serialized-instance granularity below `CI` (which is a structural/type-level node, not a serialized instance). Supersedes an earlier, incorrect proposal to add pedigree/hazmat attributes directly to `CI` (Topic 7) — that granularity was wrong; corrected here.

- `serialNumber` / `lotNumber`
- `approvedSource`, `manufactureDate`, `hazardousMaterialComposition`, `counterfeitScreeningStatus`
- `ciIds: string[]` — plain reference array (consistent with `CI.subsystemIds` precedent), since a single physical unit can be associated with more than one `CI` record over time as baselines reconcile and part numbers change at higher BOM levels

**Grounding:** FAR 52.246-11 / AS9100 / ISO 9001 (Nonconforming Material control); NAS 411 / DI-MGMT-81398 (Hazardous Materials Management Program).

### 6. `Qualification` (Topic 10: Training)
Represents the *requirement* for a qualification, not personnel certification status (personnel records are PDKM-adjacent, out of PKM scope — same boundary that keeps `Role` a position, not a person).

- `qualificationType` / `name`, `description`
- `recertificationInterval` (nullable)
- `issuingAuthorityId` (FK `CertificationAuthority`, optional — for externally certified qualifications)
- `applicableCiId` (FK `CI`, optional — for equipment/UUT-specific certifications)

**Grounding:** DoDI 1322.18 (Instructional Systems Design / ADDIE process).

---

## Amendments to existing entities

| Entity | Change | Source topic |
|---|---|---|
| `Requirement` | New boolean `hsiRelated` | Topic 3 (HSI) |
| `Requirement` | New boolean `emiEmcRelated` | Topic 4 (EMI/EMC) |
| `Requirement` | New `requiredQualificationIds: string[]` | Topic 10 (Training) |
| `Role` | New `requiredQualificationIds: string[]` | Topic 10 (Training) |
| `Gap.foundInEntityType` | Closed union gains `TraceableUnit` | Topic 8 (Quality) |
| `ActionItem` | New `resolvesFailureEventId` (FK `FailureEvent`), alongside existing `resolvesGapId`/`resolvesRiskItemId` | Topic 2 (RAM) |
| `ActionItem` | New NCM disposition value set: `Use-As-Is` / `Rework` / `Repair` / `Scrap` / `Return-to-Vendor` | Topic 8 (Quality) |
| `ChecklistItem` | Evidence-source list expanded to include `Hazard` (alongside existing Requirement/CI/Deliverable/VerificationEvent) | Topic 1 (System Safety) |
| `Deliverable.type` | New values: Safety Data Package / HTS export; Environmental Assessment/EIS; HMMP Plan; HMMP Report; Technical Manual (O&M); Training Systems Plan; Training courseware | Topics 1, 5, 7, 9, 10 |

---

## Not included in this batch — explicitly deferred

- **Topics 7 and 9** (Production/Manufacturing & Supply Chain; Technical Manuals O&M) resolved into existing structure (`RiskItem`, `ChecklistItem`, `Deliverable`) with no new entities beyond what's listed above.
- **§2.2 Candidate 8 (`artifactRole`)** and **Candidate 9 (`TDP.level`)** remain open from the prior arc — not resolved here, not represented as resolved.
- **`Site`/install-location entity** — considered and deliberately deferred at `AuthorizationEvent.siteReference`; kept as a plain string pending a second confirming use case.

---

## Changelog note for udm-exchange

Please confirm resulting version numbers for PKM Entity Model and Architecture Guidance following this bump, per standard §3.1 self-verification, same pattern as commit `85fceed`.
