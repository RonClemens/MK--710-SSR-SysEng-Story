import type { CdrlPathWorkflowOverlay } from "../types/cdrlPath";

// Illustrative-only stand-in for the real per-baseline workflow overlay — per the design
// chat's own scoping, workflow_state lives in program-status-{baseline_id}.json, NOT the
// shared reference model, and that overlay's persistence (server-backed useEntity, per
// cdrl-path-project-brief.md's Persistence row) is still a documented future phase, same
// status as the "Live program status... not yet wired up" note already in the station detail
// panel. Until that exists, this hardcoded sample gives cdrlPathReadiness.ts something real to
// compute against — same "Illustrative/demo data only" category as the rest of this reference
// model, not a stand-in for actual program tracking.
//
// Deliberately tells one coherent story rather than being random: SSS (the top of the
// requirements chain) is still under review, so most of the graph sits BLOCKED behind it —
// exactly the cascading-dependency case this feature exists to surface. SEP is APPROVED/done
// (COMPLETE), SEMP has started (IN_PROGRESS) since its only parent (SEP) already cleared the
// DRAFT gate, and the two other untouched roots (RPP, SSPP) show READY. CDD isn't listed here
// at all — it has no maturity data of its own (see highestRequiredMaturityIndex), so it reads
// as COMPLETE/always-available without needing an entry.
export const CDRL_PATH_DEMO_WORKFLOW_OVERLAY: CdrlPathWorkflowOverlay = {
  SEP: { current_maturity_target: "FINAL", workflow_state: "APPROVED" },
  SEMP: { current_maturity_target: "FINAL", workflow_state: "WORKING" },
  SSS: { current_maturity_target: "DRAFT", workflow_state: "UNDER_REVIEW" },
};
