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

Seven related entities (see `server/src/types.ts` / `client/src/types/index.ts`):

- **Logical Subsystems** — the functional/behavioral decomposition layer this
  program's CI allocation skipped (it went straight from system-level
  requirements to physical CI allocation, organized around rack enclosures —
  see the existing SSDD). Each subsystem carries a `source`: `Validated`,
  `Proposed`, or `Inherited from SSDD structure — unverified` (i.e. lifted
  from the physical/rack grouping without independent functional validation).
- **Configuration Items (CIs)** — inventory with Tier 1/2/3 classification,
  over-decomposition flagging, and a **many-to-many** link to the subsystem(s)
  a CI serves (`subsystemIds: string[]` on the CI — not a single foreign key,
  since one CI legitimately can serve more than one subsystem). The UI
  visually flags CIs serving 2+ subsystems rather than hiding the overlap —
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
  Diagram tab. Two N² grids are generated: Subsystem×Subsystem and CI×CI.
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

All entities are fully CRUD-editable in the UI (add/edit/delete, no page
reloads). The CI Detail view rolls up every related row for a given CI,
including its linked subsystems and which other CIs also serve them; the
Subsystem Detail view is the mirror image (which CIs serve this subsystem).

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
documentation and CM processes.
