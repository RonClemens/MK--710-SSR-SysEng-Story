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
 * doesn't apply to it: it's trivially COMPLETE as an output, and trivially satisfied as a
 * dependency (see unmetParents below) rather than blocking everything downstream forever. */
function highestRequiredMaturityIndex(node: CdrlPathNode): number | null {
  const allStates = node.maturity_states_by_level
    ? Object.values(node.maturity_states_by_level).flatMap((states) => states ?? [])
    : (node.maturity_states ?? []);
  const fixed = allStates.filter((s) => !s.recurring);
  if (fixed.length === 0) return null;
  return Math.max(...fixed.map((s) => MATURITY_ORDER[s.state.toUpperCase() as CdrlPathMaturityLevel] ?? 0));
}

export interface CdrlPathUnmetParent {
  parent: CdrlPathNode;
  required: CdrlPathMaturityLevel;
}

/** Every derived_from parent this node is still waiting on — a parent whose own maturity-exempt
 * (highestRequiredMaturityIndex === null, e.g. CDD) is always considered satisfied, since it has
 * no workflow of its own to gate on. */
export function unmetParents(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): CdrlPathUnmetParent[] {
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
  const unmet: CdrlPathUnmetParent[] = [];
  for (const edge of node.derived_from ?? []) {
    const parent = nodeById.get(edge.parent);
    if (!parent) continue; // dangling reference — already surfaced by validateModel()
    if (highestRequiredMaturityIndex(parent) === null) continue; // exempt parent, always satisfied
    const achieved = achievedMaturityIndex(overlay[parent.id]);
    if (achieved < MATURITY_ORDER[edge.min_parent_maturity_to_start]) {
      unmet.push({ parent, required: edge.min_parent_maturity_to_start });
    }
  }
  return unmet;
}

/** BLOCKED: at least one derived_from parent hasn't reached its required gate yet.
 * READY: every parent is satisfied (or there are none), and this node itself hasn't started.
 * IN_PROGRESS: parents satisfied, this node has started but hasn't reached its own highest
 * required (non-recurring) maturity level yet.
 * COMPLETE: this node has reached its own highest required level, or has no maturity data of
 * its own to track (e.g. CDD) — nothing left to track either way. */
export function computeReadiness(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): CdrlPathReadiness {
  if (unmetParents(node, model, overlay).length > 0) return "BLOCKED";
  const highestRequired = highestRequiredMaturityIndex(node);
  if (highestRequired === null) return "COMPLETE";
  const own = overlay[node.id];
  if (!own) return "READY";
  return achievedMaturityIndex(own) >= highestRequired ? "COMPLETE" : "IN_PROGRESS";
}

/** Human-readable "Blocked — waiting on X, Y to reach Z" text, or null when not blocked —
 * built for the station detail panel and matrix chip tooltips to share verbatim. */
export function blockedReasonText(node: CdrlPathNode, model: CdrlPathModel, overlay: CdrlPathWorkflowOverlay): string | null {
  const unmet = unmetParents(node, model, overlay);
  if (unmet.length === 0) return null;
  const byRequired = new Map<CdrlPathMaturityLevel, string[]>();
  for (const { parent, required } of unmet) {
    byRequired.set(required, [...(byRequired.get(required) ?? []), parent.title]);
  }
  const clauses = Array.from(byRequired.entries()).map(([required, titles]) => `${titles.join(", ")} to reach ${required}`);
  return `Blocked — waiting on ${clauses.join("; ")}`;
}
