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

## 2026-08-13 — Interchange hub no longer pinches parallel tracks to one pixel

Ron, sharing a real WMATA map for comparison: "the tracks are still not running completely
parallel like the true subway maps show... the convergence at each hub transfer station is
forcing edges to converge unnecessarily at the exact same XY coordinate. that is not necessary
for visual purposes." Correct call — real transfer stations keep shared-corridor lines visibly
parallel the whole way through; the icon marks the transfer, it doesn't require the lines to
merge into one point.

31. **#30's lane offset now applies unconditionally, including at meeting rings.**
    `trackAngleAt` previously special-cased a domain's own required meeting ring to skip the
    lane nudge (so tracks would touch exactly there) — that exemption is gone. A domain's lane
    offset is now constant everywhere along its track, so lines stay visibly separate and
    parallel straight through an interchange instead of pinching to a shared pixel and
    re-diverging.

32. **The interchange hub sits at the centroid of the (now-parallel, still separate) points its
    domains actually render at, with a short colored stub to each** — not a point every domain
    is forced to touch. `renderStation`'s multi-domain branch computes each participating
    domain's real (lane-offset) position at the meeting ring via `trackAngleAt`, averages them
    for the hub icon's placement, and draws a thin 3px stub from the hub to each track — small
    when domains are lanes apart, near-zero when they're adjacent, same visual language as a
    WMATA transfer icon sitting among (not merging) the lines it connects. The `MultiDomainMeeting`
    interface dropped its now-unused precomputed `point` field accordingly.

    Verified: `tsc -b` clean; Playwright screenshot confirms SE/SW/HW now run as three
    consistently parallel channels all the way through their shared interchange (no pinch
    point), with the hub icon sitting among them and short stubs to each; Level 2 (SE expanded)
    and Level 3 (detail panel) still work — zero console/page errors.

## 2026-08-13 — Relationship lines become "handoff hub" stops between rings

Ron: "the next step is to establish the 'in-between' hub stops between SETR Events that
represent the 'influence / influenced by' faint dotted lines. The purpose is to depict the
handoffs / working sessions needed between any two (or more) domain groups to complete their
CDRLs properly and to right level of maturity by the general SETR Event (represented by the
ring)." Replaces the direct point-to-point dashed relationship edges (one long diagonal per
`influences`/`influenced_by` pair, criss-crossing the whole map) with shared hub stops.

33. **Every cross-domain relationship pair is bucketed into a shared handoff hub by (unordered
    domain pair, nearest half-ring), not drawn as its own line.** A quick census of the current
    data: 59 unique cross-domain node pairs across only 16 distinct domain-pairs (e.g.
    SAFETY_RELIABILITY↔SE alone accounts for 9) — exactly the kind of repetition a shared stop
    consolidates. For each pair, `nodeRingIndex()` resolves each node's own ring (reusing the
    same anchor logic as its station marker, or its multi-domain meeting's ring if it has one);
    the pair's ring is their average, bucketed to the nearest half-ring so nearby relationships
    between the same two domains land on one hub instead of scattering across near-identical
    rings.

34. **The hub sits genuinely "in between" two SETR rings, not snapped onto one.** New
    `trackAngleAtFractional()` interpolates a domain's angle at a fractional ring (shortest
    angular path between its two neighboring integer-ring angles), and `ringRadius()` already
    supports fractional input — so a hub at ring 2.5 sits radially halfway between rings 2 and
    3, angularly positioned at the circular mean of its two domains' angles there. Rendered as
    a small (18px) dashed gray diamond — deliberately distinct from the solid-bordered white
    circle used for a CDRL that itself spans multiple domains (#17-19), since this marks a
    *process* handoff between two separate CDRLs, not one artifact's domain membership. Each
    relationship in the hub's group gets a short, thin dashed stub (its own domain's color) from
    the hub to that CDRL's actual anchor point — replacing the single long diagonal.

35. **The old direct point-to-point relationship edges and their `relationship-anchor-*` node
    scaffolding are gone.** Every cross-domain relationship now routes through its group's hub
    instead; the anchor-node emission loop that existed solely to give those direct edges valid
    React Flow source/target ids was dead code once nothing referenced it, so it was removed.

    Verified: `tsc -b` clean; Playwright screenshot shows the dashed-line hairball meaningfully
    thinned — shorter local stub segments radiating from clustered hub points rather than long
    diagonals crossing the whole map; DOM inspection confirms 33 handoff hubs and 114 stub edges
    rendering with correct geometry; Level 2 (SE expanded) and Level 3 (detail panel) still work
    — zero console/page errors.

## 2026-08-13 — Bug: jagged gray track near center; PRR given its own hub icon

Ron, from a phone screenshot: "PRR should be a hub transfer station. Gray line is jagged. why?"
Two related fixes.

36. **Root cause of the jaggedness: #30's lane offset scales as 1/radius with no floor.** A
    constant on-screen pixel gap between lanes needs a growing angular offset as radius shrinks
    — correct everywhere except near the center, where a few ring-to-ring radius steps cover a
    large relative change in 1/radius, producing a visibly jagged, near-spiraling track. PM_CM
    showed it worst because it sits at the end of the 7-line order and so has the largest
    `|laneSign|` (its lane offset is 3x HW's at every ring). Fixed with `LANE_FADE_START_RADIUS`:
    the lane offset now fades linearly to exactly 0 by `INNER_RADIUS` instead of blowing up —
    which is also the visually correct behavior on its own terms, not just a bug workaround:
    lines should draw together as they approach the map's actual hub, not fan out.

37. **PRR gets an explicit transfer-station icon, not just a thicker ring border.** Nearly
    every domain's track terminates at or passes near PRR (the data model's own dominant
    recurring-update cadence, see `confirmed_patterns`), making it the map's real hub — but
    Level 1 only ever showed that via a slightly bolder ring border, easy to miss. Added a
    concentric-ring icon (`prr-hub`, 40px — bigger than any single CDRL's own interchange hub
    at 26px, since this is the map's single biggest convergence point) at the exact center,
    same visual language as a CDRL interchange hub for immediate recognizability.

    Verified: `tsc -b` clean; Playwright screenshot confirms the gray (PM_CM) track is now a
    clean line with no zigzag near the center, and a clear hub icon sits at PRR; Level 2 (SE
    expanded) and Level 3 (detail panel) still work — zero console/page errors.

## 2026-08-13 — PRR's ring circle removed; lane fade smoothed further

Ron, from another phone screenshot: "still looks a bit jagged and sloppy. Also, remove the
concentric circle for PRR entirely (or hide it behind the transfer hub icon)." Two follow-on
refinements to #36-37.

38. **PRR's ring boundary circle is gone, not just restyled.** #37 added a hub icon at PRR but
    left the ring's own circle (radius `INNER_RADIUS`, same border every other ring gets) drawn
    around it, so the map showed a visibly separate thin circle boxing in the hub icon — a
    "circle within a circle" rather than one clean transfer-station indicator. The ring loop now
    skips PRR's boundary entirely (its `PRR` text label is unaffected); the hub icon alone marks
    the location.

39. **Lane-offset fade smoothed and spread over more rings.** #36's fade was linear over a
    fairly short radius range (down to 0 by 250px), so the last couple of rings before the
    center still showed a visible, fairly abrupt taper for domains with a large lane number.
    Switched to a smoothstep curve (zero slope at both ends, not just linear) over a wider range
    (`LANE_FADE_START_RADIUS` 250→400px) so lanes converge gradually across several rings rather
    than easing in only right at the finish; `LANE_OFFSET_PX` also trimmed slightly (9→7) for an
    overall calmer look.

    Verified: `tsc -b` clean; Playwright screenshot confirms PRR now shows a single hub icon
    with no surrounding ring circle, and tracks (PM_CM especially) read as smooth curves rather
    than a jagged polyline; Level 2 (SE expanded) and Level 3 (detail panel) still work — zero
    console/page errors.

## 2026-08-13 — Model editor: atomic edit and batch import land, consolidated into one tool

Ron: "let's provide a CDRL path model edit tool in the webapp just above the subway chart that
can publish and execute a script to update the subway map. I also want the ability to edit the
JSON CDRL path model offline, then batch import for Subway map update, too." This is Phase 4
(atomic edit) and Phase 5 (batch import) from the original handoff doc, previously unbuilt.

40. **Both pathways consolidated into one JSON-level editor, not two separate UIs.**
    `cdrl-path-import-export-architecture.md` already calls for `AtomicEditPanel` and
    `ImportManager` to share one `validateModel()` gate and never diverge into two validation
    code paths — new `CdrlPathModelEditor.tsx` takes that a step further for v1 and gives them
    one shared UI too: a textarea pre-filled with the current model (edit a field directly for
    an atomic-style change) that also accepts a **Load JSON File** upload (an offline-edited
    file, for batch import), both going through the same **Validate** → **Apply to Map** flow.
    Positioned directly above the subway chart in `CdrlPathPage.tsx`, collapsed by default
    behind an "Edit Model" button so it doesn't compete with the map when not in use.

41. **`useCdrlPathModel` became real state, not a fixed derived value.** Previously returned a
    `useMemo` of the bundled JSON with no way to change it. Now returns `{ model, setModel,
    isDirty, resetToDefault }` — `setModel` is what `CdrlPathModelEditor`'s Apply calls, and
    every consumer downstream (the layout builder, the detail panel, `CdrlPathExportManager`)
    already re-renders reactively off `model` with no changes needed elsewhere.
    `CdrlPathExportManager`'s `isDirty` prop, hardcoded `false` since Phase 3, now reflects
    real edit state — the "Unsaved changes — export to save" banner finally means something.

42. **Applying an edit never writes to disk or the repo — only the in-browser working copy.**
    Consistent with the reference model's permanent Export/Download-only persistence decision
    (#5): "Apply to Map" updates React state so the chart re-renders immediately, and Export
    JSON (already built in Phase 3) is how a session's edits actually get saved, for Ron to
    review and commit back to `cdrl-did-data-model.json` himself — no GitHub-API write-back,
    per the architecture doc's own open item marking that a possible fast-follow, not v1 scope.

43. **Diff preview is a documented v1 simplification of the architecture doc's fuller spec.**
    The full batch-import pipeline described there (exact/alias matching, per-field
    trusted-override-vs-conflict rules, three-bucket Matched/Conflicts/Unmatched review UI) is
    real reconciliation logic meant for Ron's eventual live CDRL-schedule import against
    partial records. What ships now is simpler and correct for its actual use case (a
    wholesale replacement or direct edit of the same JSON document, not reconciling a
    third-party schedule extract against it): node-level added/removed/changed-by-id, plus a
    coarser "these other top-level sections differ" flag for anything outside `nodes` (lines,
    lifecycle_lanes, decomposition_dimension, etc. — e.g. a line's `color_hint`). Caught in
    testing: the diff originally checked only `nodes` and silently missed a `lines` edit even
    though Apply correctly updated the map — fixed before shipping.

    Verified end-to-end via Playwright: opened the editor, edited a line's `color_hint`
    in-place, Validate showed "Other sections changed: lines," Apply updated the actual
    rendered track color and set the dirty banner; separately, invalid JSON produces a clear
    parse error with Apply disabled; separately, loading a file (a different line's color
    changed) through **Load JSON File** validated and applied correctly, confirmed via the
    rendered SVG stroke color. `tsc -b` clean; Level 1/2/3 regression-checked on a fresh page
    load with zero console/page errors.

## 2026-08-13 — Bug: tracks that reach PRR stopped short of the bullseye, not on it

Ron, from a phone screenshot: "make sure any paths that end up at PRR map directly on the
bullseye." #37 added a hub icon at the map's exact center, but tracks whose own content
genuinely reaches PRR were still stopping at `ringRadius(prrIndex)` — which was `INNER_RADIUS`
(50px), not 0 — leaving a small but visible gap between a track's tip and the icon it was
supposed to terminate at.

44. **`ringRadius()` now maps PRR to radius exactly 0.** The old formula reserved
    `INNER_RADIUS` as an inner floor the innermost ring's circle sat on — sensible back when
    PRR's ring boundary was actually drawn (#37 removed that boundary entirely, leaving only
    the hub icon at dead center). Rings now space evenly across the full `OUTER_RADIUS..0`
    span with no reserved inner buffer, so a domain track whose `trackExtentByLine` reaches
    `prrIndex` has its literal final point at `CENTER` — exactly where the hub icon sits — not
    a fixed 50px short of it. `INNER_RADIUS` is unchanged as the lane-offset fade floor (#36),
    which was never about the ring geometry itself.

    Verified: `tsc -b` clean; Playwright screenshot confirms SE, PM_CM, and ILS tracks (the
    domains currently reaching PRR) now terminate with their tip flush against the bullseye
    icon rather than stopping short of it; Level 2 (SE expanded) and Level 3 (detail panel)
    still work — zero console/page errors.

## 2026-08-14 — Related-CDRLs modal with side drawer; remove the connection-handle dots

Ron: "better, but needs more work. when a transfer hub or single station is clicked, CDRLs
related to those stations should display in a modal. then, each CDRL detail page should be
expandable in that pop-up window as a side drawer. remove the two little black dots from each
station circle."

45. **Clicking any marker now opens a related-CDRLs list, not one node's detail directly.**
    The old `CdrlPathStationDetailPanel` jumped straight to a single node's full detail. It's
    replaced by `CdrlPathRelatedCdrlsModal`, which lists the CDRLs relevant to whatever was
    clicked — the clicked CDRL itself plus its `influences`/`influenced_by` (`ALL` targets
    skipped, same rule as the relationship-rendering code) for a single station or interchange
    hub (`station-`/`related-`/`maturity-` prefixes), or every CDRL folded into a handoff
    hub's relationship cluster for a `handoff-hub-` click. Each list row expands into a side
    drawer within the same modal (not a second stacked modal) showing that CDRL's full detail
    — DID, maturity states, RACI, relationships, decomposition level, notes, live status —
    reusing the field-rendering content extracted into a new `CdrlPathNodeDetail` component
    (no `<Modal>` wrapper of its own, so both a station click and a handoff-hub click drive the
    same drawer content).

46. **A handoff hub's related CDRLs are computed at layout time, not in the page component.**
    Only `cdrlPathLayout.ts` has visibility into `handoffGroups` (the domain-pair + nearest-
    half-ring bucketing behind each hub — see #33-35), so each hub node now carries
    `data.relatedNodeIds` (every distinct CDRL id across the group's pairs) and
    `data.modalTitle` (e.g. "Systems Engineering CDRLs ↔ Program Management / CM CDRLs
    handoff") baked in at creation. `CdrlPathPage.tsx`'s click handler reads these straight off
    the clicked node for a `handoff-hub-` id; for every other id prefix it derives the same
    shape itself via a plain `model.nodes` lookup, since that data is already available there.
    This required changing `onNodeClick`/`onEdgeClick` to pass the full node/edge object
    through to the handler instead of just its id string, so `data` is reachable.

47. **Bug found and fixed while wiring this up: handoff-hub diamonds were invisible and
    unclickable.** Investigating why clicking one never opened the new modal traced back to
    `@xyflow/react`'s own `NodeWrapper`, which spreads a node's `style` object *after* its own
    positioning `style.transform: translate(x,y)` — so the hub's `style: { transform:
    "rotate(45deg)" }` (set to rotate the marker into a diamond) was silently clobbering React
    Flow's placement, leaving every hub stacked at one shared off-map position with no
    translate at all. This is the same failure mode already called out in the maturity-marker
    code's doc comment (an explicit `transform: undefined` collapsing every marker onto one
    position, #24-ish) — this is its sibling case, a real (non-undefined) `transform` value
    doing the same clobbering. Fixed by drawing the diamond on a `::after` pseudo-element
    (`.cdrl-handoff-hub-marker` in `index.css`) instead of rotating the node's own div, so the
    node's inline `style` never sets `transform` and React Flow's own translate survives
    untouched. Confirmed via a screenshot comparison: before the fix, no diamonds were visible
    anywhere on the map at all despite 33 handoff-hub nodes existing in the DOM; after, they're
    visible scattered across the map as originally intended by #33-35. The identical pattern
    still exists in the AS_NEEDED-state diamond maturity markers (Level 2) — left as-is since
    it's pre-existing, unrelated to this request, and not something Ron flagged; worth a fast-
    follow if that marker type turns out to matter for a real program's data.

48. **The two black dots were React Flow's default connection-`Handle` elements.** Every
    `type: "default"` node renders a top and bottom `<Handle>` div unconditionally unless
    CSS-suppressed — meaningless here since `nodesConnectable` is `false` and nothing is ever
    dragged into a connection. Fixed with one CSS rule, `.cdrl-path-page .react-flow__handle {
    display: none; }`, scoped to this page rather than global since React Flow isn't used
    anywhere else in this app (confirmed via grep) but there's no reason to risk it.

    Verified via Playwright: `.react-flow__handle` count on the page is 648 elements but 0
    visible (confirmed by CSS, not by counting through screenshots); clicking a single-domain
    station opens the related-CDRLs modal, clicking its one list row opens the side drawer with
    correct DID/maturity/RACI/relationship content; clicking a multi-domain interchange hub and
    a handoff-hub diamond each open the modal with the correct multi-row related list and
    (for the handoff hub) the correct domain-pair title; Level 2 line-expand and its maturity-
    marker clicks still open the modal correctly; screenshots confirm handoff-hub diamonds are
    now visibly rendered on the map and station circles no longer show the two dots. `tsc -b`
    clean. One pre-existing, unrelated issue surfaced during testing and left as-is: a handful
    of `handoff-stub-*` edges log a React duplicate-key warning when the same CDRL appears as
    both `pair.a` and `pair.b` across different pairs within one handoff group — a rendering
    warning only, not a click-blocking or visual defect, predates this round, and out of scope
    for what Ron asked for here.

## 2026-08-14 — Transfer hubs absorb stray tracks; SETR-event click replaces handoff diamonds; lane offset goes rank-based

Ron, from a phone screenshot of the SVR_FCA area: "if a track ends on a SETR ring, it needs to
be on the transfer hub with other tracks, unless it is the only CDRL required at that SETR,
which I doubt ever happens. Also, thise clickable dashed diamond boxes should be invisible and
aligned to the SETR Event label, if they popup the full listing of SETR Event CDRLs required.
Last, the track channel approach without track overlap is still not working properly."

49. **Every SETR ring's transfer point is now exactly ONE hub, not one per CDRL that happens to
    meet there.** The screenshot showed a small stray circle sitting right beside — not merged
    into — the SVR_FCA interchange hub. Root cause: two *different* multi-domain CDRLs (e.g.
    IRS and RVTM) independently resolving to the same ring each drew their own hub icon via
    `renderStation`, since hub rendering was keyed to one specific CDRL node, not to the ring.
    Fixed with `meetingsByRing` (groups `meetings` — see #12-16 — by ring) plus a new
    `combinedRingHubs` pass: when 2+ *distinct* meetings land on the same ring,
    `renderStation` now skips drawing its own icon for each of them and a single combined hub,
    unioning every domain converging there, is drawn once instead. A ring with only ONE
    meeting is unaffected — still gets its own hub exactly as before (#31), preserving the
    existing "click a specific CDRL's hub, see that CDRL's relationships" behavior for the
    common case.

50. **A domain's track literally ending on a ring with no CDRL meeting to explain it also joins
    a hub, not a lone circle.** Per Ron's steer: "if a track ends on a SETR ring, it needs to
    be on the transfer hub with other tracks." `extraAbsorbedByMeetingRing` handles the case
    where exactly one meeting already owns that ring (the terminating domain becomes an extra
    spoke of that same hub); `terminalOnlyByRing` — folded into the same `combinedRingHubs` pass
    as #49 — handles 2+ domains terminating at a ring with no meeting at all, drawing one new
    shared hub for just them. A ring where only ONE domain's track ends, with nothing else
    converging there, is left as a plain train stop — Ron's own "unless it's the only CDRL
    required at that SETR" carve-out. PRR is excluded from both mechanisms; it already has its
    own dedicated `prr-hub` icon that every PRR-terminating track lands on exactly (ring radius
    0 for all of them — see #44).

51. **The scattered dashed handoff-hub diamonds (#33-35) are gone, replaced by the SETR ring
    label itself as an invisible click target.** Per Ron's literal ask — "those clickable
    dashed diamond boxes should be invisible and aligned to the SETR Event label, if they popup
    the full listing of SETR Event CDRLs required" — every `ring-label-{event}` node (already
    positioned exactly where the label sits) now carries `data.relatedNodeIds` /
    `data.modalTitle` sourced from a new `getRequiredNodeIdsBySetrEvent()` in
    `cdrlPathValidation.ts` (dedupes `generateStationSummaryBySetrEvent`'s per-state entries
    down to distinct CDRL ids per event), with `cursor: pointer` and an underline-on-hover for
    the only visual affordance. The PRR hub and every combined ring-hub (#49-50) open the same
    per-event listing, unifying every non-single-CDRL click target on the map around one
    consistent semantic: "what's required at this SETR event," rather than mixing that with the
    old per-domain-pair "handoff" framing. This is a real removal, not a re-skin: the whole
    `handoffPairs`/`handoffGroups`/`ghostAnchorFor` machinery and the `related-` ghost-dot
    nodes it drew for relationship targets are deleted, along with `nodeAnchorCenter` (nothing
    reads it anymore once ghost anchors are gone). **Trade-off flagged for Ron's review**: this
    means `influences`/`influenced_by` no longer has ANY dedicated visual on the map (previously
    the dashed diamond+stub lines, #6/#22/#33-35's whole throughline) — replaced by the
    per-event summary rather than kept alongside it. If that relationship visualization still
    matters on its own terms, it needs to come back as an explicit ask in a future round; this
    round took Ron's message as fully superseding it rather than layering on top.

52. **Lane offset is now ranked per-ring, not fixed per-domain.** Three prior rounds (#24, #36,
    #44's sibling work) tuned the SAME constant-based lane-offset formula — `laneSign =
    lineIndex - (domainCount-1)/2`, a domain's FIXED position in `model.lines` — and still left
    Ron reporting overlap. Root cause, finally identified: a domain's Dijkstra-solved angle
    (#22) can end up anywhere relative to its neighbors at a given ring, since it bends toward
    whatever meetings it needs to reach — but the offset direction was keyed to the domain's
    static list position, not its actual angular position at that ring. A domain with a
    "high" lane number could end up offset toward a neighbor it was supposed to be offset away
    from, at whichever rings its solved angle happened to cross another domain's. Fixed by
    ranking domains at EACH ring by their own solved angle there (`laneRankByLineAndRing`) and
    keying the offset to that rank instead — so the offset direction always matches the real
    left-to-right ordering at that specific ring. At the outermost ring every domain sits at
    its own evenly-spaced home angle, so rank order equals the old fixed order there and
    nothing changes visually at the map's edge; the fix only diverges from the old behavior
    where domains' relative order actually shifts approaching a meeting, which is exactly
    where the old formula was wrong. Not a total guarantee against every possible crossing —
    two domains' underlying (pre-offset) solved angles can still cross each other between
    adjacent rings, which would need joint multi-domain path optimization to fully rule out —
    but it eliminates the specific "fixed lane number doesn't match local position" failure
    mode that was the likely dominant cause given three rounds of otherwise-ineffective
    constant tuning.

    Verified: `tsc -b` clean. Playwright confirms the previously-stray circle beside the
    SVR_FCA hub is now a single merged icon (screenshot diff before/after); clicking any ring
    label (tested ASR and via the PRR hub) opens a "{EVENT} — CDRLs required" modal with the
    correct deduped CDRL list; the two rings in the current dataset with a genuine multi-meeting
    collision (`ring-hub-0` → PDR, 15 CDRLs; `ring-hub-1` → SVR_FCA, 3 CDRLs) each render as one
    combined hub and open the correct listing; a non-colliding multi-domain hub (ICD) still
    renders individually and still opens its own CDRL's detail, confirming the common-case
    behavior from #31 is unchanged; Level 2 line-expand and maturity-marker clicks still work;
    zero page/console errors beyond pre-existing unresolved-marker data warnings that predate
    this round. The pre-existing `handoff-stub-*` React duplicate-key warning noted in #48 is
    also gone as a side effect of removing that code path entirely.

## 2026-08-14 — Relationships get a real connecting track; fixed a hidden edge-geometry bug

Ron: "the between SETR CDRL influenced / influenced by diamonds need a separate 'extension
track' between the relations. Existing as standalone diamonds doesnt visualize this
relationship well. what do you suggest?" — followed by: "Build it your recommended way."

53. **Every cross-domain `influences`/`influenced_by` pair now draws a direct line straight
    between the two real CDRL stations**, not a synthetic hub with faint disconnected stubs
    (the #33-35 design, removed in #51 for reading unclear). Styled distinctly from the thick
    colored domain tracks — thin, dashed, neutral gray, 65% opacity — so it reads as a
    transfer connector the way a subway map draws a walking-transfer line between stations on
    different lines, per Ron's own framing. Deliberately NOT routed through an invented
    midpoint: `nodeAnchorCenter` (brought back — see #54) gives every CDRL's real anchor point
    regardless of whether it got its own marker or was folded into a shared ring hub (#49-50),
    so the connector always runs CDRL-to-CDRL. Same-domain pairs are skipped (already visually
    adjacent on the shared track); "ALL" targets are skipped per
    `confirmed_patterns.relationship_assessment_status`. Clicking a connector opens the same
    related-CDRLs modal used everywhere else on the map, showing just the two CDRLs on that
    specific pair — reusing `CdrlPathRelatedCdrlsModal` via the same generic
    `data.relatedNodeIds`/`data.modalTitle` mechanism #51 already established, no new click
    plumbing needed in `CdrlPathPage.tsx`.

54. **Bug found and fixed while verifying #53: EVERY `type: "straight"` edge sourced from a
    `pushAnchor` node was silently collapsing onto one shared stale point** — not just the new
    relationship connectors, but the pre-existing `interchange-stub-*` and `ring-hub-stub-*`
    edges too (confirmed by comparing their rendered SVG path `d` attributes: all three showed
    the same degenerate near-zero-length segment at the same coordinates, regardless of which
    actual nodes they connected). Root cause: `.cdrl-path-page .react-flow__handle {
    display: none; }` (added in #48 to remove the "two black dots" on every station) removes
    connection-handle elements from layout entirely, and React Flow's built-in edge types
    (unlike the custom `CdrlPathTrackEdge` domain tracks, which take explicit `data.points` and
    never had this problem) compute an edge's endpoint coordinates from its connected node's
    Handle DOM elements' *measured bounding rect* — a `display:none` handle measures as an
    all-zero rect, so every such edge fell back to one shared stale default instead of the two
    real anchor positions. This had been silently broken since #48 shipped; it went unnoticed
    because the stub edges it affected always ran close alongside a correctly-rendered domain
    track or hub icon, masking their absence — it only became obviously visible once this
    round's much-longer, unmasked cross-map connectors needed the same mechanism. Fixed by
    swapping `display: none` for `opacity: 0; pointer-events: none;` — keeps every handle in
    normal layout (a real, measurable rect) while remaining fully invisible and inert.

    Verified: `tsc -b` clean. Playwright confirms all three edge types
    (`interchange-stub-IRS-SE`, `ring-hub-stub-ring-hub-0-SE`, `relationship-track-0`) now
    render distinct, correct `d` paths matching their actual connected nodes' positions, where
    before all three showed the identical degenerate path; clicking a relationship connector
    at its true rendered midpoint opens the correct two-CDRL modal (tested: "Systems
    Engineering Management Plan ↔ Systems Engineering Plan"); 55 relationship-track edges
    render across the current dataset, visually reading as a distinct thin dotted layer
    beneath the domain tracks; station clicks, ring-label clicks, and Level 2 line-expand all
    still work; zero unexpected console/page errors (only the pre-existing unresolved-marker
    data warnings, unrelated to this change).

## 2026-08-14 — Discipline × SETR-event maturity matrix becomes the primary view

The Subway Design chat delivered a research report on Ron's question above, recommending
(TL;DR, verbatim): "Adopt a discipline-swimlane × SETR-event maturity matrix as your primary
broad-audience view... Keep the subway/transit-map metaphor as a secondary 'orientation' or
executive-overview graphic only, not the primary reference." Ron: "Build it your recommended
way" — confirmed placement as a view-mode toggle within the existing CDRL Path tab (not a
separate tab, not a full replacement of the subway map), matrix as the default.

55. **New primary view: `CdrlPathMatrixView`** — rows are the 7 disciplines (matching
    `model.lines`), columns are the SETR events in `model.lifecycle_lanes.setr_events` order,
    cells list every CDRL with a maturity state tied to exactly that event, each as a clickable
    chip. Any CM baseline (Functional/Allocated/Product) established at an event renders as a
    small badge under that event's column header. A `Matrix` / `Subway Map` pill toggle sits
    above both views, sharing the same model, decomposition-level filter, model editor, and
    export manager — matrix defaults selected per the research's Stage 1 recommendation.

56. **Maturity state is double-encoded, never color alone**, per the research's accessibility
    guidance (color-vision deficiency affects a meaningful share of the audience): every chip
    shows a D/F/U letter badge AND a distinct border style (dashed=Draft, solid=Final,
    dotted=Update) — chip *color* identifies the owning discipline (matching its row and the
    subway map's line color for continuity), not the maturity state, so color is redundant
    with position, not the sole carrier of state information.

57. **Cell placement reuses `generateStationSummaryBySetrEvent`'s existing "precise text
    index, not a best-effort visual placement" philosophy**, extended to bucket by domain too
    (`buildCdrlMaturityMatrix` in the new `cdrlPathMatrix.ts`) — deliberately NOT the fuzzy
    `resolveMarkerEventIndex` resolver the subway map uses for visual positioning. A maturity
    state only lands in a cell when its `at_event` is an EXACT SETR-event id match. Recurring
    range cadences ("every SETR through PRR"), milestone/contract-day markers, and other
    non-exact phrasing are real data that would misrepresent a due date if forced into one
    column (or spammed across every column in a range) — they're listed instead in a
    "Not tied to a single SETR event" section below the grid, one list per domain, so nothing
    silently disappears from the primary reference. This is the same trade-off
    `generateStationSummaryBySetrEvent` already made for its own "precise index" use case; the
    subway map (now secondary) is still where that cadence renders as a repeating halo marker.

58. **Multi-domain CDRLs appear in every one of their domains' rows** at the same event column
    (e.g., IRS shows under both Systems Engineering and Software Engineering at SRR) —
    deliberate duplication, consistent with standard RACI/responsibility-matrix practice for
    shared-ownership items, not a bug to dedupe.

59. **Decomposition level filters the matrix exactly as it already filtered Level 2's
    timeline** (`maturityStatesForLevel`), not a separate flattened-with-level-tags view like
    `generateStationSummaryBySetrEvent`'s own output — keeps the toggle's behavior consistent
    across both CDRL Path views: selecting CI/Component/Unit changes which maturity states
    the matrix shows the same way it already changed Level 2.

    Verified: `tsc -b` clean. Playwright confirms the matrix renders as the default view (84
    chips across the current dataset); clicking a chip opens the correct related-CDRLs modal
    (tested: `SEMP` chip → "Systems Engineering Management Plan"); the Matrix/Subway Map toggle
    switches cleanly in both directions with no stale state; changing decomposition level
    changes the chip count (84 → 80 at Component level) exactly as it already did for Level 2;
    the "not tied to a single SETR event" section renders with real entries (recurring
    UPDATE cadences, ECP-lockstep phrasing, contract-day markers) grouped by domain; zero
    unexpected console/page errors. A DOM-level check confirmed exactly 7 `<tr>` rows (one per
    discipline) with chips correctly distributed across their real event columns — an initial
    read of a compressed full-page screenshot looked like a layout bug (chip clusters
    misread as stray extra rows) but was a screenshot-legibility artifact, not an actual
    rendering issue.

## 2026-08-14 — Matrix Stage 2: heat-map density toggle

Ron confirmed continuing with the Subway Design chat's Stage 2 recommendation ("add two
lightweight companion views over the same grid: a heat-map toggle... and a kanban/status
toggle"). Kanban was explicitly deferred this round (see #61) rather than built thin.

60. **`CdrlPathMatrixView` gains a `Detail` / `Heat Map` density toggle**, rendering the exact
    same `buildCdrlMaturityMatrix` data two ways instead of adding a second data path. Heat
    map colors each (discipline, event) cell by its DISTINCT CDRL count (not maturity-state
    count — a CDRL due twice at one event, e.g. both DRAFT and FINAL, is one workload item,
    not two), on a 5-bucket sequential navy ramp (0/1/2/3/4+, under the research's ~7-color
    ceiling). The count is always shown as text inside the cell too, never shade alone,
    matching the same accessibility rule the Detail view's D/F/U chips already follow.
    Clicking a populated cell opens the same related-CDRLs modal used everywhere else,
    scoped to every CDRL in that cell (title: "{Discipline} @ {Event}") — reuses the existing
    `onSelect` callback with no new modal plumbing.

61. **Kanban/status toggle deliberately NOT built this round.** The research frames it as a
    *live tracking* companion ("discipline leads can track live Draft→Final→Update progress...
    once executing") — but that requires real per-CDRL submission/approval status, which this
    app doesn't have yet: the per-baseline status overlay is an already-documented separate
    future phase (see the Persistence row in cdrl-path-project-brief.md and
    `CdrlPathNodeDetail`'s own "Live program status... not yet wired up" section). Building a
    kanban view today would just be a lower-information re-skin of the matrix's own scheduled
    dates, not the live-tracking tool the research actually describes — flagged as a real open
    item to build once the status-overlay data model exists, not silently dropped.

    Verified: `tsc -b` clean. Playwright confirms the Heat Map toggle renders shaded, numbered
    cells (40 populated cells in the current dataset); clicking a cell with count 4 opens
    "Systems Engineering CDRLs @ SRR" listing exactly 4 CDRLs; toggling back to Detail restores
    all 84 chips exactly as before; zero unexpected console/page errors.

## 2026-08-14 — Developmental/flow-down lineage (`derived_from`)

Ron: "next, setup the assumed developmental relationships between CDRLs in the data model and
visuals." Clarified via follow-up question: the requested relationship is flow-down/derivation
lineage — "the standard SE chain: which CDRL's content is directly derived from / builds on
another as part of normal development... directional (parent → child), a new relationship
distinct from the looser influences/influenced_by tags already in the model."

62. **New `derived_from: string[]` field on every node**, backward-pointing (a child lists its
    own parent(s)), distinct from `influences`/`influenced_by`. Rather than inventing new
    relationships from scratch, it's a curated subset of each node's existing `influenced_by`
    list — the data model's own `relationship_assessment` field already documents that
    `influences`/`influenced_by` was built using SE Vee-model flow-down logic, so `derived_from`
    narrows that to the subset representing strict structural derivation. Two deliberate
    exclusions, recorded in a new `confirmed_patterns.developmental_flow_down_pattern` entry:
    bidirectional analysis-feedback loops (e.g. LORA/CMRS's `influenced_by` tie to
    `HW_DEV_SPEC` is feedback, not derivation), and one skip-level redundancy (`ICD` derives
    from `IRS` directly; `SSS`'s influence on `ICD` is transitive through `IRS`). First-pass,
    Claude-assessed, not yet reviewed node-by-node with Ron — same "treat as a draft to
    challenge" caveat as `influences`/`influenced_by` itself.

63. **`validateCdrlPathModel` gains two new checks**: no dangling `derived_from` references
    (no "ALL" pseudo-target allowed here, unlike `influences`/`influenced_by` — developmental
    lineage is always a specific parent) and a three-color DFS cycle check, since a real
    derivation lineage can't cycle back on itself.

64. **`CdrlPathNodeDetail` gets a "Developmental lineage" section**, placed before the existing
    "Relationships" section since it's the more specific, more confidently-structured claim of
    the two. Shows "Derives from" (direct from `derived_from`) and "Flows into" (the reverse —
    computed on the fly by scanning the model for every node whose `derived_from` includes this
    one, since the field itself is only stored backward-pointing).

65. **Subway map gets a toggleable arrow overlay**, off by default (`showLineage` on
    `CdrlPathFlowOptions`, a checkbox next to the view-mode pills, shown only in Subway Map
    view). Reuses the exact same `nodeAnchorCenter` + `pushAnchor` + `type: "straight"` pattern
    as the existing relationship-connector tracks, so arrows land on each CDRL's real anchor
    point regardless of whether it has its own marker or was folded into a shared hub — but
    styled solid and dark (`#2b2b2b`) with a closed arrowhead on the child end, instead of the
    connectors' thin dashed gray, so "A flows down into B" reads as a distinct, directional
    claim rather than another undirected transfer link. Additive, not a replacement — both
    layers can render at once. Matrix view intentionally gets no lineage indicator this round;
    flagged as a future item if the design chat or Ron wants one, not silently scoped out.

    Verified: `tsc -b` clean. Standalone script cross-check of the curated `derived_from` graph
    (independent of the new TS validation code): 36 nodes, zero dangling references, zero
    cycles, exactly 4 roots (`CDD`, `RPP`, `SEP`, `SSPP`). Playwright: the lineage toggle is
    hidden in Matrix view and appears in Subway Map view; toggling it on adds 50 new edges
    (76 → 126) styled as solid dark arrows distinct from the existing dashed-gray connectors;
    clicking a lineage arrow (SEP → SEMP) opens the correct related-CDRLs modal; the node
    detail panel's new "Developmental lineage" section renders correctly for SEMP ("Derives
    from: Systems Engineering Plan" / "Flows into: Integrated Master Plan / Integrated Master
    Schedule, Risk/Issue/Opportunity Management Plan, Contractor's Configuration Management
    Plan"); zero unexpected console/page errors (the only console noise was pre-existing
    502s from the unrelated `/api/*` backend, which CDRL Path doesn't depend on since it reads
    the static JSON model directly — confirmed present on the plain homepage load too, not a
    regression from this round).
