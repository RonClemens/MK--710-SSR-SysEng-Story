import { useMemo } from "react";
import type { CdrlPathDecompositionLevel, CdrlPathModel } from "../types/cdrlPath";
import { buildCdrlMaturityMatrix } from "../utils/cdrlPathMatrix";
import { relatedIdsForNode } from "../utils/cdrlPathRelated";

interface Props {
  model: CdrlPathModel;
  decompositionLevel: CdrlPathDecompositionLevel;
  onSelect: (target: { title: string; relatedNodeIds: string[] }) => void;
}

const STATE_LETTER: Record<string, string> = { DRAFT: "D", FINAL: "F", UPDATE: "U", AS_NEEDED: "A" };

/** Primary CDRL Path view: discipline swimlanes × SETR-event columns, per the Subway Design
 * chat's 2026-08-14 research recommendation ("adopt a discipline-swimlane × SETR-event
 * maturity matrix as your primary broad-audience view"). Maturity state is double-encoded
 * (a D/F/U letter plus a distinct border style — solid/dashed/dotted) rather than by color
 * alone, per the same research's accessibility guidance; color in this view identifies the
 * owning domain (matching its row and the subway map's line color), not the state. */
export function CdrlPathMatrixView({ model, decompositionLevel, onSelect }: Props) {
  const matrix = useMemo(() => buildCdrlMaturityMatrix(model, decompositionLevel), [model, decompositionLevel]);
  const nodeById = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
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

  const anyOmitted = matrix.domainIds.some((id) => matrix.omitted[id].length > 0);

  return (
    <div className="cdrl-matrix">
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
                {matrix.eventIds.map((eventId) => (
                  <td key={eventId} className="cdrl-matrix-cell">
                    {matrix.cells[line.id][eventId].map((entry, i) => (
                      <button
                        key={`${entry.nodeId}-${entry.state}-${i}`}
                        type="button"
                        className={`cdrl-matrix-chip cdrl-matrix-chip-${entry.state.toLowerCase()}`}
                        style={{ borderColor: line.color_hint, color: line.color_hint }}
                        title={`${entry.title}${entry.did ? ` — ${entry.did}` : ""} (${entry.state})`}
                        onClick={() => handleChipClick(entry.nodeId)}
                      >
                        <span className="cdrl-matrix-chip-code">{entry.nodeId}</span>
                        <span className="cdrl-matrix-chip-state" aria-hidden="true">
                          {STATE_LETTER[entry.state] ?? entry.state[0]}
                        </span>
                      </button>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        <span className="hint cdrl-matrix-legend-note">Chip color identifies the owning discipline (see row labels), not the maturity state.</span>
      </div>

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
