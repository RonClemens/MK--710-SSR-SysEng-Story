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

### `reference/semp-interviews/`

Verbatim transcripts of design chat's interview-mode SEMP content sessions with this program's Lead SE — section-by-section through DI-SESS-81785B / DoD SEP Outline v4.1. This is PDKM-adjacent content (real program answers: role names, tool choices, process specifics), which is why it lives here rather than in the public `udm-exchange` repo. Dual purpose: (1) source material for this program's own SEMP content and any PKM/Architecture Guidance candidate updates a session surfaces, and (2) future seed content for a Wizard-style Q&A onboarding flow — the *question templates* in each transcript are PKM-safe/generic, but the recorded *answers* are this program's specific instance data and must never be copied into public PKM/Architecture Guidance documents as-is. Each transcript is kept as a verbatim historical record and is not retroactively edited; where a transcript's own inline design notes are later superseded by a separate, more refined candidate-updates document, the transcript says so explicitly rather than being rewritten.

- `S4_REQUIREMENTS_DEVELOPMENT.md` — Session 4, SEP Outline §2.1 (Requirements Development), complete.
