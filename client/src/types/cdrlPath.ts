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

// Shared maturity vocabulary — matches CdrlPathMaturityState.state's actual values in the data
// (see confirmed_patterns in the JSON). Ordered DRAFT < FINAL < UPDATE for readiness comparisons.
export type CdrlPathMaturityLevel = "DRAFT" | "FINAL" | "UPDATE";

// A derived_from parent edge — restructured 2026-08-15 (see DECISIONS.md and
// confirmed_patterns.readiness_gate_default_pattern) from a plain parent-id string to this
// object, so how early a child can start is configurable per relationship rather than one
// global rule. min_parent_maturity_to_start is the gate cdrlPathReadiness.ts reads: the parent
// must have achieved at least this maturity level before the child counts as unblocked.
export interface CdrlPathDerivedFromEdge {
  parent: string;
  min_parent_maturity_to_start: CdrlPathMaturityLevel;
}

// The dynamic counterpart to RACI (static, one set per CDRL) — whose turn it is right now.
// Lives in the per-baseline status overlay (program-status-{baseline_id}.json), never in the
// reference model — see cdrlPathReadiness.ts for the computed BLOCKED/READY/IN_PROGRESS/COMPLETE
// state this drives. Persistence for that overlay is still a documented future phase (see
// cdrl-path-project-brief.md's Persistence row); until it exists, the app sources this from a
// small illustrative client-side dataset (cdrlPathDemoWorkflowOverlay.ts), the same "Illustrative
// demo data only" category as the rest of this reference model.
export type CdrlPathWorkflowStage = "WORKING" | "UNDER_REVIEW" | "APPROVED" | "NOTIFIED";

export interface CdrlPathWorkflowStatus {
  current_maturity_target: CdrlPathMaturityLevel;
  workflow_state: CdrlPathWorkflowStage;
}

// nodeId -> status. A missing entry means the node hasn't started work yet (not an error).
export type CdrlPathWorkflowOverlay = Record<string, CdrlPathWorkflowStatus>;

// READY split into READY_VOLATILE/READY_STABLE 2026-08-15 (see DECISIONS.md) at the design
// chat's steer: collapsing "parent has anything" and "parent is stable" into one READY state
// hid the exact churn-risk signal (starting downstream work off an unreleased parent artifact)
// this tool exists to surface. BLOCKED still means a parent hasn't started at all.
export type CdrlPathReadiness = "BLOCKED" | "READY_VOLATILE" | "READY_STABLE" | "IN_PROGRESS" | "COMPLETE";

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
  // Distinct from `notes` — added 2026-08-15 per the design chat's content-review finding that
  // `notes` (internal model-curation history: "added node," "was mislabeled," commentary
  // referencing Ron/earlier drafts) was leaking into exported guides with no context an external
  // reader would have. This field is the vetted subset safe to show team-facing: undefined until
  // a hand-curation pass populates it — cdrlPathGuideGenerator.ts reads only from this field for
  // its Special Considerations section, never from `notes`, and simply omits the line when empty
  // rather than falling back to `notes` or inventing a substitute.
  team_facing_note?: string;
  render_style?: CdrlPathRenderStyle;
  maturity_states?: CdrlPathMaturityState[];
  // RVTM-style multi-level maturity, keyed by CdrlPathDecompositionLevel. When present,
  // takes precedence over maturity_states for whichever level is currently selected.
  maturity_states_by_level?: Partial<Record<CdrlPathDecompositionLevel, CdrlPathMaturityState[]>>;
  decomposition_level?: CdrlPathDecompositionLevel | CdrlPathDecompositionLevel[];
  influences?: string[];
  influenced_by?: string[];
  // Developmental/flow-down lineage — added 2026-08-14 (see DECISIONS.md), a NEW relationship
  // distinct from influences/influenced_by: strictly directional (this node's content is
  // structurally built from / decomposed from each listed parent's), following the SE
  // Vee-model requirements→design→implementation→test chain. A curated subset of
  // influenced_by (see confirmed_patterns.developmental_flow_down_pattern for what was
  // excluded and why) — every node lists its own parent(s); an empty array means it's a root
  // of the derivation graph (e.g. CDD, SSPP), not that it wasn't assessed. Restructured
  // 2026-08-15 from string[] to CdrlPathDerivedFromEdge[] (see that type's doc comment) to
  // carry a per-edge readiness gate.
  derived_from?: CdrlPathDerivedFromEdge[];
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
  // Authored, domain-level prose the guide generator can't derive from CDRL data — "what does
  // this discipline contribute," in two audiences (technical role-framing vs. a broad/customer
  // one-liner). Added 2026-08-15, authored by the Subway Design chat and approved by Ron as-is
  // (see DECISIONS.md) — the same "placeholder now, decide authorship later" content
  // `cdrlPathGuideGenerator.ts` had been rendering for both sections until this landed. Optional
  // because older/imported models won't have it yet — the generator falls back to its own
  // placeholder text when a domain id is missing here, same as before this field existed.
  domain_content?: {
    role_framing_paragraphs: Record<string, string>;
    contribution_blurbs: Record<string, string>;
  };
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
