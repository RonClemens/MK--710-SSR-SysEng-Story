import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { PlanningDeliverableForm, type PlanningDeliverableValues } from "../components/PlanningDeliverableForm";
import { levelLabel } from "../../../methodology/guidance/didGuidance";
import { PLANNING_CDRL_CATALOG, PLANNING_DELIVERABLES_INTRO } from "../../../methodology/guidance/planningGuidance";
import { SETR_EVENTS, SETR_GUIDANCE } from "../../../methodology/guidance/setrGuidance";
import { SOFTWARE_LIFECYCLE_GROUPS, SOFTWARE_LIFECYCLE_INTRO } from "../../../methodology/guidance/tdpGuidance";
import { DbxMbxCard } from "../components/DbxMbxCard";
import { DbxMbxTransitionGuidance } from "../components/DbxMbxTransitionGuidance";
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../../../methodology/guidance/dbxMbxGuidance";
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

const programPlanningDimension = DBX_MBX_DIMENSIONS.find((d) => d.id === "programPlanningExecution")!;

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
    {
      key: "attachments",
      label: "Links",
      render: (r) =>
        r.attachments.length === 0 ? (
          "—"
        ) : (
          <span className="badge" title={r.attachments.map((a) => a.label).join(", ")}>
            {r.attachments.length} 📎
          </span>
        ),
    },
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
    attachments: [],
  };

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="planningDeliverables.heading" defaultValue="Program Planning Deliverables" as="h2" />
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

          <EditableText contentKey="planningDeliverables.softwarePlanningHeading" defaultValue="Software/Program Planning Through SRR → PRR" as="h3" />
          <div className="did-guidance-grid">
            {SETR_EVENTS.map((event) => (
              <div className="detail-card" key={event}>
                <h4>
                  {event} <span className="badge">{SETR_GUIDANCE[event].name}</span>
                </h4>
                <EditableText
                  contentKey={`planning.setr.${event}.softwarePlanning`}
                  defaultValue={SETR_GUIDANCE[event].softwarePlanning}
                  as="p"
                />
                <EditableText contentKey="setr.tdpMaturityLabel" defaultValue="TDP Maturity (MIL-STD-31000)" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`setr.${event}.tdpMaturity`}
                  defaultValue={SETR_GUIDANCE[event].tdpMaturity}
                  as="p"
                  className="hint"
                />
              </div>
            ))}
          </div>
          <EditableText
            contentKey="planningDeliverables.setrCrossRefHint"
            defaultValue={
              'See the Specifications tab\'s "SETR Milestones" section for the full System Decomposition / System Safety Planning / System Software Planning / Spec Generation breakdown at each event, and its "Technical Data Package (TDP) Alignment" section for the full MIL-STD-31000/EIA-649 picture.'
            }
            as="p"
            className="hint"
          />

          <EditableText contentKey="planningDeliverables.ieee12207Heading" defaultValue="IEEE 12207 Software Life Cycle Alignment" as="h3" />
          <EditableText contentKey="softwareLifecycle.intro" defaultValue={SOFTWARE_LIFECYCLE_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {SOFTWARE_LIFECYCLE_GROUPS.map((g) => (
              <div className="detail-card" key={g.id}>
                <h4>{g.name}</h4>
                <EditableText contentKey={`softwareLifecycle.${g.id}.description`} defaultValue={g.description} as="p" className="hint" />
                <p className="hint">
                  <EditableText contentKey="softwareLifecycle.setrRangeLabel" defaultValue="SETR range:" as="span" />{" "}
                  {g.setrRange}
                </p>
                <EditableText contentKey="softwareLifecycle.planningCdrlsLabel" defaultValue="Planning CDRL(s)" as="p" className="did-guidance-label" />
                <EditableText contentKey={`softwareLifecycle.${g.id}.planningCdrls`} defaultValue={g.planningCdrls} as="p" />
              </div>
            ))}
          </div>

          <EditableText contentKey="planningDeliverables.dbxMbxHeading" defaultValue="Document-Based (DBx) vs Model-Based (MBx) Program Execution" as="h3" />
          <EditableText contentKey="dbxMbx.intro" defaultValue={DBX_MBX_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            <DbxMbxCard dimension={programPlanningDimension} />
          </div>
          <DbxMbxTransitionGuidance />
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
                    attachments: editing.attachments,
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
