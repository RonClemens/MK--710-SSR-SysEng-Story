import type {
  CdrlPathMaturityLevel,
  CdrlPathModel,
  CdrlPathNode,
  CdrlPathReadiness,
  CdrlPathWorkflowOverlay,
  CdrlPathWorkflowStatus,
} from "../types/cdrlPath";

// The dynamic counterpart to the matrix/subway views' static data — per the Subway Design
// chat's 2026-08-15 request: RACI says who's responsible for a CDRL, but nothing until now
// answered "can this CDRL actually start, given where its derived_from parents currently
// stand?" This module answers that as a pure function computed at render time from the
// reference model + a per-baseline workflow overlay — never a stored field, same principle
// generateStationSummaryBySetrEvent already established (a derivable value that's hand-set
// will drift; only the inputs it's derived from should be persisted).
//
// Revised same day per the design chat's follow-up: requiring full APPROVED/NOTIFIED before a
// parent unblocks its children at all was over-strict (it applied FINAL-baseline rigor to what
// a DRAFT gate is supposed to mean) AND, once loosened, under-informative on its own — a parent
// that's merely WORKING/UNDER_REVIEW is a real, well-known program risk (building off a document
// that's still churning in a PLM system), not a detail to collapse into a plain "go" signal. So
// parent standing is now three-way, not two: BLOCKED (no artifact yet) / READY_VOLATILE
// (artifact exists, not yet at the required maturity — proceed, but it can still change under
// you) / READY_STABLE (parent reached the required maturity — low churn risk).

const MATURITY_ORDER: Record<CdrlPathMaturityLevel, number> = { DRAFT: 0, FINAL: 1, UPDATE: 2 };

/** How far a node has actually gotten, as a maturity-order index. -1 means "hasn't achieved
 * anything yet" (no overlay entry, or still WORKING/UNDER_REVIEW toward its current target —
 * that target isn't achieved until APPROVED signs off, per the design chat's stage definitions:
 * "APPROVED... is what advances current_maturity_target to the next level"). APPROVED/NOTIFIED
 * both count the current target as achieved — NOTIFIED is just the post-approval "I's informed"
 * step before the cycle resets to the next target. */
function achievedMaturityIndex(status: CdrlPathWorkflowStatus | undefined): number {
  if (!status) return -1;
  const targetIndex = MATURITY_ORDER[status.current_maturity_target];
  return status.workflow_state === "APPROVED" || status.workflow_state === "NOTIFIED" ? targetIndex : targetIndex - 1;
}

/** The highest NON-recurring maturity level this node's own schedule requires (across flat
 * maturity_states or every level of maturity_states_by_level) — recurring UPDATE cadences
 * ("every SETR through PRR") are ongoing post-baseline maintenance, not a one-time completion
 * gate, so they're excluded; every node with maturity data in the current model has at least
 * one fixed non-recurring milestone. Returns null for a node with no maturity data at all
 * (e.g. CDD — a government-provided input with nothing of its own to track), meaning readiness
 * doesn't apply to it: it's trivially COMPLETE as an output, and trivially READY_STABLE as a
 * dependency (see parentGates below) rather than blocking everything downstream forever. */
function highestRequiredMaturityIndex(node: CdrlPathNode): number | null {
  const allStates = node.maturity_states_by_level
    ? Object.values(node.maturity_states_by_level).flatMap((states) => states ?? [])
    : (node.maturity_states ?? []);
  const fixed = allStates.filter((s) => !s.recurring);
  if (fixed.length === 0) return null;
  return Math.max(...fixed.map((s) => MATURITY_ORDER[s.state.toUpperCase() as CdrlPathMaturityLevel] ?? 0));
}

type ParentGateResult = "BLOCKED" | "READY_VOLATILE" | "READY_STABLE";

export interface CdrlPathParentGate {
  parent: CdrlPathNode;
  required: CdrlPathMaturityLevel;
  gate: ParentGateResult;
}

/** How each derived_from parent currently stands, independent of the child's own progress.
 * BLOCKED: no overlay entry for the parent at all — no artifact exists yet.
 * READY_VOLATILE: an artifact exists (the parent has an overlay entry) but hasn't reached the
 * required maturity for this edge — downstream work is allowed to start against it, but it can
 * still change before that maturity is reached, which is real rework risk, not a detail to hide.
 * READY_STABLE: the parent has reached the required maturity, or is exempt from maturity
 * tracking entirely (e.g. CDD — a given input, never volatile, never blocking). */
function parentGates(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): CdrlPathParentGate[] {
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
  const gates: CdrlPathParentGate[] = [];
  for (const edge of node.derived_from ?? []) {
    const parent = nodeById.get(edge.parent);
    if (!parent) continue; // dangling reference — already surfaced by validateModel()
    const required = edge.min_parent_maturity_to_start;
    if (highestRequiredMaturityIndex(parent) === null) {
      gates.push({ parent, required, gate: "READY_STABLE" });
      continue;
    }
    const status = overlay[parent.id];
    if (!status) {
      gates.push({ parent, required, gate: "BLOCKED" });
      continue;
    }
    const gate = achievedMaturityIndex(status) >= MATURITY_ORDER[required] ? "READY_STABLE" : "READY_VOLATILE";
    gates.push({ parent, required, gate });
  }
  return gates;
}

/** Worst-of across every derived_from parent: one BLOCKED parent blocks the child outright
 * (can't start at all); otherwise one READY_VOLATILE parent makes the whole thing volatile
 * (downstream of any churn risk is itself churn risk); a root with no parents, or a node whose
 * every parent has reached the required maturity, is READY_STABLE. */
function aggregateParentGate(gates: CdrlPathParentGate[]): ParentGateResult {
  if (gates.some((g) => g.gate === "BLOCKED")) return "BLOCKED";
  if (gates.some((g) => g.gate === "READY_VOLATILE")) return "READY_VOLATILE";
  return "READY_STABLE";
}

/** BLOCKED: at least one derived_from parent hasn't started at all.
 * READY_VOLATILE / READY_STABLE: every parent has at least started; this node itself hasn't —
 * these report the parent-side churn-risk signal since that's exactly what matters for the
 * decision to start now vs. wait.
 * IN_PROGRESS: parents clear this node to proceed, and it has started but hasn't reached its own
 * highest required (non-recurring) maturity level yet.
 * COMPLETE: this node has reached its own highest required level, or has no maturity data of its
 * own to track (e.g. CDD) — nothing left to track either way. */
export function computeReadiness(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): CdrlPathReadiness {
  const gate = aggregateParentGate(parentGates(node, model, overlay));
  if (gate === "BLOCKED") return "BLOCKED";
  const highestRequired = highestRequiredMaturityIndex(node);
  if (highestRequired === null) return "COMPLETE";
  const own = overlay[node.id];
  if (!own) return gate; // not started yet — parent stability IS the readiness-to-start signal
  return achievedMaturityIndex(own) >= highestRequired ? "COMPLETE" : "IN_PROGRESS";
}

function clausesFor(gates: CdrlPathParentGate[]): string {
  const byRequired = new Map<CdrlPathMaturityLevel, string[]>();
  for (const { parent, required } of gates) {
    byRequired.set(required, [...(byRequired.get(required) ?? []), parent.title]);
  }
  return Array.from(byRequired.entries())
    .map(([required, titles]) => `${titles.join(", ")} to reach ${required}`)
    .join("; ");
}

/** Human-readable reason text for the station detail panel and matrix chip tooltips to share
 * verbatim — "Blocked — waiting on X to reach Y" when a parent hasn't started at all, or
 * "Ready, but volatile — ..." when every parent has started but at least one hasn't reached the
 * required maturity yet (the churn-risk case). Null when there's nothing to flag (READY_STABLE,
 * IN_PROGRESS, or COMPLETE). */
export function readinessReasonText(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): string | null {
  const gates = parentGates(node, model, overlay);
  const blocked = gates.filter((g) => g.gate === "BLOCKED");
  if (blocked.length > 0) return `Blocked — waiting on ${clausesFor(blocked)}`;
  const volatile = gates.filter((g) => g.gate === "READY_VOLATILE");
  if (volatile.length > 0) {
    return `Ready, but volatile — waiting on ${clausesFor(volatile)} (in progress, not yet approved); starting now risks rework if it changes first.`;
  }
  return null;
}
