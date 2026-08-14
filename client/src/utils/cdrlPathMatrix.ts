import type { CdrlPathDecompositionLevel, CdrlPathModel } from "../types/cdrlPath";
import { maturityStatesForLevel } from "./cdrlPathMaturityMarkers";

// Primary-view data shaping for the discipline × SETR-event maturity matrix — per the Subway
// Design chat's research (2026-08-14): "adopt a discipline-swimlane × SETR-event maturity
// matrix as your primary broad-audience view... [it] maps directly onto the SETR process." See
// docs/cdrl-path/DECISIONS.md for the round this landed in.
//
// Deliberately reuses the same "precise text index, not a best-effort visual placement"
// philosophy generateStationSummaryBySetrEvent (cdrlPathValidation.ts) already established for
// this exact question ("what's due, exactly, at this event") — a recurring UPDATE tied to a
// RANGE phrase ("every SETR through PRR") is real, ongoing cadence, not a single due date, and
// forcing it into one column (or every column in the range) would misrepresent it as either a
// one-time event or clutter the grid with copies of the same chip. It's surfaced instead in
// `omitted`, one list per domain, so nothing silently disappears from the primary reference —
// the subway map (now the secondary view) is still where that cadence renders as a halo marker.

export interface CdrlMatrixCellEntry {
  nodeId: string;
  title: string;
  did?: string;
  state: string;
}

export interface CdrlMatrixOmittedEntry {
  nodeId: string;
  title: string;
  state: string;
  atEvent: string;
}

export interface CdrlMaturityMatrix {
  domainIds: string[];
  eventIds: string[];
  /** [domainId][eventId] -> entries due at that event for that domain, in model.nodes order. */
  cells: Record<string, Record<string, CdrlMatrixCellEntry[]>>;
  /** [domainId] -> maturity states that don't tie to exactly one SETR event (recurring ranges,
   * milestone/contract-day markers, unresolvable phrases) — real data, just not grid-shaped. */
  omitted: Record<string, CdrlMatrixOmittedEntry[]>;
}

export function buildCdrlMaturityMatrix(model: CdrlPathModel, decompositionLevel: CdrlPathDecompositionLevel): CdrlMaturityMatrix {
  const eventIds = model.lifecycle_lanes.setr_events.map((e) => e.id);
  const validEventIds = new Set(eventIds);
  const domainIds = model.lines.map((l) => l.id);

  const cells: Record<string, Record<string, CdrlMatrixCellEntry[]>> = {};
  const omitted: Record<string, CdrlMatrixOmittedEntry[]> = {};
  domainIds.forEach((domainId) => {
    cells[domainId] = {};
    eventIds.forEach((eventId) => (cells[domainId][eventId] = []));
    omitted[domainId] = [];
  });

  model.nodes.forEach((node) => {
    const states = maturityStatesForLevel(node, decompositionLevel);
    states.forEach((state) => {
      const atEvent = state.at_event.trim();
      const isExactSingleEvent = validEventIds.has(atEvent);
      node.domains.forEach((domainId) => {
        if (!cells[domainId]) return; // unknown domain — already surfaced by validateModel()
        if (!isExactSingleEvent) {
          omitted[domainId].push({ nodeId: node.id, title: node.title, state: state.state, atEvent: state.at_event });
          return;
        }
        cells[domainId][atEvent].push({ nodeId: node.id, title: node.title, did: node.did, state: state.state.toUpperCase() });
      });
    });
  });

  return { domainIds, eventIds, cells, omitted };
}
