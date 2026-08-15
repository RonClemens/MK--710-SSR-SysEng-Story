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
// Deliberately tells one coherent story rather than being random, two tiers deep so the
// three-way parent gate (see the 2026-08-15 revision in cdrlPathReadiness.ts) has real variety
// to show, not just a root and its immediate children: SEP is APPROVED/done (COMPLETE). SSS,
// IRS, and SRS are each mid-cycle (WORKING/UNDER_REVIEW) — real artifacts that exist but haven't
// reached the required maturity, so THEIR children read READY_VOLATILE: allowed to start, but
// flagged as churn risk, exactly the case this feature exists to surface. SEMP is IN_PROGRESS
// off SEP (already stable). Nodes two tiers below SSS (ICD/SSDD's own children, e.g. IDD, SDD)
// still read BLOCKED — their direct parents haven't started yet either, which is a real and
// correct signal, not an artifact of sparse demo data: readiness only ever reports on the
// parents actually recorded here. RPP/SSPP (untouched roots) show READY_STABLE. CDD isn't
// listed at all — it has no maturity data of its own (see highestRequiredMaturityIndex), so it
// reads as COMPLETE/always-available without needing an entry.
export const CDRL_PATH_DEMO_WORKFLOW_OVERLAY: CdrlPathWorkflowOverlay = {
  SEP: { current_maturity_target: "FINAL", workflow_state: "APPROVED" },
  SEMP: { current_maturity_target: "FINAL", workflow_state: "WORKING" },
  SSS: { current_maturity_target: "DRAFT", workflow_state: "UNDER_REVIEW" },
  IRS: { current_maturity_target: "DRAFT", workflow_state: "UNDER_REVIEW" },
  SRS: { current_maturity_target: "DRAFT", workflow_state: "WORKING" },
};
