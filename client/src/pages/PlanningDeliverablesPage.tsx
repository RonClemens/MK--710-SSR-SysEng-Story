import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { PlanningDeliverableForm, type PlanningDeliverableValues } from "../components/PlanningDeliverableForm";
import { levelLabel } from "../data/didGuidance";
import { PLANNING_CDRL_CATALOG, PLANNING_DELIVERABLES_INTRO } from "../data/planningGuidance";
import {
  SAFETY_APPLICABILITIES,
  SPEC_BASELINES,
  SPEC_LEVELS,
  SPEC_STATUSES,
  type ConfigurationItem,
  type LogicalSubsystem,
  type ProgramPlanningDeliverable,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<ProgramPlanningDeliverable>>;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
}

const APPLICABILITY_CLASS: Record<string, string> = {
  Development: "badge-info",
  Production: "badge-warning",
  Both: "badge",
};

export function PlanningDeliverablesPage({ entity, subsystems, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [showGuidance, setShowGuidance] = useState(true);
  const [editing, setEditing] = useState<ProgramPlanningDeliverable | "new" | null>(null);

  const subsystemNames = Object.fromEntries(subsystems.map((s) => [s.id, s.name]));
  const ciNames = Object.fromEntries(cis.map((c) => [c.id, c.name]));

  function linkedTo(r: ProgramPlanningDeliverable): string {
    if (r.level === "Subsystem" && r.linkedSubsystemId) return subsystemNames[r.linkedSubsystemId] ?? "—";
    if (r.level === "CI" && r.linkedCiId) return ciNames[r.linkedCiId] ?? "—";
    if (r.level === "System") return "(whole system)";
    return "(not yet linked)";
  }

  const columns: ColumnDef<ProgramPlanningDeliverable>[] = [
    { key: "title", label: "Title", sortValue: (r) => r.title },
    {
      key: "level",
      label: "Level",
      render: (r) => levelLabel(r.level),
      filterOptions: SPEC_LEVELS,
      filterValue: (r) => r.level,
    },
    { key: "cdrlType", label: "CDRL Type", render: (r) => <span className="truncate">{r.cdrlType}</span> },
    {
      key: "applicability",
      label: "Applicability",
      filterOptions: SAFETY_APPLICABILITIES,
      filterValue: (r) => r.applicability,
    },
    { key: "baseline", label: "Baseline", filterOptions: SPEC_BASELINES, filterValue: (r) => r.baseline },
    { key: "status", label: "Status", filterOptions: SPEC_STATUSES, filterValue: (r) => r.status },
    { key: "linkedTo", label: "Linked to", render: linkedTo },
    { key: "deliveryMilestone", label: "Delivery milestone" },
  ];

  const emptyValues: PlanningDeliverableValues = {
    title: "",
    level: "System",
    cdrlType: PLANNING_CDRL_CATALOG.System[0].name,
    applicability: PLANNING_CDRL_CATALOG.System[0].applicability,
    baseline: "Baseline A",
    status: "Draft",
    linkedSubsystemId: null,
    linkedCiId: null,
    cdrlDescription: "",
    deliveryMilestone: "",
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Program Planning Deliverables</h2>
        <EditableText
          contentKey="page.planningDeliverables.hint"
          defaultValue="Non-safety program and software planning CDRLs (SEMP, SDP, STP, etc.) at System, Subsystem, and HWCI/CSCI level."
          as="span"
          className="hint"
        />
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Planning Deliverable
        </button>
      </div>

      <button className="link-button" onClick={() => setShowGuidance((v) => !v)}>
        {showGuidance ? "Hide" : "Show"} planning CDRL guidance
      </button>

      {showGuidance && (
        <div className="did-guidance">
          <EditableText contentKey="planning.deliverablesIntro" defaultValue={PLANNING_DELIVERABLES_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {SPEC_LEVELS.map((level) => (
              <div className="detail-card" key={level}>
                <h4>{levelLabel(level)}</h4>
                <ul>
                  {PLANNING_CDRL_CATALOG[level].map((c, i) => (
                    <li key={c.name}>
                      <strong>{c.name}</strong>{" "}
                      <span className={`badge ${APPLICABILITY_CLASS[c.applicability]}`}>{c.applicability}</span>
                      <br />
                      <EditableText
                        contentKey={`planning.cdrl.${level}.${i}.description`}
                        defaultValue={c.description}
                        as="span"
                        className="hint"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={(row) => setEditing(row)}
          onDelete={(row) => {
            if (confirm(`Delete planning deliverable "${row.title}"?`)) remove(row.id);
          }}
          emptyMessage="No planning deliverables yet."
        />
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Add Planning Deliverable" : `Edit ${editing.title}`}
          onClose={() => setEditing(null)}
        >
          <PlanningDeliverableForm
            initial={
              editing === "new"
                ? emptyValues
                : {
                    title: editing.title,
                    level: editing.level,
                    cdrlType: editing.cdrlType,
                    applicability: editing.applicability,
                    baseline: editing.baseline,
                    status: editing.status,
                    linkedSubsystemId: editing.linkedSubsystemId,
                    linkedCiId: editing.linkedCiId,
                    cdrlDescription: editing.cdrlDescription,
                    deliveryMilestone: editing.deliveryMilestone,
                  }
            }
            subsystems={subsystems}
            cis={cis}
            onCancel={() => setEditing(null)}
            onSubmit={async (values: PlanningDeliverableValues) => {
              if (editing === "new") await create(values);
              else await update(editing.id, values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
