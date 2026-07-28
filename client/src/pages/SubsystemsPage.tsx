import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { DbxMbxCard } from "../components/DbxMbxCard";
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../../../methodology/guidance/dbxMbxGuidance";
import {
  LOGICAL_SUBSYSTEM_SOURCES,
  SPEC_BASELINES,
  type ConfigurationItem,
  type LogicalSubsystem,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

const decompositionDimension = DBX_MBX_DIMENSIONS.find((d) => d.id === "decomposition")!;

const fields: FieldDef<LogicalSubsystem>[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "description", label: "Description (functional/behavioral — not the enclosure it sits in)", type: "textarea" },
  { key: "source", label: "Source", type: "select", options: LOGICAL_SUBSYSTEM_SOURCES },
  { key: "baseline", label: "Baseline", type: "select", options: SPEC_BASELINES },
];

const emptyRow: Partial<LogicalSubsystem> = {
  name: "",
  description: "",
  source: "Proposed",
  baseline: "Baseline A",
};

interface Props {
  entity: ReturnType<typeof useEntity<LogicalSubsystem>>;
  cis: ConfigurationItem[];
  onSelectSubsystem: (id: string) => void;
}

export function SubsystemsPage({ entity, cis, onSelectSubsystem }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<LogicalSubsystem | "new" | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const ciCount = (subsystemId: string) => cis.filter((c) => c.subsystemIds.includes(subsystemId)).length;

  const columns: ColumnDef<LogicalSubsystem>[] = [
    {
      key: "name",
      label: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <button className="link-button" onClick={() => onSelectSubsystem(r.id)}>
          {r.name}
        </button>
      ),
    },
    { key: "description", label: "Description", render: (r) => <span className="truncate">{r.description}</span> },
    {
      key: "baseline",
      label: "Baseline",
      filterOptions: SPEC_BASELINES,
      filterValue: (r) => r.baseline,
    },
    {
      key: "source",
      label: "Source",
      filterOptions: LOGICAL_SUBSYSTEM_SOURCES,
      filterValue: (r) => r.source,
    },
    {
      key: "ciCount",
      label: "CIs serving this",
      sortValue: (r) => ciCount(r.id),
      render: (r) => {
        const count = ciCount(r.id);
        return count >= 2 ? <span className="badge badge-info">{count} CIs</span> : count;
      },
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="subsystems.heading" defaultValue="Logical Subsystems" as="h2" />
        <EditableText
          contentKey="page.subsystems.hint"
          defaultValue="Functional decomposition layer — see §2.3 background on the missing SSDD functional layer"
          as="span"
          className="hint"
        />
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Subsystem
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
            if (confirm(`Delete subsystem "${row.name}"? CIs linked to it will keep the stale reference.`)) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Logical Subsystem" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <EntityForm<LogicalSubsystem>
            fields={fields}
            initialValues={editing === "new" ? emptyRow : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
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
