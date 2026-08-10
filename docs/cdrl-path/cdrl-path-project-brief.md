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
| Nav placement | Still open — earlier answers were inconsistent (sub-view vs. new module) |
| Rendering | React Flow (not D3) — manual node coordinates for subway-line aesthetic, not force-directed |
| Data scope | Generic reference model + live per-program CDRL status tracking |
| Multi-baseline | Fully separate data-file instances per baseline (Baseline A, Baseline B) — no simultaneous view, no toggle |
| Status granularity | Status label (draft/submitted/approved) + free-text notes/evidence links. No date tracking. |
| RACI | One set per CDRL (not per-event) |
| Persistence | File-based JSON, **Export/Download for v1** (confirmed) — no auto-write to repo, no localStorage. GitHub API direct-commit is a possible fast-follow, not v1 scope. |
| Repo placement | Public GitHub toolkit repo, including per-program status data — CUI/sensitivity flagged once, Ron's call to proceed as-is; revisit with ISSO if status data becomes more specific than labels |
| Update pathways | Both BATCH_IMPORT and ATOMIC_EDIT, sharing one validation engine and one audit log format — see import/export architecture doc for full pipeline |

## Companion documents
- `cdrl-did-data-model.json` — the reference model itself (authoritative content + all schema/architecture notes)
- `cdrl-path-import-export-architecture.md` — full import/export/validation/persistence technical spec
- This file — status and scope summary

## Open items
- Nav placement within SE Workbench (standalone top-level vs. nested — unresolved)
- 13 nodes still need DID/event confirmation (list above) — likely resolved by future schedule import rather than further interview
- Every `influences`/`influenced_by` edge and `decomposition_level` tag needs review — currently Claude's first-pass assessment
- Remaining `[VERIFY]`-flagged DID numbers (IMP/IMS, RMP, TDP level, provisioning DID series) not yet checked against DLA ASSIST directly
- Visual conventions (line colors, bend angles, node coordinate layout algorithm) not yet designed — Code Chat will likely need to make an initial pass here
- Export/Download persistence is a known limitation (manual re-commit step) — GitHub API integration is the scoped fast-follow if this becomes friction in practice
