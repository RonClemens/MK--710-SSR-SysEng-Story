# PDR Reconciliation & Baseline Alignment Workbench

An editable, living workbench for a defense program's PDR reconciliation effort —
replaces a static Word/PowerPoint working paper with a single source of truth
for CI inventory, delta/traceability tracking, A/B baseline compatibility, COTS
item records, and recommendations, plus an AI assistant panel grounded in the
app's current data.

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
  document (`server/data/db.json`, gitignored — seeded from
  `server/data/seed.json` on first run). Hosts the AI provider abstraction so
  API keys/credentials never reach the browser.
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
  (see `client/src/data/didGuidance.ts`), adapted from MIL-STD-961E System/
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
- **Safety Deliverables** — MIL-STD-882E/JSSSEH CDRL-style safety artifacts
  (see `client/src/data/safetyGuidance.ts`), one record per deliverable
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
  artifacts (SEMP, CMP, SDP, STP, SDD, VDD — see
  `client/src/data/planningGuidance.ts`). Kept as a separate entity/tab
  rather than folded into Safety Deliverables' CDRL catalog, since a Software
  Development Plan is about how software gets built and verified, not what
  hazards it introduces.

### System safety and the decomposition hierarchy

MIL-STD-882E and the JSSSEH (Joint Software Systems Safety Engineering
Handbook) require hazard analysis and safety-requirements flow-down to ride on
the same System → Subsystem → HWCI/CSCI hierarchy IEEE 12207 formalizes,
rather than run as a parallel activity — see `client/src/data/safetyGuidance.ts`.
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
Review — see `client/src/data/setrGuidance.ts` for the guidance content,
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
- **SSR** — this app's working name for the review that closes out
  System/Subsystem-level Development specs before CI-level decomposition
  starts at PDR; confirm this against your program's actual SETR
  nomenclature if it differs — hasn't been reached. `spec-005` (the
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
Systems Engineering Management Plan (SEMP) section outline styled after
DI-SESS-81785B (`client/src/data/sempGuidance.ts`,
`client/src/utils/sempExport.ts`).

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

**The DI-SESS-81785B section numbering/titles are a working assumption, not a
verified citation** — this app has not been checked against a real copy of
that DID. Every section number, title, and "source in this app" description
on the SEMP Migration tab is editable via Edit Mode (see below) so you can
correct the mapping to match your program's actual DID/SEMP table of contents
before exporting; corrections are picked up by the next export automatically.

Explicit non-goal: no direct integration with any other tool (no API push, no
file write to a shared/mounted location) — see
[Non-goals](#non-goals-v1).

## Editable site content

Beyond the structured entity data above, most of the app's guidance prose
(the DID level pros/cons/competency framing, spec-type guidance, section
descriptions, page hints, and a few SE-judgment sentences on the CI/Subsystem
detail views) is itself editable in place, versioned separately from the
structured entities:

- Toggle **Edit Mode** in the header (persisted per-browser via
  `localStorage`). While on, editable prose is outlined with a pencil (✎)
  button; click it to open an editor with Save/Cancel, a **Reset to
  original** option (removes the override, reverting to the hardcoded
  default), and a **version history** panel listing every prior value with a
  **Revert to this** action per entry.
- Backed by a ninth entity, `ContentEntry` (`key`, `value`, `history[]`,
  `updatedAt`), stored the same way as the rest of the data — server-side
  JSON in normal mode, `localStorage` in the static/Pages build — and
  included in Export/Import.
- Deliberately out of scope: structural UI (labels, button/tab text) and the
  entire AI Assistant panel, including its CUI/security banner — those stay
  fixed regardless of Edit Mode, since drifting security-relevant copy is a
  risk this feature shouldn't introduce.
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
  file. Seeded from `client/src/data/seed.ts` (same illustrative data as
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
