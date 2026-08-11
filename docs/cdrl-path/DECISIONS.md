# CDRL Path — Decision Log

Running record of decisions confirmed between this app's Code Chat and the separate CDRL Subway Design chat,
relayed via SHA-pinned GitHub links since the design chat has no direct repo access. Each entry supersedes the
matching row in `cdrl-path-project-brief.md` / `cdrl-path-import-export-architecture.md` as of its date — those
two docs carry the full narrative detail, this file is the dated audit trail of what changed and why.

## 2026-08-11 — Review round 1

Design chat had no repo access; answers below are based on Code Chat's description of the actual files, not a
direct review. Design chat flagged nothing as a misdescription — see individual entries.

1. **Nav placement — confirmed as proposed.** New top-level tab in the existing `allTabs` tab bar
   (`client/src/App.tsx`), not nested under another tab, not part of the phase wizard. Reasoning sharpened by the
   design chat: the phase wizard shows one phase at a time, which would structurally prevent CDRL Path's core
   value (the cross-phase view at once). Precedent: the standalone N² Diagram tab.

2. **Naming — confirmed, extended.** `CdrlPathPage` / `CdrlPath*` for the page/component layer, avoiding the
   existing unrelated `CdrlPhasePanel` component. Design chat extended the convention to the data layer: the
   model-loading hook is `useCdrlPathModel`, not a generic `useCdrl*` name, so it isn't confused with this app's
   existing `useEntity` pattern.

3. **Rendering package — confirmed, with a correction.** `@xyflow/react` (not `react-flow-renderer`, which is
   deprecated). Confirmed React 19–compatible as of early 2025 via its Zustand 5 upgrade, currently v12.11.2.

4. **Persistence — revised, not simply confirmed.** Original architecture doc applied one Export/Download-only
   model to both the reference model and the per-program status overlay. Design chat revised this after learning
   the app already has a server-backed `useEntity`/entities API pattern:
   - Reference model (`cdrl-did-data-model.json`): **unchanged**, permanent Export/Download-only exception —
     reusable, program-agnostic reference content, not per-session user data.
   - Per-program status overlay (`program-status-{baseline_id}.json`): **now folds into the existing
     `useEntity`/entities API pattern** (and the static-build `localStorage` seed pattern) instead of a bespoke
     export/download path, since it's per-program mutable data the app already has a generic mechanism for.
   - Open item created by this revision: how status-overlay audit-log entries get stored through the entities API
     hasn't been resolved — needs a read of `server/src/db.ts` before it's implementable as described, not before.

5. **File location — confirmed for now, with a planned move.** `/docs/cdrl-path/` is correct while content is
   still pre-decision planning material (13/36 nodes unconfirmed). Planned fast-follow once confirmation is
   farther along: relocate `cdrl-did-data-model.json` to `/methodology/guidance/` and convert it from raw `.json`
   to a typed `.ts` module, consistent with this app's "types stay in `client/src/types`" convention.

## 2026-08-11 — Scope gap: relationship-edge rendering folded into Phase 3

Caught mid-build, not a design-chat round: the original 5-phase plan never assigned a phase to actually drawing the
`influences`/`influenced_by` edges across lines — the cross-document "back and forth across the whole team" the
data model's own `purpose_statement` names as this app's primary goal. Everything built through Phase 2 only
showed those relationships as a text list in the Level 3 detail panel, not as connections on the map itself.

6. **Resolution: fold it into Phase 3, not its own phase or a design-chat round-trip.** `validateModel()`'s first
   check (no dangling `influences`/`influenced_by` references) covers the exact same edge data the drawing needs,
   so building both together avoided doing the same edge-traversal twice. Implemented as edges only from the
   currently expanded line's nodes outward — not a permanent full-graph overlay, since the data model's own
   `confirmed_patterns.relationship_assessment_status` already flags that an always-on graph (with `SEMP`/
   `IMP_IMS`/`RMP` all influencing `"ALL"`) would be an unreadable hairball. Edges to `"ALL"` targets are skipped
   for the same reason. Targets on a currently-collapsed line get a small unfilled "ghost" endpoint dot at their
   own anchor position (clickable, opens that node's own detail panel) rather than requiring their line to also
   be expanded. **Superseded by #7 below** — the point-to-point diagonal edges this produced were replaced with
   hub-and-spoke routing the same day, once Ron reacted to a screenshot.

## 2026-08-11 — Relationship hub redesigned as a WMATA-style bullseye; schema reworked for multi-domain CDRLs

Two rounds of direct visual feedback from Ron, referencing real WMATA subway maps, landed the same day as #6 above
and changed both the relationship-edge rendering and the underlying node schema.

7. **Relationship routing: hub-and-spoke through one bullseye, not point-to-point diagonals.** Ron: "dashed lines
   should be cross routes to major subway hub stations combining all related lines together," then, with a WMATA
   map legend screenshot showing its concentric-ring transfer-station icon: "outside to inside with each SETR
   event being a circle down to a single bullseye for PRR." Replaced the per-relationship diagonal edges from #6
   with ONE shared hub per line-expansion, positioned at the PRR column, rendered as concentric CSS `box-shadow`
   rings (one per distinct SETR event the expanded line's own DRAFT/FINAL/UPDATE markers touch, capped at 6) —
   every qualifying node's relationships route into that single bullseye and back out to each target, rather than
   each drawing its own line across the map. PRR specifically because "every SETR through PRR" is this data
   model's dominant recurring-update cadence (see `confirmed_patterns`), making it the natural convergence point.

8. **Schema: `node.line: string` → `node.domains: string[]`.** Ron, sharing a larger multi-line WMATA map: "colors
   could be aligned to various system development domains on a large program with CDRLs being the subway stops
   involving one or more domains['] participation." A CDRL needing to serve more than one domain line
   simultaneously (a real subway interchange, not a relationship edge to a different node) wasn't representable
   under a single `line` field. Migrated `cdrl-did-data-model.json` structure-only — every node's `domains` array
   still holds just its one prior `line` value, **no new multi-domain content was invented as part of this
   change**. Rendering now treats `domains[0]` as primary (where the node's own timeline/context marker appears)
   and draws any additional domains as a true interchange: small unfilled presence dots on those lines' rows at
   the same column, joined by a thin vertical connector — verified against a synthetic (uncommitted) multi-domain
   RVTM before reverting it, since RVTM's own notes already call it "the natural interchange station artifact...
   where Design Input and Design Output lines cross." **Open item:** which CDRLs actually span multiple domains is
   unconfirmed content, not something this app should assign unilaterally — a future interview/design-chat pass,
   same as the rest of the not-yet-confirmed content tracked in `cdrl-path-project-brief.md`.

9. **Relationship hub must be a permanent map feature, not gated behind expanding a line.** Ron, after seeing #7
   live: "I tapped a line and see a bullseye specific to that one colored line. We need to evolve this together as
   this misses the mark for my request" — clarified the gap is that a bullseye only existing while inspecting one
   specific line isn't a real subway interchange; real ones are always on the map. Reworked so every line's
   relationship hub (if it has any cross-line relationships) renders simultaneously at Level 1, with no line
   expanded — verified 4 hubs visible at once on the unmodified data with zero clicks. The per-node DRAFT/FINAL/
   UPDATE maturity timeline (sub-lane offsets, per-state marker styling) stays gated behind expanding a line, as
   the Level 2 detail layer; every full_station node otherwise shows a lightweight single-dot marker so hub edges
   always have a visible origin/destination point regardless of zoom state.
