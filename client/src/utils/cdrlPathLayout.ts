import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathDecompositionLevel, CdrlPathModel } from "../types/cdrlPath";
import { expandMaturityStateToMarkers, getMaturityMarkerStyle, maturityStatesForLevel } from "./cdrlPathMaturityMarkers";

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
  }

  return { nodes, edges };
}
