import { useMemo, useState } from "react";
import type { CdrlPathDecompositionLevel, CdrlPathModel, CdrlPathWorkflowOverlay } from "../types/cdrlPath";
import { buildCdrlMaturityMatrix } from "../utils/cdrlPathMatrix";
import { relatedIdsForNode } from "../utils/cdrlPathRelated";
import { computeReadiness, readinessReasonText } from "../utils/cdrlPathReadiness";

interface Props {
  model: CdrlPathModel;
  decompositionLevel: CdrlPathDecompositionLevel;
  workflowOverlay: CdrlPathWorkflowOverlay;
  onSelect: (target: { title: string; relatedNodeIds: string[] }) => void;
}

type DensityMode = "detail" | "heatmap";

const STATE_LETTER: Record<string, string> = { DRAFT: "D", FINAL: "F", UPDATE: "U", AS_NEEDED: "A" };

/** Sequential bucket for a cell's DISTINCT CDRL count (not state-entry count — a CDRL due
 * twice at the same event, e.g. both DRAFT and FINAL, is one workload item, not two) — per
 * the research's Stage 2 heat-map recommendation ("cell color = count... for executives to
 * spot workload hot-spots and coverage gaps"). Capped at 5 buckets, well under the ~7-color
 * accessibility ceiling the same research calls for. */
function heatBucket(count: number): string {
  if (count === 0) return "0";
  if (count === 1) return "1";
  if (count === 2) return "2";
  if (count === 3) return "3";
  return "4plus";
}

/** Primary CDRL Path view: discipline swimlanes × SETR-event columns, per the Subway Design
 * chat's 2026-08-14 research recommendation ("adopt a discipline-swimlane × SETR-event
 * maturity matrix as your primary broad-audience view"). Maturity state is double-encoded
 * (a D/F/U letter plus a distinct border style — solid/dashed/dotted) rather than by color
 * alone, per the same research's accessibility guidance; color in this view identifies the
 * owning domain (matching its row and the subway map's line color), not the state. */
export function CdrlPathMatrixView({ model, decompositionLevel, workflowOverlay, onSelect }: Props) {
  const [density, setDensity] = useState<DensityMode>("detail");
  const matrix = useMemo(() => buildCdrlMaturityMatrix(model, decompositionLevel), [model, decompositionLevel]);
  const nodeById = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
  // Per-node readiness, computed once per render rather than per chip — a node can appear as
  // multiple chips (once per due maturity state) but its readiness is a property of the node,
  // not the individual state entry. Two of the five states get a visual treatment: BLOCKED
  // (muted/locked — nothing to build on yet) and READY_VOLATILE (a caution flag — building on
  // this now is allowed but risks rework, per the design chat's steer that this is "probably the
  // single most valuable signal this whole readiness layer can surface"). READY_STABLE,
  // IN_PROGRESS, and COMPLETE don't change how a chip looks, to keep the primary Detail view's
  // existing D/F/U-and-discipline-color encoding from getting more crowded than it needs to.
  const readinessByNodeId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeReadiness>>();
    model.nodes.forEach((n) => map.set(n.id, computeReadiness(n, model, workflowOverlay)));
    return map;
  }, [model, workflowOverlay]);
  const baselineByEvent = useMemo(() => {
    const map = new Map<string, string[]>();
    model.lifecycle_lanes.cm_baselines.forEach((b) => {
      const list = map.get(b.established_at) ?? [];
      list.push(b.id);
      map.set(b.established_at, list);
    });
    return map;
  }, [model]);

  function handleChipClick(nodeId: string) {
    const node = nodeById.get(nodeId);
    if (!node) return;
    onSelect({ title: node.title, relatedNodeIds: relatedIdsForNode(node) });
  }

  function handleHeatCellClick(line: (typeof model.lines)[number], eventId: string, nodeIds: string[]) {
    if (nodeIds.length === 0) return;
    onSelect({ title: `${line.label} @ ${eventId}`, relatedNodeIds: nodeIds });
  }

  const anyOmitted = matrix.domainIds.some((id) => matrix.omitted[id].length > 0);

  return (
    <div className="cdrl-matrix">
      <div className="cdrl-badge-row" role="group" aria-label="Matrix density">
        <button
          type="button"
          className={`cdrl-status-pill${density === "detail" ? " selected" : ""}`}
          onClick={() => setDensity("detail")}
        >
          Detail
        </button>
        <button
          type="button"
          className={`cdrl-status-pill${density === "heatmap" ? " selected" : ""}`}
          onClick={() => setDensity("heatmap")}
          title="Cell shade + count = how many CDRLs are due at that discipline/event intersection — spot workload hot-spots at a glance."
        >
          Heat Map
        </button>
      </div>

      <div className="cdrl-matrix-scroll">
        <table className="cdrl-matrix-table">
          <thead>
            <tr>
              <th className="cdrl-matrix-corner" scope="col" />
              {model.lifecycle_lanes.setr_events.map((event) => (
                <th key={event.id} scope="col" title={event.notes}>
                  <div className="cdrl-matrix-event-id">{event.id}</div>
                  <div className="cdrl-matrix-event-phase">{event.phase}</div>
                  {(baselineByEvent.get(event.id) ?? []).map((baselineId) => (
                    <div key={baselineId} className="cdrl-matrix-baseline-badge" title={`${baselineId} baseline established here`}>
                      {baselineId}
                    </div>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.lines.map((line) => (
              <tr key={line.id}>
                <th scope="row" className="cdrl-matrix-row-label" style={{ borderLeftColor: line.color_hint }}>
                  {line.label}
                </th>
                {matrix.eventIds.map((eventId) => {
                  const cellEntries = matrix.cells[line.id][eventId];
                  if (density === "heatmap") {
                    const nodeIds = Array.from(new Set(cellEntries.map((e) => e.nodeId)));
                    const bucket = heatBucket(nodeIds.length);
                    return (
                      <td
                        key={eventId}
                        className={`cdrl-matrix-cell cdrl-matrix-heat cdrl-matrix-heat-${bucket}`}
                        onClick={() => handleHeatCellClick(line, eventId, nodeIds)}
                        role={nodeIds.length > 0 ? "button" : undefined}
                        tabIndex={nodeIds.length > 0 ? 0 : undefined}
                        title={nodeIds.length > 0 ? `${nodeIds.length} CDRL${nodeIds.length === 1 ? "" : "s"} due — click to list` : "Nothing due"}
                      >
                        {nodeIds.length > 0 && <span className="cdrl-matrix-heat-count">{nodeIds.length}</span>}
                      </td>
                    );
                  }
                  return (
                    <td key={eventId} className="cdrl-matrix-cell">
                      {cellEntries.map((entry, i) => {
                        const node = nodeById.get(entry.nodeId);
                        const readiness = readinessByNodeId.get(entry.nodeId);
                        const isBlocked = readiness === "BLOCKED";
                        const isVolatile = readiness === "READY_VOLATILE";
                        const reason = node ? readinessReasonText(node, model, workflowOverlay) : null;
                        return (
                          <button
                            key={`${entry.nodeId}-${entry.state}-${i}`}
                            type="button"
                            className={`cdrl-matrix-chip cdrl-matrix-chip-${entry.state.toLowerCase()}${isBlocked ? " cdrl-matrix-chip-blocked" : ""}${isVolatile ? " cdrl-matrix-chip-volatile" : ""}`}
                            style={{ borderColor: line.color_hint, color: line.color_hint }}
                            title={`${entry.title}${entry.did ? ` — ${entry.did}` : ""} (${entry.state})${reason ? ` — ${reason}` : ""}`}
                            onClick={() => handleChipClick(entry.nodeId)}
                          >
                            {isBlocked && <span className="cdrl-matrix-chip-lock" aria-hidden="true">🔒</span>}
                            {isVolatile && <span className="cdrl-matrix-chip-caution" aria-hidden="true">⚠️</span>}
                            <span className="cdrl-matrix-chip-code">{entry.nodeId}</span>
                            <span className="cdrl-matrix-chip-state" aria-hidden="true">
                              {STATE_LETTER[entry.state] ?? entry.state[0]}
                            </span>
                          </button>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {density === "detail" ? (
        <div className="cdrl-matrix-legend">
          <span className="cdrl-matrix-legend-title">Maturity:</span>
          <span className="cdrl-matrix-chip cdrl-matrix-chip-draft cdrl-matrix-legend-chip">
            <span className="cdrl-matrix-chip-state" aria-hidden="true">D</span> Draft
          </span>
          <span className="cdrl-matrix-chip cdrl-matrix-chip-final cdrl-matrix-legend-chip">
            <span className="cdrl-matrix-chip-state" aria-hidden="true">F</span> Final
          </span>
          <span className="cdrl-matrix-chip cdrl-matrix-chip-update cdrl-matrix-legend-chip">
            <span className="cdrl-matrix-chip-state" aria-hidden="true">U</span> Update
          </span>
          <span className="hint cdrl-matrix-legend-note">
            Chip color identifies the owning discipline (see row labels), not the maturity state. 🔒 = blocked — a derived_from parent
            hasn't started at all yet. ⚠️ = ready, but volatile — every parent has started, but at least one hasn't reached its
            required maturity, so building on it now risks rework (click the chip for detail).
          </span>
        </div>
      ) : (
        <div className="cdrl-matrix-legend">
          <span className="cdrl-matrix-legend-title">CDRLs due:</span>
          {["0", "1", "2", "3", "4plus"].map((bucket) => (
            <span key={bucket} className={`cdrl-matrix-heat-swatch cdrl-matrix-heat-${bucket}`}>
              {bucket === "4plus" ? "4+" : bucket}
            </span>
          ))}
          <span className="hint cdrl-matrix-legend-note">Shade and the number both encode the same count — click a cell to list its CDRLs.</span>
        </div>
      )}

      {anyOmitted && (
        <div className="cdrl-matrix-omitted">
          <h4>Not tied to a single SETR event</h4>
          <p className="hint">
            Recurring cadences ("every SETR through PRR"), milestone/contract-day markers, and other non-exact timing — shown on
            the subway map's line timelines, not placed in a column here to avoid implying a one-time due date.
          </p>
          {model.lines.map((line) =>
            matrix.omitted[line.id].length > 0 ? (
              <div key={line.id} className="cdrl-matrix-omitted-domain">
                <strong style={{ color: line.color_hint }}>{line.label}:</strong>{" "}
                {matrix.omitted[line.id].map((entry, i) => (
                  <span key={`${entry.nodeId}-${i}`}>
                    {i > 0 && ", "}
                    <button type="button" className="link-button" onClick={() => handleChipClick(entry.nodeId)}>
                      {entry.nodeId} ({entry.state.toLowerCase()}, {entry.atEvent})
                    </button>
                  </span>
                ))}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
