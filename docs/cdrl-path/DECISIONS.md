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
   be expanded.
