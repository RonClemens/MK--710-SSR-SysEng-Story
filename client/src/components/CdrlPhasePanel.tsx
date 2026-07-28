import { EditableText } from "./EditableText";
import type { PhaseCdrl } from "../utils/acquisitionPhase";
import { SPEC_STATUSES, type SpecStatus } from "../types";

interface Props {
  cdrls: PhaseCdrl[];
  onUpdateStatus: (cdrl: PhaseCdrl, status: SpecStatus) => void;
  onViewInAllTabs: (tab: "safetyDeliverables" | "planningDeliverables") => void;
}

const APPLICABILITY_CLASS: Record<string, string> = {
  Development: "badge-info",
  Production: "badge-warning",
  Both: "badge",
};

export function CdrlPhasePanel({ cdrls, onUpdateStatus, onViewInAllTabs }: Props) {
  return (
    <div className="cdrl-phase-panel">
      <p className="did-guidance-label">
        <EditableText contentKey="cdrlPhasePanel.label" defaultValue="CDRLs due in this phase" as="span" />
        {cdrls.length > 0 ? ` (${cdrls.length})` : ""}
      </p>
      {cdrls.length === 0 ? (
        <EditableText
          contentKey="cdrlPhasePanel.emptyState"
          defaultValue="No Safety or Program Planning deliverables reference a milestone in this phase yet."
          as="p"
          className="empty-row"
        />
      ) : (
        cdrls.map((c) => (
          <div className="checklist-item-card" key={`${c.kind}-${c.record.id}`}>
            <p>
              <strong>{c.record.title}</strong> — {c.record.cdrlType}
            </p>
            <div className="cdrl-badge-row">
              <span className={`badge ${APPLICABILITY_CLASS[c.record.applicability] ?? "badge"}`}>
                {c.record.applicability}
              </span>
              <span className="badge">{c.kind === "safety" ? "Safety Deliverable" : "Program Planning Deliverable"}</span>
            </div>
            <div className="cdrl-badge-row">
              {SPEC_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`cdrl-status-pill${c.record.status === status ? " selected" : ""}`}
                  onClick={() => onUpdateStatus(c, status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              className="link-button"
              onClick={() => onViewInAllTabs(c.kind === "safety" ? "safetyDeliverables" : "planningDeliverables")}
            >
              View in All Tabs
            </button>
          </div>
        ))
      )}
    </div>
  );
}
