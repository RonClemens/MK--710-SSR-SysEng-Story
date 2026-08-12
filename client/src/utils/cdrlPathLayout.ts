import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathDecompositionLevel, CdrlPathMaturityState, CdrlPathModel, CdrlPathNode } from "../types/cdrlPath";
import { anchorEventIndex, expandMaturityStateToMarkers, getMaturityMarkerStyle, maturityStatesForLevel } from "./cdrlPathMaturityMarkers";

// Polar "dartboard" coordinate system per Ron's steer: SETR events are concentric rings
// (ASR outermost, PRR the center bullseye — PCA/ISR fall outside the ring system since PRR
// is explicitly the terminus, not the literal end of the SETR sequence). Each domain (line)
// is a track running from the outer ring inward to wherever that domain's own latest active
// SETR event is — it does not have to reach the center, and per Ron's follow-up steer, it
// does not have to stay in its own fixed angular slice either: a track bends toward whatever
// other domains it needs to run alongside to reach a CDRL that spans more than one of them,
// meeting them at a single shared point rather than staying rigidly radial the whole way in.
// See docs/cdrl-path/DECISIONS.md #10-#12 and #22 for the full history of how this shape was
// arrived at.

export const CENTER = { x: 700, y: 700 };
export const OUTER_RADIUS = 640;
export const INNER_RADIUS = 50;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Cartesian point for a given radius/angle (degrees, 0 = +x axis, clockwise positive since
 * screen Y grows downward — -90 therefore points "up" on screen, used as the top reference). */
export function polarPoint(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = toRadians(angleDeg);
  return { x: CENTER.x + radius * Math.cos(rad), y: CENTER.y + radius * Math.sin(rad) };
}

function circularMeanAngle(anglesDeg: number[]): number {
  const meanSin = anglesDeg.reduce((sum, a) => sum + Math.sin(toRadians(a)), 0) / anglesDeg.length;
  const meanCos = anglesDeg.reduce((sum, a) => sum + Math.cos(toRadians(a)), 0) / anglesDeg.length;
  return (Math.atan2(meanSin, meanCos) * 180) / Math.PI;
}

/** Shortest signed angular distance from `a` to `b`, in (-180, 180], so interpolation always
 * takes the short way around instead of potentially sweeping the long way through 0°/360°. */
function shortestAngleDelta(a: number, b: number): number {
  let delta = (b - a) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function lerpAngle(a: number, b: number, t: number): number {
  return a + shortestAngleDelta(a, b) * t;
}

/**
 * Best-effort resolution of a free-text temporal marker (e.g. "SRR", "MSA/SRR",
 * "pre-MSA", "SVR_FCA / PCA") to a fractional SETR-event-index. Generic by design rather
 * than hardcoded per node, since the handoff doc calls for this app to stay "data-driven
 * and regeneration-friendly, not hardcoded to today's specific node set." Falls back to
 * index 0 and logs a warning when nothing matches, so gaps in the mapping surface as
 * visible console noise during this "surface remaining data-model bugs" phase rather than
 * silently mispositioning a station. This index is abstract (not itself a coordinate) —
 * ringRadius() below is what converts it to a drawable radius, clamped to the ring range.
 */
export function resolveMarkerEventIndex(
  marker: string,
  setrEvents: { id: string; phase: string }[],
): number {
  // Split on whitespace/slashes/hyphens but NOT underscores — some event ids
  // themselves contain an underscore (e.g. "SVR_FCA"), and splitting on it
  // breaks those into tokens that silently match the wrong, shorter event id.
  const tokens = marker.split(/[^A-Za-z0-9_]+/).filter(Boolean);
  const isPre = /^pre[-\s]/i.test(marker.trim());

  for (const token of tokens) {
    const eventIndex = setrEvents.findIndex((e) => e.id.toLowerCase() === token.toLowerCase());
    if (eventIndex !== -1) return isPre ? eventIndex - 0.5 : eventIndex;
  }

  for (const token of tokens) {
    const phaseIndex = setrEvents.findIndex((e) => e.phase.toLowerCase() === token.toLowerCase());
    if (phaseIndex !== -1) return isPre ? phaseIndex - 0.5 : phaseIndex;
  }

  console.warn(`CDRL Path: could not resolve temporal marker "${marker}" to a SETR event; defaulting to leftmost column.`);
  return 0;
}

export interface CdrlPathFlowElements {
  nodes: Node[];
  edges: Edge[];
}

export interface CdrlPathFlowOptions {
  /** Line whose full_station nodes should expand into their maturity timeline (Level 2). Null = Level 1 only. */
  expandedLineId?: string | null;
  decompositionLevel?: CdrlPathDecompositionLevel;
}

// "Train stop" icon per Ron's steer: a single-domain CDRL is a hollow ring sitting on its
// one track; a multi-domain CDRL is a bigger concentric-ring interchange icon (the WMATA
// transfer-station look) sitting exactly where its tracks bend together and touch — no
// separate stub connectors needed once the tracks themselves converge there.
const STATION_MARKER_SIZE = 16;
const HUB_MARKER_SIZE = 26;
// Nodes sharing a domain fan out by a small angle rather than the flat pixel offset the
// old Cartesian sub-lane used — capped so even a domain with many nodes doesn't bleed its
// spread into a neighboring domain's angular sector.
const MAX_SUBLANE_SPREAD_DEG = 28;

interface AngleKeyframe {
  ring: number;
  angle: number;
}

interface MultiDomainMeeting {
  node: CdrlPathNode;
  ring: number;
  lineIndices: number[];
  angle: number;
  point: { x: number; y: number };
}

/** Builds the React Flow elements for the current zoom/filter state.
 *
 * Always rendered, regardless of zoom state: the concentric SETR-event rings, each domain's
 * track (stopping at its own latest active ring, not forced to the center — and bending
 * toward whatever other domains it needs to run alongside to reach a shared multi-domain
 * CDRL, rather than staying in its own fixed angular slice the whole way in), context
 * markers, a lightweight single-dot marker for every full_station node at its primary
 * anchor ring, and direct relationship connectors for every influences/influenced_by pair.
 *
 * Expansion-dependent: when a line is expanded (Level 2), that line's full_station nodes
 * additionally get their full DRAFT/FINAL/UPDATE maturity timeline (angular sub-lane
 * offset, per-state marker styling) in place of the lightweight dot. */
export function buildCdrlPathFlowElements(model: CdrlPathModel, options: CdrlPathFlowOptions = {}): CdrlPathFlowElements {
  const { expandedLineId = null, decompositionLevel = "SYSTEM" } = options;
  const { setr_events, cm_baselines } = model.lifecycle_lanes;
  const prrIndex = Math.max(0, setr_events.findIndex((e) => e.id === "PRR"));
  const ringCount = prrIndex + 1; // ASR(0)..PRR(prrIndex) inclusive

  const ringRadius = (index: number) => {
    const clamped = Math.max(0, Math.min(index, prrIndex));
    return OUTER_RADIUS - (clamped / prrIndex) * (OUTER_RADIUS - INNER_RADIUS);
  };

  const domainCount = model.lines.length;
  const angleStep = 360 / domainCount;
  const domainHomeAngle = (domainIndex: number) => -90 + domainIndex * angleStep;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // Cartesian center-point of each CDRL node's single "primary" visual anchor, populated as
  // markers are created — used below to draw relationship connectors without a second
  // traversal of the model.
  const nodeAnchorCenter = new Map<string, { x: number; y: number }>();
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));

  // Concentric SETR-event rings — the dartboard itself.
  for (let index = 0; index < ringCount; index++) {
    const event = setr_events[index];
    const radius = ringRadius(index);
    nodes.push({
      id: `ring-${event.id}`,
      type: "default",
      position: { x: CENTER.x - radius, y: CENTER.y - radius },
      data: { label: "" },
      draggable: false,
      selectable: false,
      zIndex: 0,
      style: {
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        border: index === prrIndex ? "2px solid #999" : "1px dashed #ccc",
        background: "transparent",
        padding: 0,
      },
    });
    // Ring labels along one reference spoke, offset from angle 0 so they don't sit on top
    // of a domain's own track.
    const labelAngle = -90 - angleStep / 2;
    const labelPoint = polarPoint(radius, labelAngle);
    nodes.push({
      id: `ring-label-${event.id}`,
      type: "default",
      position: { x: labelPoint.x - 30, y: labelPoint.y - 10 },
      data: { label: event.id },
      draggable: false,
      selectable: false,
      zIndex: 1,
      style: { width: 60, textAlign: "center", background: "transparent", border: "none", fontWeight: 600, fontSize: 11 },
    });
  }

  // CM baselines highlight a ring rather than a separate vertical marker. PRODUCT (PCA)
  // doesn't fit — PCA falls outside the ASR..PRR ring range this dartboard models (PRR is
  // explicitly the innermost ring/terminus, not simply "wherever the SETR sequence ends") —
  // flagged rather than silently dropped or awkwardly stretching the ring system for it.
  cm_baselines.forEach((baseline) => {
    const atIndex = setr_events.findIndex((e) => e.id === baseline.established_at);
    if (atIndex === -1 || atIndex > prrIndex) {
      console.warn(`CDRL Path: CM baseline "${baseline.id}" (at "${baseline.established_at}") falls outside the ASR..PRR ring range this dartboard models.`);
      return;
    }
    const radius = ringRadius(atIndex);
    nodes.push({
      id: `baseline-${baseline.id}`,
      type: "default",
      position: { x: CENTER.x - radius, y: CENTER.y - radius },
      data: { label: "" },
      draggable: false,
      selectable: false,
      zIndex: 0,
      style: { width: radius * 2, height: radius * 2, borderRadius: "50%", border: "2px dotted #888", background: "transparent", padding: 0, opacity: 0.5 },
    });
  });

  const fullStationNodes = model.nodes.filter((n) => n.render_style !== "context_marker");
  const contextMarkers = model.nodes.filter((n) => n.render_style === "context_marker");

  /** A node's own maturity states regardless of the currently selected decomposition level —
   * every level's states when they're split via maturity_states_by_level (e.g. RVTM),
   * otherwise the flat maturity_states array. Deliberately NOT filtered by decompositionLevel:
   * per the project brief, decomposition level is "a filter/toggle, not a separate stacked
   * map," so it should change which detail Level 2 shows, not whether a domain's backbone
   * track exists at Level 1. Most CDRLs (all of SW's and HW's among them) are tagged a single
   * decomposition_level like CONFIGURATION_ITEM simply because that's the only level they're
   * ever produced at — not because they should vanish from the System-level view. */
  function allMaturityStates(node: CdrlPathNode): CdrlPathMaturityState[] {
    if (node.maturity_states_by_level) return Object.values(node.maturity_states_by_level).flat();
    return node.maturity_states ?? [];
  }

  /** Highest ring index reached by a domain's OWN nodes (context markers and full_station
   * maturity markers where this is their primary/only domain) — ignores any ring it might
   * additionally reach by bending toward a shared multi-domain CDRL, which domainTrackExtent
   * (below) adds on top. */
  function domainOwnContentMaxIndex(lineId: string): number {
    let max = 0;
    model.nodes.forEach((n) => {
      if (n.domains[0] !== lineId) return;
      if (n.render_style === "context_marker") {
        const marker = n.drafted_at ?? n.baselined_at ?? "";
        max = Math.max(max, Math.round(resolveMarkerEventIndex(marker, setr_events)));
        return;
      }
      allMaturityStates(n).forEach((state) => {
        expandMaturityStateToMarkers(n, state, setr_events).forEach(({ eventIndex }) => {
          max = Math.max(max, Math.round(eventIndex));
        });
      });
    });
    return Math.min(max, prrIndex);
  }

  /** Every CDRL spanning 2+ domains gets exactly one shared meeting point — the ring is that
   * node's own resolved anchor (same logic as a single-domain station's position), and the
   * angle is the circular mean of its domains' home angles. Every domain that node touches
   * bends its track to pass through this exact point, which is what replaces the old
   * separate hub-icon-plus-stub-connectors construct: the tracks themselves now converge. */
  const meetings: MultiDomainMeeting[] = model.nodes
    .filter((n) => n.domains.length > 1)
    .map((n) => {
      const lineIndices = n.domains.map((d) => model.lines.findIndex((l) => l.id === d)).filter((idx) => idx !== -1);
      if (lineIndices.length < 2) return null;
      const ring = Math.max(
        0,
        Math.min(
          Math.round(
            n.render_style === "context_marker"
              ? resolveMarkerEventIndex(n.drafted_at ?? n.baselined_at ?? "", setr_events)
              : anchorEventIndex(n, setr_events),
          ),
          prrIndex,
        ),
      );
      const angle = circularMeanAngle(lineIndices.map((idx) => domainHomeAngle(idx)));
      return { node: n, ring, lineIndices, angle, point: polarPoint(ringRadius(ring), angle) };
    })
    .filter((m): m is MultiDomainMeeting => m !== null);
  const meetingByNodeId = new Map(meetings.map((m) => [m.node.id, m]));

  /** A domain's full track extent: its own content, extended further inward if it needs to
   * reach a shared meeting point deeper than its own content goes — e.g. a domain whose own
   * deliverables stop at CDR but that also co-owns an interface doc recurring through PRR
   * keeps its track running (bent toward that doc) all the way to PRR. */
  function domainTrackExtent(lineIndex: number): number {
    let max = domainOwnContentMaxIndex(model.lines[lineIndex].id);
    meetings.forEach((m) => {
      if (m.lineIndices.includes(lineIndex)) max = Math.max(max, m.ring);
    });
    return Math.min(max, prrIndex);
  }

  /** A domain's angle keyframes: home angle at ring 0 and at its own track extent, plus one
   * keyframe per shared meeting it participates in — angleAtRing interpolates between them
   * (shortest-path) so the track eases toward a meeting and back rather than snapping. */
  function computeKeyframes(lineIndex: number, maxRing: number): AngleKeyframe[] {
    const home = domainHomeAngle(lineIndex);
    const byRing = new Map<number, number[]>();
    meetings.forEach((m) => {
      if (!m.lineIndices.includes(lineIndex)) return;
      const ring = Math.min(m.ring, maxRing);
      const angles = byRing.get(ring) ?? [];
      angles.push(m.angle);
      byRing.set(ring, angles);
    });
    if (!byRing.has(0)) byRing.set(0, [home]);
    if (!byRing.has(maxRing)) byRing.set(maxRing, [home]);
    return Array.from(byRing.entries())
      .map(([ring, angles]) => ({ ring, angle: circularMeanAngle(angles) }))
      .sort((a, b) => a.ring - b.ring);
  }

  function angleAtRing(keyframes: AngleKeyframe[], ring: number): number {
    if (ring <= keyframes[0].ring) return keyframes[0].angle;
    const last = keyframes[keyframes.length - 1];
    if (ring >= last.ring) return last.angle;
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i];
      const b = keyframes[i + 1];
      if (ring >= a.ring && ring <= b.ring) {
        const t = b.ring === a.ring ? 0 : (ring - a.ring) / (b.ring - a.ring);
        return lerpAngle(a.angle, b.angle, t);
      }
    }
    return last.angle;
  }

  const trackExtentByLine = model.lines.map((_, lineIndex) => domainTrackExtent(lineIndex));
  const keyframesByLine = model.lines.map((_, lineIndex) => computeKeyframes(lineIndex, trackExtentByLine[lineIndex]));
  const trackAngleAt = (lineIndex: number, ring: number) => angleAtRing(keyframesByLine[lineIndex], ring);

  /** Zero-size anchor node a straight edge can source/target from, at an already-resolved point. */
  function pushAnchor(id: string, point: { x: number; y: number }) {
    nodes.push({ id, type: "default", position: point, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } });
  }

  model.lines.forEach((line, lineIndex) => {
    const isExpanded = line.id === expandedLineId;
    const maxRing = trackExtentByLine[lineIndex];
    const labelPoint = polarPoint(ringRadius(0) + 36, trackAngleAt(lineIndex, 0));

    nodes.push({
      id: `line-label-${line.id}`,
      type: "default",
      position: { x: labelPoint.x - 70, y: labelPoint.y - 12 },
      data: { label: `${isExpanded ? "▾ " : "▸ "}${line.label}` },
      draggable: false,
      selectable: false,
      zIndex: 6,
      style: {
        width: 140,
        background: "transparent",
        border: "none",
        fontWeight: isExpanded ? 700 : 600,
        fontSize: 12,
        color: line.color_hint,
        textAlign: "center",
        cursor: "pointer",
      },
    });

    // The track itself: one ring-to-ring straight segment per hop, its angle interpolated
    // from the domain's keyframes — a polyline that bends toward shared meeting points
    // instead of a single rigid radial line. Segment ids carry a `--seg{n}` suffix so
    // CdrlPathPage's click routing (which only needs the line id) can still parse them.
    const ringPointId = (r: number) => `line-pt-${line.id}--${r}`;
    for (let r = 0; r <= maxRing; r++) {
      pushAnchor(ringPointId(r), polarPoint(ringRadius(r), trackAngleAt(lineIndex, r)));
    }
    for (let r = 0; r < maxRing; r++) {
      edges.push({
        id: `line-edge-${line.id}--seg${r}`,
        source: ringPointId(r),
        target: ringPointId(r + 1),
        type: "straight",
        selectable: false,
        style: { stroke: line.color_hint, strokeWidth: isExpanded ? 12 : 9, cursor: "pointer" },
      });
    }
    if (maxRing === 0) {
      // No resolvable activity at all: a visible stub at the outer ring rather than nothing.
      edges.push({
        id: `line-edge-${line.id}--seg0`,
        source: ringPointId(0),
        target: ringPointId(0),
        type: "straight",
        selectable: false,
        style: { stroke: line.color_hint, strokeWidth: isExpanded ? 12 : 9, cursor: "pointer" },
      });
    }
  });

  /** A single subway "train stop": a hollow ring in the line's own color, sitting directly
   * on that line. */
  function pushTrainStop(id: string, point: { x: number; y: number }, size: number, color: string, zIndex: number) {
    const half = size / 2;
    nodes.push({
      id,
      type: "default",
      position: { x: point.x - half, y: point.y - half },
      data: { label: "" },
      draggable: false,
      zIndex,
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--card-bg, #fff)",
        border: `3px solid ${color}`,
        padding: 0,
        cursor: "pointer",
      },
    });
  }

  /** Renders a CDRL's station marker: a plain train-stop icon sitting on its one (possibly
   * bent) track if it belongs to a single domain, or the bigger concentric-ring interchange
   * icon at its precomputed meeting point if it spans two or more — where every one of its
   * domains' tracks already bends to meet it, so no separate stub connectors are needed. */
  function renderStation(cdrlNode: CdrlPathNode, radiusIndex: number, primaryLineIndex: number) {
    const meeting = meetingByNodeId.get(cdrlNode.id);
    if (!meeting) {
      const point = polarPoint(ringRadius(radiusIndex), trackAngleAt(primaryLineIndex, radiusIndex));
      nodeAnchorCenter.set(cdrlNode.id, point);
      pushTrainStop(`station-${cdrlNode.id}`, point, STATION_MARKER_SIZE, model.lines[primaryLineIndex].color_hint, 6);
      return;
    }
    nodeAnchorCenter.set(cdrlNode.id, meeting.point);
    const half = HUB_MARKER_SIZE / 2;
    nodes.push({
      id: `station-${cdrlNode.id}`,
      type: "default",
      position: { x: meeting.point.x - half, y: meeting.point.y - half },
      data: { label: "" },
      draggable: false,
      zIndex: 7,
      style: {
        width: HUB_MARKER_SIZE,
        height: HUB_MARKER_SIZE,
        borderRadius: "50%",
        background: "var(--card-bg, #fff)",
        border: "3px solid #333",
        boxShadow: "0 0 0 2px var(--card-bg, #fff), 0 0 0 4px #333",
        padding: 0,
        cursor: "pointer",
      },
    });
  }

  contextMarkers.forEach((cdrlNode) => {
    const primaryLineIndex = model.lines.findIndex((l) => l.id === cdrlNode.domains[0]);
    if (primaryLineIndex === -1) {
      console.warn(`CDRL Path: node "${cdrlNode.id}" references unknown domain "${cdrlNode.domains[0]}".`);
      return;
    }
    const marker = cdrlNode.drafted_at ?? cdrlNode.baselined_at ?? "";
    renderStation(cdrlNode, resolveMarkerEventIndex(marker, setr_events), primaryLineIndex);
  });

  // Lightweight marker + anchor for EVERY full_station node, regardless of which (if any)
  // line is expanded — this is what makes relationships and interchanges permanent map
  // features rather than something that only exists while one specific line is expanded.
  // A node on the currently expanded line gets its full timeline instead, below, which
  // overwrites this with a more precise (sub-lane-adjusted, FINAL-preferring) anchor.
  fullStationNodes.forEach((cdrlNode) => {
    const primaryLineIndex = model.lines.findIndex((l) => l.id === cdrlNode.domains[0]);
    if (primaryLineIndex === -1) {
      console.warn(`CDRL Path: node "${cdrlNode.id}" references unknown domain "${cdrlNode.domains[0]}".`);
      return;
    }
    if (cdrlNode.domains.includes(expandedLineId ?? "")) return; // gets the rich timeline below instead
    renderStation(cdrlNode, anchorEventIndex(cdrlNode, setr_events), primaryLineIndex);
  });

  if (expandedLineId) {
    const lineIndex = model.lines.findIndex((l) => l.id === expandedLineId);
    const line = model.lines[lineIndex];
    const qualifyingNodes = fullStationNodes.filter(
      (n) => n.domains.includes(expandedLineId) && maturityStatesForLevel(n, decompositionLevel).length > 0,
    );
    // Nodes sharing a domain fan out by a small angle so their markers don't collide when
    // they land on the same ring (e.g. two nodes both FINAL at SFR) — same failure mode the
    // old Cartesian sub-lane pixel offset fixed, expressed as degrees instead of pixels.
    const subLaneAngleStep = qualifyingNodes.length > 1 ? Math.min(4, MAX_SUBLANE_SPREAD_DEG / (qualifyingNodes.length - 1)) : 0;

    qualifyingNodes.forEach((cdrlNode, nodeIndex) => {
      const angleOffset = (nodeIndex - (qualifyingNodes.length - 1) / 2) * subLaneAngleStep;
      const states = maturityStatesForLevel(cdrlNode, decompositionLevel);
      states.forEach((state) => {
        const markers = expandMaturityStateToMarkers(cdrlNode, state, setr_events);
        markers.forEach(({ eventIndex }) => {
          const clampedIndex = Math.min(Math.round(eventIndex), prrIndex);
          const visual = getMaturityMarkerStyle(state);
          const size = visual.large ? 26 : 18;
          const half = size / 2;
          const point = polarPoint(ringRadius(clampedIndex), trackAngleAt(lineIndex, clampedIndex) + angleOffset);
          // Relationship connectors point to one representative point per node — prefer
          // FINAL (the "as-delivered" milestone) over whichever marker happened to be
          // created first, and over the lightweight anchor set above.
          const isFinal = state.state.toUpperCase() === "FINAL";
          if (isFinal || !nodeAnchorCenter.has(cdrlNode.id)) {
            nodeAnchorCenter.set(cdrlNode.id, point);
          }
          nodes.push({
            id: `maturity-${cdrlNode.id}-${state.state}-${eventIndex}`,
            type: "default",
            position: { x: point.x - half, y: point.y - half },
            data: { label: visual.shape === "diamond" ? "" : cdrlNode.id.slice(0, 3) },
            draggable: false,
            zIndex: 5,
            // Deliberately no `transform`/`boxShadow` keys at all (not even `: undefined`)
            // when unused. React Flow applies its own positioning `transform` on the same
            // element by merging it with this style object — an explicit `transform:
            // undefined` key here clears React Flow's translate(x,y) on mount, which is
            // exactly what silently collapsed every marker onto one shared position.
            style: {
              width: size,
              height: size,
              borderRadius: visual.shape === "diamond" ? 3 : "50%",
              ...(visual.shape === "diamond" ? { transform: "rotate(45deg)" } : {}),
              background: visual.hollow ? "var(--card-bg, #fff)" : line.color_hint,
              border: `2.5px solid ${line.color_hint}`,
              ...(visual.halo ? { boxShadow: `0 0 0 3px ${line.color_hint}55` } : {}),
              padding: 0,
              fontSize: 7,
              fontWeight: 700,
              color: visual.hollow ? line.color_hint : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            },
          });
        });
      });
      // No separate interchange-stub step needed here: if cdrlNode spans multiple domains,
      // every one of those domains' tracks already bends through its shared meeting point
      // (see `meetings` above), so the expanded line's own track already runs through it.
    });
  }

  // Relationship connectors — the actual "back and forth across the whole team" Ron
  // described as this model's core value (see purpose_statement in the data model). Drawn
  // directly between each pair's actual anchor points. "ALL" targets (SEMP/IMP_IMS/RMP) are
  // skipped per confirmed_patterns.relationship_assessment_status flagging them as too broad
  // to chart.
  const ghostNodeIdsAdded = new Set<string>();
  const ghostSlotsUsed = new Map<string, number>();

  function ghostAnchorFor(target: CdrlPathNode): { x: number; y: number } | null {
    const existing = nodeAnchorCenter.get(target.id);
    if (existing) return existing;
    const meeting = meetingByNodeId.get(target.id);
    if (meeting) {
      nodeAnchorCenter.set(target.id, meeting.point);
      return meeting.point;
    }
    const targetLineIndex = model.lines.findIndex((l) => l.id === target.domains[0]);
    if (targetLineIndex === -1) return null;
    const eventIndex = Math.min(anchorEventIndex(target, setr_events), prrIndex);
    const slotKey = `${targetLineIndex}:${eventIndex}`;
    const slot = ghostSlotsUsed.get(slotKey) ?? 0;
    ghostSlotsUsed.set(slotKey, slot + 1);
    const point = polarPoint(ringRadius(eventIndex), trackAngleAt(targetLineIndex, eventIndex) + slot * 6);
    nodeAnchorCenter.set(target.id, point);
    if (!ghostNodeIdsAdded.has(target.id)) {
      ghostNodeIdsAdded.add(target.id);
      const targetLine = model.lines[targetLineIndex];
      nodes.push({
        id: `related-${target.id}`,
        type: "default",
        position: { x: point.x - 5, y: point.y - 5 },
        data: { label: "" },
        draggable: false,
        zIndex: 4,
        style: {
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--card-bg, #fff)",
          border: `2px solid ${targetLine.color_hint}`,
          padding: 0,
          cursor: "pointer",
        },
      });
    }
    return point;
  }

  fullStationNodes.forEach((cdrlNode) => {
    const sourceAnchor = nodeAnchorCenter.get(cdrlNode.id);
    if (!sourceAnchor) return;
    const sourceLine = model.lines[model.lines.findIndex((l) => l.id === cdrlNode.domains[0])];
    const relationshipTargets = [...(cdrlNode.influences ?? []), ...(cdrlNode.influenced_by ?? [])];
    relationshipTargets.forEach((targetId) => {
      if (targetId === "ALL" || targetId === cdrlNode.id) return;
      const target = nodeById.get(targetId);
      if (!target) return; // dangling reference — already surfaced by validateModel()
      if (target.domains[0] === cdrlNode.domains[0]) return; // same-domain, already visually adjacent on the shared track
      const targetAnchor = ghostAnchorFor(target);
      if (!targetAnchor) return;
      edges.push({
        id: `relationship-${cdrlNode.id}--${targetId}`,
        source: `relationship-anchor-${cdrlNode.id}`,
        target: `relationship-anchor-${targetId}`,
        type: "straight",
        selectable: false,
        zIndex: 2,
        style: { stroke: sourceLine?.color_hint ?? "#888", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.4 },
        markerEnd: { type: "arrow", color: sourceLine?.color_hint ?? "#888", width: 9, height: 9 },
      });
    });
  });

  // React Flow edges need real source/target NODE ids to anchor to, but the actual visual
  // anchor for a CDRL node is one of several markers/dots already pushed above under a
  // different id scheme (`maturity-...`, `station-...`, `related-...`). Rather than thread
  // the "which exact id represents this node's primary anchor" logic through several
  // different creation sites, a single zero-size node per referenced CDRL node is added
  // here at its already-resolved anchor center, and edges above connect to that instead.
  for (const [nodeId, center] of nodeAnchorCenter) {
    nodes.push({
      id: `relationship-anchor-${nodeId}`,
      type: "default",
      position: center,
      data: {},
      draggable: false,
      selectable: false,
      zIndex: 3,
      style: { width: 1, height: 1, opacity: 0, border: "none" },
    });
  }

  return { nodes, edges };
}
