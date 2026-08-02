# /methodology

Reusable SE methodology content, per [Architecture Guidance](/vendor/architecture-guidance-v1.7.1.md) §2. This is
the "how" — SE domain logic, checklists, prompt templates, scoring rules, document-structure schemas — meant to be
the same regardless of which program or contract this app is pointed at.

## Current contents

- `guidance/` — the SE guidance modules consumed by the client UI (DID structure, system safety, SETR milestones,
  TDP/CM alignment, DBx vs MBx, pointer specifications, INCOSE process mapping, program planning, recovery-program
  delta classification). **Relocated here as-is from `client/src/data/` (Architecture Guidance §7 step 1, pure
  relocation) — the content itself has not yet been split per §1.1's anti-pattern test.** Several files in this
  directory still contain Baseline-A/B-specific narrative and this-program attributions baked into their exported
  constants (most notably `recoveryProgramGuidance.ts` and parts of `dbxMbxGuidance.ts`/`setrGuidance.ts`). That
  untangling is Architecture Guidance §7 step 5 — the highest-judgment, highest-regression-risk step, deliberately
  sequenced last and file-by-file. Don't mistake this directory's location for the content already being
  program-agnostic; apply the §1.1 test to each file's actual default values before treating it as reusable.
- `prompts/` — versioned, parameterized prompt templates loaded by both the server (Node, via `fs.readFileSync`)
  and the client (browser bundle, via Vite's `?raw` import), so there is exactly one source of truth for each
  prompt regardless of which runtime consumes it (§5).

## What's intentionally NOT here

- **UI components** (`client/src/pages`, `client/src/components`) — the guidance's `/ui` convention. These stay
  inside `client/src` rather than being physically relocated to a root `/ui`, since this app is a Vite/React SPA
  and moving its component tree out from under Vite's project root would require reconfiguring the bundler and
  TypeScript project setup for no functional benefit — the guidance's actual requirement (thin, mostly-generic
  presentation layer) is already met in place. Treat `client/src/pages` + `client/src/components` as this app's
  `/ui` layer by convention, not by physical location.
- **Data-shape definitions** — see `/data-schema/README.md`.
- **The AI provider implementation** — see `/provider/README.md`.
