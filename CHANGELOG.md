# Changelog

Tracks this app's compliance with the [Reusable SE Webapp Architecture Guidance](vendor/architecture-guidance-v1.4.0.md),
per its §6 versioning/vendoring discipline. This app is the reference implementation the guidance's v1.1.0, v1.2.0,
and v1.4.0 §10 revisions were informed by (see that doc's own changelog).

## Architecture guidance vendoring

| Vendored version | Imported | Reviewer |
|---|---|---|
| v1.3.0 | 2026-07-25 | this program's Lead Systems Engineer |
| v1.4.0 | 2026-07-28 | this program's Lead Systems Engineer |

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
- **Not yet done — Phase 5: Methodology-vs-program-data content split.** The ~10 files under
  `/methodology/guidance/` were relocated as-is in Phase 1; several (most notably
  `recoveryProgramGuidance.ts`, parts of `dbxMbxGuidance.ts` and `setrGuidance.ts`) still interleave genuinely
  reusable SE methodology with Baseline-A/B-specific narrative in the same exported constants, per the
  guidance's §1.1 anti-pattern. Untangling this is the highest-judgment, highest-regression-risk step,
  deliberately sequenced last and to be done file-by-file — not yet started as of this changelog entry.
