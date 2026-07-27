import type { PhaseCdrl } from "../utils/acquisitionPhase";

interface Props {
  cdrls: PhaseCdrl[];
  onViewInAllTabs: (tab: "safetyDeliverables" | "planningDeliverables") => void;
}

const APPLICABILITY_CLASS: Record<string, string> = {
  Development: "badge-info",
  Production: "badge-warning",
  Both: "badge",
};

export function CdrlPhasePanel({ cdrls, onViewInAllTabs }: Props) {
  return (
    <div className="cdrl-phase-panel">
      <p className="did-guidance-label">CDRLs due in this phase{cdrls.length > 0 ? ` (${cdrls.length})` : ""}</p>
      {cdrls.length === 0 ? (
        <p className="empty-row">No Safety or Program Planning deliverables reference a milestone in this phase yet.</p>
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
              <span className="badge">{c.record.status}</span>
              <span className="badge">{c.kind === "safety" ? "Safety Deliverable" : "Program Planning Deliverable"}</span>
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
