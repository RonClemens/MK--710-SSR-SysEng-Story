import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { EditableText } from "../components/EditableText";
import { COMMENT_STATUSES, type Comment, type Role } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<Comment>>;
  roles: Role[];
}

// Architecture Guidance §13.1's "global list" surface: the only place an
// unattached Comment (no entityType/entityId) is visible at all, and a
// useful cross-cutting view even for attached ones. Filterable by status
// and entityType, per that section's own recommended shape.
export function CommentsPage({ entity, roles }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<Comment | "new" | null>(null);

  const roleLabels = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const roleName = (id: string | null) => (id ? roleLabels[id] ?? "(unknown role)" : "(unspecified)");
  const entityTypeOptions = Array.from(new Set(rows.map((c) => c.entityType).filter((t): t is string => t !== null)));

  const fields: FieldDef<Comment>[] = [
    { key: "entityType", label: "Attached entity type (optional)", type: "text", placeholder: "e.g. ConfigurationItem" },
    { key: "entityId", label: "Attached entity id (optional)", type: "text", placeholder: "e.g. ci-001" },
    { key: "text", label: "Comment / TODO text", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: COMMENT_STATUSES },
    {
      key: "createdByRoleId",
      label: "Raised by role (optional)",
      type: "select",
      options: ["", ...roles.map((r) => r.id)],
      optionLabels: { "": "(unspecified)", ...roleLabels },
    },
    { key: "createdDate", label: "Created date", type: "date" },
    { key: "resolvedDate", label: "Resolved date (optional)", type: "date" },
  ];

  const emptyRow: Partial<Comment> = {
    projectId: "project-001",
    entityType: null,
    entityId: null,
    text: "",
    status: "Open",
    createdByRoleId: null,
    createdDate: new Date().toISOString().slice(0, 10),
    resolvedDate: null,
  };

  const columns: ColumnDef<Comment>[] = [
    { key: "text", label: "Comment", render: (c) => <span className="truncate">{c.text}</span> },
    {
      key: "entityType",
      label: "Attached to",
      render: (c) => (c.entityType ? `${c.entityType}${c.entityId ? ` (${c.entityId})` : ""}` : "(unattached)"),
      filterOptions: entityTypeOptions,
      filterValue: (c) => c.entityType ?? "",
    },
    { key: "status", label: "Status", filterOptions: COMMENT_STATUSES, filterValue: (c) => c.status },
    { key: "createdByRoleId", label: "Raised by", render: (c) => roleName(c.createdByRoleId) },
    { key: "createdDate", label: "Created", sortValue: (c) => c.createdDate },
    { key: "resolvedDate", label: "Resolved", render: (c) => c.resolvedDate ?? "—" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="comments.heading" defaultValue="Comments / TODOs" as="h2" />
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Comment
        </button>
      </div>
      <EditableText
        contentKey="comments.hint"
        defaultValue={
          "General-purpose notes and TODOs, attached to any record or standing alone. Prefer marking a comment " +
          "Resolved over deleting it — it stays as historical context, the same way this app treats every other " +
          "entity's lifecycle."
        }
        as="p"
        className="hint"
      />
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={(row) => setEditing(row)}
          onDelete={(row) => {
            if (confirm("Delete this comment? Prefer marking it Resolved instead, if it has any historical value.")) {
              remove(row.id);
            }
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Comment" : "Edit Comment"} onClose={() => setEditing(null)}>
          <EntityForm<Comment>
            fields={fields}
            initialValues={editing === "new" ? emptyRow : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = {
                ...values,
                entityType: values.entityType || null,
                entityId: values.entityId || null,
                createdByRoleId: values.createdByRoleId || null,
                resolvedDate: values.resolvedDate || null,
              };
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
