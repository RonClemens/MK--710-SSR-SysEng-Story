# CDRL Path — Handoff to SE Workbench Coding Chat

## Read in this order
1. This file (scope, phasing, acceptance criteria)
2. `cdrl-path-project-brief.md` — what CDRL Path is, current content status, confirmed decisions
3. `cdrl-path-import-export-architecture.md` — how import/export/validation/persistence work
4. `cdrl-did-data-model.json` — the actual data, load it and read the `purpose_statement`, `confirmed_patterns`, and `ui_requirements` keys first; they carry as much implementation guidance as the node data itself

## What this is NOT ready for yet
This is content-in-progress, not a finished spec. 13 of 36 nodes are still unconfirmed placeholders (listed in the project brief), all relationship edges are Claude's first-pass assessment, and the visual layout (colors, coordinates, bend angles) hasn't been designed at all. **Build the app to be data-driven and regeneration-friendly, not hardcoded to today's specific node set** — the content will keep changing, especially once Ron's CDRL schedule import lands.

## Recommended phased build

**Phase 1 — Static render, confirmed nodes only**
Load `cdrl-did-data-model.json`, render Level 1 (7 lines + interchange stations) using React Flow with manually-placed coordinates (time axis = SETR event sequence, cross-axis = line). Don't build zoom/import/edit yet — prove the data renders sensibly first, and use this phase to surface any remaining data-model bugs before more code depends on it.

**Phase 2 — Zoom tiers + station detail**
Level 2 (line expansion) and Level 3 (station detail panel showing DID, maturity states, RACI, relationships, decomposition level). Decomposition-level filter/toggle for drilling into a specific CI.

**Phase 3 — Validation engine + export**
Port `validateModel()` per the architecture doc. Wire up `<ExportManager />` and the dirty-state indicator. This should work even with no import/edit UI yet — it's the safety net the next two phases depend on.

**Phase 4 — Atomic edit**
`<AtomicEditPanel />` in the Level 3 detail view. Every edit runs through `validateModel()` and writes an audit log entry before it's considered "saved" (in-memory — export is still the only durable save, per the v1 persistence decision).

**Phase 5 — Batch import**
`<ImportManager />`, generalized for both the reference model and per-baseline status overlays. This is the phase most likely to need rework once Ron's actual schedule file exists and its real shape is known — build the matching/diff/preview pipeline generically per the architecture doc rather than against assumptions about exact field names.

## Acceptance criteria (definition of done, per phase)
- **Phase 1**: App loads the JSON with no errors, all 7 lines render, all interchange stations are visible and correctly positioned along the SETR-event time axis.
- **Phase 2**: Clicking a line expands to show its `full_station` nodes; context markers render distinctly (small dots per the legend); clicking any node opens a detail panel showing at minimum DID, title, and maturity states; decomposition-level toggle correctly filters/reveals CI-level detail without needing a second permanent map.
- **Phase 3**: Running `validateModel()` against the current (as-of-handoff) JSON returns zero issues — this is the actual regression baseline, since a manual Python version of this exact check was run clean at the end of the design session. Export produces valid, re-loadable JSON matching the original schema's structure.
- **Phase 4**: Editing a single field, saving, and re-running validation shows the edit applied and an audit log entry created; undo reverts cleanly within the same session.
- **Phase 5**: Importing a sample file with a mix of matched/conflicting/unmatched records correctly sorts into all three preview buckets; committing an import updates the model, re-validates, and logs the import with correct counts.

## Explicit non-goals (don't build these — confirmed out of scope)
- No simultaneous multi-baseline view (Baseline A/B are separate files/instances, never rendered together)
- No date-based schedule tracking (status is label + notes only, no due-date slip tracking)
- No auto-write to the GitHub repo (Export/Download only for v1)
- No localStorage/browser storage for persistence
- ECP/RFV/NOR/SCN/ERR are never rendered as graph nodes or edges — badge/indicator only

## One thing worth flagging back to Ron before deep implementation
Nav placement within SE Workbench (standalone top-level module vs. nested under an existing one) was never firmly resolved — earlier answers conflicted. Worth a quick confirmation before Code Chat wires up routing, rather than guessing.
