# UDM Exchange

Shared hand-off point between this repo's Claude Code session (working on the PDR Reconciliation & Baseline
Alignment Workbench) and the separate Claude chat drafting the Unified Data Model / Process Knowledge Model
(PKM). Replaces passing files through chat uploads/downloads each round — both sides read and write here
directly instead.

**Location:** `docs/udm-exchange/` on branch `claude/coding-session-j9t6v5` of
`RonClemens/MK--710-SSR-SysEng-Story` (this repo is private — whatever the UDM chat uses to reach it, whether a
connector with repo access or a manual copy into GitHub's web UI, needs read/write to this private repo). If
browsing GitHub directly, the branch has to be selected explicitly — this folder won't appear under the
repo's default `main` view.

## Protocol

- **Never overwrite a file.** Each new round of a document gets a new file at its own version — same discipline
  already used for `/vendor/architecture-guidance-vX.Y.Z.md` elsewhere in this repo. Old versions stay for
  history; nothing here is edited in place.
- **Naming:**
  - `pkm-entity-model-vX.Y.Z.md` — the PKM Entity & Relationship Model, as authored by the UDM chat.
  - `pkm-migration-plan-vX.Y.Z.md` — the SE Workbench PKM Migration Plan, as authored by the UDM chat.
  - `workbench-feedback-<topic>-vX.Y.Z.md` — this session's feedback, named for the version of the document it's
    responding to (e.g. `workbench-feedback-entity-model-v0.1.0.md`).
- **Each file's own header states what it's responding to** (version + filename), so the thread is
  reconstructable from the folder alone without needing chat history from either side.
- **A round is "delivered" once its file is committed and pushed here** — not before. The human remains the one
  who tells each side "check the folder, there's a new round," rather than the two chats triggering each other
  unsupervised.

## Current state (as of this seed commit)

| File | Status |
|---|---|
| `pkm-entity-model-v0.2.1.md` | Latest from UDM chat. Corrected CI↔LogicalSubsystem to many-to-many (v0.2.0); added `AbCompatibilityRow` as evidence toward open question #1 (v0.2.1). |
| `pkm-migration-plan-v0.2.0.md` | Latest from UDM chat. Renamed Phase→Step to resolve terminology collision with Architecture Guidance §7; expanded Step 2's blast radius; carved out `AbCompatibilityRow`; added methodology/data split note to Step 3; added blocking open question #4. |
| `workbench-feedback-entity-model-v0.1.0.md` | This session's feedback on PKM Entity Model v0.1.0 (the CI↔LogicalSubsystem cardinality conflict, resolved in v0.2.0). |
| `workbench-feedback-migration-plan-v0.1.0.md` | This session's feedback on Migration Plan v0.1.0 (Step 2 blast radius, methodology/data split, `AbCompatibilityRow`), incorporated into v0.2.0 above. |

**Open and unresolved:** Migration Plan v0.2.0's open question #4 is explicitly blocking — whether Step 2
(Baseline enum→entity) and Architecture Guidance's still-pending content-split step should run as one
coordinated effort or a defined order, since both touch `methodology/guidance/recoveryProgramGuidance.ts`. Held
pending this exchange-mechanism switch; not yet answered.
