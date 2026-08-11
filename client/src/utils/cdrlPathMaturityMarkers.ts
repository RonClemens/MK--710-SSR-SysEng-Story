import type { CdrlPathMaturityState, CdrlPathNode, CdrlPathSetrEvent } from "../types/cdrlPath";
import { resolveMarkerEventIndex } from "./cdrlPathLayout";

// Level 2 (line expansion) renders a node's full maturity_states timeline, per the
// recommended_chart_rendering guidance in cdrl-did-data-model.json's maturity_state_legend:
// DRAFT = hollow, FINAL = filled (bigger if it establishes a CM baseline), UPDATE = filled
// with a halo, AS_NEEDED = diamond. Recurring states ("every SETR through PRR", "every
// subsequent SETR event") should render one marker per matching event, not a single point.

export interface CdrlPathMarkerPoint {
  state: CdrlPathMaturityState;
  eventIndex: number;
}

export interface MarkerVisualStyle {
  shape: "circle" | "diamond";
  hollow: boolean;
  halo: boolean;
  large: boolean;
}

export function getMaturityMarkerStyle(state: CdrlPathMaturityState): MarkerVisualStyle {
  switch (state.state.toUpperCase()) {
    case "AS_NEEDED":
      return { shape: "diamond", hollow: false, halo: false, large: false };
    case "DRAFT":
      return { shape: "circle", hollow: true, halo: false, large: false };
    case "FINAL":
      return { shape: "circle", hollow: false, halo: false, large: Boolean(state.note && /baseline/i.test(state.note)) };
    case "UPDATE":
      return { shape: "circle", hollow: false, halo: true, large: false };
    default:
      return { shape: "circle", hollow: false, halo: false, large: false };
  }
}

/** Resolves the node's own DRAFT/FINAL maturity point, used as the start of an UPDATE range
 * and as a better fallback position than "leftmost column" for otherwise-unresolvable markers. */
function anchorEventIndex(node: CdrlPathNode, setrEvents: CdrlPathSetrEvent[]): number {
  const finalState = node.maturity_states?.find((s) => s.state.toUpperCase() === "FINAL");
  const draftState = node.maturity_states?.find((s) => s.state.toUpperCase() === "DRAFT");
  const anchor = finalState ?? draftState;
  if (anchor) return Math.round(resolveMarkerEventIndex(anchor.at_event, setrEvents));
  const fallbackMarker = node.baselined_at ?? node.drafted_at;
  return fallbackMarker ? Math.round(resolveMarkerEventIndex(fallbackMarker, setrEvents)) : 0;
}

function integerRange(start: number, end: number): number[] {
  if (end < start) return [end];
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

/**
 * Expands one maturity_states entry into one or more marker points. Handles the two
 * common recurring phrasings found throughout the data model generically (by regex, not
 * per-node-id) — "every SETR through <EVENT>" and "every subsequent SETR event" — and
 * falls back to a single best-effort point for anything else (e.g. the WSESRB/SSSTRP
 * board-cadence phrasing on SSPP, or the ECP-lockstep phrasing on LORA/CMRS), logging via
 * resolveMarkerEventIndex's own warning when even that can't find a confident match.
 */
export function expandMaturityStateToMarkers(
  node: CdrlPathNode,
  state: CdrlPathMaturityState,
  setrEvents: CdrlPathSetrEvent[],
): CdrlPathMarkerPoint[] {
  const throughMatch = /through\s+([A-Za-z0-9_]+)/i.exec(state.at_event);
  if (state.recurring && throughMatch) {
    const endIndex = setrEvents.findIndex((e) => e.id.toLowerCase() === throughMatch[1].toLowerCase());
    if (endIndex !== -1) {
      const startIndex = Math.min(anchorEventIndex(node, setrEvents) + 1, endIndex);
      return integerRange(startIndex, endIndex).map((eventIndex) => ({ state, eventIndex }));
    }
  }

  if (state.recurring && /every (subsequent )?SETR event/i.test(state.at_event)) {
    const startIndex = Math.min(anchorEventIndex(node, setrEvents) + 1, setrEvents.length - 1);
    return integerRange(startIndex, setrEvents.length - 1).map((eventIndex) => ({ state, eventIndex }));
  }

  const resolved = resolveMarkerEventIndex(state.at_event, setrEvents);
  const noConfidentMatch = resolved === 0 && !/\basr\b/i.test(state.at_event);
  const eventIndex = noConfidentMatch ? anchorEventIndex(node, setrEvents) : resolved;
  return [{ state, eventIndex }];
}

/** All marker points for a node at a given decomposition level — from maturity_states_by_level
 * when the node defines it (e.g. RVTM), otherwise the flat maturity_states array. Returns an
 * empty array when the node doesn't apply at the requested level (e.g. RVTM at COMPONENT). */
export function maturityStatesForLevel(node: CdrlPathNode, level: string): CdrlPathMaturityState[] {
  if (node.maturity_states_by_level) {
    return node.maturity_states_by_level[level as keyof typeof node.maturity_states_by_level] ?? [];
  }
  const nodeLevels = Array.isArray(node.decomposition_level)
    ? node.decomposition_level
    : node.decomposition_level
      ? [node.decomposition_level]
      : ["SYSTEM"]; // undeclared decomposition_level defaults to SYSTEM, per the data model's own framing
  return nodeLevels.includes(level as never) ? (node.maturity_states ?? []) : [];
}
