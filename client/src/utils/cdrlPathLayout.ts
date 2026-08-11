import type { Edge, Node } from "@xyflow/react";
import type { CdrlPathModel } from "../types/cdrlPath";

// Phase 1 coordinate layout: manual, subway-line-style positioning per the confirmed
// "React Flow, not force-directed" decision — time axis (SETR event sequence) on X,
// one row per line on Y. Visual conventions (exact colors, bend angles, node shapes)
// are explicitly not designed yet (see cdrl-path-project-brief.md open items); this is
// a first pass to prove the data renders sensibly, per the Phase 1 goal in the handoff doc.

const EVENT_COLUMN_WIDTH = 180;
const LINE_ROW_HEIGHT = 120;
// Wide enough that a "pre-<event>" marker (rendered half a column left of its
// matched event, e.g. CDD at "pre-MSA") doesn't overlap the line-label column.
const LEFT_MARGIN = 220;
const TOP_MARGIN = 80;

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

/** Builds the Level 1 (system view) React Flow elements: 7 lines + interchange stations. */
export function buildLevel1FlowElements(model: CdrlPathModel): CdrlPathFlowElements {
  const { setr_events, cm_baselines } = model.lifecycle_lanes;
  const eventX = (index: number) => LEFT_MARGIN + index * EVENT_COLUMN_WIDTH;
  const lineY = (index: number) => TOP_MARGIN + index * LINE_ROW_HEIGHT;
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
      style: {
        width: 90,
        textAlign: "center",
        background: "transparent",
        border: "none",
        fontWeight: 600,
        fontSize: 12,
      },
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

    nodes.push({
      id: `line-label-${line.id}`,
      type: "default",
      position: { x: 0, y: y - 16 },
      data: { label: line.label },
      draggable: false,
      selectable: false,
      style: {
        width: LEFT_MARGIN - 24,
        background: "transparent",
        border: "none",
        fontWeight: 600,
        fontSize: 13,
        color: line.color_hint,
        textAlign: "right",
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
      style: { stroke: line.color_hint, strokeWidth: 6 },
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

    nodes.push({
      id: `station-${cdrlNode.id}`,
      type: "default",
      position: { x: eventX(fractionalIndex) - 14, y: lineY(lineIndex) - 14 },
      data: { label: cdrlNode.id },
      draggable: false,
      selectable: false,
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#fff",
        border: `3px solid ${line.color_hint}`,
        fontSize: 9,
        fontWeight: 600,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "10px",
        textAlign: "center",
      },
    });
  });

  return { nodes, edges };
}
