import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { SafetyDeliverableForm, type SafetyDeliverableValues } from "../components/SafetyDeliverableForm";
import { levelLabel } from "../data/didGuidance";
import { CDRL_CATALOG, HAZARD_CATEGORY_META, SAFETY_DELIVERABLES_INTRO, hazardCategoryForLevel } from "../data/safetyGuidance";
import {
  SAFETY_APPLICABILITIES,
  SPEC_BASELINES,
  SPEC_LEVELS,
  SPEC_STATUSES,
  type ConfigurationItem,
  type LogicalSubsystem,
  type SafetyDeliverable,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<SafetyDeliverable>>;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
}

const APPLICABILITY_CLASS: Record<string, string> = {
  Development: "badge-info",
  Production: "badge-warning",
  Both: "badge",
};

export function SafetyDeliverablesPage({ entity, subsystems, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [showGuidance, setShowGuidance] = useState(true);
  const [editing, setEditing] = useState<SafetyDeliverable | "new" | null>(null);

  const subsystemNames = Object.fromEntries(subsystems.map((s) => [s.id, s.name]));
  const ciNames = Object.fromEntries(cis.map((c) => [c.id, c.name]));

  function linkedTo(r: SafetyDeliverable): string {
    if (r.level === "Subsystem" && r.linkedSubsystemId) return subsystemNames[r.linkedSubsystemId] ?? "—";
    if (r.level === "CI" && r.linkedCiId) return ciNames[r.linkedCiId] ?? "—";
    if (r.level === "System") return "(whole system)";
    return "(not yet linked)";
  }

  const columns: ColumnDef<SafetyDeliverable>[] = [
    { key: "title", label: "Title", sortValue: (r) => r.title },
    {
      key: "level",
      label: "Level",
      render: (r) => `${levelLabel(r.level)} (${hazardCategoryForLevel(r.level)})`,
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

  const emptyValues: SafetyDeliverableValues = {
    title: "",
    level: "System",
    cdrlType: CDRL_CATALOG.System[0].name,
    applicability: CDRL_CATALOG.System[0].applicability,
    baseline: "Baseline A",
    status: "Draft",
    linkedSubsystemId: null,
    linkedCiId: null,
    hazardExample: "",
    cdrlDescription: "",
    deliveryMilestone: "",
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>System Safety Deliverables</h2>
        <EditableText
          contentKey="page.safetyDeliverables.hint"
          defaultValue="CDRL-style safety artifacts (MIL-STD-882E / JSSSEH) at System, Subsystem, and HWCI/CSCI level."
          as="span"
          className="hint"
        />
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Safety Deliverable
        </button>
      </div>

      <button className="link-button" onClick={() => setShowGuidance((v) => !v)}>
        {showGuidance ? "Hide" : "Show"} hazard category & CDRL guidance
      </button>

      {showGuidance && (
        <div className="did-guidance">
          <EditableText contentKey="safety.deliverablesIntro" defaultValue={SAFETY_DELIVERABLES_INTRO} as="p" className="hint" />

          <h3>Hazard categories</h3>
          <div className="did-guidance-grid">
            {SPEC_LEVELS.map((level) => {
              const category = hazardCategoryForLevel(level);
              const meta = HAZARD_CATEGORY_META[category];
              return (
                <div className="detail-card" key={category}>
                  <h4>
                    {category} <span className="badge">{levelLabel(level)}</span>
                  </h4>
                  <EditableText contentKey={`safety.hazardCategory.${category}.description`} defaultValue={meta.description} as="p" />
                  <p className="did-guidance-label">Example hazards</p>
                  <ul>
                    {meta.examples.map((ex, i) => (
                      <EditableText key={i} contentKey={`safety.hazardCategory.${category}.examples.${i}`} defaultValue={ex} as="li" />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <h3>Expected CDRLs per level</h3>
          <div className="did-guidance-grid">
            {SPEC_LEVELS.map((level) => (
              <div className="detail-card" key={level}>
                <h4>{levelLabel(level)}</h4>
                <ul>
                  {CDRL_CATALOG[level].map((c, i) => (
                    <li key={c.name}>
                      <strong>{c.name}</strong>{" "}
                      <span className={`badge ${APPLICABILITY_CLASS[c.applicability]}`}>{c.applicability}</span>
                      <br />
                      <EditableText contentKey={`safety.cdrl.${level}.${i}.description`} defaultValue={c.description} as="span" className="hint" />
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
            if (confirm(`Delete safety deliverable "${row.title}"?`)) remove(row.id);
          }}
          emptyMessage="No safety deliverables yet."
        />
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Add Safety Deliverable" : `Edit ${editing.title}`}
          onClose={() => setEditing(null)}
        >
          <SafetyDeliverableForm
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
                    hazardExample: editing.hazardExample,
                    cdrlDescription: editing.cdrlDescription,
                    deliveryMilestone: editing.deliveryMilestone,
                  }
            }
            subsystems={subsystems}
            cis={cis}
            onCancel={() => setEditing(null)}
            onSubmit={async (values: SafetyDeliverableValues) => {
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
