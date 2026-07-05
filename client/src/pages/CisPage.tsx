import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { CI_TIERS, CI_TYPES, type ConfigurationItem } from "../types";
import type { useEntity } from "../hooks/useEntity";

const fields: FieldDef<ConfigurationItem>[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "type", label: "Type", type: "select", options: CI_TYPES },
  { key: "tier", label: "Tier", type: "select", options: CI_TIERS },
  { key: "overDecompositionFlag", label: "Over-decomposition flag", type: "boolean" },
  { key: "consolidationNotes", label: "Consolidation notes", type: "textarea" },
  { key: "status", label: "Status", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const emptyRow: Partial<ConfigurationItem> = {
  name: "",
  type: "developmental",
  tier: "Tier 2",
  overDecompositionFlag: false,
  consolidationNotes: "",
  status: "",
  notes: "",
};

interface Props {
  entity: ReturnType<typeof useEntity<ConfigurationItem>>;
  onSelectCi: (id: string) => void;
}

export function CisPage({ entity, onSelectCi }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<ConfigurationItem | "new" | null>(null);

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
    {
      key: "overDecompositionFlag",
      label: "Over-decomp?",
      render: (r) => (r.overDecompositionFlag ? "⚠️ Yes" : "No"),
      filterOptions: ["Yes", "No"],
      filterValue: (r) => (r.overDecompositionFlag ? "Yes" : "No"),
    },
    { key: "status", label: "Status", sortValue: (r) => r.status },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Configuration Items</h2>
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add CI
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
            if (confirm(`Delete CI "${row.name}"?`)) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add CI" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <EntityForm<ConfigurationItem>
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
