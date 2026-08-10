# docs

The UDM/PKM cross-app exchange previously lived at `docs/udm-exchange` in this repo. It has moved to a
standalone public repository — [`RonClemens/udm-exchange`](https://github.com/RonClemens/udm-exchange) — so that
methodology-only, program-agnostic content (Architecture Guidance, the Process Knowledge Model, this app's
migration plan and feedback) is readable without needing access to this repo, which stays private because it also
contains real application source and program-specific content. See that repo's own `DECISION_RECORD_UDM_EXCHANGE_REPO.md`
for the full reasoning.

This app's own contributions to that exchange live at:
- `migration-plans/se-workbench/PKM_MIGRATION_PLAN.md`
- `feedback/se-workbench/PKM_ENTITY_MODEL_CONFORMANCE.md`
- `feedback/se-workbench/PKM_MIGRATION_PLAN_FEEDBACK.md`

## `reference/`

Internal reference material for contributors — original summaries of external standards, not reproductions of the source documents themselves. See `reference/INCOSE_SE_HANDBOOK_5TH_ED_SUMMARY.md` for a section-by-section map of the INCOSE SE Handbook (5th ed.), useful when checking a PKM entity or field against established SE terminology. The source Handbook PDF itself is licensed for personal use only and must never be added to this or any repo.

## `cdrl-path/`

Design-in-progress material for **CDRL Path**, a proposed module visualizing DID-defined CDRLs across the Navy
SETR sequence and CM baselines as a zoomable subway map. Not built yet — see `cdrl-path/README.md` for read order
and current content-confirmation status before treating anything in that folder as settled.
