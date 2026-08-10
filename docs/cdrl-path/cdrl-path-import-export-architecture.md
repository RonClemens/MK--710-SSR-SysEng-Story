# CDRL Path — Import/Export/Validation Subsystem Architecture

Companion to `cdrl-path-project-brief.md` and `cdrl-did-data-model.json`. This spec covers HOW updates get into and out of the model — both the future batch CDRL-schedule import and in-browser atomic edits — so both pathways are built on the same foundation from day one instead of drifting apart.

## Data files

| File | Contents | Update pathway |
|---|---|---|
| `cdrl-did-data-model.json` | Reference model: nodes, lines, events, decomposition dimension, change-request mechanisms, RACI, aliases | Both BATCH_IMPORT and ATOMIC_EDIT |
| `program-status-{baseline_id}.json` (one per baseline, e.g. `program-status-baseline-a.json`) | Live per-program CDRL status overlay: `{status: draft/submitted/approved, notes}` per node | Both BATCH_IMPORT and ATOMIC_EDIT — Ron's schedule import will also carry status data, so this file goes through the identical match/diff/preview/validate/audit pipeline as the reference model, not a separate lighter-weight path |
| Audit log — embedded as an `audit_log` array inside each of the above files, not a separate file | Append-only change history | Written by both pathways, never edited directly by the user |

## Shared validation engine (build this first — both pathways depend on it)

Port the exact consistency-check logic already proven out manually today into a single reusable function:

```
validateModel(model) -> { valid: boolean, issues: string[] }
```

Checks required, in this order:
1. No dangling `influences`/`influenced_by` references (every referenced node ID must exist, `"ALL"` is a valid special case)
2. Every node has `maturity_states` OR `maturity_states_by_level` OR is in an explicit exemption list (e.g., `CDD`)
3. Every `station_summary_by_setr_event` key is a valid SETR event ID, and every entry references a real node
4. `station_summary_by_setr_event` is regenerated FROM node data, never hand-edited — call the generator function, don't accept manual summary edits
5. No duplicate DID numbers across distinct nodes (excluding intentional `[VERIFY]`/unconfirmed placeholders)

Both `ImportManager` and `AtomicEditPanel` call this same function before committing any change. Never implement two separate validation code paths.

## Batch import pipeline

Applies identically to **either target**: the reference model (`cdrl-did-data-model.json`) or a baseline's status overlay (`program-status-{baseline_id}.json`). `ImportManager` should take a `target` parameter rather than being hardcoded to one file — Ron's real schedule import may touch both in a single session (e.g., updating RACI in the reference model and status labels in the active baseline's overlay from the same source file), so the matching/diff/preview steps below need to run against whichever target(s) the imported records actually belong to, potentially producing two separate preview sets in one import pass.

Status-overlay-specific merge rule: `status` and `notes` fields are always **trusted override** from import (no conflict-flagging needed — there's no competing "DLA-ASSIST-verified" value to protect, unlike DID/title in the reference model).

1. **File select** — client-side `FileReader`, JSON only. No server upload; this is a browser-only app.
2. **Parse & shape-check** — confirm it's valid JSON and has the expected record shape (array of objects, each with a `Key` field at minimum).
3. **Matching pass** — for each import record:
   - Exact match: `record.Key` (case-insensitive) == `node.id`
   - Alias match: check `node.aliases[]` if exact match fails
   - Unmatched: goes to a review bucket — never silently create a new node or silently drop a record
4. **Diff computation** — for matched records, apply the field-level merge rules already defined in `import_schema`:
   - `raci`, `maturity_states`/event timing → trusted override (import wins), but log the diff
   - `did`, `title` → flag conflict, do not auto-overwrite
   - `influences`, `influenced_by`, `decomposition_level`, `relationship_assessment` → preserve existing model values
5. **Preview/review UI** — three buckets, all visible before commit: **Matched** (with diffs shown), **Conflicts** (require explicit accept-import/keep-existing/manual-edit choice), **Unmatched** (require manual reconciliation or explicit rejection).
6. **Commit** — apply accepted changes to in-memory state.
7. **Validate** — run `validateModel()`. Block commit and surface errors if it fails.
8. **Audit log entry** — `{timestamp, source: "batch-import", filename, matched_count, conflict_count, unmatched_count, fields_changed: [...]}`.
9. **Export prompt** — immediately offer "Download updated JSON," since nothing auto-writes back to the repo (see persistence decision below).

## Atomic edit pipeline

1. User clicks a station in the Level 3 detail panel (per the zoom-tier model already defined) → edit form appears for that node's editable fields (event mappings, RACI, notes, status overlay fields).
2. **Save** — apply the single-field change to in-memory state.
3. **Validate** — run the same `validateModel()` function.
4. **Audit log entry** — `{timestamp, source: "atomic-edit", node_id, field, before, after}`.
5. **Inline undo** — session-based undo for the last several atomic edits (not persisted across reloads — that's what the audit log and export are for).
6. **Dirty-state indicator** — persistent visual cue ("unsaved changes — export to save") since there's no auto-save to a file.

## Persistence (confirmed decision: Export/Download for v1)

- App holds the full model in memory (React state/context), loaded at startup from a file picker or a bundled default copy.
- All edits — import or atomic — mutate this in-memory state only. Nothing is durably saved until the user clicks **Export**.
- **Export** produces a pretty-printed JSON matching the existing schema's key order/structure (keeps git diffs clean when Ron commits it back to the repo), plus optionally a human-readable markdown changelog of what changed since the last export — nice-to-have, not required for v1.
- Known limitation, explicitly accepted: this reintroduces a manual "export then git-commit" step. GitHub API direct-commit is the scoped fast-follow if atomic-edit frequency makes this annoying in practice.

## Suggested component breakdown (React)

- `<ImportManager target={referenceModel | statusOverlay} />` — file picker, matching/diff computation, three-bucket preview UI; reusable against either target file since both follow the same pipeline
- `<AtomicEditPanel />` — per-node edit form, rendered inside the Level 3 station detail view
- `validateModel()` — non-visual utility module, imported by both of the above
- `<AuditLogViewer />` — displays the `audit_log` array, filterable by source/date/node
- `<ExportManager />` — download button + dirty-state banner

## Open items carried from the data model

- GitHub API direct-commit remains a possible fast-follow, not in v1 scope.
- RACI is confirmed as one-set-per-CDRL (not per-event), so the edit form needs only a single RACI block per node, not one per maturity state.
