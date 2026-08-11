# docs/cdrl-path

Design-in-progress material for **CDRL Path**, a proposed module within this app that visualizes how DID-defined
CDRLs relate to one another across the Navy SETR sequence and CM baselines — styled as a zoomable, GPS-style
"subway map." Nothing here is built yet; these are planning documents for review, not a shipped feature.

**Nothing in this folder is a finished spec.** Content status as of the last handoff: 23 of 36 CDRL nodes are
confirmed via DID-by-DID interview, 13 are still first-pass placeholders, every `influences`/`influenced_by`
relationship edge is an unconfirmed first-pass assessment, and nav placement within the SE Workbench (standalone
top-level tab vs. nested) was flagged but never firmly resolved. See `cdrl-path-handoff.md` for the full list of
open items.

## Read in this order

1. `cdrl-path-handoff.md` — scope, phased build plan, acceptance criteria per phase
2. `cdrl-path-project-brief.md` — what CDRL Path is, current content status, confirmed decisions
3. `cdrl-path-import-export-architecture.md` — how import/export/validation/persistence work
4. `cdrl-did-data-model.json` — the actual reference data; read the `purpose_statement`, `confirmed_patterns`, and
   `ui_requirements` keys first, they carry as much implementation guidance as the node data itself
5. `DECISIONS.md` — dated log of decisions confirmed since the handoff, superseding individual rows in the docs
   above; check this first if something above looks stale
