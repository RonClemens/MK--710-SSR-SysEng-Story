import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { LOGICAL_SUBSYSTEM_SOURCES, type ConfigurationItem, type LogicalSubsystem } from "../types";
import type { useEntity } from "../hooks/useEntity";

const fields: FieldDef<LogicalSubsystem>[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "description", label: "Description (functional/behavioral — not the enclosure it sits in)", type: "textarea" },
  { key: "source", label: "Source", type: "select", options: LOGICAL_SUBSYSTEM_SOURCES },
];

const emptyRow: Partial<LogicalSubsystem> = {
  name: "",
  description: "",
  source: "Proposed",
};

interface Props {
  entity: ReturnType<typeof useEntity<LogicalSubsystem>>;
  cis: ConfigurationItem[];
  onSelectSubsystem: (id: string) => void;
}

export function SubsystemsPage({ entity, cis, onSelectSubsystem }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<LogicalSubsystem | "new" | null>(null);

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
        <h2>Logical Subsystems</h2>
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
