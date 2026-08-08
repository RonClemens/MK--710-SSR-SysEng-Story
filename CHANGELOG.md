# Changelog

Tracks this app's compliance with the [Reusable SE Webapp Architecture Guidance](vendor/architecture-guidance-v1.8.0.md),
per its §6 versioning/vendoring discipline. This app is the reference implementation the guidance's v1.1.0, v1.2.0,
and v1.4.0 §10 revisions were informed by (see that doc's own changelog).

## Architecture guidance vendoring

| Vendored version | Imported | Reviewer |
|---|---|---|
| v1.3.0 | 2026-07-25 | this program's Lead Systems Engineer |
| v1.4.0 | 2026-07-28 | this program's Lead Systems Engineer |
| v1.7.0 | 2026-08-01 | this program's Lead Systems Engineer |
| v1.7.1 | 2026-08-02 | this program's Lead Systems Engineer |
| v1.8.0 | 2026-08-08 | this program's Lead Systems Engineer |

Current version tracked in [`/data-schema/PKM_VERSIONS.json`](data-schema/PKM_VERSIONS.json) (§8.1) — not this
table. This table is historical import record only; do not treat it as the source of truth for "what version is
this app on" going forward.

## App-side migration history (Architecture Guidance §7)

- **2026-07-25 — Phase 1: Directory convention move.** Relocated `client/src/data/*.ts` (SE guidance modules) to
  `/methodology/guidance/`, `client/src/data/seed.ts` + `server/data/seed.json` to `/mock-data/`. Added
  `/provider/README.md` and `/data-schema/README.md` documenting where this app's provider implementation and
  data-shape definitions actually live (both kept in place inside `client`/`server` rather than physically
  relocated — see those READMEs for why). Pure relocation; no content changes.
- **2026-07-25 — Phase 2: Prompt-library extraction.** Collapsed three hand-duplicated copies of the system
  prompt and PDR-summary prompt (`server/src/ai/context.ts`, `server/src/routes/ai.ts`,
  `client/src/api/aiContext.ts`) into `/methodology/prompts/system-prompt.md` and
  `/methodology/prompts/pdr-summary.md`. Server reads via `fs.readFileSync`; client reads via Vite's `?raw` import.
  One source of truth for both runtimes.
- **2026-07-25 — Phase 3: `config.json` data-source injection.** Added root `config.json` with a `dataSource`
  pointer (defaults to `./mock-data/seed.json`); `server/src/db.ts` resolves it (relative or absolute path) with
  a documented fallback when `config.json` is absent. Provider selection remains on existing env vars
  (`AI_PROVIDER`, `AWS_REGION`, etc.) per the guidance's §4 scope note — not migrated into `config.json`.
- **2026-07-25 — Phase 4: Versioning/vendoring scaffolding.** This file, `/vendor/architecture-guidance-v1.3.0.md`,
  and the in-app `ARCHITECTURE_VERSION`/`ARCHITECTURE_DATE` footer (see `client/src/config/architectureVersion.ts`).
- **2026-07-28 — Vendoring bump to v1.4.0 (§10, `@domain-placeholder` convention).** This app implemented the
  `@domain-placeholder` marker convention, its `/data-schema/DOMAIN_PLACEHOLDER_FIELDS.md` manifest, and the PDKM
  Promises tab ahead of the canonical Architecture Guidance formally documenting §10 — the guidance's v1.4.0 §10
  text was itself generalized from this app's implementation and its response to the original convention proposal
  (see `udm-exchange` repo, `feedback/se-workbench/PROPOSAL_DOMAIN_PLACEHOLDER_CONVENTION_RESPONSE.md`). This is a
  paperwork-only vendoring update: re-vendored `/vendor/architecture-guidance-v1.4.0.md`, bumped
  `ARCHITECTURE_VERSION`/`ARCHITECTURE_DATE` to `1.4.0`/`2026-07-27`, and updated every in-repo doc/comment citing
  the vendored version. No code behavior changed — the app already conformed to the content this bump formalizes.
- **2026-08-01 — Vendoring bump to v1.7.0 (§8.1, single JSON source of truth for version display).**
  Design chat found this app's footer displaying stale, hand-copied `"1.4.0"`/`"2026-07-27"` values —
  at least two version bumps of undetected drift, the exact failure mode §8.1 was rewritten to prevent.
  Re-vendored `/vendor/architecture-guidance-v1.7.0.md` (removing the stale v1.4.0 copy), replaced the
  hand-maintained `ARCHITECTURE_VERSION`/`ARCHITECTURE_DATE` TS constants (`client/src/config/architectureVersion.ts`,
  now deleted) with `/data-schema/PKM_VERSIONS.json` — the single file both the footer
  (`ArchitectureFooter.tsx`, via a build-time JSON import — this app's own adaptation of §8.1's "fetch, not
  embedded constants" for a Vite SPA that already imports shared repo-root content this way) and every data
  export now read from. Added the same `PKM_VERSIONS.json` object as a `meta` block to both the "Export JSON"
  feature (`ExportImport.tsx`) and the SEMP Migration package (`sempExport.ts`), stripped back out on import
  (`api.importData`) so re-importing an exported file doesn't persist a stray `meta` key. Updated every
  in-repo doc/comment citing the vendored version/path.
- **2026-08-02 — Vendoring bump to v1.7.1 (§8.1's build-time-import note; PKM Entity Model bumped
  to v0.7.3).** Both of this app's own optional follow-up items from the v1.7.0 bump (status
  report §14 items 9-10) were resolved upstream in the same pass: §8.1 now explicitly blesses the
  build-time JSON import this app already used as equally conformant to runtime `fetch()` for
  bundled SPAs, citing this app's dual deploy modes as the motivating case; PKM Entity Model v0.7.3
  §4 documents the closed-union-vs-plain-string convention `Comment.entityType` surfaced, citing
  this app's implementation by name. Re-vendored `/vendor/architecture-guidance-v1.7.1.md`
  (removing the v1.7.0 copy) and bumped `/data-schema/PKM_VERSIONS.json` to match both the
  Architecture Guidance and PKM Entity Model current versions. No code behavior changed — this app
  already conformed to what both bumps formalize.
- **2026-08-08 — Vendoring bump to v1.8.0 (§14, Traceability Interchange Schema and Tool Category;
  PKM Entity Model bumped to v0.8.0).** Both documents grew directly from the S4 SEMP interview
  transcripts stored in `docs/reference/semp-interviews/` (§2.1/§2.2): PKM Entity Model v0.8.0 adds
  `LifecycleState`, `DerivationStep`, and `Interface` as new entities, plus a substantial
  `Requirement` attribute expansion; Architecture Guidance v1.8.0 adds the `tool_category`/
  `entity_scope` convention and a tool-agnostic traceability interchange schema. Re-vendored
  `/vendor/architecture-guidance-v1.8.0.md` (removing the v1.7.1 copy) and bumped
  `/data-schema/PKM_VERSIONS.json` to match. **Vendoring only, per this HANDOFF's own explicit
  "no implementation obligation"** — none of the new entities (`LifecycleState`, `DerivationStep`,
  `Interface`) or the §14 traceability schema are implemented in this app's data model yet; that
  awaits an actual relayed HANDOFF/ACTION requesting it, same accountability convention as every
  other step so far. `artifactRole` and `TDP` remain explicitly unresolved upstream and are not
  referenced anywhere in this app.
- **Not yet done — Phase 5: Methodology-vs-program-data content split.** The ~10 files under
  `/methodology/guidance/` were relocated as-is in Phase 1; several (most notably
  `recoveryProgramGuidance.ts`, parts of `dbxMbxGuidance.ts` and `setrGuidance.ts`) still interleave genuinely
  reusable SE methodology with Baseline-A/B-specific narrative in the same exported constants, per the
  guidance's §1.1 anti-pattern. Untangling this is the highest-judgment, highest-regression-risk step,
  deliberately sequenced last and to be done file-by-file — not yet started as of this changelog entry.
