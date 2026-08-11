// Shape of cdrl-did-data-model.json actually consumed so far. Widened phase by phase
// (Phase 1: lines/SETR events/context markers; Phase 2 adds full-station maturity
// rendering, RACI, relationships, decomposition level, and the station detail panel)
// rather than modeled up front, so this type doesn't drift ahead of what's rendered.
// See docs/cdrl-path/DECISIONS.md #5 for the planned move of the underlying JSON to a
// typed .ts module in /methodology/guidance once content confirmation is farther along,
// which is when this file's role changes from "narrow view" to "source".

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
  note?: string;
  recurring?: boolean;
}

// Matches decomposition_dimension.levels[].id in the data model.
export type CdrlPathDecompositionLevel =
  | "SYSTEM"
  | "ELEMENT_SUBSYSTEM"
  | "CONFIGURATION_ITEM"
  | "COMPONENT"
  | "UNIT";

export interface CdrlPathDecompositionLevelDef {
  id: CdrlPathDecompositionLevel;
  hw_term: string;
  sw_term: string;
  notes?: string;
}

export interface CdrlPathRaci {
  responsible: string | null;
  accountable: string | null;
  consulted: string[];
  informed: string[];
}

export interface CdrlPathSupersedes {
  did: string;
  title: string;
  status: string;
}

export interface CdrlPathNode {
  id: string;
  did?: string;
  title: string;
  // Which line(s)/domains this CDRL participates in — domains[0] is the "primary" line for
  // positioning (its own maturity timeline renders there); any additional domains render as
  // a true subway interchange (small presence markers + connector stubs on those lines).
  // Migrated 2026-08-11 from a single `line: string` field — see DECISIONS.md #7. The
  // migration was structure-only (each node's domains array still holds just its one prior
  // line value); which CDRLs actually span multiple domains is unconfirmed content for a
  // future pass, not something this app invents.
  domains: string[];
  drafted_at?: string;
  baselined_at?: string;
  notes?: string;
  render_style?: CdrlPathRenderStyle;
  maturity_states?: CdrlPathMaturityState[];
  // RVTM-style multi-level maturity, keyed by CdrlPathDecompositionLevel. When present,
  // takes precedence over maturity_states for whichever level is currently selected.
  maturity_states_by_level?: Partial<Record<CdrlPathDecompositionLevel, CdrlPathMaturityState[]>>;
  decomposition_level?: CdrlPathDecompositionLevel | CdrlPathDecompositionLevel[];
  influences?: string[];
  influenced_by?: string[];
  raci?: CdrlPathRaci;
  supersedes?: CdrlPathSupersedes[];
  confirmed_via_did_interview?: boolean;
}

export interface CdrlPathCmBaseline {
  id: string;
  established_at: string;
  controls: string;
}

export interface CdrlPathSupersededDid {
  cancelled_did: string;
  cancelled_title: string;
  cancelled_by_authority: string;
  status: string;
  superseded_by_did: string;
  superseded_by_node_id: string;
  superseded_by_title: string;
  source: string;
  notes?: string;
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
  decomposition_dimension: {
    levels: CdrlPathDecompositionLevelDef[];
  };
  superseded_dids?: CdrlPathSupersededDid[];
  // Derived FROM node maturity data, never hand-edited — see confirmed_patterns
  // .station_summary_generation in the JSON itself. validateModel() regenerates this and
  // flags drift rather than trusting the stored copy.
  station_summary_by_setr_event?: Record<string, string[]>;
}
