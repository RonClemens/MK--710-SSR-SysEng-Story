import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathDecompositionLevel, CdrlPathMaturityState, CdrlPathModel, CdrlPathNode } from "../types/cdrlPath";
import { anchorEventIndex, expandMaturityStateToMarkers, getMaturityMarkerStyle, maturityStatesForLevel } from "./cdrlPathMaturityMarkers";
import { buildGraph, dijkstraShortestPath, type GraphEdge, type GraphNode } from "./cdrlPathGraph";
import { getRequiredNodeIdsBySetrEvent } from "./cdrlPathValidation";

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

interface MultiDomainMeeting {
  node: CdrlPathNode;
  ring: number;
  lineIndices: number[];
  angle: number;
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

  // Every SETR-ring click target (the ring label, the PRR hub, and any transfer hub formed by
  // coincidental track convergence — see below) opens the same "what's required at this event"
  // listing, computed once here rather than per click target.
  const requiredNodeIdsByEvent = getRequiredNodeIdsBySetrEvent(model);

  // PRR (the last ring) maps to radius exactly 0 — the literal center point the hub icon
  // sits at — not INNER_RADIUS short of it. Rings are spaced evenly across the full
  // OUTER_RADIUS..0 span rather than reserving INNER_RADIUS as an unused inner buffer, so
  // any domain track whose own content actually reaches PRR lands its final point exactly
  // on the bullseye instead of stopping visibly short of it.
  const ringRadius = (index: number) => {
    const clamped = Math.max(0, Math.min(index, prrIndex));
    return OUTER_RADIUS * (1 - clamped / prrIndex);
  };

  const domainCount = model.lines.length;
  const angleStep = 360 / domainCount;
  const domainHomeAngle = (domainIndex: number) => -90 + domainIndex * angleStep;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // Every CDRL's actual rendered anchor point, populated as station/hub/maturity markers are
  // created below — used at the very end to draw a direct "extension track" between the two
  // real stations of every cross-domain influences/influenced_by pair (see the relationship
  // connector pass), so the connector always lands on where that CDRL genuinely is, including
  // when it's been absorbed into a shared ring hub rather than getting its own marker.
  const nodeAnchorCenter = new Map<string, { x: number; y: number }>();
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));

  // Concentric SETR-event rings — the dartboard itself. PRR's own ring circle is skipped
  // entirely (label kept) — the explicit hub icon added below is its marker now, and drawing
  // both a ring boundary AND a hub icon at the same radius read as a redundant "circle within
  // a circle" rather than one clear transfer-station indicator.
  for (let index = 0; index < ringCount; index++) {
    const event = setr_events[index];
    const radius = ringRadius(index);
    if (index !== prrIndex) {
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
          border: "1px dashed #ccc",
          background: "transparent",
          padding: 0,
        },
      });
    }
    // Ring labels along one reference spoke, offset from angle 0 so they don't sit on top
    // of a domain's own track. Per Ron's steer, this label IS the "full SETR event CDRL
    // listing" click target — no separate visible marker needed (the old scattered dashed
    // handoff-hub diamonds this replaces were exactly that: a second, disconnected click
    // target). Clicking it opens everything required at this event (see requiredNodeIdsByEvent
    // above), regardless of which CDRLs prompted it.
    const labelAngle = -90 - angleStep / 2;
    const labelPoint = polarPoint(radius, labelAngle);
    nodes.push({
      id: `ring-label-${event.id}`,
      type: "default",
      position: { x: labelPoint.x - 30, y: labelPoint.y - 10 },
      data: { label: event.id, relatedNodeIds: requiredNodeIdsByEvent[event.id] ?? [], modalTitle: `${event.id} — CDRLs required` },
      draggable: false,
      selectable: false,
      className: "cdrl-ring-label",
      zIndex: 1,
      style: { width: 60, textAlign: "center", background: "transparent", border: "none", fontWeight: 600, fontSize: 11, cursor: "pointer" },
    });
  }

  // PRR is the map's actual hub — nearly every domain's track terminates there or passes
  // close by it (see #22-24's meandering-track history and the lane-fade above) — so it gets
  // its own explicit transfer-station icon at the center, not just an implicitly-thicker ring
  // border. Same concentric-ring visual language as a CDRL interchange hub, sized larger since
  // this is the map's single biggest convergence point rather than one CDRL's own domains.
  const PRR_HUB_SIZE = 40;
  {
    const half = PRR_HUB_SIZE / 2;
    nodes.push({
      id: "prr-hub",
      type: "default",
      position: { x: CENTER.x - half, y: CENTER.y - half },
      data: { label: "", relatedNodeIds: requiredNodeIdsByEvent[setr_events[prrIndex].id] ?? [], modalTitle: `${setr_events[prrIndex].id} — CDRLs required` },
      draggable: false,
      selectable: false,
      zIndex: 7,
      style: {
        width: PRR_HUB_SIZE,
        height: PRR_HUB_SIZE,
        borderRadius: "50%",
        background: "var(--card-bg, #fff)",
        border: "3px solid #333",
        boxShadow: "0 0 0 2px var(--card-bg, #fff), 0 0 0 5px #333",
        padding: 0,
        cursor: "pointer",
      },
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
      return { node: n, ring, lineIndices, angle };
    })
    .filter((m): m is MultiDomainMeeting => m !== null);
  const meetingByNodeId = new Map(meetings.map((m) => [m.node.id, m]));

  // Two DIFFERENT multi-domain CDRLs can independently resolve to the same ring (e.g. two
  // unrelated interface docs both anchored at the same SETR event) — each would otherwise get
  // its own separate hub icon via renderStation below, rendering as near-duplicate overlapping
  // circles at that ring instead of one shared transfer hub. meetingsByRing groups them so
  // renderStation can tell when it needs to defer to the combined-ring-hub pass further down.
  const meetingsByRing = new Map<number, MultiDomainMeeting[]>();
  meetings.forEach((m) => {
    const arr = meetingsByRing.get(m.ring) ?? [];
    arr.push(m);
    meetingsByRing.set(m.ring, arr);
  });

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

  /**
   * A domain's track as a shortest-path problem, per Ron's steer: describe the network as a
   * graph and solve it with Dijkstra rather than hand-interpolating between waypoints. One
   * node per (ring, candidate angle); one edge per ring-to-ring hop, weighted by the angular
   * distance moved — so total path weight is exactly "distance between the lines," and
   * minimizing it is the whole objective. A ring where this domain has a mandatory meeting
   * (see `meetings` above) only offers ONE candidate node — that meeting's angle — which is
   * what "constrained at each SETR event" becomes here: Dijkstra is forced through it, and
   * finds the least-total-movement way to link every required ring in order, easing toward
   * home angle everywhere else. Candidate angles otherwise are the domain's home angle plus
   * every meeting angle it participates in anywhere along its track, so the shortest path is
   * free to start drifting toward a meeting before the ring that actually requires it.
   */
  function solveDomainTrackAngles(lineIndex: number, maxRing: number): number[] {
    const home = domainHomeAngle(lineIndex);
    const ownMeetings = meetings.filter((m) => m.lineIndices.includes(lineIndex));
    const requiredAngleByRing = new Map<number, number>();
    ownMeetings.forEach((m) => requiredAngleByRing.set(Math.min(m.ring, maxRing), m.angle));
    const candidateAngles = Array.from(new Set([home, ...ownMeetings.map((m) => m.angle)]));

    const nodesByRing: GraphNode[][] = [];
    const allNodes: GraphNode[] = [];
    for (let ring = 0; ring <= maxRing; ring++) {
      const required = requiredAngleByRing.get(ring);
      const angles = required !== undefined ? [required] : candidateAngles;
      const ringNodes = angles.map((angle, i) => ({ id: `L${lineIndex}-r${ring}-${i}`, ring, angle }));
      nodesByRing.push(ringNodes);
      allNodes.push(...ringNodes);
    }

    const edges: GraphEdge[] = [];
    for (let ring = 0; ring < maxRing; ring++) {
      nodesByRing[ring].forEach((from) => {
        nodesByRing[ring + 1].forEach((to) => {
          edges.push({ from: from.id, to: to.id, weight: Math.abs(shortestAngleDelta(from.angle, to.angle)) });
        });
      });
    }

    const graph = buildGraph(allNodes, edges);
    const startNode = nodesByRing[0].find((n) => n.angle === home) ?? nodesByRing[0][0];
    const endRingNodes = nodesByRing[maxRing];
    const endNode = endRingNodes.find((n) => n.angle === home) ?? endRingNodes[0];
    const path = dijkstraShortestPath(graph, startNode.id, endNode.id);

    if (!path) return nodesByRing.map(() => home); // unreachable shouldn't happen (fully connected DAG); safe fallback
    return path.map((id) => graph.nodes.get(id)!.angle);
  }

  const trackExtentByLine = model.lines.map((_, lineIndex) => domainTrackExtent(lineIndex));
  const anglesByLine = model.lines.map((_, lineIndex) => solveDomainTrackAngles(lineIndex, trackExtentByLine[lineIndex]));

  // Two domains easing toward (or away from) the same meeting can end up running nearly
  // parallel for a stretch — real subway maps give each line sharing a corridor its own thin
  // channel the whole way through (see e.g. WMATA's Blue/Orange/Silver trunk), rather than
  // pinching every line to one exact point at the transfer station itself. Every domain is
  // nudged sideways by LANE_OFFSET_PX, scaled by 1/radius so the on-screen gap stays a constant
  // pixel width regardless of how close to the center that ring is.
  //
  // The offset DIRECTION/magnitude is keyed to a domain's RANK among the domains still active
  // at that specific ring, sorted by their own solved angle there — not a fixed lane number
  // based on the domain's static position in `model.lines`. A domain's Dijkstra-solved angle
  // can end up anywhere over the course of its track (that's the whole point of #22's
  // shortest-path bending), so a fixed global lane assignment could put a domain on the
  // visually wrong side of a neighboring domain's actual position at some ring — offsetting it
  // straight into a track it should be offsetting away from, which is what kept producing
  // overlap no matter how the fade constants below were tuned in earlier rounds. Ranking by
  // actual per-ring angle instead means the offset always points the same direction as the
  // real left-to-right ordering at that ring.
  const maxRingOverall = Math.max(0, ...trackExtentByLine);
  const laneRankByLineAndRing: number[][] = model.lines.map(() => []);
  for (let ring = 0; ring <= maxRingOverall; ring++) {
    const activeLines = model.lines.map((_, idx) => idx).filter((idx) => trackExtentByLine[idx] >= ring);
    const sorted = [...activeLines].sort((a, b) => anglesByLine[a][ring] - anglesByLine[b][ring]);
    sorted.forEach((idx, rank) => {
      laneRankByLineAndRing[idx][ring] = rank - (sorted.length - 1) / 2;
    });
  }

  // A constant PIXEL gap needs a GROWING angular offset as radius shrinks (offsetDeg ∝
  // 1/radius) — fine everywhere except near the center, where a few ring-to-ring radius steps
  // cover a large relative change in 1/radius, producing a visibly jagged, almost spiraling
  // track for whichever domain has the largest-magnitude rank at that ring. LANE_FADE_START_RADIUS
  // fades the offset to exactly 0 by INNER_RADIUS instead of letting it blow up — which also
  // reads correctly on its own terms: PRR is the map's actual hub, so lines drawing tightly
  // together as they approach it is the right visual, not a bug to route around.
  const LANE_OFFSET_PX = 7;
  const LANE_FADE_START_RADIUS = 400;
  function laneOffsetDeg(rank: number, radius: number): number {
    if (radius <= INNER_RADIUS) return 0;
    const t = Math.min(1, (radius - INNER_RADIUS) / (LANE_FADE_START_RADIUS - INNER_RADIUS));
    const fade = t * t * (3 - 2 * t); // smoothstep — zero slope at both ends, so the fade
    // neither kinks in sharply where it starts nor snaps abruptly right at the center.
    return ((rank * LANE_OFFSET_PX * fade) / radius) * (180 / Math.PI);
  }
  const trackAngleAt = (lineIndex: number, ring: number) => {
    const clamped = Math.max(0, Math.min(ring, trackExtentByLine[lineIndex]));
    const rank = laneRankByLineAndRing[lineIndex][clamped] ?? 0;
    return anglesByLine[lineIndex][clamped] + laneOffsetDeg(rank, ringRadius(clamped));
  };

  // Domains whose track terminates at a SETR ring with no multi-domain-CDRL meeting of their
  // own there (see `meetings` above) get merged into an EXISTING meeting-hub at that same ring
  // if there's exactly one — per Ron's steer, a track ending on a SETR ring needs to join the
  // transfer hub with other tracks there, not sit as its own separate near-adjacent circle. A
  // ring with no existing meeting but 2+ such domains gets a brand-new shared hub instead (see
  // the terminal-hub block below, after the track-drawing loop); a ring with only ONE
  // unexplained domain stays a plain train stop — Ron's own "unless it's the only CDRL
  // required at that SETR" carve-out, expected to be rare in practice. A ring with more than
  // one DISTINCT meeting is left alone (ambiguous which one a lone domain should join).
  const extraAbsorbedByMeetingRing = new Map<number, number[]>();
  const terminalOnlyByRing = new Map<number, number[]>();
  model.lines.forEach((_, lineIndex) => {
    const ring = trackExtentByLine[lineIndex];
    const alreadyMet = meetings.some((m) => m.ring === ring && m.lineIndices.includes(lineIndex));
    if (alreadyMet) return;
    const ringMeetings = meetings.filter((m) => m.ring === ring);
    if (ringMeetings.length === 1) {
      const arr = extraAbsorbedByMeetingRing.get(ring) ?? [];
      arr.push(lineIndex);
      extraAbsorbedByMeetingRing.set(ring, arr);
      return;
    }
    const arr = terminalOnlyByRing.get(ring) ?? [];
    arr.push(lineIndex);
    terminalOnlyByRing.set(ring, arr);
  });

  /** Zero-size anchor node an edge can source/target from, at an already-resolved point. Only
   * needs to exist for React Flow's own bookkeeping (every edge needs valid source/target node
   * ids) — the actual drawn path never depends on this node's rendered position or boundary. */
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

    // The track itself: ONE edge, its path a polyline through every ring's angle-solved point
    // (see solveDomainTrackAngles) — drawn as a single custom SVG path (CdrlPathTrackEdge)
    // rather than a chain of React Flow's own node-to-node edges. React Flow's built-in edge
    // types connect via "floating" boundary-intersection geometry that shrinks each segment
    // slightly at both ends; chaining many short ring-to-ring segments compounded that
    // shrinkage into a visible gap at every joint. A single custom path sidesteps that
    // entirely — it draws exactly where computed, with no seams.
    const points: { x: number; y: number }[] = [];
    for (let r = 0; r <= maxRing; r++) points.push(polarPoint(ringRadius(r), trackAngleAt(lineIndex, r)));
    if (points.length === 1) points.push(polarPoint(ringRadius(0) - 5, trackAngleAt(lineIndex, 0))); // stub for a domain with no resolvable activity at all

    const startId = `line-pt-${line.id}--start`;
    const endId = `line-pt-${line.id}--end`;
    pushAnchor(startId, points[0]);
    pushAnchor(endId, points[points.length - 1]);
    edges.push({
      id: `line-edge-${line.id}`,
      source: startId,
      target: endId,
      type: "cdrlPathTrack",
      data: { points },
      selectable: false,
      style: { stroke: line.color_hint, strokeWidth: isExpanded ? 12 : 9, cursor: "pointer" },
    });
  });

  // Combined ring hubs: every SETR ring where 2+ domains converge in a way ONE existing
  // mechanism doesn't already cover — either 2+ DISTINCT multi-domain-CDRL meetings landing on
  // the same ring (renderStation above defers to this pass for those), or 2+ domains whose
  // tracks simply end at the same ring with no meeting at all (terminalOnlyByRing) — get
  // exactly ONE transfer-hub icon unioning everyone converging there, not one icon apiece.
  // Per Ron's steer, a track ending on a SETR ring needs to join THE transfer hub, singular.
  // PRR is excluded — it already has its own dedicated hub icon (prr-hub above) that every
  // PRR-terminating track already lands on exactly (ringRadius(prrIndex) is 0 for all of them).
  // Unlike a single CDRL's own interchange hub, a combined hub isn't about any one CDRL, so it
  // opens the same "what's required at this SETR event" listing as the ring label itself.
  const combinedRingHubs = new Map<number, Set<number>>();
  meetingsByRing.forEach((ringMeetings, ring) => {
    if (ringMeetings.length < 2) return;
    const set = combinedRingHubs.get(ring) ?? new Set<number>();
    ringMeetings.forEach((m) => m.lineIndices.forEach((idx) => set.add(idx)));
    combinedRingHubs.set(ring, set);
  });
  terminalOnlyByRing.forEach((lineIndices, ring) => {
    const set = combinedRingHubs.get(ring) ?? new Set<number>();
    lineIndices.forEach((idx) => set.add(idx));
    combinedRingHubs.set(ring, set);
  });

  let combinedHubIndex = 0;
  combinedRingHubs.forEach((lineIndexSet, ring) => {
    const lineIndices = Array.from(lineIndexSet);
    if (ring === prrIndex || lineIndices.length < 2) return;
    const radius = ringRadius(ring);
    const trackPoints = lineIndices.map((idx) => ({ idx, point: polarPoint(radius, trackAngleAt(idx, ring)) }));
    const hubPoint = {
      x: trackPoints.reduce((sum, t) => sum + t.point.x, 0) / trackPoints.length,
      y: trackPoints.reduce((sum, t) => sum + t.point.y, 0) / trackPoints.length,
    };
    // Every CDRL whose own meeting resolved to this ring gets its anchor set here, since
    // renderStation (below) skips drawing an individual marker for them once their ring has
    // 2+ distinct meetings — the relationship-connector pass at the end needs this anchor
    // regardless of whether the CDRL got its own icon or was folded into this combined one.
    (meetingsByRing.get(ring) ?? []).forEach((m) => nodeAnchorCenter.set(m.node.id, hubPoint));
    const hubId = `ring-hub-${combinedHubIndex++}`;
    const half = HUB_MARKER_SIZE / 2;
    const eventId = setr_events[ring].id;
    nodes.push({
      id: hubId,
      type: "default",
      position: { x: hubPoint.x - half, y: hubPoint.y - half },
      data: { label: "", relatedNodeIds: requiredNodeIdsByEvent[eventId] ?? [], modalTitle: `${eventId} — CDRLs required` },
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
    trackPoints.forEach(({ idx, point }) => {
      const stubId = `ring-hub-stub-${hubId}-${model.lines[idx].id}`;
      pushAnchor(`${stubId}-a`, hubPoint);
      pushAnchor(`${stubId}-b`, point);
      edges.push({
        id: stubId,
        source: `${stubId}-a`,
        target: `${stubId}-b`,
        type: "straight",
        selectable: false,
        zIndex: 2,
        style: { stroke: model.lines[idx].color_hint, strokeWidth: 3 },
      });
    });
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
   * icon if it spans two or more. The hub sits at the CENTROID of its domains' actual
   * (lane-offset, still-parallel) points at that ring — not a point they're forced to share —
   * with a short stub to each, the way a real transfer station icon sits among separate
   * parallel lines rather than pinching them together (see docs/cdrl-path/DECISIONS.md #31). */
  function renderStation(cdrlNode: CdrlPathNode, radiusIndex: number, primaryLineIndex: number) {
    const meeting = meetingByNodeId.get(cdrlNode.id);
    if (!meeting) {
      const point = polarPoint(ringRadius(radiusIndex), trackAngleAt(primaryLineIndex, radiusIndex));
      nodeAnchorCenter.set(cdrlNode.id, point);
      pushTrainStop(`station-${cdrlNode.id}`, point, STATION_MARKER_SIZE, model.lines[primaryLineIndex].color_hint, 6);
      return;
    }
    // A second, unrelated multi-domain CDRL independently resolving to this same ring would
    // otherwise get its own separate hub icon here too, rendering as a near-duplicate circle
    // right beside this one. When that happens, skip drawing this node's own icon entirely —
    // the combined-ring-hub pass (before the contextMarkers/fullStationNodes passes below)
    // already drew ONE icon for the whole ring and set this node's anchor to it.
    if ((meetingsByRing.get(meeting.ring)?.length ?? 0) > 1) return;

    const radius = ringRadius(meeting.ring);
    // A domain whose own track happens to terminate at this exact ring with no meeting of its
    // own gets absorbed as an extra spoke of this hub (see extraAbsorbedByMeetingRing above) —
    // per Ron's steer, a track ending on a SETR ring joins the transfer hub already there
    // rather than sitting beside it as its own separate circle.
    const allLineIndices = [...meeting.lineIndices, ...(extraAbsorbedByMeetingRing.get(meeting.ring) ?? [])];
    const trackPoints = allLineIndices.map((idx) => ({ idx, point: polarPoint(radius, trackAngleAt(idx, meeting.ring)) }));
    const hubPoint = {
      x: trackPoints.reduce((sum, t) => sum + t.point.x, 0) / trackPoints.length,
      y: trackPoints.reduce((sum, t) => sum + t.point.y, 0) / trackPoints.length,
    };

    const half = HUB_MARKER_SIZE / 2;
    nodes.push({
      id: `station-${cdrlNode.id}`,
      type: "default",
      position: { x: hubPoint.x - half, y: hubPoint.y - half },
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

    trackPoints.forEach(({ idx, point }) => {
      const stubId = `interchange-stub-${cdrlNode.id}-${model.lines[idx].id}`;
      pushAnchor(`${stubId}-a`, hubPoint);
      pushAnchor(`${stubId}-b`, point);
      edges.push({
        id: stubId,
        source: `${stubId}-a`,
        target: `${stubId}-b`,
        type: "straight",
        selectable: false,
        zIndex: 2,
        style: { stroke: model.lines[idx].color_hint, strokeWidth: 3 },
      });
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
          // Relationship connectors (see the pass at the end) point to one representative
          // point per node — prefer FINAL (the "as-delivered" milestone) over whichever marker
          // happened to be created first, and over the lightweight anchor renderStation set.
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

  // Relationship connectors — per Ron's steer, an influences/influenced_by pair needs a real
  // "extension track" directly between the two actual stations, not a standalone floating
  // marker with no visible connection (the earlier handoff-hub diamonds, #33-35, removed in
  // #51 for reading unclear). Each cross-domain pair draws ONE dashed line straight from one
  // CDRL's real anchor point (nodeAnchorCenter, set above by every station/hub/maturity-marker
  // pass) to the other's — deliberately not routed through a synthetic midpoint hub, so it's
  // always literally "this CDRL, connected to that CDRL," styled distinctly (thin, dashed,
  // neutral gray) from the thick colored domain tracks so it reads as a transfer link, the way
  // a subway map draws a walking connector between stations on different lines. Same-domain
  // pairs are skipped (already visually adjacent on the shared track); "ALL" targets
  // (SEMP/IMP_IMS/RMP) are skipped per confirmed_patterns.relationship_assessment_status
  // flagging them as too broad to chart. Clicking a connector opens the same related-CDRLs
  // modal as any station, showing just the two CDRLs on each end of that specific pair.
  const seenRelationshipPairs = new Set<string>();
  let relationshipEdgeIndex = 0;
  fullStationNodes.forEach((cdrlNode) => {
    const relationshipTargets = [...(cdrlNode.influences ?? []), ...(cdrlNode.influenced_by ?? [])];
    relationshipTargets.forEach((targetId) => {
      if (targetId === "ALL" || targetId === cdrlNode.id) return;
      const target = nodeById.get(targetId);
      if (!target) return; // dangling reference — already surfaced by validateModel()
      const domainAIndex = model.lines.findIndex((l) => l.id === cdrlNode.domains[0]);
      const domainBIndex = model.lines.findIndex((l) => l.id === target.domains[0]);
      if (domainAIndex === -1 || domainBIndex === -1 || domainAIndex === domainBIndex) return;
      const pairKey = [cdrlNode.id, targetId].sort().join("--");
      if (seenRelationshipPairs.has(pairKey)) return;
      seenRelationshipPairs.add(pairKey);
      const aPoint = nodeAnchorCenter.get(cdrlNode.id);
      const bPoint = nodeAnchorCenter.get(target.id);
      if (!aPoint || !bPoint) return;
      const edgeId = `relationship-track-${relationshipEdgeIndex++}`;
      pushAnchor(`${edgeId}-a`, aPoint);
      pushAnchor(`${edgeId}-b`, bPoint);
      edges.push({
        id: edgeId,
        source: `${edgeId}-a`,
        target: `${edgeId}-b`,
        type: "straight",
        data: { relatedNodeIds: [cdrlNode.id, target.id], modalTitle: `${cdrlNode.title} ↔ ${target.title}` },
        zIndex: 3,
        style: { stroke: "#888", strokeWidth: 1.5, strokeDasharray: "4 3", opacity: 0.65, cursor: "pointer" },
      });
    });
  });

  return { nodes, edges };
}
