import { BaseEdge, type EdgeProps } from "@xyflow/react";

// A domain's bent track is one continuous multi-point polyline (see cdrlPathLayout.ts's
// solveDomainTrackAngles), not a sequence of separate edges between tiny anchor nodes — React
// Flow's built-in edge types only connect two nodes each via floating/boundary-intersection
// geometry, which shrinks every segment slightly at both ends. Chaining many such short
// segments compounded that shrinkage into a visible gap at every ring joint. Drawing the whole
// path as a single custom SVG `<path>` from an explicit point list sidesteps the node-boundary
// math entirely, so the line renders exactly where computed with no seams.
export interface CdrlPathTrackEdgeData extends Record<string, unknown> {
  points: { x: number; y: number }[];
}

export function CdrlPathTrackEdge({ data, style, markerEnd }: EdgeProps) {
  const points = (data as CdrlPathTrackEdgeData | undefined)?.points ?? [];
  if (points.length < 2) return null;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  return <BaseEdge path={d} style={style} markerEnd={markerEnd} />;
}
