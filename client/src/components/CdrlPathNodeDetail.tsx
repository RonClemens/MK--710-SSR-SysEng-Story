import type { CdrlPathModel, CdrlPathNode, CdrlPathReadiness, CdrlPathWorkflowOverlay, CdrlPathWorkflowStage } from "../types/cdrlPath";
import { computeReadiness, readinessReasonText } from "../utils/cdrlPathReadiness";

interface Props {
  model: CdrlPathModel;
  node: CdrlPathNode;
  decompositionLevel: string;
  workflowOverlay: CdrlPathWorkflowOverlay;
}

// Per the design chat's stage descriptions: WORKING (R active) → UNDER_REVIEW (C's reviewing)
// → APPROVED (A signs off) → NOTIFIED (I's informed, cycle resets). Plain-glyph icons, same
// convention this file already uses for expand carets (▸/▾) rather than pulling in an icon
// library for four badges.
const WORKFLOW_STAGE_ICON: Record<CdrlPathWorkflowStage, string> = {
  WORKING: "✎",
  UNDER_REVIEW: "🔍",
  APPROVED: "✓",
  NOTIFIED: "🔔",
};

const WORKFLOW_STAGE_LABEL: Record<CdrlPathWorkflowStage, string> = {
  WORKING: "Working",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  NOTIFIED: "Notified",
};

// READY_VOLATILE gets its own caution glyph (⚠) distinct from BLOCKED's lock and COMPLETE's
// implicit "done" — per the design chat's steer that this is "probably the single most valuable
// signal this whole readiness layer can surface," it shouldn't read as a plain green go.
const READINESS_ICON: Partial<Record<CdrlPathReadiness, string>> = {
  BLOCKED: "🔒",
  READY_VOLATILE: "⚠️",
};

const READINESS_LABEL: Record<CdrlPathReadiness, string> = {
  BLOCKED: "BLOCKED",
  READY_VOLATILE: "READY (VOLATILE)",
  READY_STABLE: "READY (STABLE)",
  IN_PROGRESS: "IN PROGRESS",
  COMPLETE: "COMPLETE",
};

function relatedTitles(ids: string[] | undefined, model: CdrlPathModel): string {
  if (!ids || ids.length === 0) return "—";
  return ids
    .map((id) => (id === "ALL" ? "ALL" : (model.nodes.find((n) => n.id === id)?.title ?? id)))
    .join(", ");
}

/** The reverse of derived_from — every other CDRL that lists this node as one of its parents.
 * Not stored on the node itself (derived_from is backward-pointing, parent lookup only), so
 * it's computed from the full model each time, same as any other derived view in this file. */
function childrenOf(node: CdrlPathNode, model: CdrlPathModel): CdrlPathNode[] {
  return model.nodes.filter((n) => n.derived_from?.some((edge) => edge.parent === node.id));
}

// Level 3 station detail fields — per cdrl-path-project-brief.md's zoom tier model: "click a
// node, see DID, maturity states, RACI, influences/influenced-by, decomposition level, live
// program status + notes." Program status + notes (draft/submitted/approved + free text) come
// from the per-baseline status overlay, which is a later phase (see docs/cdrl-path/DECISIONS.md
// #4) — not shown here yet. workflow_state/readiness (added 2026-08-15) live in that same
// eventual overlay but are sourced from a client-side demo dataset in the meantime — see
// cdrlPathDemoWorkflowOverlay.ts.
//
// Extracted from the old standalone CdrlPathStationDetailPanel (no <Modal> wrapper of its own)
// so the same field-rendering content can serve as CdrlPathRelatedCdrlsModal's side-drawer body
// — a CDRL is reached by clicking a station/hub, then expanded from a list within that modal,
// rather than opening its own separate stacked modal. Read-only; AtomicEditPanel is a later phase.
export function CdrlPathNodeDetail({ model, node, decompositionLevel, workflowOverlay }: Props) {
  const supersedesRecord = node.supersedes?.length
    ? model.superseded_dids?.find((s) => s.superseded_by_node_id === node.id)
    : undefined;

  const maturityStates = node.maturity_states_by_level
    ? (node.maturity_states_by_level[decompositionLevel as keyof typeof node.maturity_states_by_level] ?? [])
    : (node.maturity_states ?? []);

  const ownWorkflow = workflowOverlay[node.id];
  const readiness = computeReadiness(node, model, workflowOverlay);
  const readinessReason = readinessReasonText(node, model, workflowOverlay);

  return (
    <div className="cdrl-path-node-detail">
      <p className="hint">{node.id}</p>

      <div className="cdrl-badge-row">
        <span className="badge">{node.did ?? "DID not on file"}</span>
        {node.confirmed_via_did_interview && <span className="badge badge-info">Confirmed via DID interview</span>}
        <span className={`badge cdrl-readiness-badge cdrl-readiness-${readiness.toLowerCase()}`} title={readinessReason ?? undefined}>
          {READINESS_ICON[readiness] ? `${READINESS_ICON[readiness]} ` : ""}
          {READINESS_LABEL[readiness]}
        </span>
        {ownWorkflow && (
          <span className="badge cdrl-workflow-badge" title={`Workflow: ${WORKFLOW_STAGE_LABEL[ownWorkflow.workflow_state]} toward ${ownWorkflow.current_maturity_target}`}>
            {WORKFLOW_STAGE_ICON[ownWorkflow.workflow_state]} {WORKFLOW_STAGE_LABEL[ownWorkflow.workflow_state]}
          </span>
        )}
      </div>

      {supersedesRecord && (
        <div className="cdrl-badge-row">
          <span className="badge badge-warning" title={supersedesRecord.notes}>
            Consolidates: {supersedesRecord.cancelled_did} ({supersedesRecord.cancelled_title}) — {supersedesRecord.status}
          </span>
        </div>
      )}

      <section>
        <h4>Maturity states {node.maturity_states_by_level ? `— ${decompositionLevel} level` : ""}</h4>
        {maturityStates.length === 0 ? (
          <p className="empty-row">
            {node.maturity_states_by_level
              ? "This CDRL doesn't apply at the currently selected decomposition level."
              : "No maturity states on file."}
          </p>
        ) : (
          <ul>
            {maturityStates.map((state, i) => (
              <li key={i}>
                <strong>{state.state}</strong> — {state.at_event}
                {state.recurring ? " (recurring)" : ""}
                {state.note ? ` — ${state.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4>RACI</h4>
        {node.raci ? (
          <ul>
            <li>Responsible: {node.raci.responsible ?? "—"}</li>
            <li>Accountable: {node.raci.accountable ?? "—"}</li>
            <li>Consulted: {node.raci.consulted.length ? node.raci.consulted.join(", ") : "—"}</li>
            <li>Informed: {node.raci.informed.length ? node.raci.informed.join(", ") : "—"}</li>
          </ul>
        ) : (
          <p className="empty-row">Not on file.</p>
        )}
      </section>

      <section>
        <h4>Developmental lineage</h4>
        <p>
          <strong>Derives from:</strong>{" "}
          {node.derived_from && node.derived_from.length > 0
            ? relatedTitles(node.derived_from.map((edge) => edge.parent), model)
            : "Root document — no parent in this model"}
        </p>
        {readinessReason && (
          <p className={`cdrl-readiness-reason${readiness === "READY_VOLATILE" ? " cdrl-readiness-reason-volatile" : ""}`}>
            {readinessReason}
          </p>
        )}
        <p>
          <strong>Flows into:</strong> {(() => {
            const children = childrenOf(node, model);
            return children.length > 0 ? children.map((c) => c.title).join(", ") : "—";
          })()}
        </p>
        <p className="hint">
          Strict, directional structural derivation (Vee-model flow-down) — first-pass,
          unconfirmed, distinct from the looser relationships below.
        </p>
      </section>

      <section>
        <h4>Relationships</h4>
        <p>
          <strong>Influences:</strong> {relatedTitles(node.influences, model)}
        </p>
        <p>
          <strong>Influenced by:</strong> {relatedTitles(node.influenced_by, model)}
        </p>
        <p className="hint">
          First-pass, unconfirmed — see cdrl-path-project-brief.md content-status notes before treating as settled.
        </p>
      </section>

      <section>
        <h4>Decomposition level</h4>
        <p>{Array.isArray(node.decomposition_level) ? node.decomposition_level.join(", ") : (node.decomposition_level ?? "SYSTEM (default)")}</p>
      </section>

      {node.notes && (
        <section>
          <h4>Notes</h4>
          <p>{node.notes}</p>
        </section>
      )}

      <section>
        <h4>Live program status</h4>
        <p className="empty-row">Not yet wired up — status overlay persistence is a later phase.</p>
      </section>
    </div>
  );
}
