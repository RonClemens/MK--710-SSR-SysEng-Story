# SE Workbench

An editable, living Systems Engineering workbench for a defense acquisition
program — organized around a phase-driven guided navigation spanning the
full Major Capability Acquisition lifecycle (Materiel Solution Analysis
through Production & Deployment), not just PDR-era reconciliation, though
that remains one of its core capabilities. Replaces a static Word/PowerPoint
working paper with a single source of truth for CI inventory, delta/
traceability tracking, A/B baseline compatibility, COTS item records,
requirements and verification tracking, safety and program-planning CDRLs,
and recommendations, plus an AI assistant panel grounded in the app's
current data.

**All data shipped in this repo (MHC/MCC/IPS "Test Set" example) is
illustrative/demo data only — it is not real program data.**

## Read this before entering real data

This app is subject to CUI data handling requirements (NIST SP 800-171 / CMMC)
in a government contracting context. **The Anthropic public API is not
FedRAMP-authorized.** Do not enter CUI or program-sensitive data into the AI
Assistant panel until your program's security/ISSM office has cleared this
tool. See the in-app banner on the AI Assistant panel, and §6/§7 of the
original project brief for the full data-handling requirements this app was
built against.

The AI Assistant can be turned off entirely (both a client-side toggle and a
server-level `AI_ASSISTANT_ENABLED=false` switch) to use the app purely as an
editable data tool with zero external API calls.

## Architecture

- **`client/`** — React + Vite + TypeScript SPA. Editable CRUD tables for each
  entity, a CI detail rollup view, and a persistent AI Assistant drawer.
- **`server/`** — Express + TypeScript API. Persists data as a single JSON
  document (`server/data/db.json`, gitignored — seeded on first run from the
  `dataSource` file named in root `config.json`, defaulting to
  `mock-data/seed.json`). Hosts the AI provider abstraction so API
  keys/credentials never reach the browser.
- **AI provider abstraction** (`server/src/ai/`) — a single `AiClient`
  interface with two implementations selected by `AI_PROVIDER`:
  - `public` (default, built and tested against in this build phase) — calls
    Anthropic's public API directly.
  - `bedrock` (written, but **not exercised end-to-end** — no GovCloud access
    during this build phase) — targets Claude in AWS Bedrock GovCloud for a
    future CUI-capable deployment. Supports both bearer-token and IAM
    credential-chain auth. The `@anthropic-ai/bedrock-sdk` import is loaded
    lazily so an unused/untested install can never break the default `public`
    mode at server startup.

  Neither the UI nor the prompt-construction logic knows which provider is
  active — see `server/src/ai/index.ts`.

### Reusable SE Webapp Architecture Guidance compliance

This app is the reference implementation a companion cross-app architecture guidance doc (vendored at
[`vendor/architecture-guidance-v1.4.0.md`](vendor/architecture-guidance-v1.4.0.md)) was informed by — the current
guidance version is shown live in the app's bottom-right footer. That guidance separates a reusable
**methodology layer** (SE logic, prompts, checklists — public-safe, program-agnostic) from a **data layer**
(real program content — CUI-only, per-program). Its migration checklist has five phases; this app has completed
the first four:

- **`/methodology`** — `guidance/` holds the SE guidance modules the UI renders (relocated from
  `client/src/data/`, same content, new address); `prompts/` holds the two AI prompt templates
  (`system-prompt.md`, `pdr-summary.md`), loaded by both the server (`fs.readFileSync`) and the static client
  build (Vite `?raw` import) from one shared source instead of three hand-duplicated copies.
- **`/mock-data`** — the illustrative demo dataset (`seed.json` for the server, `seed.ts` for the static build),
  relocated from `client/src/data/seed.ts` and `server/data/seed.json`.
- **`/provider`** and **`/data-schema`** — documentation-only directories. This app's actual provider
  implementation (`server/src/ai/`) and data-shape definitions (`client/src/types/index.ts`) stay where Vite/
  Express project conventions expect them; each directory's `README.md` explains why physical relocation would be
  high-churn/low-value here, and documents the pragmatic adaptation explicitly rather than silently deviating
  from the guidance's literal directory convention.
- **Root `config.json`** — a `dataSource` pointer (defaults to `./mock-data/seed.json`), resolved by
  `server/src/db.ts` with a documented fallback when absent. Provider selection deliberately stays on the
  existing `AI_PROVIDER`/`AWS_REGION` env vars rather than moving into `config.json`, per the guidance's own
  scope note that `config.json` only needs to own settings without an existing home.
- **`CHANGELOG.md`** — records the vendored guidance version and this app's phase-by-phase migration history.

**Not yet done:** the guidance's fifth and highest-risk phase — untangling genuinely reusable SE methodology from
Baseline-A/B-specific program narrative that's still interleaved inside several files under
`/methodology/guidance` (most notably `recoveryProgramGuidance.ts` and parts of `dbxMbxGuidance.ts`/
`setrGuidance.ts`). See `/methodology/README.md` and `CHANGELOG.md` for what's flagged and why it's deliberately
sequenced last, file-by-file, rather than attempted as one large rewrite.

## Setup

```bash
npm install               # installs root + client + server workspaces
cp server/.env.example server/.env
# edit server/.env and set ANTHROPIC_API_KEY (and ANTHROPIC_MODEL if needed)
npm run dev                # runs server (port 3001) and client (Vite) together
```

Open the printed Vite URL (typically http://localhost:5173). The client proxies
`/api/*` to the server during development (see `client/vite.config.ts`).

To run without any AI features/API calls, set `AI_ASSISTANT_ENABLED=false` in
`server/.env` before starting — the server then never contacts the AI provider
even if it's misconfigured.

## Data model

Ten structured entities (see `server/src/types.ts` / `client/src/types/index.ts`),
plus an eleventh, `ContentEntry`, for editable site prose (see
[Editable site content](#editable-site-content) below):

- **Logical Subsystems** — the functional/behavioral decomposition layer this
  program's CI allocation skipped (it went straight from system-level
  requirements to physical CI allocation, organized around rack enclosures —
  see the existing SSDD). Each subsystem carries a `source`: `Validated`,
  `Proposed`, or `Inherited from SSDD structure — unverified` (i.e. lifted
  from the physical/rack grouping without independent functional validation),
  and a `baseline` (`Baseline A` / `Baseline B`) — Baseline A and Baseline B
  are **independently decomposed architectures**, not one shared structure
  with two states, so a Baseline B subsystem is its own record even when its
  name mirrors a Baseline A subsystem.
- **Configuration Items (CIs)** — inventory with Tier 1/2/3 classification,
  over-decomposition flagging, a `baseline`, and a **many-to-many** link to
  the subsystem(s) a CI serves (`subsystemIds: string[]` on the CI — not a
  single foreign key, since one CI legitimately can serve more than one
  subsystem, and should only reference subsystems of its own baseline). The
  UI visually flags CIs serving 2+ subsystems rather than hiding the overlap —
  that overlap is signal, not noise.
- **Delta / Traceability Matrix** — SFR-agreed allocation vs. as-built vs.
  disposition, scoped to Baseline A's internal reconciliation.
- **A/B Compatibility Matrix** — Baseline A vs. Baseline B state at
  UUT-relevant (Tier 1) interfaces.
- **COTS Item Records** — capability-based requirements, parts list, qualified
  alternates, obsolescence monitoring.
- **Recommendations / Action Items** — optionally linked back to a CI.
- **Interfaces** — a documented edge between two elements of the same type
  (`scope: "subsystem" | "ci"`, `aId`, `bId`, `description`), for the N²
  Diagram tab. The tab has its own **Baseline** selector (defaulting to
  Baseline A) that filters which subsystems/CIs feed both grids —
  `InterfaceRecord` itself carries no baseline field, since an interface
  between two Baseline-B-scoped elements is already implicitly Baseline B by
  virtue of the ids it references. Two N² grids are generated per baseline:
  Subsystem×Subsystem and CI×CI.
  Off-diagonal cells that share a linking CI (subsystem grid) or a linking
  subsystem (CI grid) are shown as a "derived" hint (○) — this is computed
  live from existing data, not stored. Clicking any cell opens an editor
  pre-filled with that hint where you can write and save a real documented
  interface, which persists as an `Interface` record and flips the cell to
  "documented" (●). Derived hints are a starting point, not a substitute for
  an actual documented interface. Any Subsystem×Subsystem cell can drill into
  a CI×CI view filtered to just the CIs behind that subsystem pair — useful
  for showing how many CI-level interfaces actually implement what looks like
  one clean subsystem-level interface (integration bloat).
- **Specifications** — DID-style HRS/SRS requirement specification templates
  (see `methodology/guidance/didGuidance.ts`), adapted from MIL-STD-961E System/
  Subsystem/CI specification conventions and the DI-IPSC-8143x SRS/SSS DIDs.
  Each spec has a `level` (System / Subsystem / CI), `domain` (Hardware /
  Software), `specType` (Development / Production), `baseline` (Baseline A /
  Baseline B), a `status`, an optional link to a Subsystem or CI (System-level
  specs aren't linked to either), and 12 DID-structured sections (scope,
  applicable documents, functional/performance, interfaces, environmental,
  design constraints, safety, security, human factors, logistics,
  verification provisions, notes). The Specifications tab surfaces the
  pros/cons of documenting requirements at each of the three levels and the
  distinction between Development specs (pre-CDR/TRR, requirements-based) and
  Production specs (post-qualification, references the validated design) —
  grounded in this program's own known issues (missing subsystem layer,
  over-decomposition, delta-matrix drift) rather than generic boilerplate.
  Section relevance (Required / Recommended / Typically N/A) is shown
  per-section based on the spec's level, as guidance rather than a hard gate.
  Baseline A and Baseline B are expected to mature through Development →
  Production at different rates while influencing each other at UUT-relevant
  interfaces — track that relationship via the A/B Compatibility Matrix, not
  by duplicating content across specs.

  The guidance also names which of the two core SE competencies each level
  leans on — **process knowledge** (the domain-independent "how": requirements
  discipline, decomposition, interface management, V&V, configuration
  management) versus **domain/product knowledge** (the "what": actual
  familiarity with this system's hardware, software, and operational
  context). System-level specs are **process-led**; HWCI/CSCI-level specs are
  **domain-led**; Subsystem-level specs sit where the two are **in tension** —
  choosing a real functional boundary takes domain judgment no process
  technique supplies, while documenting and maintaining it is process
  discipline. This program's SSDD-inherited, unverified subsystems are what
  happens when that process step gets skipped.

  The Specifications tab's guidance panel also covers **pointer
  specifications** — the higher-level industry/military standards a spec's
  Section 2 (Applicable Documents) cites and requires compliance with (MIL-
  STDs, ASME/ANSI standards, handbooks like the JSSSEH), as distinct from
  requirements this program authors itself (see
  `methodology/guidance/pointerSpecGuidance.ts`). The recommended approach: cite
  by reference rather than restating standard text, tailor each standard
  once (at the highest level it applies) rather than re-deriving the
  tailoring at every level, flow every applicable paragraph down into an
  actual verifiable "shall" with an assigned verification method, track
  revision level under configuration management, and don't cite a standard
  at a level it doesn't actually drive. An illustrative, non-exhaustive
  catalog covers MIL-STD-882E (System Safety) and the JSSSEH (its
  software-safety supplement), MIL-STD-1472 (Human Engineering, at System
  level and wherever a CI presents an operator interface), MIL-STD-28800
  (equipment ruggedization class, CI/Hardware-domain), and ASME Y14.100
  (engineering drawing practices, CI-level and Production-spec-era) — each
  with why it matters and the recommended cite/tailor/flow-down approach for
  this program's decomposition. The Specification Detail page also surfaces
  a pointer back to this guidance directly on the Applicable Documents field.
- **Safety Deliverables** — MIL-STD-882E/JSSSEH CDRL-style safety artifacts
  (see `methodology/guidance/safetyGuidance.ts`), one record per deliverable
  instance. Each has a `level` (System / Subsystem / CI — the same three
  levels as Specifications, just relabeled in safety vocabulary as System
  Hazard / Functional Hazard / Physical Hazard, derived rather than stored so
  the two can't drift out of sync), a `cdrlType` (e.g. Preliminary Hazard
  Analysis Report, Functional Hazard Analysis Report, System Hazard Analysis
  Report — filtered to what's relevant at the chosen level), an
  `applicability` (Development / Production / Both), a `baseline`, a
  `status`, an optional link to a Subsystem or CI, an illustrative
  `hazardExample`, a `cdrlDescription` of what the artifact documents, and a
  `deliveryMilestone`. The tab's guidance panel shows example hazards per
  category and the expected CDRL catalog per level before the CRUD list. See
  [System safety and the decomposition hierarchy](#system-safety-and-the-decomposition-hierarchy)
  below for how deliverable maturity should track Development vs. Production
  specs.
- **Program Planning Deliverables** — the same CDRL-per-instance shape as
  Safety Deliverables (`level`, `cdrlType`, `applicability`, `baseline`,
  `status`, optional Subsystem/CI link, `cdrlDescription`,
  `deliveryMilestone`), but for **non-safety** program and software planning
  artifacts (SEMP, CMP, Risk/Requirements/Data Management Plans, SDP, STP,
  SDD, VDD — see `methodology/guidance/planningGuidance.ts`; the Risk/Requirements/
  Data Management Plans were added specifically because DI-SESS-81785B
  paragraph 3.7 names them explicitly). Kept as a separate entity/tab
  rather than folded into Safety Deliverables' CDRL catalog, since a Software
  Development Plan is about how software gets built and verified, not what
  hazards it introduces.

### System safety and the decomposition hierarchy

MIL-STD-882E and the JSSSEH (Joint Software Systems Safety Engineering
Handbook) require hazard analysis and safety-requirements flow-down to ride on
the same System → Subsystem → HWCI/CSCI hierarchy IEEE 12207 formalizes,
rather than run as a parallel activity — see `methodology/guidance/safetyGuidance.ts`.
A hazard analysis performed against an unvalidated or over-decomposed
structure inherits that structure's weaknesses, so this app surfaces the
connection at the points where it actually bites:

- **Specifications tab** — a "System Safety Decomposition" guidance block maps
  the hazard analysis types most commonly cited under 882E/JSSSEH (FHA,
  PHA/SRHA, SSHA, SHA, O&SHA) to each level, and each specification's "Why
  {level}-level?" section and Safety Requirements row carry the same mapping
  in context.
- **Subsystem Detail** — a subsystem sourced `Inherited from SSDD structure —
  unverified` gets a callout: any Functional Hazard Analysis scoped to it
  inherits that same unverified functional boundary.
- **CI Detail** — a CI with the over-decomposition flag set gets a callout
  that a Subsystem/System Hazard Analysis scoped to it risks re-analyzing the
  same causal factor redundantly across CIs that should have been
  consolidated.
- **N² Diagrams** — a note that documented interfaces are also where
  interface hazard causal factors live (the System Hazard Analysis's core
  concern), so a derived-only cell is also an unassessed interface hazard
  boundary.
- **Delta / Traceability Matrix** — a note that this matrix is also where
  PHA/SRHA-derived safety requirements get verified as correctly allocated
  from system level down to the responsible CI.
- **Safety Deliverables tab** — actually tracks the CDRL instances the four
  bullets above only reference in passing: real records with a level, hazard
  category, CDRL type, applicability, baseline, status, and links to a
  Subsystem or CI, rolled up on both detail views the same way Specifications
  are.

The guidance prose above (framework intro, hazard category descriptions and
examples, CDRL descriptions, callout text) is editable in place the same way
as the DID guidance (see [Editable site content](#editable-site-content));
the Safety Deliverable *records* themselves are a normal CRUD entity like
everything else in the data model.

Each Safety Deliverable's `applicability` should track its corresponding
specification's maturity, not run ahead of or behind it: a CDRL marked
`Development` is expected to close out around the same milestone as the
matching Development spec (e.g. a Subsystem's FHA Report alongside its
Subsystem Development spec), while a `Production` CDRL — SHA, O&SHA, HHA —
shouldn't be finalized before the corresponding Production spec exists,
since it depends on the same as-built design maturity. `Both`-applicability
CDRLs (SSPP, SAR, Hazard Log) are program-wide and aren't gated by either.

### SRR → PRR: the full SETR arc, on both baselines

This app now models the whole SETR (Systems Engineering Technical Review)
sequence from System Requirements Review through Production Readiness
Review — see `methodology/guidance/setrGuidance.ts` for the guidance content,
shown on the Specifications tab's "SETR Milestones: SRR → PRR" section (all
eight events, four dimensions each: System Decomposition, System Safety
Planning, System Software Planning, Spec Generation) and, more narrowly, on
the Program Planning tab's own SETR section (the System Software Planning
dimension only, since that's this tab's focus).

**Baseline B tells the early half of the story** — it starts at its own SRR,
not as a placeholder:

- **SRR** is closed (System Requirements Specification `spec-003` is
  `In Review`; SEMP/CMP/SDP established, `plan-001`/`plan-002`/`plan-003`).
- **SFR** is mostly closed. Baseline B has its **own** Logical Subsystems
  (`sub-b-001`..`sub-b-003`), independently validated from Baseline A's — two
  cleared SFR (`Validated`), one (`Power Conditioning & Distribution`) is
  still `Proposed`. Subsystem-level Development specs (`spec-004`,
  `spec-005`) and Functional Hazard Analyses (`safety-008`, `safety-009`)
  exist for the two validated subsystems only.
- **SSR (Software Specification Review, confirmed by this program's LSE)** —
  closes out System/Subsystem-level Development specs before CI-level
  decomposition starts at PDR — hasn't been reached. `spec-005` (the
  Ethernet-based Diagnostic Messaging redesign) is flagged in its own notes
  as the most likely to slip SSR if its FHA (`safety-009`, still `Draft`)
  doesn't close first.
- **PDR through PRR**: not reached. Consistent with that, Baseline B has
  **no CI-level specs, Safety Deliverables, Program Planning Deliverables, or
  CIs at all** — physical decomposition is a PDR-era activity, and their
  absence is the correct state, not a gap to fill in.

**Baseline A tells the later half** — it's the "approaching System TRR"
baseline this app's PDR-reconciliation effort exists to reconcile:

- **PDR/CDR**: CI-level decomposition happened (`ci-001`..`ci-005`), but
  imperfectly — MCC and IPS are the over-decomposition finding a proper PDR
  disposition should have caught (see CI Inventory, `rec-001`). A Software
  Design Description for the Test Set CI (`plan-005`) is `In Review`, in
  step with that same CI's still-unresolved Development spec (`spec-002`).
- **TRR**: approaching, not yet reached. CI-level System/Operating & Support
  Hazard Analyses (`safety-005`, `safety-006`) and the Test Set CI's Version
  Description Document (`plan-006`) are all still `Draft` — exactly what
  TRR-era artifacts should look like before the gate, not after it.
- **SVR/PRR**: not yet reached — no Baseline A spec has transitioned to
  Production type yet, which is the whole point: this program's
  reconciliation problem is what happens when that transition gets attempted
  before the underlying CI structure and traceability are actually sound.

The point of modeling it this way: SRR through PRR aren't independent
checklists. Each gates what the next is allowed to assume, and System
Decomposition, System Safety Planning, and System Software Planning are
expected to mature together at each event — not for one to run ahead of or
behind the others.

All entities are fully CRUD-editable in the UI (add/edit/delete, no page
reloads). The CI Detail view rolls up every related row for a given CI,
including its linked subsystems (and which other CIs also serve them), any
linked specifications, safety deliverables, and planning deliverables; the
Subsystem Detail view is the mirror image.

### Technical Data Package (TDP) alignment — MIL-STD-31000 / EIA-649 / IEEE 12207

The SETR sequence, spec maturity, and Program Planning CDRLs above aren't
just internally consistent with each other — they're aligned to three
external standards that define what a real program's Technical Data Package
and configuration management program actually require (see
`methodology/guidance/tdpGuidance.ts`):

- **MIL-STD-31000 (Technical Data Packages)** — defines three TDP maturity
  levels: **Conceptual** (requirements only, no design committed — SRR
  through SFR), **Developmental** (preliminary/detailed design data, not yet
  test-verified — SSR through TRR, correlating directly to this app's
  Development spec type), and **Product/Production** (as-built,
  qualification-verified design data — SVR through PRR and beyond,
  correlating to this app's Production spec type). Each of the eight SETR
  events on the Specifications and Program Planning tabs now carries an
  explicit **TDP Maturity** field alongside its existing System
  Decomposition / Safety Planning / Software Planning / Spec Generation
  guidance, and the Specifications tab has its own "Technical Data Package
  (TDP) Alignment" section mapping MIL-STD-31000's TDP content elements
  (engineering drawings, specifications, standards, software documentation,
  QA provisions, packaging) to which entity/tab in this app already captures
  each one — and flagging the two (drawings, packaging) this app deliberately
  doesn't model as structured data.
- **EIA-649 (Configuration Management)** — its five CM functional areas
  (Planning, Identification, Change Management, Status Accounting,
  Verification and Audit) turn out to already be implemented by mechanisms
  this app had before this update, just not named as CM: the independent
  Baseline A/B decomposition *is* Configuration Identification; the Delta
  Matrix's "ECP required" disposition *is* Configuration Change Management;
  every status field *is* Configuration Status Accounting. The Specifications
  tab's TDP Alignment section names this mapping explicitly. The Functional
  and Physical Configuration Audits — EIA-649's Verification and Audit
  function — map onto this app's own SETR sequence as **SVR (FCA)**, which
  gates a spec's Development → Production transition item by item, and
  **PCA**, performed at or shortly after **PRR**, which closes out
  Product-level TDP maturity by confirming the as-built article and drawing
  package match the Production spec.
- **IEEE 12207 (Software Life Cycle Processes)** — its technical process
  groups are condensed to the granularity this app's software-relevant
  Program Planning CDRLs already operate at, and mapped on the Program
  Planning tab's own "IEEE 12207 Software Life Cycle Alignment" section:
  Requirements Definition → SDP, Architecture and Design Definition → SDD,
  Verification and Validation → STP/STD, Transition → VDD (Implementation
  and Integration has no dedicated CDRL in this app's catalog — tracked via
  spec status and the Delta Matrix instead).

As with the DI-SESS-81785B SEMP section mapping, this is a best-effort
alignment, not a verified citation against your program's actual application
of these standards — every piece of it is editable via Edit Mode, and the
SEMP Migration export (below) pulls the live, possibly-edited version of all
three, including a dedicated "Technical Data Package (TDP) Management"
section in the exported SEMP outline.

### Document-Based (DBx) vs Model-Based (MBx) Systems Engineering

**The concrete reason a program shifts from DBx to MBx is traceability and
change-impact analysis, not tooling fashion** — every other benefit
(consistency, single source of truth, automated views) is downstream of that
one, and this app's guidance leads with it rather than burying it in a
neutral feature comparison. In DBx, a change to one requirement or
architecture element is only as traceable as the people who remember to walk
every dependent document and update it — the same manual-synchronization
failure this app's own Delta Matrix exists to catch after the fact, and
exactly what let this program's Baseline A CI over-decomposition go
unnoticed for years. In MBx, that relationship is a first-class link inside
the model: change-impact analysis becomes a query instead of an archaeology
exercise across a document set.

Every SE activity above can be executed two ways, independent of which
review gate or CDRL governs it (see `methodology/guidance/dbxMbxGuidance.ts`,
`client/src/components/DbxMbxCard.tsx`):

- **Document-Based (DBx)** — text specifications, ICDs, hazard-analysis
  reports, and plans are the authoritative artifacts, cross-referenced by
  hand. Correct only as long as whoever updates one side of a cross-
  reference remembers to check the other.
- **Model-Based (MBx)** — per the DoD's 2018 Digital Engineering Strategy, a
  single connected model (typically SysML) is the Authoritative Source of
  Truth; documents, where they still exist, are generated views into it
  rather than independently authored deliverables. Consistency is enforced
  by the model itself rather than by discipline.

This guidance appears — via a shared `DbxMbxCard` component and a common
`dbxMbx.*` content-key namespace, so an edit to one instance shows up
consistently wherever that dimension is referenced — on **six tabs**, one
dimension each: **Subsystems** and **CI Inventory** (Systems Engineering &
Decomposition), **N² Diagram** (Interface Management), **Specifications**
(Specification Writing), **Safety Deliverables** (System Safety Analysis),
and **Program Planning** (Program Planning & Execution). Each dimension
names the DBx approach, the MBx approach, the tradeoff between them, and —
deliberately, not glossed over — an honest note on where **this app itself**
sits: a relational document/database staging tool, not a SysML/MBSE
environment. The N² Diagram's "derived hint" cells are the one place this
app borrows an MBx-*inspired* idea (a live-computed relationship, not a
manually maintained record) without being an actual model; every other tab
is DBx in the fullest sense, cross-references and all — including the SEMP
Migration export itself, which is a generated Markdown document, not a
connected model. The SEMP export's 2.4 "Modeling Strategy" section — the SEP
Outline's own real anchor for a program's modeling-strategy discussion —
carries the full six-dimension table.

#### Caught between DBx and MBx: the transition period

Most programs don't switch in one step — they spend a period straddling
both, and a shared `DbxMbxTransitionGuidance` component (rendered on the
**Program Planning** tab and the **SEMP Migration** tab's 2.4 Modeling
Strategy section) makes the case that this period is not simply "doing both
approaches at once." It's structurally worse than either pure state: two
sources of truth exist simultaneously and can diverge, reintroducing the
exact manual-synchronization risk MBx was adopted to eliminate — smaller and
more insidious, since whoever's looking at either artifact has no way to
know it's already drifted from the other. Three dimensions of friction are
named explicitly, each with the concrete extra work required while
straddling:

- **Customer Expectations** — a customer's own review process may lack the
  tooling or trained reviewers to accept a native model as evidence, and
  trust in an unfamiliar model-based artifact has to be earned over a
  visible period; every model-based artifact needs a translated document
  view for as long as that takes.
- **Team Organization and Expertise** — DID-structured document authorship
  and SysML/MBSE model authorship are different skill sets requiring real
  training investment, not a tool license; a team split between
  document-fluent and model-fluent staff pays a coordination tax until
  training closes the gap.
- **Planning and Execution** — SE cost/schedule estimates built on "time to
  write a document" don't transfer to "time to mature a model," and SETR
  entry/exit criteria have to be explicitly redefined for model-based
  artifacts; the concrete cost is dual configuration control (baselining
  both the model and the documents, EIA-649 Configuration Identification and
  Status Accounting applied twice) plus periodic reconciliation, treating
  any model/document divergence the same way this app's own Delta Matrix
  treats a requirements gap — a disposition-required finding, not a
  footnote.

**This program's complicating factor**, in its Lead Systems Engineer's own
assessment: Baseline A already has a mature Design/Product Baseline, but its
earlier Functional and Allocated Baseline documentation — especially
CI-specific requirements documentation — is poor or effectively
nonexistent. That's exactly the specification-tree gap the OSD SEP Outline's
own Figure 2.1-1 (Functional Baseline → Allocated Baseline → ... → Product
Baseline) expects to be filled in sequence, and exactly what this app's own
Subsystems tab ("Inherited from SSDD structure — unverified") and thin
CI-level Development specs already surface as a live finding, not a
historical footnote. In this LSE's expert opinion, this asymmetry is one of
the fundamental reasons Baseline A's prior development effort was never
completed successfully on schedule. This complicates the DBx/MBx
co-existence assessment in three concrete ways: a pure-DBx program can let
this exact asymmetry develop silently (which is precisely how it went
unnoticed for years); MBx doesn't automatically fix it either, since a model
built forward from an already-mature Product Baseline inherits the same gap
by omission unless the team deliberately reconstructs the missing
relationships; but the transition is also the first real structural
opportunity to close the gap for good, by building the missing layer as
enforced model relationships instead of backfilled documents nobody will
maintain either.

Also this program's live state, not a hypothetical: the **Statement of
Work still contracts DBx CDRL deliverables** — Development/Production
specs, ICDs, and the other document-shaped artifacts this app itself
models — while the actual engineering work increasingly happens natively in
MBx/PLM tools: **Cameo** (Systems Modeler / Enterprise Architecture) for the
SysML model, **PTC Codebeamer** for requirements/ALM, and **Aras
Innovator** for PLM. That's the Customer Expectations friction dimension
above, playing out concretely: every CDRL due against the SOW has to be
generated from these tools' native model, requirements, and PLM records
into a document format the SOW and the customer's review process actually
expect, for as long as the SOW keeps specifying DBx-shaped deliverables
instead of model-based ones.

Five concrete mitigations are named so the straddling period stays temporary
rather than becoming permanent by default: naming an explicit authoritative
source per artifact type in writing, treating divergence as a tracked
finding on a reconciliation cadence, a staged customer trust-building
roadmap, redefined SETR entry/exit criteria for model-based artifacts before
the first review that needs them, and an explicit sunset gate for the hybrid
state itself.

### Recovery program context, recurring technical activities, and IPPD corrections

A companion repo, `RonClemens/IPPDTraining`, holds this program's own IPPD
onboarding curriculum, and several of its program-specific facts have been
folded into this app directly (with real names genericized to role titles —
LSE, CE, PM, etc. — since this app is public-facing and that curriculum
isn't). Three corrections from this program's Lead Systems Engineer,
specifically, are now reflected:

- **SSR is Software Specification Review**, not "System Specification
  Review" — this app previously hedged the name as an unverified working
  assumption; that hedge is now resolved (`methodology/guidance/setrGuidance.ts`).
- **CI Tier doubles as Baseline B's configuration-delta classification.**
  Per this program's LSE, this app's existing CI Tier field isn't just a
  criticality ranking on Baseline B — assigning a CI's Tier **is** the
  decision of how much of that CI's prior design carries forward versus
  needs rework, mapped Class 1 (Carry Forward) → Tier 3, Class 2 (Modified)
  → Tier 2, Class 3 (Re-Architected) → Tier 1. See
  `methodology/guidance/recoveryProgramGuidance.ts`, rendered on the **CI
  Inventory** tab (under the DBx/MBx guidance toggle) and folded into the
  SEMP export's 2.2 Architectures and Interface Control section. The scope
  note is explicit that this mapping is Baseline-B-specific, not a general
  MIL-STD-961E tiering rule asserted for Baseline A or programs generally.
- **Technical Reviews extend past the eight SRR→PRR milestone gates.** The
  SEP Outline's own 3.2.13 section title is "Technical Reviews, Audits and
  Activities" — broader than just the eight named events. Four recurring
  activities that fill the space between milestone gates are now modeled
  alongside them: **Internal Technical Interchange Meeting** (no customer
  attendance, cross-discipline working session), **External TIM**
  (customer-facing, narrower in scope than a milestone review but still
  formally minuted), **Design Review** (subsystem/CI-level peer review, the
  informal counterpart to PDR/CDR), and the **Change (Control) Review Board
  (CCB)** — the actual governance mechanism behind this app's Delta Matrix
  "ECP required" disposition and EIA-649 Configuration Change Management.
  See `methodology/guidance/setrGuidance.ts` (`RECURRING_TECHNICAL_ACTIVITIES`),
  rendered on the **Specifications** tab beneath the SETR Milestones grid
  and folded into the SEMP export's 3.2.13 Technical Reviews, Audits and
  Activities section.

## Linked files/documents

CIs, COTS Item Records, Specifications, Safety Deliverables, and Program
Planning Deliverables can each carry an `attachments: Attachment[]` field
(`{ label, url }`). This is **link-only** — the app never stores or uploads
file content, only a label and a URL pointing at wherever the real document
already lives (SharePoint, DOORS, a network share). Edited as free text, one
`label | url` per line, the same convention as `qualifiedAlternates` on COTS
records, and rendered as clickable 📎-prefixed pills wherever the record
appears (list tables, CI/Subsystem detail rollups).

This was a deliberate scope decision, not a v1-of-something-bigger: this app
is a staging tool, not a CM system of record, and storing real program files
here — especially in the public static/Pages build — would be exactly the
kind of CUI exposure the [security banner](#read-this-before-entering-real-data)
above exists to prevent. If you need actual file storage, that belongs in
your program's real CM system; this app just needs to point at it.

## SEMP Migration

The **SEMP Migration** tab produces a single downloadable Markdown file that
maps this app's current content — including any Edit Mode changes — onto a
Systems Engineering Management Plan (SEMP) section structure built from two
verified source documents, both supplied by this app's user and read
directly (not scraped): the governing DID, **DI-SESS-81785B** (approved
2025-01-08), and the **Department of Defense Systems Engineering Plan (SEP)
Outline, Version 4.1** (May 2023, OUSD(R&E), Distribution Statement A —
publicly releasable; `methodology/guidance/sempGuidance.ts`,
`client/src/utils/sempExport.ts`).

**Unlike most DIDs, DI-SESS-81785B does not prescribe a fixed table of
contents.** It says outright: *"2. Format. The SEMP format shall be selected
by the contractor."* Content-wise, it requires the SEMP to "be consistent
with and address all topics in the government SEP, if available. In the
absence of a government SEP, the SEMP shall address the topics in the OSD SEP
Outline active at the time of the RFP." So the section list on this tab
mirrors the **SEP Outline's own real section numbers** — 1 (Introduction),
2.1–2.6 (Program Technical Definition: Requirements Development,
Architectures and Interface Control, Specialty Engineering, Modeling
Strategy, Design Considerations, Technical Certifications), 3.1 and
3.2.1–3.2.13 (Program Technical Management), and its Appendices B–E and
closing References section — not a fabricated generic outline, and a richer,
more authoritative structure than the bare DID paragraph list this tab used
before.

Two real anchors are worth calling out because they line up unusually well
with what this app already tracks:

- **2.4 Modeling Strategy** literally asks the program to *"define the
  modeling strategy to be used (model-supported, model-integrated, or
  model-centric)"* — this is the real-document home for the Document-Based
  (DBx) vs Model-Based (MBx) guidance repeated across six tabs (see
  [above](#document-based-dbx-vs-model-based-mbx-systems-engineering)); the
  full six-dimension table is reproduced here.
- **2.1 Requirements Development**'s own sample table is literally a
  *"Requirements Traceability Matrix (mandatory)"* with a per-requirement
  verification-method column — a direct match for this app's Delta Matrix
  and each Specification's Verification Provisions section.

**One honest limitation:** the uploaded SEP Outline PDF is 20 pages, but the
document's own table of contents runs to page 58 — so this app has verbatim
body text (the actual "Expectation:" requirement language) only through
section 2.5. Sections 2.6 onward — all of Section 3, and the Appendices —
have their **section numbers and titles verified against the real table of
contents**, but not their specific required content; this app's mapping for
those is a reasonable inference from the title and general DoD SE practice,
not a citation. Every section on the SEMP Migration tab is tagged
**Verbatim-verified** or **Title-verified** accordingly, and several genuine
gaps are called out rather than papered over: Technical Performance
Measures, Reliability and Maintainability Engineering, Manufacturing and
Quality Engineering, Corrosion Prevention and Control, Technology Insertion
and Refresh, System Security Engineering, Technical Certifications, and
Technical Planning (staffing/schedule/WBS) are all real SEP Outline sections
this app does not model. Two things also remain genuinely unverified beyond
the section structure itself:

- If your program has an actual **government-furnished SEP**, the DID
  requires this SEMP to be consistent with *that* document first — this app
  has no visibility into it and can't substitute for it.
- **IEEE 24748-7:2019** and **IEEE 24748-8:2019** (the DID's own cited
  reference standards for SE application and technical reviews/audits) are
  typically available only via an IEEE subscription — this app's SETR event
  names and entry/exit criteria (SRR/SFR/SSR/PDR/CDR/TRR/SVR/PRR) haven't
  been checked against IEEE 24748-8's actual defined review/audit set.

Section 1 (Introduction) is where the SEP Outline asks the program to
*"describe the program's plan to align the Prime Contractor's SEMP with the
PMO SEP"* — this app supplies the contractor-side half of that via an
**INCOSE / ISO-IEC-IEEE 15288 process-group mapping**
(`methodology/guidance/incoseGuidance.ts`, rendered on this tab below the section
mapping), covering all four 15288 process groups (Agreement, Organizational
Project-Enabling, Technical Management, Technical) and naming which of this
app's tabs implements each sub-process — including the honest gaps
(Agreement Processes and Organizational Project-Enabling Processes sit above
the level of individual technical artifacts this app models). The
government-side column still requires your program's actual government SE
process documentation. Section 3.2.10 (Configuration and Change Management)
is where DI-SESS-81785B paragraph 3.7's named *"risk management plan,
requirements management plan, data management plan, and configuration
management plan"* live — the Program Planning tab's System-level CDRL
catalog gained Risk Management Plan, Requirements Management Plan, and Data
Management Plan entries specifically because that DID paragraph names them
(Configuration Management Plan was already modeled).

**This is a manual, one-way export, not an integration.** This app has no
network path to any other tool or machine, and is not meant to have one — the
whole point of the CUI-avoidance decisions elsewhere in this README (link-only
attachments, no CUI in the AI Assistant) is that this app stays outside the
CUI boundary. If you're authoring a real SEMP on a separate (e.g. CUI) system:

1. Open the **SEMP Migration** tab and click **Download SEMP Migration
   Package (.md)**. The file contains only what's already visible in this
   app's illustrative workbench data — it is not CUI by construction, but
   review its contents yourself before moving it anywhere, since it will
   reflect whatever real data you've entered.
2. Move the downloaded file to your CUI-side environment using your
   organization's own authorized transfer process (approved removable media,
   an approved file-transfer gateway, etc.). This app cannot do that step for
   you and does not try to.
3. On the CUI side, manually incorporate each section into the SEMP you're
   authoring there, using the file's section-by-section structure as a
   drafting aid and cross-check — not as a finished, ready-to-sign document.

Every section number, title, and "source in this app" description on the
SEMP Migration tab is editable via Edit Mode (see below) so any of the
title-verified-only sections, the flagged gaps, or the still-unverified
government-SEP/IEEE 24748-7/8 items above can be corrected to match your
program's actual governing documents before exporting; corrections are
picked up by the next export automatically.

Explicit non-goal: no direct integration with any other tool (no API push, no
file write to a shared/mounted location) — see
[Non-goals](#non-goals-v1).

## Acquisition Phase Workbench

The app's **default landing view** is no longer the flat tab bar — it's a
"left-to-right," time/phase-driven guided navigation built around the DoD
Adaptive Acquisition Framework's Major Capability Acquisition (MCA)
pathway: Materiel Solution Analysis → Technology Maturation & Risk
Reduction → Engineering & Manufacturing Development → Production &
Deployment → Operations & Support.

- **Phase taxonomy** (`methodology/guidance/aafPhaseGuidance.ts`) bands the
  same 8 SETR events this app already tracks (SRR through PRR) under the 5
  MCA phases, the same banding technique `tdpGuidance.ts` already uses for
  TDP maturity levels and IEEE 12207 software life-cycle groups — this is a
  coarser lens over existing data, not a new taxonomy competing with it.
  Materiel Solution Analysis and Operations & Support are explicit,
  visibly-marked **stub phases**: this app's SETR modeling only spans
  SRR–PRR, so those two phases show an out-of-scope note rather than
  fabricated content. The pathway type (`AcquisitionPathway`) is
  deliberately a one-member union (`"MCA"` only) — extensible later if a
  program needs a different AAF pathway, but no pathway-selection UI or
  schema field exists yet, since there's only one option to choose from
  today. **PKM Migration Step 9** (per PKM Migration Plan v0.3.0 §8)
  confirmed this stays a plain union, not a data-layer entity: it's already
  PKM-conformant as a stable, external, human-meaningful id, and its
  name/definition are DoD AAF doctrine identical for every program, not
  per-program data.
- **Baseline selector + phase stepper**: pick a baseline (Baseline A /
  Baseline B), and the stepper highlights that baseline's *current* phase —
  derived client-side from its `Milestone` records (the first SETR event
  that isn't yet `Complete`), not a stored field. Browsing a different phase
  than the current one shows its guidance and gate context read-only. This
  "derived, not stored" choice for current-phase was likewise confirmed,
  not revisited, by Step 9 below.
- **Milestone A/B/C occurrence tracking (PKM Migration Step 9, additive;
  consolidated into `Milestone` per PKM Migration Plan v0.3.0 §8).** The
  entry/exit gate shown for each phase (Milestone A/B/C) has a real,
  per-baseline occurrence record behind it — status and dates, click-to-set
  the same way Safety/Program Planning CDRL status already works in the
  panel below it — rather than only the static gate name/decision-summary
  text these gates originally showed. This was first built as its own
  standalone `AcquisitionMilestone` entity (Step 8), then folded into the
  `Milestone` entity itself via a `milestoneType: "SETR" | "AcquisitionGate"`
  discriminator once the canonical PKM model settled on one entity rather
  than two parallel ones — the same "promote existing structured content to
  queryable records" move Step 3 made for SETR Milestones, just consolidated
  under one type. The generic definition of what each gate *means* stays in
  `methodology/guidance/aafPhaseGuidance.ts` permanently; only the
  per-baseline occurrence (did this baseline actually pass Milestone B, and
  when) is queryable data. The standalone `AcquisitionMilestone` entity is
  deprecated but still present (coexist-then-deprecate window) — see
  `client/src/types/index.ts`'s comments on both types for the full
  reasoning, including why AAF gates are a `milestoneType` on `Milestone`
  rather than a broadened `MilestoneEvent`.
- **Guided checklist panel**: when viewing a baseline's current phase, a
  domain-grouped, click-to-answer panel over that milestone's `ChecklistItem`
  records appears — status toggles (Not Evaluated/Met/Not Met/Waived) save
  immediately on click, and a full-record edit/create form covers everything
  else. This is the first real consumer of `ChecklistItem`'s own
  forward-compatibility design intent from the PKM migration (a discrete,
  user-answerable criterion + toggleable status + evidence reference).
- **The original flat tab bar is fully preserved**, reachable via the **All
  Tabs** toggle in the header (or the button inside the workbench itself) —
  nothing about the 12 existing tabs' internals changed. Which view you land
  on is remembered per-browser via `localStorage`, the same pattern used for
  Edit Mode.

## PDKM Promises

The **PDKM Promises** tab is a read-only, cross-entity browser over every
field this app marks `@domain-placeholder` in its type files (see
`data-schema/DOMAIN_PLACEHOLDER_FIELDS.md` for the full manifest). Every row
is a real value from a real record currently in this app's data — a CI name,
a hazard example, a spec section's text — framed as a *promise*: in the
spirit of a promissory note, this app commits that each of these fields will
be updated once a real Product/Domain Knowledge Model (PDKM) exists for the
program a given deployment actually serves, arriving either through a
landing zone upload (a technical or management source file ingested through
this app's import path) or direct user data entry through each entity's own
tab. The tab itself has no edit affordance — it exists to make that
inventory browsable and filterable by entity type, not to replace each
entity's own editing UI.

## Editable site content

Beyond the structured entity data above, most of the app's guidance prose
(the DID level pros/cons/competency framing, spec-type guidance, section
descriptions, page hints, and a few SE-judgment sentences on the CI/Subsystem
detail views) is itself editable in place, versioned separately from the
structured entities:

- Click the pencil **FAB** in the bottom-left corner to enter Edit Mode —
  it prompts for a password (currently a hardcoded placeholder, `edit`; not
  real access control, just deliberate friction against accidental edits
  while multiple people share this environment). The FAB turns amber while
  active; click it again to exit (no password needed to leave). The on/off
  state persists per-browser via `localStorage`. While on, editable prose is
  outlined with a pencil (✎) button; click it to open an editor with
  Save/Cancel, a **Reset to original** option (removes the override,
  reverting to the hardcoded default), and a **version history** panel
  listing every prior value with a **Revert to this** action per entry.
  Saved overrides are visible immediately whether or not Edit Mode is on —
  Edit Mode only controls whether the pencil buttons themselves are shown.
- Backed by a ninth entity, `ContentEntry` (`key`, `value`, `history[]`,
  `updatedAt`), stored the same way as the rest of the data — server-side
  JSON in normal mode, `localStorage` in the static/Pages build — and
  included in Export/Import.
- Coverage is broad: every page heading, section label, hint, and empty-state
  message is editable, not just prose paragraphs — the app's *content* (what
  it says) is editable throughout, versioned the same way as everything else.
- Deliberately out of scope: true UI controls (button and tab labels — the
  editor can't nest inside an interactive element without breaking HTML),
  table column headers and entity form field labels (schema-level, not
  content), and the AI Assistant panel's CUI/security banner specifically —
  that stays fixed regardless of Edit Mode, since drifting security-relevant
  copy is a risk this feature shouldn't introduce.
- This is a content-versioning layer, not a program-data audit trail — it
  exists so the app's own guidance text can be refined in place by whoever's
  using it, with a way to see what changed and undo it.

## AI Assistant

- Every chat/summary request sends the app's **full current dataset** as
  context (see `server/src/ai/context.ts`), so the assistant can answer
  cross-cutting questions ("which CIs are still TBD and blocking PDR exit?").
- The "Generate PDR Readiness Summary" button produces a markdown summary
  (baseline fundamentals, CI over-decomposition, delta matrix, A/B alignment,
  recommendations) that can be copied directly into a working paper.

## Export / Import

Independent of the AI features: "Export JSON" downloads the entire dataset;
"Import JSON" replaces it from a file (with a confirmation prompt, since it's
a full overwrite). Use this for backup/portability, or to move data between
machines.

## Static demo deployment (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds and publishes the `client/` app
(only) to GitHub Pages on every push to `main` or the active working branch.
This is a **temporary, interim deployment** for iterating together before the
app moves to a CUI-capable environment (e.g. an internal GitLab instance) —
it is not the intended long-term home for this tool.

Because GitHub Pages is static hosting, there is no backend in this build:

- **Data** lives in the browser's `localStorage` instead of the server's JSON
  file. Seeded from `mock-data/seed.ts` (same illustrative data as
  `server/data/seed.json`) on first load. Data does not sync between devices
  or browsers, and clearing site data resets it back to the seed.
- **AI Assistant** calls `api.anthropic.com` directly from the browser using
  a "bring your own key" flow (`client/src/api/directAi.ts`) — you paste your
  own Anthropic API key into the panel, it's stored only in your browser's
  `localStorage`, and it's sent only to Anthropic, never to any server this
  app controls. This uses Anthropic's documented
  `anthropic-dangerous-direct-browser-access` opt-in for browser-side
  prototyping. **Anyone with devtools open on the page can read the key out
  of network requests** — only use a key you're fine exposing that way, and
  don't treat the Pages URL as if it were a hosted service with a shared key.
- Everything else (server, `AI_PROVIDER=public`/`bedrock`, `.env`) is
  unaffected — that's still how you'd run this for real, non-demo use.

Which mode the client builds in is controlled by `VITE_DEPLOY_MODE` at build
time (`static` → localStorage + BYOK; anything else/unset → normal server
mode). See `client/src/api/deployMode.ts`.

One manual, one-time step is required that isn't scriptable via the GitHub
API used in this repo: in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions**. Once that's set, every push triggers a new deploy
automatically.

## Non-goals (v1)

No multi-user auth, no real-time collaboration, no integration with
Cameo/SysML/DOORS/Jama, and no attempt to be a formal CM system of record —
this is a staging tool that feeds into (not replaces) official program
documentation and CM processes. The SEMP Migration tab follows the same
principle: a downloadable Markdown drafting aid, not a live integration with
any CUI-side SEMP-authoring tool.
