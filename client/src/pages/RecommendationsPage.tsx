import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { EditableText } from "../components/EditableText";
import {
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_STATUSES,
  type ConfigurationItem,
  type Gap,
  type Recommendation,
  type Role,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<Recommendation>>;
  roles: ReturnType<typeof useEntity<Role>>;
  cis: ConfigurationItem[];
  gaps: Gap[];
}

// PKM Migration Step 11 (per PKM Migration Plan v0.4.0 §9): the owner
// dropdown below now reads live Role records instead of the retired
// RECOMMENDATION_OWNER_ROLES const -- this is the actual point of the
// step (roles addable/removable per program, not a fixed enum). `owner`
// itself is untouched in the data model (still populated on pre-existing
// records) but is no longer this form's edited field; assignedRoleId is.
export function RecommendationsPage({ entity, roles, cis, gaps }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<Recommendation | "new" | null>(null);
  const [managingRoles, setManagingRoles] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | "new" | null>(null);

  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string | null) => (id ? ciLabels[id] ?? "(unknown CI)" : "—");
  const gapsById = Object.fromEntries(gaps.map((g) => [g.id, g]));
  const roleLabels = Object.fromEntries(roles.rows.map((r) => [r.id, r.name]));
  const roleName = (id: string | null) => (id ? roleLabels[id] ?? "(unknown role)" : "—");

  const fields: FieldDef<Recommendation>[] = [
    { key: "text", label: "Recommendation text", type: "textarea" },
    { key: "category", label: "Category", type: "select", options: RECOMMENDATION_CATEGORIES },
    { key: "status", label: "Status", type: "select", options: RECOMMENDATION_STATUSES },
    {
      key: "assignedRoleId",
      label: "Assigned role (optional)",
      type: "select",
      options: ["", ...roles.rows.map((r) => r.id)],
      optionLabels: { "": "(unassigned)", ...roleLabels },
    },
    {
      key: "relatedCiId",
      label: "Related CI (optional)",
      type: "select",
      options: ["", ...cis.map((c) => c.id)],
      optionLabels: { "": "(none)", ...ciLabels },
    },
    {
      key: "resolvesGapId",
      label: "Resolves Gap (optional)",
      type: "select",
      options: ["", ...gaps.map((g) => g.id)],
      optionLabels: { "": "(none)", ...Object.fromEntries(gaps.map((g) => [g.id, g.description])) },
    },
  ];

  const emptyRow: Partial<Recommendation> = {
    text: "",
    category: "other",
    status: "open",
    assignedRoleId: null,
    relatedCiId: null,
    resolvesGapId: null,
  };

  const columns: ColumnDef<Recommendation>[] = [
    { key: "text", label: "Recommendation", render: (r) => <span className="truncate">{r.text}</span> },
    { key: "category", label: "Category", filterOptions: RECOMMENDATION_CATEGORIES, filterValue: (r) => r.category },
    { key: "status", label: "Status", filterOptions: RECOMMENDATION_STATUSES, filterValue: (r) => r.status },
    {
      key: "assignedRoleId",
      label: "Assigned role",
      render: (r) => roleName(r.assignedRoleId),
      filterOptions: roles.rows.map((r) => r.id),
      filterValue: (r) => r.assignedRoleId ?? "",
    },
    { key: "relatedCiId", label: "Related CI", render: (r) => ciName(r.relatedCiId) },
    {
      key: "resolvesGapId",
      label: "Resolves Gap",
      render: (r) => (r.resolvesGapId ? gapsById[r.resolvesGapId]?.description ?? "(unknown gap)" : "—"),
    },
  ];

  const roleFields: FieldDef<Role>[] = [
    { key: "name", label: "Role name", type: "text" },
    { key: "authorityDescription", label: "Authority / responsibility (optional)", type: "textarea" },
  ];

  const roleColumns: ColumnDef<Role>[] = [
    { key: "name", label: "Name" },
    { key: "isDefault", label: "Default", render: (r) => (r.isDefault ? "Yes" : "No") },
    {
      key: "authorityDescription",
      label: "Authority / responsibility",
      render: (r) => r.authorityDescription ?? "—",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="recommendations.heading" defaultValue="Recommendations / Action Items" as="h2" />
        <div className="page-header-actions">
          <button className="button-secondary" onClick={() => setManagingRoles((v) => !v)}>
            {managingRoles ? "Hide Roles" : "Manage Roles"}
          </button>
          <button className="button-primary" onClick={() => setEditing("new")}>
            + Add Recommendation
          </button>
        </div>
      </div>

      {managingRoles && (
        <div className="roles-panel">
          <div className="page-header">
            <EditableText contentKey="recommendations.rolesHeading" defaultValue="Roles" as="h3" />
            <button className="button-secondary" onClick={() => setEditingRole("new")}>
              + Add Role
            </button>
          </div>
          <EditableText
            contentKey="recommendations.rolesHint"
            defaultValue="Program-tailorable role taxonomy for Recommendation assignment. Default roles (isDefault) are this app's own starting set; add or remove roles to match a real program's RACI conventions."
            as="p"
            className="hint"
          />
          <DataTable
            columns={roleColumns}
            rows={roles.rows}
            onEdit={(row) => setEditingRole(row)}
            onDelete={(row) => {
              if (confirm("Delete this role? Recommendations assigned to it will show as unassigned.")) {
                roles.remove(row.id);
              }
            }}
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
              const payload = {
                ...values,
                assignedRoleId: values.assignedRoleId || null,
                relatedCiId: values.relatedCiId || null,
                resolvesGapId: values.resolvesGapId || null,
              };
              if (editing === "new") await create(payload);
              else await update(editing.id, payload);
              setEditing(null);
            }}
          />
        </Modal>
      )}
      {editingRole && (
        <Modal title={editingRole === "new" ? "Add Role" : "Edit Role"} onClose={() => setEditingRole(null)}>
          <EntityForm<Role>
            fields={roleFields}
            initialValues={
              editingRole === "new"
                ? { name: "", authorityDescription: null, isDefault: false, projectId: "project-001" }
                : editingRole
            }
            onCancel={() => setEditingRole(null)}
            onSubmit={async (values) => {
              const payload = { ...values, authorityDescription: values.authorityDescription || null };
              if (editingRole === "new") await roles.create({ ...payload, isDefault: false });
              else await roles.update(editingRole.id, payload);
              setEditingRole(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
