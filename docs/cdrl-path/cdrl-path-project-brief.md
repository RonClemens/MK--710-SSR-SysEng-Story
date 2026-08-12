# CDRL Path — Project Brief (v2, current as of handoff)

Supersedes the earlier v1 brief, which predates several structural changes (decomposition dimension, ECP rescoping, import/export architecture, multi-level maturity). Read this one.

## Purpose
A module within the SE Workbench, named **"CDRL Path,"** that visualizes how DID-defined CDRLs relate to one another across the Navy SETR sequence and CM baselines — styled as a zoomable, GPS-style "subway map." Doubles as a live tracker of a specific program's actual CDRL status. The core value is making visible the back-and-forth relationships between documents across the whole engineering/management team (early analysis shapes design, design maturity reshapes analysis, ECPs synchronize everything post-baseline) — not just cataloging DIDs in isolation. See `purpose_statement` at the top of `cdrl-did-data-model.json` for the canonical version of this.

## Governing framework
- **SETR events**: ASR → SRR → SFR → SSR → PDR → CDR → TRR → SVR/FCA → PRR → PCA → ISR (Navy SETR, confirmed applicable; SSR is a NAVAIR software-intensive supplement — confirm against your program's SEP).
- **Additional temporal marker types** (beyond SETR events): MILESTONE (A/B/C), CONTRACT_DAY (e.g., "3 MAC" — Months After Contract, often the earliest due dates, predating ASR), MANAGEMENT_TRACK (recurring/periodic, not tied to a single point).
- **External review boards**: WSESRB and SSSTRP pace safety-domain updates, loosely preceding SRR/CDR/PRR.
- **CM baselines**: Functional (SFR), Allocated (PDR), Product (PCA).
- **Decomposition dimension**: SYSTEM → ELEMENT/SUBSYSTEM → CONFIGURATION_ITEM (HWCI/CSCI) → COMPONENT (CSC) → UNIT (CSU). No Segment level on this program. Some documents (confirmed: RVTM) need level-specific maturity timing via `maturity_states_by_level` rather than one flat timeline — check other multi-level candidates (ICD, FMECA, drawings) against this pattern as they're confirmed.
- **Change-request objects are explicitly OUT of scope for the graph**: ECP, RFV, NOR, SCN, ERR are change-request mechanisms, not process/product artifacts. They render only as a lightweight badge on artifacts requiring one before a given SETR event — never as a station or edge-bearing node. See `change_request_mechanisms` in the data model.
- **Lines are engineering disciplines, not input/output stage** (**revised 2026-08-12**, see DECISIONS.md #11): SE, SW, HW, TE, SAFETY_RELIABILITY, ILS, PM_CM — replacing the original DESIGN_INPUT/DESIGN_OUTPUT/MGMT/TEST/LOGISTICS/SAFETY_RELIABILITY/CM. Ron-approved as a starting point, not a final confirmation. Six CDRLs are genuinely multi-domain under this taxonomy (IRS, ICD, IDD, RVTM, HW_DEV_SPEC, FCA_PCA_evidence) — see the `domains[]` field on each node.

## Content status (as of handoff — NOT fully confirmed)

**Confirmed via DID-by-DID interview (23 nodes)**: SEMP, IMP_IMS, RMP, SSS, IRS, ICD, SRS, SSDD, IDD, SDD, DBDD, ENG_DRAWINGS, SVD, STP, STD, STR, RVTM, TEMP, SSPP, HW_DEV_SPEC, HW_PROD_SPEC, LORA, CMRS.

**NOT yet confirmed (13 nodes)** — still first-pass/original-draft values, do not treat as final: SEP, CDD, SPS *(explicitly flagged uncertain by Ron)*, SAR, SSHAR, RPP, FMECA, RM_PREDICTIONS, FAILURE_SUMMARY_REPORT, LCSP, PROVISIONING, CMP, FCA_PCA_evidence.

**Every node's `influences`/`influenced_by` relationship data is first-pass, Claude-assessed** — never individually confirmed like the DID/event data was. Treat as a draft to challenge, not settled fact. Same caveat applies to `decomposition_level` tags.

**The remaining unconfirmed content is expected to be resolved primarily via Ron's authoritative CDRL schedule JSON import (not yet available)**, not further manual interview — see the import/export architecture doc.

## Zoom tier model
1. **Level 1 — System view (default)**: 7 lines + SETR/baseline interchange stations only.
2. **Level 2 — Line view**: click a line, expand all `full_station` nodes on it (context markers show as small dots).
3. **Level 3 — Station detail**: click a node, see DID, maturity states, RACI, influences/influenced-by, decomposition level, live program status + notes. This is also where `AtomicEditPanel` lives (see import/export architecture doc).

Decomposition level is a **filter/toggle**, not a separate stacked map — "drilling into a CI" reveals that CI's own Dev-Spec→Product-Spec lane, consistent with the GPS zoom metaphor.

## Confirmed technical/scope decisions
| Topic | Decision |
|---|---|
| Build target | Standalone React app, module named "CDRL Path," part of SE Workbench |
| Nav placement | **Confirmed 2026-08-11**: new top-level tab in the existing `allTabs` tab bar (`client/src/App.tsx`), not nested under another tab, not part of the phase wizard — the wizard shows one phase at a time, which would structurally block CDRL Path's core value (the cross-phase view at once). Precedent: the standalone N² Diagram tab. |
| Naming | **Confirmed 2026-08-11**: page/component layer uses `CdrlPathPage` / `CdrlPath*`, not bare `Cdrl*` — this app already has an unrelated `CdrlPhasePanel` component (per-phase deliverable checklist in the wizard). Extend the same convention to the data layer: the model-loading hook is `useCdrlPathModel`, not a generic `useCdrl*` name, so it isn't confused with this app's existing `useEntity` pattern. |
| Rendering | React Flow — specifically **`@xyflow/react`** (the current, maintained package; `react-flow-renderer` is deprecated, do not install it). Confirmed React 19–compatible as of early 2025 via its Zustand 5 upgrade, currently v12.11.2. Manual node coordinates for subway-line aesthetic, not force-directed. |
| Data scope | Generic reference model + live per-program CDRL status tracking |
| Multi-baseline | Fully separate data-file instances per baseline (Baseline A, Baseline B) — no simultaneous view, no toggle |
| Status granularity | Status label (draft/submitted/approved) + free-text notes/evidence links. No date tracking. |
| RACI | One set per CDRL (not per-event) |
| Persistence | **Revised 2026-08-11 — split by content type**, superseding the single Export/Download-for-everything answer below the "Update pathways" row was originally attached to (see architecture doc for the pre-revision pipeline this replaces for the status overlay only): <br>• **Reference model** (`cdrl-did-data-model.json` — DIDs, events, relationships): stays a **permanent** Export/Download-only exception. It's reusable, program-agnostic reference content, same category as `/methodology/guidance`, not per-session user data, and shouldn't behave like a mutable entity — especially once multiple programs may load the same reference model. <br>• **Per-program status overlay** (`program-status-{baseline_id}.json` — draft/submitted/approved + notes): folds into this app's **existing server-backed `useEntity`/entities API pattern** (and the static-build `localStorage` seed pattern), rather than a bespoke export/download path. It's per-program, mutable, changes over time — exactly what that pattern already exists for. |
| Repo placement | Public GitHub toolkit repo, including per-program status data — CUI/sensitivity flagged once, Ron's call to proceed as-is; revisit with ISSO if status data becomes more specific than labels. Design docs currently live at `/docs/cdrl-path/` (pre-decision planning material). **Planned fast-follow**: once content confirmation is farther along, move the reference model to `/methodology/guidance/` (or a sibling) and convert it from raw `.json` to a typed `.ts` module, consistent with this app's "types stay in `client/src/types`" convention rather than fetching/parsing raw JSON at runtime. |
| Update pathways | Both BATCH_IMPORT and ATOMIC_EDIT, sharing one validation engine and one audit log format — see import/export architecture doc for full pipeline. Note the Persistence revision above: this shared-pipeline description still holds for validation/audit-log behavior, but the *underlying storage* the two pathways write to now differs by target (reference model vs. status overlay), per the Persistence row. |
| Node-to-line schema | **Revised 2026-08-11** (see DECISIONS.md #8): `node.line: string` → `node.domains: string[]`. A CDRL can now belong to more than one line/domain at once — rendered as a true subway interchange (presence dots + connector on each additional line), not just a relationship edge to a different node. Migration was structure-only (every node's `domains` still holds just its one prior value) — actually assigning any CDRL to multiple domains is unconfirmed content for a future pass, not invented here. |
| Relationship-edge rendering | **Added 2026-08-11**, not originally scoped to any phase (see DECISIONS.md #6): drawn when a line is expanded, but routed hub-and-spoke through a single WMATA-style concentric-ring bullseye at the PRR column (see DECISIONS.md #7) rather than as separate point-to-point diagonals per relationship. |

## Companion documents
- `cdrl-did-data-model.json` — the reference model itself (authoritative content + all schema/architecture notes)
- `cdrl-path-import-export-architecture.md` — full import/export/validation/persistence technical spec
- This file — status and scope summary

## Open items
- ~~Nav placement within SE Workbench~~ — **resolved 2026-08-11**, see Confirmed technical/scope decisions above.
- 13 nodes still need DID/event confirmation (list above) — likely resolved by future schedule import rather than further interview
- Every `influences`/`influenced_by` edge and `decomposition_level` tag needs review — currently Claude's first-pass assessment
- Remaining `[VERIFY]`-flagged DID numbers (IMP/IMS, RMP, TDP level, provisioning DID series) not yet checked against DLA ASSIST directly
- Visual conventions (line colors, bend angles, node coordinate layout algorithm) not yet designed — Code Chat will likely need to make an initial pass here
- Reference-model Export/Download persistence is an accepted permanent tradeoff (see Persistence row), not a v1-only limitation — the earlier framing of it as a temporary gap applied to the status overlay, which now has a real fix (fold into `useEntity`).
- Planned fast-follow: relocate `cdrl-did-data-model.json` from `/docs/cdrl-path/` to `/methodology/guidance/` and convert to a typed `.ts` module, once node/relationship confirmation is farther along.
- Which CDRLs actually span multiple domains is unconfirmed content (the `domains[]` schema migration was structure-only — see DECISIONS.md #8) — a candidate for a future interview pass, alongside the other unconfirmed content above. RVTM is a plausible first candidate given its own notes already describe it as an interchange artifact, but that's not yet a decision.
