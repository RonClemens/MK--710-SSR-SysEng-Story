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

## 2026-08-12 — Domain taxonomy redefined; polar/dartboard layout scoped as the next rewrite

Ron, reacting to a bigger multi-line WMATA reference map: the layout itself should be polar, not Cartesian — SETR
events as concentric rings (ASR outermost, PRR the center bullseye), each line spiraling inward and stopping at its
own latest active ring rather than a left-to-right timeline with a hub bolted on. That's a full coordinate-system
rewrite (`x=time, y=line` → `radius=time, angle=line`), and Ron flagged the prerequisite himself: "each train route
is a grouping of types of CDRLs, which we should probably refine the definition together" — i.e. settle what the
*lines* represent before building geometry around them.

10. **Sequencing confirmed: domains before geometry.** Agreed not to build polar layout code around groupings
    that were about to change. Code Chat proposed a discipline-based draft taxonomy for Ron to react to rather
    than asking Ron to author one from scratch, since the existing 36-node data model already had enough signal
    (DIDs, RACI-adjacent content, current line categories) to draft a reasonable first pass.

11. **New domain taxonomy — Ron: "looks good for start."** Replaced the original 7 lines (grouped by
    input/output *stage*) with 7 domains grouped by engineering *discipline*, matching how programs actually
    organize into IPTs:
    | Domain | Was (old line) | Rationale |
    |---|---|---|
    | `SE` (Systems Engineering) | mostly `DESIGN_INPUT`/`DESIGN_OUTPUT` | System-level requirements/design, not discipline-specific |
    | `SW` (Software Engineering) | `DESIGN_OUTPUT` (IPSC docs) | CSCI design/build artifacts |
    | `HW` (Hardware Engineering) | `DESIGN_OUTPUT` (HWCI docs) | HWCI design/production artifacts — new line, didn't exist before |
    | `TE` (Test & Evaluation) | `TEST` | Verification purpose, not artifact numbering — the IPSC-numbered test docs (STP/STD/STR) live here, not SW |
    | `SAFETY_RELIABILITY` | `SAFETY_RELIABILITY` | Unchanged |
    | `ILS` (Integrated Logistics Support) | `LOGISTICS` | Renamed only |
    | `PM_CM` | `MGMT` + `CM` merged | One program-administration line instead of two |

    This is a **real content change**, not structure-only like the domains[] migration in #8 — it reassigns which
    domain(s) each of the 36 nodes belongs to, based on Code Chat's draft proposal, approved by Ron as a starting
    point (not a final confirmation — same provisional status as the rest of this model's unconfirmed content).
    Six nodes came out as genuinely multi-domain rather than single-line, which is the whole point of the #8
    schema change paying off: `IRS`/`ICD`/`IDD` (interface docs — SE+SW+HW), `RVTM` (TE+SE, already described in
    its own notes as an interchange artifact), `HW_DEV_SPEC` (HW+SW, its own notes say it covers "combined SW/HW
    requirements"), and `FCA_PCA_evidence` (PM_CM+SE+SW+HW, already described as "the terminal interchange
    station" where Design Input and Design Output converge). Verified `validateModel()` still returns 0 issues and
    the existing (still-Cartesian) rendering shows real interchange connectors at these nodes — no synthetic test
    data needed this time, since the migration itself produced genuine multi-domain content.

    **Open/next:** the polar/dartboard geometry itself (#10's actual deliverable) hasn't been built yet — this
    entry only covers the prerequisite domain redefinition. Also open: whether `CDD` belongs in `SE` or `PM_CM`
    (flagged as a coin flip in the draft proposal, not specifically confirmed either way).

## 2026-08-12 — Polar/dartboard layout built

`cdrlPathLayout.ts` rewritten from Cartesian (`x=time, y=line`) to polar (`radius=SETR event,
angle=domain`) coordinates, delivering #10's actual geometry against the #11 domain taxonomy.

12. **Rings, not columns: SETR events become concentric circles, ASR outermost, PRR the
    center.** `ringRadius(index)` maps event index 0..prrIndex onto `OUTER_RADIUS..INNER_RADIUS`
    linearly. PCA and ISR fall outside this ring system (PRR is the modeled terminus, not the
    literal last SETR event) — CM baselines at PCA are skipped with a console warning rather than
    stretching the ring system or silently mispositioning them.

13. **Domain spokes stop at each domain's own latest active ring — not forced to center.**
    `domainMaxActiveIndex(lineId)` scans every node primarily on that domain (context markers and
    full-station maturity markers alike) for the highest SETR event actually reached, and the
    spoke is drawn from the outer ring (ASR) to exactly that ring. In the current data most
    domains' spokes do reach the center, because most CDRLs recur through PRR (the data model's
    own dominant confirmed pattern) — that's real content, not a bug forcing convergence.

14. **The constructed bullseye hub from #7 is gone — the real rings do that job now.**
    Relationship edges (`influences`/`influenced_by`) are drawn as direct dashed connectors
    between each pair's actual anchor points, skipping same-domain pairs (already visually
    adjacent on one spoke) and `"ALL"` targets (per `confirmed_patterns
    .relationship_assessment_status`, same reasoning as #6). With real concentric rings and a
    shared center, routing relationships through a separately-constructed hub was redundant once
    the geometry itself did the converging.

15. **Multi-domain interchanges render as a chord + presence dot, not a true arc.** For a node
    spanning 2+ domains, a straight line between its two positions on the same ring approximates
    the arc a real subway map would draw — deliberately simpler for a first pass; flagged in code
    as a candidate for a true SVG arc if it reads poorly in practice.

16. **Sub-lane collision fix re-expressed as an angular offset.** Multiple nodes landing on the
    same domain + ring (Level 2 expanded timeline) now fan out by degrees
    (`MAX_SUBLANE_SPREAD_DEG`, capped at 4°/node) instead of the old Cartesian pixel offset —
    same fix, same failure mode, adapted to the new coordinate system.

    Verified: `tsc -b` clean; Playwright screenshots of Level 1 (all 7 spokes, rings, and
    interchange chords rendering with zero clicks), Level 2 (SE line expanded, full maturity
    timeline fanning correctly by ring), and Level 3 (station detail panel opens on click) with
    zero console/page errors in all three states.

## 2026-08-12 — Train-stop iconography; interchanges are a hub between tracks, not on one

Ron, reacting to the polar layout live: "thicken each line, make each CDRL look like the
trainstop icon. if the CDRL is only one domain area to develop, it belongs on one single track.
If two or more domain areas are needed to develop, the CDRL should be a hub for those related
tracks." Two changes to `cdrlPathLayout.ts`.

17. **Domain spokes thickened** (5/7px unexpanded/expanded → 9/12px) for better visual weight
    against the rest of the map, matching how prominently a WMATA line reads against its
    background.

18. **Every CDRL now renders as a hollow "train stop" ring in its line's color**, not a solid
    filled dot — `STATION_MARKER_SIZE` (16px, up from 12px) with a 3px colored border and a
    light fill, replacing the old solid-fill-with-white-border look. A single-domain CDRL gets
    exactly one of these, sitting directly on its one track, per Ron's "it belongs on one single
    track."

19. **Multi-domain CDRLs are now a hub between their tracks, not a marker on their "primary"
    one.** Replaced the old chord-between-two-points approximation (drawn from the primary
    domain's own marker out to a presence dot on each other domain) with `renderInterchangeHub`:
    the station itself sits at the circular-mean angle of all its domains (at their shared
    ring) — genuinely *between* the tracks rather than glued to whichever domain happened to be
    `domains[0]` — rendered as a bigger (26px) concentric-ring icon (double border, the WMATA
    transfer-station look Ron referenced back in #7's original bullseye feedback), with a short
    colored stub running from the hub out to a train-stop tick on each involved track. The
    Level 2 rich-timeline case (a multi-domain node whose primary domain is the currently
    expanded line) keeps its maturity marker on that line as before, but now extracts the same
    stub-drawing logic (`renderInterchangeStubsFrom`) so the interchange still reads consistently
    whether or not a line is expanded.

    Verified: `tsc -b` clean; Playwright screenshots at Level 1 (7 thickened spokes, all 6
    multi-domain nodes rendering as concentric-ring hubs with colored stubs to 2-4 tracks
    depending on the node), Level 2 (SE expanded, interchange stubs still branching correctly
    from the expanded-line anchor), and Level 3 (detail panel opens on click) — zero console/page
    errors in all three states, no click-routing changes needed since `station-`/
    `interchange-presence-` id schemes were preserved.

## 2026-08-12 — Bug: decomposition level was silently hiding whole domains

Ron, looking at the live map: "I think the data model might be too detailed or complex to align
CDRLs using railroad track colors. I am seeing Software Engineering CDRLs (orange) and Hardware
Engineering CDRLs (red) not evolving through the SETR process on one single track." Traced to a
real bug, not a modeling-complexity problem — the "single track per domain" concept was fine,
decomposition-level filtering was breaking it.

20. **Root cause: two code paths disagreed about whether a node's own `decomposition_level` tag
    should gate its visibility.** A station's lightweight dot (`anchorEventIndex`) reads a
    node's maturity data directly, ignoring decomposition level entirely — same as
    `CdrlPathStationDetailPanel`, which only branches on `maturity_states_by_level` when a node
    actually defines it (e.g. RVTM), never on the node's own single-level tag. But
    `maturityStatesForLevel` (used for both the domain spoke's length and the Level 2 rich
    timeline) treated that single-level tag as an all-or-nothing visibility switch: since every
    one of SW's and HW's real deliverables (SRS, SDD, DBDD, ENG_DRAWINGS, HW_DEV_SPEC, etc.) is
    tagged `CONFIGURATION_ITEM` — because that's the only level a CSCI/HWCI-specific document is
    ever produced at, not a partial/incomplete tagging — the default "System" view computed
    their domain's spoke length as zero and, one layer deeper, hid their entire Level 2
    timeline too, while unrelated nodes tagged `SYSTEM` (like IRS) kept showing normally on the
    same track. The result: orphaned station dots past a stub track, and an almost-empty
    expanded view for two of seven domains — reading exactly like "not evolving on one single
    track."

21. **Fix: a node's own `decomposition_level` tag is descriptive, not a visibility gate.**
    `maturityStatesForLevel` (`cdrlPathMaturityMarkers.ts`) now matches
    `CdrlPathStationDetailPanel`'s already-correct behavior — branch on
    `maturity_states_by_level` only when a node defines it, otherwise always return the flat
    `maturity_states` regardless of which decomposition-level button is selected. A domain's
    spoke length (`domainMaxActiveIndex` in `cdrlPathLayout.ts`) goes a step further via a new
    `allMaturityStates` helper: for a level-split node, it takes the union across ALL levels
    rather than just the currently selected one, so a domain's backbone track stays stable as
    you toggle decomposition level — per the project brief, that toggle is "a filter/toggle,
    not a separate stacked map," and shouldn't make whole tracks appear or disappear.

    Verified: SW and HW spokes now reach the center at the default System view without needing
    to switch decomposition level, matching every other domain (previously confirmed by
    comparison against the CI-level view, where they already looked correct). Expanding SW at
    System level now shows all 5 of its real deliverables' full DRAFT/FINAL/UPDATE timelines,
    not just the one coincidentally-SYSTEM-tagged interchange node (IRS) that happens to also
    touch that track. `tsc -b` clean; zero console/page errors across Level 1, Level 2 (SW
    expanded), and Level 3 (detail panel).

## 2026-08-12 — Tracks bend to meet each other; interchange stubs removed

Ron, looking at the live map: "the colors don't have to stay in their pie piece if they need to
traverse alongside another domain color track to get to their finish state. there are too many
criss-crossing dashed lines in addition to the large route line for each color. how do we
establish a meandering single track for each color?" This was explicitly flagged as deferred
scope back in #16-19 ("whether domains should ever have angularly bent/curved spokes... deferred
per stated v1 scope") — Ron asked for it to be built now.

22. **Domain tracks are now bent polylines, not rigid radial spokes.** Each domain still has a
    home angle (the equal-division pie-slice angle from #10), but a track only sits exactly on
    that angle where it has no reason to move. For every CDRL spanning 2+ domains, Code Chat
    computes one shared "meeting point" — the circular mean of its domains' home angles, at that
    CDRL's own resolved ring — and every domain touching that CDRL gets an angle keyframe pulling
    its track toward that exact point at that ring. Between keyframes (ring 0 at home angle, each
    meeting ring, and the track's own end back at home angle), the angle is linearly interpolated
    (shortest angular path) so the track eases toward a meeting and back rather than snapping.
    Rendered as one straight ring-to-ring segment per hop (reusing the zero-size-anchor-node +
    `type: "straight"` pattern already used throughout this file) rather than a single edge, so
    it reads as a continuous bending line without needing a custom multi-point edge component.

23. **The separate interchange-hub-plus-stub-connectors construct from #17-19 is gone.** Since
    every domain a multi-domain CDRL touches now bends its own track through that CDRL's exact
    meeting point, the tracks themselves visually converge there — no separate thin stub edges
    or per-domain presence dots are needed to fake the connection anymore. `renderInterchangeHub`
    and `renderInterchangeStubsFrom` collapsed into one path: the concentric-ring hub icon still
    renders (unchanged look), but sits exactly where the bent tracks already meet.

24. **A domain's track extent now includes anywhere it needs to bend to, not just its own
    content.** `domainTrackExtent` takes the deeper of a domain's own maturity data and any
    shared-meeting ring it participates in — so a domain whose own deliverables stop early but
    that co-owns a CDRL recurring much further inward keeps running (bent toward that CDRL) all
    the way to it, per Ron's "traverse alongside another domain color track to get to their
    finish state."

    Click-routing impact: a domain's track edge id changed from one `line-edge-{lineId}` edge to
    several `line-edge-{lineId}--seg{n}` segments: updated `lineIdFromElementId` in
    `CdrlPathPage.tsx` to split off the `--seg{n}` suffix rather than change the click-handling
    contract. The now-dead `interchange-presence-` id branch in `nodeIdFromElementId` was removed
    since nothing produces that id anymore.

    Verified: `tsc -b` clean; Playwright screenshots show tracks visibly curving toward shared
    meeting points (e.g. SE/SW/HW bending together near their shared interface-doc stations)
    with no separate stub lines, and Level 2 (SE expanded — the rich timeline follows the same
    bent track) and Level 3 (detail panel) still work, clicking anywhere along a segmented track
    still expands/collapses it — zero console/page errors in all three states.

## 2026-08-12 — Track routing reformulated as a graph + Dijkstra shortest path

Ron: "I'd like to employ dijkstra's algorithm to this entire network. We need to figure out how
to describe the 'network' in the data structure feeding the diagram as an optimization / linear
programming representation." Follow-up, clarifying scope: "The 'shortest path' should be
calculated for every color, not just the overall shortest path. this is meant to minimize
distance between all the lines constrained at each SETR Event." #22's bent tracks were computed
via hand-interpolation between waypoints (a reasonable heuristic, but not an actual graph or
algorithm) — this replaces that with a literal graph representation solved by Dijkstra, one per
domain, per Ron's explicit ask.

25. **New module `cdrlPathGraph.ts`**: a generic, reusable `Graph` (nodes + weighted directed
    adjacency) and a textbook Dijkstra (`dijkstraShortestPath`) — linear-scan "extract min"
    rather than a binary heap, since these graphs are tiny (a handful of candidate angles per
    ring, at most ~11 rings), so O(V²) is negligible and the implementation stays easy to verify
    by inspection.

26. **The network, formalized**: for each domain, one graph. A node is a `(ring, candidate
    angle)` pair; an edge connects ring `r` to `r+1`, weighted by the angular distance between
    the two nodes' angles. A ring where that domain has a mandatory multi-domain meeting (from
    #22's `meetings`) offers exactly ONE candidate node — that meeting's angle — so the shortest
    path is forced through it; this is the literal graph expression of "constrained at each SETR
    event." Every other ring offers the domain's home angle plus every meeting angle it
    participates in anywhere along its track, so the solver is free to start easing toward a
    meeting before the ring that actually requires it. Total path weight is exactly "distance
    between the lines" — minimizing it (Dijkstra's whole job) is precisely Ron's stated
    objective, and it's computed independently "for every color," not one shared/overall
    shortest path.

27. **`cdrlPathLayout.ts`'s `solveDomainTrackAngles` replaces the old keyframe/lerp pair.**
    Builds each domain's graph, runs Dijkstra from its ring-0 home-angle node to its terminal
    ring's home-angle node, and reads the angle off each node in the returned path — `trackAngleAt`
    becomes a simple array lookup. Because the cost function (sum of angular distance per hop)
    obeys the triangle inequality, the shortest path between two required points is always the
    direct one — so for the common one-meeting-per-domain case, results are numerically
    equivalent to #22's heuristic; the real gain is for domains touching multiple meetings at
    different rings (a genuine multi-stop shortest-path problem, which Dijkstra solves correctly
    by construction rather than by hoping keyframe interpolation happened to get it right) and
    having an explicit, inspectable, extensible graph rather than an ad hoc formula.

    Verified: `tsc -b` clean; Playwright screenshots at Level 1 (bent tracks visually unchanged
    from #22 — expected, confirming the solver reproduces the same optimum), Level 2 (SE
    expanded, rich timeline follows the Dijkstra-solved track), and Level 3 (detail panel) —
    zero console/page errors in all three states.

## 2026-08-12 — Bug: visible gaps in bent tracks, fixed with a custom polyline edge

Ron, from a phone screenshot of the live map: "why are these lines not connected?" — PM_CM and
ILS (the tracks with the most ring-to-ring bending) showed a visible staircase of gaps between
segments instead of one continuous line.

28. **Root cause: React Flow's floating-edge geometry, not the angle math.** #22-24 chained a
    domain's track as one straight `Edge` per ring-to-ring hop, connecting tiny "anchor" utility
    nodes. Without explicit handles, React Flow's built-in edge types connect via "floating"
    boundary-intersection geometry — each edge's endpoint is computed as where the line between
    the two nodes' centers crosses the *node's own bounding box*, not the exact center. For a
    single edge that shrink is a fraction of a pixel, invisible. Chaining many short segments
    compounds it into a real, visible gap at every joint — confirmed by inspecting the actual
    rendered SVG path data in the browser: two consecutive segments meant to share one point
    landed 26px apart. A same-size investigation also surfaced that `.react-flow__node-default`'s
    stylesheet applies a `min-width`/`min-height` that silently overrides a plain `style: {width:
    0}` (min-* always wins over width/height in the CSS box model) — a dead end worth recording
    since it's exactly the kind of thing that looks like it should have worked.

29. **Fix: one custom-drawn polyline edge per domain, not a chain of React Flow edges.** New
    `client/src/components/CdrlPathTrackEdge.tsx` renders an arbitrary multi-point SVG `<path>`
    directly from an explicit `data.points` array via `BaseEdge`, sidestepping node-boundary
    math entirely — the line renders exactly where `solveDomainTrackAngles` computed it, with no
    seams regardless of how many rings it bends through. `cdrlPathLayout.ts` now emits exactly
    one `line-edge-{lineId}` edge per domain (reverting the `--seg{n}` id scheme from #22), with
    two lightweight anchor nodes existing only so React Flow has valid source/target ids to
    satisfy its bookkeeping — their own rendered position/size no longer matters, since the
    custom edge ignores it.

    Verified: `tsc -b` clean; inspected actual rendered SVG path coordinates confirming
    consecutive points now align exactly (no gap); Playwright screenshots across Level 1 (all 7
    tracks single continuous bent lines), Level 2 (SE expanded, still clickable to
    collapse), and Level 3 (detail panel) — zero console/page errors in all three states.

## 2026-08-12 — Parallel tracks given their own lane, per-domain

Ron, from the live map: "can each path have it's own channel, or slight offset, so none overlap
and align next to each other when necessary?" — domains easing toward the same meeting (or
running the same general direction for a stretch) were landing on top of each other, same as a
real subway map's shared trunk corridor before this was addressed.

30. **Every domain gets a fixed lane, offset perpendicular to its own path.** `trackAngleAt`
    (`cdrlPathLayout.ts`) now nudges each domain's angle sideways by `LANE_OFFSET_PX` (9px)
    times its lane number — the domain's position in the line order, centered on zero (e.g. for
    7 domains: -3..+3) — scaled by `1/radius` so the on-screen gap stays a constant pixel width
    regardless of how close to the center that ring is (a bigger angular nudge is needed near
    the center to hold the same physical gap). The one exemption: at a ring that's an actual
    required meeting for that domain, no offset is applied, so tracks still converge to touch
    exactly at the interchange icon rather than passing near it and missing. Because every
    caller (the track polyline, single-domain station markers, expanded-line maturity markers,
    relationship ghost anchors) reads through the same `trackAngleAt`, the lane offset applies
    consistently everywhere a domain's position is computed — no marker ends up off its own
    rendered track.

    Verified: `tsc -b` clean; Playwright screenshot shows SE/SW/HW running as three visibly
    separate parallel channels on approach to their shared interchange, converging to one exact
    point at the hub icon rather than overlapping the whole way; Level 2 (SE expanded) and
    Level 3 (detail panel) still work — zero console/page errors.
