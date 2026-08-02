# Reusable SE Webapp Architecture Guidance

**Version:** 1.7.1
**Last updated:** 2026-08-02
**Status:** Draft

**Changelog:**
- **v1.7.1** — §8.1 now explicitly blesses build-time import as equally conformant to runtime `fetch()` for `PKM_VERSIONS.json`, with its own example — per Workbench's own optional follow-up item 10 (status report v2.1.0 §13/§14), which correctly identified that their dual server-backed/static deploy modes make a literal runtime fetch impractical without duplicating the file. Their adaptation is now the documented recommended pattern for that case, not just a tolerated deviation.
- **v1.7.0** — Redesigned §8.1 around a single JSON source of truth (`/data-schema/PKM_VERSIONS.json`) for guidance version display, replacing the prior pair of hardcoded JS constants. Prompted by a real, visible failure of the old approach: SE Workbench's live footer showed v1.4.0 — the *literal example value* from the prior snippet — while actual current was v1.6.0, at least two version bumps of undetected drift (Ron, 2026-08-01). This file is now also the intended source for any PKM/PDKM data export's own `meta` block, so exported data becomes self-describing about which guidance versions produced it. §2's directory convention and §8 item 5 updated to match.
- **v1.6.0** — Added §13, the Comment / TODO UI Pattern — a user-editable UI convention for PKM's new `Comment` entity (PKM v0.7.0), needed because every prior entity's UI precedent (§10.5's "Promises" view) is explicitly read-only. Renumbered former §13 ("Why This Matters Long-Term") to §14.
- **v1.5.0** — Added §11 (brief — `RiskItem` fields follow the existing `@domain-placeholder` convention, §10, no new mechanism) and §12, the SEMP Generation Pattern: a directory convention and generation approach for assembling a Systems Engineering Management Plan from PKM structure + PDKM content, per `proposals/UDM_V2_SEMP_GENERATION_PROPOSAL.md` §2 (design chat, 2026-07-29). No new provider capability required — reuses the existing provider abstraction (§3) and data-injection pattern (§4) exactly as designed; these sections document the pattern, they don't introduce new mechanism. Renumbered former §11 ("Why This Matters Long-Term") to §13.
- **v1.4.0** — Added §10, the `@domain-placeholder` convention: a field/type-level marker for program-specific illustrative content, plus a required manifest and a recommended "Promises" UI pattern. Generalized from SE Workbench's own implementation, refined through Workbench's response to the original proposal (JSDoc-comment form, whole-type and shared-subtype tagging patterns, mock-data scope settled as out-of-scope). Renumbered former §10 ("Why This Matters Long-Term") to §11. Added a §7 migration-checklist line for retroactive tagging.
- **v1.3.0** — Added §10 (now §11), forward-compatibility conventions for an eventual Unified Data Model (UDM) spanning multiple apps. Non-blocking; sets conventions only.
- **v1.2.0** — Clarified §4: `config.json` doesn't have to own every setting (e.g., provider selection can stay on existing env vars); it exists to give settings without an existing home, like `dataSource`, a documented place to live. Prompted by SE Workbench implementation review of v1.1.0.
- **v1.1.0** — Added public-only/static deployment exception (§3.1), clarified provider interface as a functional contract rather than a literal method signature (§3), added cross-runtime prompt-sharing guidance (§5), added "editable override ≠ real separation" anti-pattern (§1.1), added recommended migration sequencing (§7), noted §8.1 footer snippet needs adapting for multi-file/SPA frameworks. Informed by first real-world gap analysis (SE Workbench app).
- **v1.0.0** — Initial release.

**Purpose:** Mature each standalone webapp (workbench, PDR readiness, Dispatch, document translator, etc.) toward a common architecture so the *same SE methodology engine* can be reused across many programs with different technical data, and can move cleanly between the public (GitHub/Anthropic API) and CUI (GitLab/Bedrock) environments.

**Core principle:** Separate the **methodology layer** ("how" — SE logic, checklists, prompts, scoring rules, document structure) from the **data layer** ("what" — program-specific technical content). The methodology layer is the reusable, versioned, public-safe product. The data layer is disposable per program and lives only in CUI space.

---

## 1. Three-Layer Model

Every app should be decomposable into three layers, regardless of what it does on the surface:

```
┌─────────────────────────────────────────┐
│  UI Layer            (presentation)      │  ← thin, mostly generic
├─────────────────────────────────────────┤
│  Methodology Layer    (the "how")        │  ← reusable across programs
│  - SE domain logic, checklists           │
│  - prompt templates                      │
│  - scoring/gap-analysis rules            │
│  - document structure schemas (DIDs)     │
├─────────────────────────────────────────┤
│  Provider Layer       (AI + I/O)         │  ← swappable backend
│  - Anthropic API adapter                 │
│  - Bedrock GovCloud adapter               │
├─────────────────────────────────────────┤
│  Data Layer           (the "what")       │  ← per-program, CUI, never versioned publicly
│  - real requirements, CI names, etc.     │
└─────────────────────────────────────────┘
```

**Test for any new feature:** "Would this line of code be the same if the program were Baseline A, Baseline B, or a completely different contract?" If yes → methodology layer. If no → data layer.

### 1.1 Anti-Pattern: Editable Override ≠ Real Separation

A common half-measure is building a runtime override system (e.g., a CMS-style "editable text" layer backed by a database) that lets any string be changed without a code deploy, and mistaking that for methodology/data separation. It isn't — if the *default* value baked into the methodology file is still program-specific content (real program names, actual findings, specific attributions), the file still fails the test above, even though it's technically editable. Overridability solves a different problem (letting non-developers tweak copy) than separation does (keeping the methodology repo genuinely program-agnostic and safe to vendor into any CUI environment). Apply the test to the *default value in the source file*, not to whether the field is editable at runtime.

---

## 2. Directory Convention (applies to every app)

```
/app
  /methodology/          # pure SE logic — programs-agnostic
    checklists/           # e.g. 42-item PDR checklist, domain definitions
    prompts/               # versioned prompt templates, parameterized
    schemas/                # document/DID structure (SSDD, RTM, etc.)
    scoring/                 # gap-analysis / go-no-go rule logic
  /provider/              # AI backend abstraction
    anthropic-adapter.js
    bedrock-adapter.js
    provider-interface.js   # shared contract both adapters implement
  /ui/                    # presentation components
  /data-schema/           # SHAPE of program data (field defs), not actual data
    PKM_VERSIONS.json      # single source of truth for guidance versions (§8.1)
  /mock-data/             # synthetic mirror baseline for public-side testing
  config.json             # points at which provider + which program data source
```

**Rule:** `/methodology`, `/provider`, `/ui`, and `/data-schema` are what get vendored into CUI repos. `/mock-data` stays public-only. Real program data never lives in this tree at all — it's injected at runtime (see §4). `PKM_VERSIONS.json` is the one file in `/data-schema` that isn't about program data shape — it's build/vendoring metadata (§8.1), and belongs there because it travels with the same vendoring lifecycle as everything else in that folder.

---

## 3. Provider Abstraction Contract

Every app should code against one interface, never against Anthropic's or Bedrock's SDK directly in application logic. The requirement is functional, not literal: **one shared interface, implemented identically by every backend, with application/methodology code calling only that interface.** The example below shows one reasonable shape — an existing app using different method names (e.g., `sendMessage()` instead of `complete()`) satisfies the guidance as long as the same three properties hold. Don't rename working code just to match this example verbatim; document the existing shape as an accepted equivalent instead.

```js
// provider-interface.js
export interface AIProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  completeStructured(prompt: string, schema: object): Promise<object>;
}
```

`anthropic-adapter.js` and `bedrock-adapter.js` both implement this. `config.json` (or an env var) selects which one loads. Application/methodology code never branches on environment — it just calls `provider.complete(...)`. Note `completeStructured()` implies schema-validated output; only include it if the app actually validates against a schema — otherwise a single `complete()`-style method is sufficient.

This is the single highest-leverage piece of engineering across all your apps: get this right once, and every future app inherits CUI-portability for free.

### 3.1 Exception: Public-Only Static Deployments

Some apps ship a fully static, serverless build (e.g., GitHub Pages, client-only bundle) alongside or instead of a server-backed mode — often using a visitor-supplied API key called directly from the browser. This deployment target **cannot** implement the provider abstraction as written: there is no server to hold GovCloud credentials, and browser CORS/credential-exposure constraints make direct browser-to-Bedrock calls impractical and unsafe.

This is an accepted, named exception, not a violation — **provided the static build is public-only by construction** (it structurally cannot hold or reach CUI data, e.g., GitHub Pages) and this is documented explicitly in the app's README or config, not left as a silent deviation. If an app has both a server-backed mode and a static mode, the provider-abstraction requirement applies fully to the server-backed mode; the static mode is understood to be public-demo/BYOK-only and out of scope for CUI deployment entirely.

---

## 4. Data Injection Pattern (the part that makes this multi-program)

Instead of hardcoding a program's data into the app, define a **data schema** (shape, not content) in `/data-schema`, and load actual program data from an external, swappable source at runtime:

- **Public/dev:** load `/mock-data/synthetic-program.json` — fake system, same schema.
- **CUI/prod:** load real program data from a local file, CUI GitLab data repo, or a config-pointed path — never committed into the methodology repo.

```js
// config.json (CUI side, not committed to public repo)
{
  "provider": "bedrock",
  "dataSource": "./data/baseline-b-requirements.json"
}
```

**Scope note:** `config.json` need not be the single source of truth for every setting shown above — it exists to give the `dataSource` pointer a documented, versioned home, since that concept typically has no existing mechanism in an app. If an app already has a working, credential-appropriate way to select its provider (e.g., env vars like `AI_PROVIDER`/`AWS_REGION`, already how Bedrock credentials are meant to flow), that can coexist with `config.json` — leave provider selection where it already works, and add `config.json` for whichever settings (usually just `dataSource`) don't yet have a home. Don't migrate a working provider-selection mechanism just to consolidate it into `config.json`.

This is what lets the *same codebase* run your PDR readiness checklist against Baseline A, Baseline B, or Program C next year — only the data file and config change.

---

## 5. Prompt Library Discipline

Prompts belong in `/methodology/prompts` as parameterized templates, not embedded strings scattered through app code:

```
prompts/gap-analysis.md
prompts/rtm-coverage-check.md
prompts/ssdd-section-mapping.md
```

Each should be:
- Versioned (track changes like code — prompt drift silently degrades output quality)
- Parameterized with clear placeholders (`{{domain}}`, `{{checklist_item}}`)
- Tested against `/mock-data` before being trusted on CUI-side real data

**Cross-runtime sharing:** if an app has multiple runtimes that can't directly share a module (e.g., a Node server and a browser bundle), do not hand-duplicate prompt strings into each — that's exactly the drift risk this section exists to prevent. Instead, keep prompts as standalone `.md`/`.json` files in `/methodology/prompts` and have both runtimes load the same file at build time or via fetch at runtime, so there is exactly one source of truth even when there are two consumers.

---

## 6. Versioning & Vendoring (ties to the repo-sync architecture)

- Public repo (`workbench-toolkit` or per-app) is the source of truth for `/methodology`, `/provider`, `/ui`, `/data-schema`.
- Tag releases (`v1.4.0`) when methodology changes are stable.
- CUI repos vendor a pinned snapshot under `/vendor/<app>-vX.Y.Z/`, never hand-edit it.
- Each CUI app's `CHANGELOG.md` records: version imported, date, checksum, reviewer.
- If a CUI-side program surfaces a methodology gap (e.g., a checklist item that doesn't fit), patch it in a local `/patches` folder, log it, and upstream to the public repo on the next sync — don't fork the methodology silently per program, or you lose the reuse benefit.

---

## 7. Migration Checklist for Existing Apps

For each app currently in development, evaluate:

- [ ] Is program-specific data (real requirement text, CI names, etc.) mixed into application code or prompts? → extract to `/data-schema` + runtime injection
- [ ] Does the app call Anthropic's API directly in UI/logic code? → wrap behind `provider-interface.js`
- [ ] Are prompts inline strings? → extract to `/methodology/prompts`, parameterize
- [ ] Is there a synthetic mirror dataset for public-side testing? → build one if not
- [ ] Are program-specific illustrative values in `/data-schema` tagged with `@domain-placeholder` (§10)? → tag retroactively; this is additive, comment-only, and low-risk, so it can be done early rather than waiting for the content-split step
- [ ] Could this app's methodology logic be reused for a different program today, with just a config/data swap? If not, that's the gap to close next.

**Suggested order:** workbench app first (it's the platform), then retrofit PDR readiness app and Dispatch against the same pattern, since they'll benefit most from the provider abstraction and prompt library already existing.

**Recommended sequencing within a single app's migration:** do mechanical, low-regression-risk moves first, and save judgment-heavy content work for last:

1. Directory convention move (`/methodology`, `/provider`, `/ui`, `/data-schema`, `/mock-data`) — pure relocation.
2. Prompt-library extraction — collapse any duplicated prompt copies into one shared, versioned source.
3. `config.json` / data-source injection pattern — mostly additive, low regression risk.
4. Versioning/vendoring scaffolding — `CHANGELOG.md`, version tag, in-app version footer.
5. Methodology-vs-program-data content split (untangling program-specific narrative from genuinely reusable methodology inside existing files) — the highest-judgment, highest-regression-risk step. Do this last, file by file, so each split can be tested independently rather than attempted as one large rewrite.

---

## 8. Applying This Document in CUI Repos

This guidance document is itself methodology-layer content — public-safe, program-agnostic — and follows the same vendoring discipline as the code it describes (§6). It is **not** to be hand-edited once vendored into a CUI GitLab workspace.

**For CUI-side teams requested to comply with this guidance:**

1. **Vendor it, don't fork it.** Place the imported copy at:
   ```
   /vendor/architecture-guidance-vX.Y.Z.md
   ```
   Do not edit this file directly in the CUI repo. Treat it as read-only, identical to how `/vendor/<app>-vX.Y.Z/` code is handled.

2. **Attach a pointer note.** Append a short metadata block to the top of the vendored copy (or in the repo's `CHANGELOG.md`) recording program-specific context — this note is the only thing allowed to differ from the public original:
   ```
   Applies to: <Program / Baseline name>
   Vendored version: v1.2.0
   Imported: 2026-07-25
   Reviewer: <name>
   ```

3. **Log gaps, don't silently patch.** If a CUI-side project finds the guidance doesn't fit a real situation (a checklist item, a directory convention that doesn't map cleanly), do not alter the vendored file. Record the gap in `/patches/architecture-guidance-notes.md` with enough detail to reproduce the issue, and route it back upstream through the same public-repo update process described in §6 for code. The next public version should resolve it for every program, not just this one.

4. **Compliance requests reference the version, not "the doc."** When requesting a CUI team update to comply with this architecture, cite the specific vendored version (e.g., "bring `/vendor` up to architecture-guidance-v1.4.0") so compliance is checkable and auditable, consistent with the version-pinning discipline in §6.

5. **Update the app's displayed version tag alongside the vendored doc.** Every app implementing this architecture should surface its current guidance version in-app (see §8.1 below). When `/vendor/architecture-guidance-vX.Y.Z.md` is bumped, update `/data-schema/PKM_VERSIONS.json` in the same commit — the single source of truth for this, per §8.1. A compliance check is not complete until the visible tag matches the vendored file — this is the fastest way to catch drift across multiple apps without inspecting each repo, and now checkable by inspecting one JSON file rather than hunting for hardcoded constants in app code.

6. **This section travels with the file.** Because this section is itself part of the public-source document, it stays intact in every vendored copy — CUI teams always have the instructions for how to treat the file, without needing a second document or side-channel explanation.

### 8.1 Version Metadata — Single Source of Truth, Not Hardcoded Constants

**This subsection replaces the prior version of itself, and the reason why matters:** the previous version of this snippet shipped its own example values (`"1.4.0"`, `"2026-07-27"`) directly in the code sample. At least one real deployment copy-pasted that snippet verbatim and never revisited it — the footer displayed those literal example values, unchanged, for at least two version bumps' worth of drift, discovered only when someone happened to compare the footer against the actual current version by hand. Two hardcoded constants with no verification mechanism is exactly the failure mode this whole document exists to prevent (§1's own separation discipline) — a docs bug, not just an app bug, and worth stating plainly rather than quietly fixing.

**The fix: one JSON file is the source of truth, consumed by both the footer and every data export — never two places to keep in sync.**

```
/data-schema/
  PKM_VERSIONS.json      # the only place these numbers are typed by hand
```

```json
{
  "architectureGuidanceVersion": "1.7.0",
  "architectureGuidanceDate": "2026-08-01",
  "pkmEntityModelVersion": "0.7.1",
  "pkmEntityModelDate": "2026-08-01"
}
```

- **Update this one file** whenever the vendored `architecture-guidance-vX.Y.Z.md` or `PKM_ENTITY_MODEL.md` is bumped in that repo, in the same commit (§6, §8 item 5) — same discipline as before, but now a single mechanical edit instead of remembering to update JS constants *and* keep them consistent with whatever the data layer separately claims.
- **The footer reads this file, not embedded constants — via runtime `fetch()` or a build-time import, both equally conformant.** A genuine runtime `fetch()` is the default assumption below, but a bundled SPA reading the same file via `import pkmVersions from "../../data-schema/PKM_VERSIONS.json"` (with a bundler's JSON-import support, e.g. TypeScript's `resolveJsonModule`) satisfies this requirement exactly as well — it's still one canonical file, still zero duplication, still updates automatically on next build. This matters specifically for apps with a static/serverless deploy mode (§3.1) where `/data-schema` isn't otherwise a client-servable path: a literal `fetch()` there would force either duplicating the file into a public-assets directory (recreating the exact two-places-to-keep-in-sync problem this section exists to eliminate) or an extra build step just to relocate it. Build-time import avoids both without weakening the single-source-of-truth guarantee. If it's stale, the footer is stale by definition either way, which is at least honestly traceable to one file rather than silently drifting from an untracked pair of constants.
- **Every PKM/PDKM data export (§4's data-injection pattern, the "Export JSON" pattern any app with real program data should have) includes this same object as a `meta` block** at the top of the exported file — not a separately-typed copy, the literal same source. This makes staleness checkable from *outside* the running app too: any exported data file is self-describing about which guidance versions produced it, the same self-verification instinct behind SHA-pinned commit checking elsewhere in this UDM effort.

```html
<!-- Runtime fetch — the default assumption, works for any server-backed app -->
<!-- Framework-agnostic sketch — adapt to your app's actual data-loading pattern,
     same "concept, not verbatim markup" guidance as before -->
<script>
  fetch('/data-schema/PKM_VERSIONS.json')
    .then(r => r.json())
    .then(v => {
      document.getElementById('arch-version').textContent = v.architectureGuidanceVersion;
      document.getElementById('arch-date').textContent = v.architectureGuidanceDate;
    });
</script>

<footer style="
  position: fixed; bottom: 0; right: 0;
  font-size: 11px; color: #888;
  padding: 4px 10px; opacity: 0.6;
">
  Architecture: v<span id="arch-version"></span> (<span id="arch-date"></span>)
</footer>
```

```ts
// Build-time import — equally conformant, recommended for bundled SPAs with a
// static/serverless deploy mode (§3.1), where /data-schema isn't otherwise
// client-servable without duplicating the file
import pkmVersions from "../../data-schema/PKM_VERSIONS.json";
// requires a bundler JSON-import capability, e.g. TypeScript's resolveJsonModule

function ArchitectureFooter() {
  return (
    <footer>
      Architecture: v{pkmVersions.architectureGuidanceVersion} ({pkmVersions.architectureGuidanceDate})
    </footer>
  );
}
```

**Migration for existing apps:** move whatever the current hardcoded constants are into this new file (correcting them to the actual current vendored version while you're at it — don't just relocate stale values), point the footer at the file, and check any existing data-export feature for whether it should carry the same `meta` block.

---

## 9. Forward Compatibility with a Unified Data Model (UDM) — Exploratory, Non-Blocking

A broader Unified Data Model is under design as a separate, follow-on effort: a shared **Process Knowledge Model (PKM)** — a public-safe, cross-program ontology of SE entity types and relationships (Requirement, CI, Milestone, Gap, etc.) — paired with a per-program **Product/Domain Knowledge Model (PDKM)** holding real CUI content, linked to the PKM by reference only. Eventually, individual apps are expected to become *views* over a shared UDM rather than each owning an isolated schema.

This section does **not** require any app to build toward the UDM now. It exists so that current `/data-schema` and `/methodology` work (§2, §7 step 5) doesn't have to be redone when the UDM arrives. Three lightweight conventions to follow going forward:

1. **Give every entity a stable, external ID**, not just an internal database auto-increment key — e.g., a CI record should carry an ID like `CI-042` that means the same thing outside the app's own database, not just `id: 17`. This is what will eventually let a PDKM record reference a PKM entity type across app boundaries.
2. **Keep `/data-schema` definitions shape-only and minimal**, exactly as already required by §2 — these are the parts most likely to be promoted into a shared PKM type later, so the less program-specific assumption baked into a schema's structure, the easier that promotion will be.
3. **Model relationships as explicit reference fields, not denormalized text.** E.g., "this CI satisfies Requirement REQ-118" should be a field like `satisfiesRequirementId: "REQ-118"`, not a sentence embedded in a description string. Explicit references survive a future migration into a shared/graph model; prose references don't.

No app should delay its current migration work waiting on the UDM. Treat these as cheap defaults to apply while doing work you're already doing, not a new workstream.

---

## 10. The `@domain-placeholder` Convention

This section makes §1's own test — *"would this line of code be the same regardless of program?"* — mechanically checkable at the field level, instead of relying on a reviewer remembering to apply it. It also closes the exact loophole §1.1 names: a field can be runtime-editable and still fail separation if its baked-in default is program-specific content. The marker below applies to that default, same as §1.1 already requires — just made greppable.

It also extends §9's UDM forward-compatibility conventions: §9 already asks for stable IDs and explicit references so a future PDKM can attach cleanly. `@domain-placeholder` is the missing piece that marks *exactly where*, field by field, a PDKM's real values are meant to land once one exists.

### 10.1 The marker

Tag every field whose current value is program-specific illustrative content — as distinct from structural fields (IDs, foreign-key references, fixed enums, timestamps, booleans) — with a JSDoc-style `@domain-placeholder` tag directly above the field:

```ts
interface ConfigurationItem {
  id: string;                          // structural — not tagged
  subsystemIds: string[];              // structural — not tagged
  baselineId: string;                  // structural — not tagged

  /** @domain-placeholder */
  name: string;                        // illustrative program content — tagged

  /** @domain-placeholder */
  description: string;                 // illustrative program content — tagged
}
```

Use the JSDoc block-comment form specifically, not a plain line comment — it's the form IDE hover and `tsdoc`-aware tooling already read natively, which matters if this ever grows a lint rule (§10.4).

The test for what gets tagged is §1's test, applied at field granularity: **if this field's current value is a synthetic stand-in for something a real program will eventually supply, tag it.** Structural fields are never tagged — the shape is exactly what's meant to be reused; only the illustrative *values* sitting in that shape are.

**Free-text fields that are structural taxonomy, not program content, are also not tagged.** A field like `domain: string` holding a reusable SE category name (e.g., "System Safety," "Verification & Validation") is structural despite being an untyped string — contrast with a status field whose actual values are genuinely program-specific findings. When this distinction isn't obvious from the field name alone, note it inline (a one-line comment is enough) rather than leaving a future reviewer to guess.

### 10.2 Beyond single fields

Two shapes come up often enough to call out explicitly:

**Whole-type tagging.** A fixed-key, variable-value structure — e.g. a `Record<SectionKey, string>` where the keys are reusable DID/CDRL structure but every value is program-specific requirement text — has no single field to annotate. Tag the type alias itself:

```ts
/** @domain-placeholder -- every section's text is program-specific requirement
 * content, not generic structure. The keys themselves are the reusable
 * DID-derived structure and stay as-is. */
export type SpecSections = Record<SpecSectionKey, string>;
```

**Shared sub-types.** If a type is reused across multiple parent entities (e.g., an `Attachment` type nested inside several different record types' `attachments` arrays), tag it once, on the shared type itself — it applies transitively everywhere that type is used. Don't re-tag it per parent entity.

### 10.3 The manifest

Every app maintains a companion manifest at `/data-schema/DOMAIN_PLACEHOLDER_FIELDS.md`, listing every tagged field or type, per entity, in one reviewable place. This gives:
- A fast audit of how much of an app's current data is placeholder, without reading every type file.
- Confirmation at CUI-vendoring time (§8) that nothing tagged has silently become load-bearing default content.
- An onboarding reference instead of the boundary being inferred from scratch.

Markdown is the required format for now, for consistency with the rest of this document family. A structured (JSON/YAML) manifest is a reasonable future step once a second app wants to build a shared, generic "Promises" UI (§10.5) rather than a hand-built one per app — not a blocker today.

### 10.4 Tooling enforcement (future direction, not required now)

A future lint rule could flag any string field in `/data-schema` that has neither a `@domain-placeholder` tag nor an explicit structural-taxonomy justification. This is not being built now, and any future version needs an allowlist mechanism for structural free-text fields (§10.1) — a naive "untyped string ⇒ flag it" rule will false-positive on exactly that category.

### 10.5 The "Promises" view (recommended, not mandated)

Pair the marker convention with a read-only, filterable in-app view surfacing every current record's `@domain-placeholder` values in one place, framed as a promissory note: each value is synthetic and will be replaced once a real PDKM exists for the program a given deployment serves, arriving via landing-zone upload or direct user entry (§4). Every app doesn't need identical UI, but every app should have *some* visible way to answer "what in this deployment is still synthetic."

### 10.6 Mock data is out of scope

Mock/seed data files are **not** tagged. The marker's job is to tell a real deployment which schema fields need real content — it is not to make demo data illegible while it waits for that deployment. Rewriting illustrative seed values into placeholder strings would defeat the purpose of having a readable demo in the first place. This is settled, not an open question.

### 10.7 Migration note

Retroactively tagging an existing app's fields is additive and comment-only — no structural change, no behavior change. It can be done early in an app's migration sequence (§7) rather than waiting for the content-split step.

---

## 11. Risk, Issue, and Opportunity Tracking

`RiskItem` (PKM v0.6.0) follows the same data-injection pattern every other entity already uses (§4) — no new mechanism, just noting it explicitly since risk content has a genuine PDKM-sensitivity worth calling out. Risk statements, root-cause narratives, and mitigation rationale are program-specific content (real cost/schedule impact, real technical concerns) — apply the `@domain-placeholder` convention (§10) to these fields the same way any other illustrative content gets tagged. `itemType`, `category`, `mitigationStrategy`, and `riskLevel` (derived) are structural — not tagged, same test as any other field (§10.1).

---

## 12. SEMP Generation Pattern

An automated Systems Engineering Management Plan (SEMP) generation capability is under design (`proposals/UDM_V2_SEMP_GENERATION_PROPOSAL.md`), building directly on §9's PKM/PDKM split and §10's `@domain-placeholder` convention. This section documents the pattern once it's ready for apps to build against — **it introduces no new provider capability or data-injection mechanism**; it's a specific *consumer* of both, assembled the same way any other AI-assisted feature in this architecture already works.

### 12.1 Three inputs, one generated output

```
SEMP Template (methodology layer, public-safe)
        +
PKM instance data (structure — per-baseline/per-project, already exists)
        +
PDKM instance data (real program content — per-program, CUI)
        ↓
   Generated SEMP (program-specific output — never committed publicly)
```

The generated document itself is data-layer output by definition — same rule as any other real program data (§1, §4): it's generated at runtime from real content, and it never gets committed to any public repo, including this one.

### 12.2 Directory convention addition

```
/methodology/
  semp-template/          # new — section-by-section mapping + generation prompts
    section-mapping.md     # which PKM entities/PDKM fields feed each SEMP section
    prompts/                 # narrative-section prompts, same discipline as §5
```

`semp-template/` sits alongside the existing `/methodology/prompts` and `/methodology/checklists` — same versioning, same public-safe/CUI-vendoring treatment as everything else in `/methodology` (§6, §8).

### 12.3 Generation approach — two kinds of sections, two mechanisms

**Structured sections** (schedule tables, deliverable lists, RACI-style role/action tables) are assembled directly from PKM+PDKM data via query-and-format — no AI call, same risk profile and same code path as any other read-only view already in an app. Example: a schedule table is a direct query over `Milestone` records, formatted per the template's mapping — nothing about this requires the provider abstraction at all.

**Narrative sections** (SE process description, objectives/constraints prose) go through the existing provider abstraction (§3) via `complete()` or `completeStructured()` — the same interface every other AI-assisted feature in an app already calls. No new provider method, no new adapter requirement.

**Content-boundary test applies at the section level**, same test as everywhere else in this document (§1): is a section's *assembly logic* (which fields to pull, how to lay out the table, which prompt template to use) the same regardless of program? If yes, methodology layer, public-safe, belongs in `semp-template/`. Is the *generated output itself* real program content? Always yes, by definition (§12.1) — so it's data-layer, never public.

### 12.4 What this deliberately doesn't require

- No new entity type solely for SEMP generation — it's a consumer of `Milestone`, `Deliverable`, `Requirement`, `Role`, `RiskItem`, and whatever PKM already models, not a reason to add structure.
- No change to the provider interface (§3) — `complete()`/`completeStructured()` already cover narrative generation.
- No change to the data-injection pattern (§4) — PDKM content loads exactly the way any other program data already does.

If a real implementation surfaces a need for any of the above, that's a gap to route back through the normal Documentation Drift / conformance-feedback path (per `UDM_WORKFLOW_PROTOCOL.md` §3.5), not something to build ad hoc inside a single app's SEMP feature.

---

## 13. The Comment / TODO UI Pattern

`Comment` (PKM v0.7.0) is different from every entity this document has addressed a UI pattern for so far. §10.5's "Promises" view — the closest existing precedent — is explicitly **read-only**: a display of synthetic values waiting to be replaced by real PDKM content. `Comment` is the opposite: it's meant for direct, real, end-user-authored input, persisted live, with no synthetic/placeholder framing at all. This section exists because that gap is real, not because `Comment` needed new provider or data-injection mechanism — it doesn't; it's CRUD like every other entity (§2, §4).

### 13.1 Recommended shape, not mandated

Two complementary surfaces, matching how `Comment`'s polymorphic attachment actually gets used:

- **Inline, on any entity detail view the app already has:** a small comment-count affordance (e.g., a badge or icon) that expands to a thread — create, edit own text, mark `Resolved`/reopen. This is where most comments will actually get created, attached to whatever record the user was already looking at (`entityType`/`entityId` populated from context, not user-entered).
- **A global list view**, filterable by `status` and by `entityType`, sortable by `createdDate` — the only place an *unattached* `Comment` (no `entityType`/`entityId`) is visible at all, and a useful cross-cutting view even for attached ones. This plays a similar role to §10.5's Promises view structurally (one screen, everything in one place), but is fully editable rather than read-only.

Every app doesn't need identical UI for either surface — the requirement is that both exist in *some* form, the same "every app needs some visible way to answer X" standard §10.5 already sets for its own question.

### 13.2 Authorship without assuming authentication

Most apps built against this architecture are internal SE tools without individual user login (per this document's own scope — synthetic demo apps, shared-access tools). `Comment.createdByRoleId` should therefore be a **manually selected value at creation time** — the same UX already established for `ActionItem.assignedRoleId` (a Role-select dropdown, not an auto-derived session identity). If an app later adds real authentication, deriving `createdByRoleId` from a logged-in user's role becomes a natural enhancement, not a breaking change to the entity shape.

### 13.3 Resolution, not deletion, as the default

Prefer setting `status: "Resolved"` (with `resolvedDate` populated) over hard-deleting a `Comment` record — this preserves it as historical context, consistent with how this document treats every other entity's lifecycle (nothing else in the PKM model is designed around silent deletion). Hard delete isn't prohibited, just not the default pattern to reach for.

### 13.4 Content-boundary note

`Comment.text` is always PDKM content — real, user-authored, by definition never synthetic. Nothing about `Comment` needs `@domain-placeholder` tagging (§10): there's no "default value" to tag, since every real `Comment` record only exists because a user actually created it. Mock/seed data, if an app includes example `Comment` records for demo purposes, follows the same §10.6 exemption every other entity's seed data already has.

---

## 14. Why This Matters Long-Term

Right now each app (PDR readiness, Dispatch, translator) independently reinvents: an AI provider call, a prompt, a data shape, a UI. Once `/methodology` + `/provider` are standardized, a new tool for a new program becomes: define a data schema, write a few checklist/prompt files, reuse everything else. That's the actual scaling unlock — not just CUI-compliance, but turning one-off tools into a genuine internal SE toolkit product line.
