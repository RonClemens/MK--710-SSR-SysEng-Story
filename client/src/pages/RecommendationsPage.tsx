import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import {
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_STATUSES,
  type ConfigurationItem,
  type Recommendation,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<Recommendation>>;
  cis: ConfigurationItem[];
}

export function RecommendationsPage({ entity, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<Recommendation | "new" | null>(null);

  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string | null) => (id ? ciLabels[id] ?? "(unknown CI)" : "—");

  const fields: FieldDef<Recommendation>[] = [
    { key: "text", label: "Recommendation text", type: "textarea" },
    { key: "category", label: "Category", type: "select", options: RECOMMENDATION_CATEGORIES },
    { key: "status", label: "Status", type: "select", options: RECOMMENDATION_STATUSES },
    { key: "owner", label: "Owner (optional)", type: "text" },
    {
      key: "relatedCiId",
      label: "Related CI (optional)",
      type: "select",
      options: ["", ...cis.map((c) => c.id)],
      optionLabels: { "": "(none)", ...ciLabels },
    },
  ];

  const emptyRow: Partial<Recommendation> = {
    text: "",
    category: "other",
    status: "open",
    owner: "",
    relatedCiId: null,
  };

  const columns: ColumnDef<Recommendation>[] = [
    { key: "text", label: "Recommendation", render: (r) => <span className="truncate">{r.text}</span> },
    { key: "category", label: "Category", filterOptions: RECOMMENDATION_CATEGORIES, filterValue: (r) => r.category },
    { key: "status", label: "Status", filterOptions: RECOMMENDATION_STATUSES, filterValue: (r) => r.status },
    { key: "owner", label: "Owner" },
    { key: "relatedCiId", label: "Related CI", render: (r) => ciName(r.relatedCiId) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Recommendations / Action Items</h2>
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Recommendation
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
            if (confirm("Delete this recommendation?")) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Recommendation" : "Edit Recommendation"} onClose={() => setEditing(null)}>
          <EntityForm<Recommendation>
            fields={fields}
            initialValues={editing === "new" ? emptyRow : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = { ...values, relatedCiId: values.relatedCiId || null };
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
