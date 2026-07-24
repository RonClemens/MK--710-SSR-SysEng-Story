import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { DbxMbxCard } from "../components/DbxMbxCard";
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../data/dbxMbxGuidance";
import {
  RECOVERY_DELTA_CLASSES,
  RECOVERY_DELTA_CLASS_SCOPE_NOTE,
  RECOVERY_DELTA_CLASS_TIER_MAPPING,
  RECOVERY_PROGRAM_INTRO,
} from "../data/recoveryProgramGuidance";
import { attachmentsToText, textToAttachments } from "../utils/attachments";
import { CI_TIERS, CI_TYPES, SPEC_BASELINES, type ConfigurationItem, type LogicalSubsystem } from "../types";
import type { useEntity } from "../hooks/useEntity";

const decompositionDimension = DBX_MBX_DIMENSIONS.find((d) => d.id === "decomposition")!;

type CiFormValues = Omit<ConfigurationItem, "attachments"> & { attachments: string };

const emptyRow: Partial<CiFormValues> = {
  name: "",
  type: "developmental",
  tier: "Tier 2",
  subsystemIds: [],
  baseline: "Baseline A",
  overDecompositionFlag: false,
  consolidationNotes: "",
  status: "",
  notes: "",
  attachments: "",
};

interface Props {
  entity: ReturnType<typeof useEntity<ConfigurationItem>>;
  subsystems: LogicalSubsystem[];
  onSelectCi: (id: string) => void;
}

export function CisPage({ entity, subsystems, onSelectCi }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<ConfigurationItem | "new" | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const subsystemLabels = Object.fromEntries(subsystems.map((s) => [s.id, s.name]));
  const subsystemNames = (ids: string[]) => ids.map((id) => subsystemLabels[id] ?? "(unknown)").join(", ");
  // Include the baseline in each option's label since the multiselect isn't
  // filtered to the CI's own baseline — subsystems are baseline-scoped, so
  // this is the cheapest way to keep a cross-baseline pick from looking like
  // a plain oversight.
  const subsystemOptionLabels = Object.fromEntries(subsystems.map((s) => [s.id, `${s.name} (${s.baseline})`]));

  const fields: FieldDef<CiFormValues>[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "type", label: "Type", type: "select", options: CI_TYPES },
    { key: "tier", label: "Tier", type: "select", options: CI_TIERS },
    { key: "baseline", label: "Baseline", type: "select", options: SPEC_BASELINES },
    {
      key: "subsystemIds",
      label: "Logical subsystem(s) served",
      type: "multiselect",
      options: subsystems.map((s) => s.id),
      optionLabels: subsystemOptionLabels,
    },
    { key: "overDecompositionFlag", label: "Over-decomposition flag", type: "boolean" },
    { key: "consolidationNotes", label: "Consolidation notes", type: "textarea" },
    { key: "status", label: "Status", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
    {
      key: "attachments",
      label: "Linked files/documents (one per line: label | url)",
      type: "textarea",
      placeholder: "ICD-TS-014 | https://...",
    },
  ];

  const columns: ColumnDef<ConfigurationItem>[] = [
    {
      key: "name",
      label: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <button className="link-button" onClick={() => onSelectCi(r.id)}>
          {r.name}
        </button>
      ),
    },
    { key: "type", label: "Type", sortValue: (r) => r.type, filterOptions: CI_TYPES, filterValue: (r) => r.type },
    { key: "tier", label: "Tier", sortValue: (r) => r.tier, filterOptions: CI_TIERS, filterValue: (r) => r.tier },
    { key: "baseline", label: "Baseline", filterOptions: SPEC_BASELINES, filterValue: (r) => r.baseline },
    {
      key: "subsystemIds",
      label: "Subsystems served",
      sortValue: (r) => r.subsystemIds.length,
      render: (r) =>
        r.subsystemIds.length === 0 ? (
          "—"
        ) : (
          <>
            {r.subsystemIds.length >= 2 && <span className="badge badge-info">{r.subsystemIds.length}× </span>}
            <span className="truncate">{subsystemNames(r.subsystemIds)}</span>
          </>
        ),
    },
    {
      key: "overDecompositionFlag",
      label: "Over-decomp?",
      render: (r) => (r.overDecompositionFlag ? "⚠️ Yes" : "No"),
      filterOptions: ["Yes", "No"],
      filterValue: (r) => (r.overDecompositionFlag ? "Yes" : "No"),
    },
    { key: "status", label: "Status", sortValue: (r) => r.status },
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>Configuration Items</h2>
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add CI
        </button>
      </div>

      <button className="link-button" onClick={() => setShowGuidance((v) => !v)}>
        {showGuidance ? "Hide" : "Show"} Document-Based (DBx) vs Model-Based (MBx) guidance
      </button>
      {showGuidance && (
        <div className="did-guidance">
          <EditableText contentKey="dbxMbx.intro" defaultValue={DBX_MBX_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            <DbxMbxCard dimension={decompositionDimension} />
          </div>

          <h3>Recovery Program: CI Tier ↔ Delta Classification (Baseline B)</h3>
          <EditableText contentKey="recovery.intro" defaultValue={RECOVERY_PROGRAM_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {RECOVERY_DELTA_CLASSES.map((cls) => (
              <div className="detail-card" key={cls}>
                <h4>
                  {cls} <span className="badge">{RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].tier}</span>
                </h4>
                <EditableText
                  contentKey={`recovery.class.${cls}.description`}
                  defaultValue={RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].description}
                  as="p"
                />
                <p className="did-guidance-label">Reconciliation effort</p>
                <EditableText
                  contentKey={`recovery.class.${cls}.workRequired`}
                  defaultValue={RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].workRequired}
                  as="p"
                  className="hint"
                />
              </div>
            ))}
          </div>
          <EditableText
            contentKey="recovery.scopeNote"
            defaultValue={RECOVERY_DELTA_CLASS_SCOPE_NOTE}
            as="p"
            className="hint"
          />
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
            if (confirm(`Delete CI "${row.name}"?`)) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add CI" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <EntityForm<CiFormValues>
            fields={fields}
            initialValues={
              editing === "new" ? emptyRow : { ...editing, attachments: attachmentsToText(editing.attachments) }
            }
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = { ...values, attachments: textToAttachments(values.attachments ?? "") };
              if (editing === "new") await create(payload);
              else await update(editing.id, payload);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
