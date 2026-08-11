import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathDecompositionLevel, CdrlPathModel, CdrlPathNode } from "../types/cdrlPath";
import { anchorEventIndex, expandMaturityStateToMarkers, getMaturityMarkerStyle, maturityStatesForLevel } from "./cdrlPathMaturityMarkers";

// Manual, subway-line-style coordinate layout per the confirmed "React Flow, not
// force-directed" decision — time axis (SETR event sequence) on X, one row per line on Y.
// Visual conventions (exact colors, bend angles, node shapes) are explicitly not designed
// yet (see cdrl-path-project-brief.md open items); this is a first pass to prove the data
// renders sensibly, per the Phase 1/2 goals in the handoff doc.

export const EVENT_COLUMN_WIDTH = 180;
export const LINE_ROW_HEIGHT = 120;
// Wide enough that a "pre-<event>" marker (rendered half a column left of its
// matched event, e.g. CDD at "pre-MSA") doesn't overlap the line-label column.
export const LEFT_MARGIN = 220;
export const TOP_MARGIN = 80;

export const eventX = (index: number) => LEFT_MARGIN + index * EVENT_COLUMN_WIDTH;
export const lineY = (index: number) => TOP_MARGIN + index * LINE_ROW_HEIGHT;

/**
 * Best-effort resolution of a free-text temporal marker (e.g. "SRR", "MSA/SRR",
 * "pre-MSA", "SVR_FCA / PCA") to a fractional SETR-event-index x-position. Generic by
 * design rather than hardcoded per node, since the handoff doc calls for this app to stay
 * "data-driven and regeneration-friendly, not hardcoded to today's specific node set."
 * Falls back to index 0 and logs a warning when nothing matches, so gaps in the mapping
 * surface as visible console noise during this "surface remaining data-model bugs" phase
 * rather than silently mispositioning a station.
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

const CONTEXT_MARKER_SIZE = 12;

/** Builds the React Flow elements for the current zoom/filter state: always the 7 lines,
 * SETR headers, CM baseline markers, and context_marker interchange stations (Level 1
 * content, visible at every zoom level per the legend); plus, when a line is expanded, that
 * line's full_station maturity timeline filtered to the selected decomposition level. */
export function buildCdrlPathFlowElements(model: CdrlPathModel, options: CdrlPathFlowOptions = {}): CdrlPathFlowElements {
  const { expandedLineId = null, decompositionLevel = "SYSTEM" } = options;
  const { setr_events, cm_baselines } = model.lifecycle_lanes;
  const rightEdgeX = eventX(setr_events.length - 1) + EVENT_COLUMN_WIDTH / 2;
  const leftEdgeX = eventX(0) - EVENT_COLUMN_WIDTH / 2;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // Center-point (not the top-left style offset used for `position`) of each CDRL node's
  // single "primary" visual anchor, populated as markers are created — used below to draw
  // relationship edges without needing a second traversal of the model.
  const nodeAnchorCenter = new Map<string, { x: number; y: number }>();

  setr_events.forEach((event, index) => {
    nodes.push({
      id: `setr-header-${event.id}`,
      type: "default",
      position: { x: eventX(index), y: 0 },
      data: { label: event.id },
      draggable: false,
      selectable: false,
      style: { width: 90, textAlign: "center", background: "transparent", border: "none", fontWeight: 600, fontSize: 12 },
    });
  });

  cm_baselines.forEach((baseline) => {
    const atIndex = setr_events.findIndex((e) => e.id === baseline.established_at);
    if (atIndex === -1) {
      console.warn(`CDRL Path: CM baseline "${baseline.id}" references unknown SETR event "${baseline.established_at}".`);
      return;
    }
    nodes.push({
      id: `baseline-${baseline.id}`,
      type: "default",
      position: { x: eventX(atIndex) - 1, y: TOP_MARGIN - 36 },
      data: { label: `${baseline.id} baseline` },
      draggable: false,
      selectable: false,
      style: {
        width: 2,
        height: model.lines.length * LINE_ROW_HEIGHT + 20,
        background: "#888",
        border: "none",
        opacity: 0.35,
        fontSize: 10,
        color: "#888",
        padding: 0,
      },
    });
  });

  model.lines.forEach((line, lineIndex) => {
    const y = lineY(lineIndex);
    const isExpanded = line.id === expandedLineId;

    nodes.push({
      id: `line-label-${line.id}`,
      type: "default",
      position: { x: 0, y: y - 16 },
      data: { label: `${isExpanded ? "▾ " : "▸ "}${line.label}` },
      draggable: false,
      selectable: false,
      style: {
        width: LEFT_MARGIN - 24,
        background: "transparent",
        border: "none",
        fontWeight: isExpanded ? 700 : 600,
        fontSize: 13,
        color: line.color_hint,
        textAlign: "right",
        cursor: "pointer",
      },
    });

    const startId = `line-start-${line.id}`;
    const endId = `line-end-${line.id}`;
    nodes.push(
      { id: startId, type: "default", position: { x: leftEdgeX, y }, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } },
      { id: endId, type: "default", position: { x: rightEdgeX, y }, data: {}, draggable: false, selectable: false, style: { width: 1, height: 1, opacity: 0, border: "none" } },
    );
    edges.push({
      id: `line-edge-${line.id}`,
      source: startId,
      target: endId,
      type: "straight",
      selectable: false,
      style: { stroke: line.color_hint, strokeWidth: isExpanded ? 8 : 6, cursor: "pointer" },
    });
  });

  const contextMarkers = model.nodes.filter((n) => n.render_style === "context_marker");
  contextMarkers.forEach((cdrlNode) => {
    const lineIndex = model.lines.findIndex((l) => l.id === cdrlNode.line);
    if (lineIndex === -1) {
      console.warn(`CDRL Path: node "${cdrlNode.id}" references unknown line "${cdrlNode.line}".`);
      return;
    }
    const marker = cdrlNode.drafted_at ?? cdrlNode.baselined_at ?? "";
    const fractionalIndex = resolveMarkerEventIndex(marker, setr_events);
    const line = model.lines[lineIndex];
    const half = CONTEXT_MARKER_SIZE / 2;
    nodeAnchorCenter.set(cdrlNode.id, { x: eventX(fractionalIndex), y: lineY(lineIndex) });

    nodes.push({
      id: `station-${cdrlNode.id}`,
      type: "default",
      position: { x: eventX(fractionalIndex) - half, y: lineY(lineIndex) - half },
      data: { label: "" },
      draggable: false,
      style: {
        width: CONTEXT_MARKER_SIZE,
        height: CONTEXT_MARKER_SIZE,
        borderRadius: "50%",
        background: line.color_hint,
        border: "2px solid var(--card-bg, #fff)",
        padding: 0,
        cursor: "pointer",
      },
    });
  });

  if (expandedLineId) {
    const lineIndex = model.lines.findIndex((l) => l.id === expandedLineId);
    const line = model.lines[lineIndex];
    // Multiple full_station nodes commonly share a line (e.g. SSS and IRS both on
    // DESIGN_INPUT) and often share an event too (both FINAL at SFR) — without a sub-lane
    // offset their markers would land on the exact same coordinate and become unclickable,
    // one fully occluding the other. Only nodes with at least one marker at the currently
    // selected decomposition level get a sub-lane, so the fan-out tightens as you drill in.
    const SUBLANE_HEIGHT = 22;
    // Not `n.render_style === "full_station"`: 4 confirmed real CDRLs (HW_DEV_SPEC,
    // HW_PROD_SPEC, LORA, CMRS) have no render_style field at all in the data model — an
    // apparent data-entry gap, not a deliberate context_marker classification, since only
    // 5 nodes are ever explicitly tagged context_marker. Defaulting anything not explicitly
    // a context marker to "full station" matches that data model's own implicit convention
    // instead of silently dropping these 4 nodes from Level 2 everywhere they appear.
    const qualifyingNodes = model.nodes.filter(
      (n) => n.line === expandedLineId && n.render_style !== "context_marker" && maturityStatesForLevel(n, decompositionLevel).length > 0,
    );

    qualifyingNodes.forEach((cdrlNode, nodeIndex) => {
      const subLaneOffset = (nodeIndex - (qualifyingNodes.length - 1) / 2) * SUBLANE_HEIGHT;
      const rowY = lineY(lineIndex) + subLaneOffset;
      const states = maturityStatesForLevel(cdrlNode, decompositionLevel);
      states.forEach((state) => {
        const markers = expandMaturityStateToMarkers(cdrlNode, state, setr_events);
        markers.forEach(({ eventIndex }) => {
          const visual = getMaturityMarkerStyle(state);
          const size = visual.large ? 26 : 18;
          const half = size / 2;
          // Relationship edges connect to one representative point per node — prefer FINAL
          // (the "as-delivered" milestone) over whichever marker happened to be created first.
          const isFinal = state.state.toUpperCase() === "FINAL";
          if (isFinal || !nodeAnchorCenter.has(cdrlNode.id)) {
            nodeAnchorCenter.set(cdrlNode.id, { x: eventX(eventIndex), y: rowY });
          }
          nodes.push({
            id: `maturity-${cdrlNode.id}-${state.state}-${eventIndex}`,
            type: "default",
            position: { x: eventX(eventIndex) - half, y: rowY - half },
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
    });

    // Cross-line relationship edges — the actual "back and forth across the whole team"
    // Ron described as this model's core value (see purpose_statement in the data model),
    // distinct from the timeline markers above. Only drawn from the currently expanded
    // line's qualifying nodes, not the whole graph at once: with 36 nodes many of them
    // influencing "ALL", an always-on full relationship graph would be an unreadable
    // hairball — the data model's own confirmed_patterns.relationship_assessment note makes
    // this same point about the ECP node. Expanding a line to see how ITS documents connect
    // outward matches the GPS zoom-tier metaphor already used for time/decomposition.
    const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
    const ghostNodeIdsAdded = new Set<string>();
    // Two related targets on the same collapsed line easily resolve to the same event
    // column (e.g. SSDD and IDD both FINAL at PDR) — without an offset here they'd land on
    // the exact same coordinate and become unclickable, same failure mode the sub-lane
    // offset above fixes for the expanded line's own markers.
    const ghostSlotsUsed = new Map<string, number>();

    function ghostAnchorFor(target: CdrlPathNode): { x: number; y: number } | null {
      const existing = nodeAnchorCenter.get(target.id);
      if (existing) return existing;
      const targetLineIndex = model.lines.findIndex((l) => l.id === target.line);
      if (targetLineIndex === -1) return null;
      const eventIndex = anchorEventIndex(target, setr_events);
      const slotKey = `${targetLineIndex}:${eventIndex}`;
      const slot = ghostSlotsUsed.get(slotKey) ?? 0;
      ghostSlotsUsed.set(slotKey, slot + 1);
      const x = eventX(eventIndex) + slot * 14;
      const y = lineY(targetLineIndex);
      nodeAnchorCenter.set(target.id, { x, y });
      if (!ghostNodeIdsAdded.has(target.id)) {
        ghostNodeIdsAdded.add(target.id);
        const targetLine = model.lines[targetLineIndex];
        nodes.push({
          id: `related-${target.id}`,
          type: "default",
          position: { x: x - 5, y: y - 5 },
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
      return { x, y };
    }

    qualifyingNodes.forEach((cdrlNode) => {
      const sourceAnchor = nodeAnchorCenter.get(cdrlNode.id);
      if (!sourceAnchor) return;
      const relationshipTargets: { targetId: string; direction: "influences" | "influenced_by" }[] = [
        ...(cdrlNode.influences ?? []).map((targetId) => ({ targetId, direction: "influences" as const })),
        ...(cdrlNode.influenced_by ?? []).map((targetId) => ({ targetId, direction: "influenced_by" as const })),
      ];
      relationshipTargets.forEach(({ targetId, direction }) => {
        // "ALL" (SEMP, IMP_IMS, RMP) is explicitly flagged in the data model itself as too
        // broad to chart usefully as point-to-point edges — see confirmed_patterns
        // .relationship_assessment_status. Self-references can't happen structurally but
        // are guarded anyway since they'd be a degenerate zero-length edge.
        if (targetId === "ALL" || targetId === cdrlNode.id) return;
        const target = nodeById.get(targetId);
        if (!target) return; // dangling reference — already surfaced by validateModel()
        const targetAnchor = ghostAnchorFor(target);
        if (!targetAnchor) return;

        const [sourceId, targetHandleId] = direction === "influences" ? [cdrlNode.id, targetId] : [targetId, cdrlNode.id];
        edges.push({
          id: `relationship-${cdrlNode.id}-${direction}-${targetId}`,
          source: `relationship-anchor-${sourceId}`,
          target: `relationship-anchor-${targetHandleId}`,
          type: "straight",
          selectable: false,
          zIndex: 3,
          style: { stroke: line.color_hint, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.45 },
          markerEnd: { type: "arrow", color: line.color_hint, width: 12, height: 12 },
        });
      });
    });

    // React Flow edges need real source/target NODE ids to anchor to, but the actual visual
    // anchor for a CDRL node is one of several markers/dots already pushed above under a
    // different id scheme (`maturity-...`, `station-...`, `related-...`). Rather than thread
    // the "which exact id represents this node's primary anchor" logic through three
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
  }

  return { nodes, edges };
}
