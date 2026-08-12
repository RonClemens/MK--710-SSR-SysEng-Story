import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathDecompositionLevel, CdrlPathModel, CdrlPathNode } from "../types/cdrlPath";
import { anchorEventIndex, expandMaturityStateToMarkers, getMaturityMarkerStyle, maturityStatesForLevel } from "./cdrlPathMaturityMarkers";

// Polar "dartboard" coordinate system per Ron's steer: SETR events are concentric rings
// (ASR outermost, PRR the center bullseye — PCA/ISR fall outside the ring system since PRR
// is explicitly the terminus, not the literal end of the SETR sequence), and each domain
// (line) is a radial spoke running from the outer ring inward to wherever that domain's own
// latest active SETR event is — it does not have to reach the center. This replaced an
// earlier Cartesian (x=time, y=line) layout with a bolted-on "relationship hub" once Ron
// clarified the whole map should be radial, not just one feature of it — see
// docs/cdrl-path/DECISIONS.md #10-#12 for the full history of how this shape was arrived at.

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
// transfer-station look) sitting between its tracks, with a short colored stub connecting
// it to each one — not a marker glued onto its "primary" domain's line.
const STATION_MARKER_SIZE = 16;
const HUB_MARKER_SIZE = 26;
// Nodes sharing a domain fan out by a small angle rather than the flat pixel offset the
// old Cartesian sub-lane used — capped so even a domain with many nodes doesn't bleed its
// spread into a neighboring domain's angular sector.
const MAX_SUBLANE_SPREAD_DEG = 28;

/** Builds the React Flow elements for the current zoom/filter state.
 *
 * Always rendered, regardless of zoom state: the concentric SETR-event rings, each domain's
 * radial spoke (stopping at its own latest active ring, not forced to the center), context
 * markers, a lightweight single-dot marker for every full_station node at its primary
 * anchor ring, and direct relationship connectors for every influences/influenced_by pair —
 * the real concentric rings and shared center (PRR) already do the "combining all related
 * lines together" work a separate constructed hub used to do, so relationships no longer
 * need one.
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
  const domainAngle = (domainIndex: number) => -90 + domainIndex * angleStep;

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
    // of a domain's own spoke line.
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

  /** Highest ring index reached by any of a domain's own nodes (context markers and
   * full_station maturity markers alike) — where that domain's spoke line stops. Domains
   * with no resolvable activity default to the outermost ring only (a stub spoke) rather
   * than guessing a length. */
  function domainMaxActiveIndex(lineId: string): number {
    let max = 0;
    model.nodes.forEach((n) => {
      if (n.domains[0] !== lineId) return;
      if (n.render_style === "context_marker") {
        const marker = n.drafted_at ?? n.baselined_at ?? "";
        max = Math.max(max, Math.round(resolveMarkerEventIndex(marker, setr_events)));
        return;
      }
      maturityStatesForLevel(n, decompositionLevel).forEach((state) => {
        expandMaturityStateToMarkers(n, state, setr_events).forEach(({ eventIndex }) => {
          max = Math.max(max, Math.round(eventIndex));
        });
      });
    });
    return Math.min(max, prrIndex);
  }

  model.lines.forEach((line, lineIndex) => {
    const angle = domainAngle(lineIndex);
    const isExpanded = line.id === expandedLineId;
    const maxIndex = domainMaxActiveIndex(line.id);
    const outerPoint = polarPoint(ringRadius(0), angle);
    const innerPoint = polarPoint(ringRadius(maxIndex), angle);
    const labelPoint = polarPoint(ringRadius(0) + 36, angle);

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

    const startId = `line-start-${line.id}`;
    const endId = `line-end-${line.id}`;
    nodes.push(
      { id: startId, type: "default", position: outerPoint, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } },
      { id: endId, type: "default", position: innerPoint, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } },
    );
    edges.push({
      id: `line-edge-${line.id}`,
      source: startId,
      target: endId,
      type: "straight",
      selectable: false,
      style: { stroke: line.color_hint, strokeWidth: isExpanded ? 12 : 9, cursor: "pointer" },
    });
  });

  /** Zero-size anchor node a straight edge can source/target from, at an already-resolved point. */
  function pushAnchor(id: string, point: { x: number; y: number }) {
    nodes.push({ id, type: "default", position: point, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } });
  }

  /** A single subway "train stop": a hollow ring in the line's own color, sitting directly
   * on that line. Used both for a single-domain CDRL's only marker and for the small
   * presence tick a multi-domain CDRL leaves on each of its other tracks. */
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

  /** Renders a CDRL's station marker at ring `radiusIndex`: a plain train-stop icon if it
   * belongs to one domain, or an interchange hub (see renderInterchangeHub) if it spans
   * two or more. Per Ron's steer: a single-domain CDRL "belongs on one single track"; a
   * multi-domain one "should be a hub for those related tracks," not a marker glued onto
   * whichever domain happens to be listed first. */
  function renderStation(cdrlNode: CdrlPathNode, radiusIndex: number, primaryLineIndex: number) {
    const lineIndices = cdrlNode.domains
      .map((domainId) => model.lines.findIndex((l) => l.id === domainId))
      .filter((idx) => idx !== -1);

    if (lineIndices.length <= 1) {
      const point = polarPoint(ringRadius(radiusIndex), domainAngle(primaryLineIndex));
      nodeAnchorCenter.set(cdrlNode.id, point);
      pushTrainStop(`station-${cdrlNode.id}`, point, STATION_MARKER_SIZE, model.lines[primaryLineIndex].color_hint, 6);
      return;
    }
    renderInterchangeHub(cdrlNode, radiusIndex, lineIndices);
  }

  /**
   * True subway interchange: for a node spanning 2+ domains, the station itself sits at the
   * circular-mean angle of its domains (at their shared ring) rather than on any one line —
   * a bigger concentric-ring icon (the WMATA transfer-station look), with a short colored
   * stub running out to a train-stop tick on each involved track. Per Ron's steer: CDRLs
   * are "the subway stops involving one or more domains' participation," and a multi-domain
   * one "should be a hub for those related tracks."
   */
  function renderInterchangeHub(cdrlNode: CdrlPathNode, radiusIndex: number, lineIndices: number[]) {
    const radius = ringRadius(radiusIndex);
    const angles = lineIndices.map((idx) => toRadians(domainAngle(idx)));
    const meanSin = angles.reduce((sum, a) => sum + Math.sin(a), 0) / angles.length;
    const meanCos = angles.reduce((sum, a) => sum + Math.cos(a), 0) / angles.length;
    const hubAngleDeg = (Math.atan2(meanSin, meanCos) * 180) / Math.PI;
    const hubPoint = polarPoint(radius, hubAngleDeg);
    nodeAnchorCenter.set(cdrlNode.id, hubPoint);

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

    lineIndices.forEach((lineIndex) => {
      const domainLine = model.lines[lineIndex];
      const trackPoint = polarPoint(radius, domainAngle(lineIndex));
      const stubId = `interchange-stub-${cdrlNode.id}-${domainLine.id}`;
      pushAnchor(`${stubId}-a`, hubPoint);
      pushAnchor(`${stubId}-b`, trackPoint);
      edges.push({
        id: stubId,
        source: `${stubId}-a`,
        target: `${stubId}-b`,
        type: "straight",
        selectable: false,
        zIndex: 2,
        style: { stroke: domainLine.color_hint, strokeWidth: 3 },
      });
      pushTrainStop(`interchange-presence-${domainLine.id}--${cdrlNode.id}`, trackPoint, STATION_MARKER_SIZE, domainLine.color_hint, 6);
    });
  }

  /** Connects an already-placed marker (e.g. a maturity marker on the currently expanded
   * line) out to a train-stop tick on each of the node's OTHER domains — used when the
   * node's primary position isn't the interchange hub itself (Level 2's rich timeline keeps
   * that marker on the expanded line), so the interchange still needs its stubs drawn from
   * that fixed point instead of a freshly computed hub. */
  function renderInterchangeStubsFrom(cdrlNode: CdrlPathNode, fromPoint: { x: number; y: number }, radiusIndex: number, shownOnLineIndex: number) {
    const radius = ringRadius(radiusIndex);
    const otherLineIndices = cdrlNode.domains
      .map((domainId) => model.lines.findIndex((l) => l.id === domainId))
      .filter((idx) => idx !== -1 && idx !== shownOnLineIndex);

    otherLineIndices.forEach((lineIndex) => {
      const domainLine = model.lines[lineIndex];
      const trackPoint = polarPoint(radius, domainAngle(lineIndex));
      const stubId = `interchange-stub-${cdrlNode.id}-${domainLine.id}`;
      pushAnchor(`${stubId}-a`, fromPoint);
      pushAnchor(`${stubId}-b`, trackPoint);
      edges.push({
        id: stubId,
        source: `${stubId}-a`,
        target: `${stubId}-b`,
        type: "straight",
        selectable: false,
        zIndex: 2,
        style: { stroke: domainLine.color_hint, strokeWidth: 3 },
      });
      pushTrainStop(`interchange-presence-${domainLine.id}--${cdrlNode.id}`, trackPoint, STATION_MARKER_SIZE, domainLine.color_hint, 6);
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
          const point = polarPoint(ringRadius(clampedIndex), domainAngle(lineIndex) + angleOffset);
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
      if (cdrlNode.domains.length > 1) {
        const anchor = nodeAnchorCenter.get(cdrlNode.id);
        if (anchor) {
          const anchorIndex = Math.round(
            (Math.hypot(anchor.x - CENTER.x, anchor.y - CENTER.y) - OUTER_RADIUS) / ((INNER_RADIUS - OUTER_RADIUS) / prrIndex),
          );
          renderInterchangeStubsFrom(cdrlNode, anchor, anchorIndex, lineIndex);
        }
      }
    });
  }

  // Relationship connectors — the actual "back and forth across the whole team" Ron
  // described as this model's core value (see purpose_statement in the data model). Drawn
  // directly between each pair's actual anchor points rather than through a constructed
  // hub: on the dartboard, the concentric rings and shared center are already the visual
  // structure that makes multiple domains' activity converge, so relationships don't need
  // a separate bullseye of their own the way they did under the old Cartesian layout (see
  // docs/cdrl-path/DECISIONS.md #10-#12). "ALL" targets (SEMP/IMP_IMS/RMP) are skipped per
  // confirmed_patterns.relationship_assessment_status flagging them as too broad to chart.
  const ghostNodeIdsAdded = new Set<string>();
  const ghostSlotsUsed = new Map<string, number>();

  function ghostAnchorFor(target: CdrlPathNode): { x: number; y: number } | null {
    const existing = nodeAnchorCenter.get(target.id);
    if (existing) return existing;
    const targetLineIndex = model.lines.findIndex((l) => l.id === target.domains[0]);
    if (targetLineIndex === -1) return null;
    const eventIndex = Math.min(anchorEventIndex(target, setr_events), prrIndex);
    const slotKey = `${targetLineIndex}:${eventIndex}`;
    const slot = ghostSlotsUsed.get(slotKey) ?? 0;
    ghostSlotsUsed.set(slotKey, slot + 1);
    const point = polarPoint(ringRadius(eventIndex), domainAngle(targetLineIndex) + slot * 6);
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
      if (target.domains[0] === cdrlNode.domains[0]) return; // same-domain, already visually adjacent on the shared spoke
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
