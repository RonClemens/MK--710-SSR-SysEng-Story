# SEMP Interview Transcript — Session 5, §2.3 Specialty Engineering

**Routing note:** Per established convention, this transcript is PDKM-adjacent and routes to SE Workbench's private repo, not `udm-exchange`. It contains Ron's direct programmatic answers, distinct from the PKM-safe generalized candidates already relayed separately (see `S5_PKM_ARCH_GUIDANCE_CANDIDATE_UPDATES.md`, an interim staging copy in this same directory pending proper commit to `udm-exchange` by that session).

---

## Topic 1: System Safety

**Scope decided:** Governing constraint for the whole §2.3 arc — every specialty entity must work as a simple list/spreadsheet for a small program and scale to full formal rigor for a large one, without two schemas. Hazard-related risks tracked separately from general program/technical risks (Ron's explicit instruction).

**People:** Approval authority structure —
- **System Software Safety Technical Review Panel (SSSTRP)** and **Weapon System Explosive Safety Review Board (WSESRB)** are fixed certification/approval boards for software safety and weapon-system/explosives safety, respectively.
- **Naval Ordnance Safety and Security Activity (NOSSA)** — Navy technical authority above WSESRB.
- **Principal for Safety (PFS)** — customer-side compliance-officer-equivalent role, interfaces between contractor and the certification boards. Aligned to the paying customer, not the contractor.
- Contractor side: **Program Manager and Lead Systems Engineer** handle safety directly on small programs; a dedicated **System Safety Engineering Lead** on large programs. No separate contractor-side safety POC role beyond this — PFS is purely a customer-side role.

**Process:** Hazard identified → contractor analysis → package submitted to customer's PFS → **PFS reviews and routes back until acceptable** (iterative loop) → package goes before the applicable board (WSESRB/SSSTRP/etc.) → residual risk accepted at tiered authority. Board approval is a **precondition**, not its own gating milestone — attaches as a `ChecklistItem` against the relevant existing SETR milestone (e.g., CDR), not a new milestone type.

**Tools:** Small programs use a spreadsheet/simple list for hazard tracking; large programs may use a dedicated Hazard Tracking System (HTS) product. No PKM-structural implication from tool choice itself.

---

## Topic 2: RAM (Reliability, Availability, Maintainability)

**Confirmed:** Full RAM-C apparatus scoping (RAM-C Rationale Report, FMECA, reliability growth, FRACAS) matches program practice at large scale; qualitative-only at small scale.

**Key decision:** Failure events are captured under **FRACAS starting after CDR** — documented program practice/timing, not a schema-enforced constraint (same treatment as other milestone-relative timing facts in this model).

---

## Topic 3: Human Systems Integration (HSI)

**Scoping decision:** This section narrowed to Human Factors Engineering specifically; Training and ESOH (both HSI sub-domains generally) handled in their own dedicated topics (10 and 5) to avoid double-tracking.

**Confirmed:** No severity/criticality scoring for HSI findings, unlike System Safety's hazard matrix — a simple `hsiRelated` flag on Requirement is sufficient.

---

## Topic 4: EMI/EMC

**Confirmed:** EMC requirements verified through standard `VerificationEvent` records (the MIL-STD-461 test itself is the verification) — no separate corrective-action loop distinct from normal requirement verification, unlike RAM's FRACAS.

---

## Topic 5: Environmental, Safety, and Occupational Health (ESOH)

**Confirmed:** Folds entirely into the `Hazard` construct from Topic 1 (new `hazardType` values for Environmental and Occupational Health) — no separate mechanism. NEPA-driven environmental compliance documents (EA/EIS) are a `Deliverable` type.

---

## Topic 6: Cybersecurity

**Key detail (Ron, verbatim substance):** As the system is developed by the contractor's team, it receives a **temporary/interim ATO based on a representative design baseline** submitted to the Authorizing Official. For longer programs, this temporary ATO gets **recertified before it expires**. **Before delivery, but after PRR**, the system needs **recertification by the customer for each related install site**, based on the conditional/temporary ATO package the contractor submitted.

This confirmed the need for a new time-bounded, multi-stage, potentially multi-site authorization-tracking entity (`AuthorizationEvent`) — a materially different shape than System Safety's simpler one-time board concurrence.

**Scale decision:** Site-level granularity kept lightweight — a plain `siteReference` string, not a first-class `Site` entity, pending further evidence from another topic.

---

## Topic 7: Production/Manufacturing Engineering & Supply Chain Management

**Confirmed:** Manufacturing readiness, supply chain risk, and parts/materials traceability all decompose into existing structure (`ChecklistItem` under PRR, `RiskItem`, and — after correction in Topic 8 — `TraceableUnit` rather than a `CI`-level attribute).

**Ron surfaced:** Larger programs sometimes maintain a **Hazardous Material Program Plan** — confirmed as a real DID pair: **DI-MGMT-81398** (HMMP Plan) and **DI-MISC-81397C/D** (HMMP Report), both based on AIA/NAS 411. Resolved as a `Deliverable` type; underlying hazmat composition content lives on `TraceableUnit`, not `CI`.

---

## Topic 8: Quality

**Key detail:** Nonconforming Material (NCM) tracking needs granularity at **"the lowest tracked/traced part, component, or unit level"** — below `CI`, which is a structural/type-level node only.

**Key detail, second exchange:** A CI's hardware units **might be assigned a different part number at a higher BOM level depending on which Baseline they're catalogued under** — the same physical unit can map to more than one `CI` record over its life as baselines reconcile. This directly drove `TraceableUnit.ciIds` as a plain array (not a single FK), consistent with the `CI.subsystemIds` precedent Ron confirmed as sufficient ("keep as is" — no per-association metadata/join entity needed).

This also corrected an earlier misstep in Topic 7, where pedigree/hazmat data had been provisionally proposed as a `CI`-level attribute — wrong granularity, corrected once the serialized-unit need became clear.

---

## Topic 9: Technical Manuals — Operations & Maintenance

**Confirmed:** Fully opaque `Deliverable` as far as this data model is concerned, regardless of authoring format (legacy MIL-STD-38784 vs. S1000D data modules) — no data-module-level traceability needed into PKM.

---

## Topic 10: Training

**Key detail (Ron, verbatim substance):** Certification/qualification tracking applies to large or small projects depending on product/system complexity, and — **if test equipment is involved — the related Unit Under Test (UUT) certifications for handling and testing**. Requirements often **direct the type of operator qualifications or minimum skillsets** required to operate or maintain the system.

This drove the new `Qualification` entity plus two linking arrays (`Role.requiredQualificationIds`, `Requirement.requiredQualificationIds`).

**Explicitly declined:** `VerificationEvent` is **not** gated by qualification level — confirmed as descriptive/structural tracking only, no enforcement relationship.

---

## Open items carried forward (unchanged from prior arc)

- `artifactRole` (§2.2 Candidate 8) — per-instance vs. fixed entity-type property, still unresolved.
- `TDP.level` progression (§2.2 Candidate 9) — single-record vs. three-superseding-records-per-CI, still unresolved; flagged as a good future §3.2.10 (Configuration and Change Management) interview question.
- Workbench branch `claude/udm-alignment-webapp-p5vvd0` — still not confirmed merged to `main` as of last check; non-blocking, noted for continuity.
