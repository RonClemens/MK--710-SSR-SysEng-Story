// Minimal shape of cdrl-did-data-model.json actually consumed so far (Phase 1: static
// Level 1 render — lines, SETR events, and context_marker "interchange station" nodes).
// The JSON carries many more fields (RACI, influences/influenced_by, decomposition_level,
// maturity_states_by_level, etc.) for later phases — deliberately not modeled here yet so
// this type doesn't drift ahead of what's actually rendered. Widen it phase by phase
// rather than up front. See docs/cdrl-path/DECISIONS.md #5 for the planned move of the
// underlying JSON to a typed .ts module in /methodology/guidance once content confirmation
// is farther along, which is when this file's role changes from "narrow view" to "source".

export interface CdrlPathSetrEvent {
  id: string;
  name: string;
  phase: string;
  notes?: string;
}

export interface CdrlPathLine {
  id: string;
  label: string;
  color_hint: string;
  description: string;
}

export type CdrlPathRenderStyle = "full_station" | "context_marker";

export interface CdrlPathMaturityState {
  state: string;
  at_event: string;
}

export interface CdrlPathNode {
  id: string;
  title: string;
  line: string;
  drafted_at?: string;
  baselined_at?: string;
  render_style?: CdrlPathRenderStyle;
  maturity_states?: CdrlPathMaturityState[];
}

export interface CdrlPathCmBaseline {
  id: string;
  established_at: string;
  controls: string;
}

export interface CdrlPathModel {
  purpose_statement: string;
  lifecycle_lanes: {
    phases: string[];
    setr_events: CdrlPathSetrEvent[];
    cm_baselines: CdrlPathCmBaseline[];
  };
  lines: CdrlPathLine[];
  nodes: CdrlPathNode[];
}
