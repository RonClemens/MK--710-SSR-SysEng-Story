import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { EditableText } from "../components/EditableText";
import {
  RISK_ITEM_TYPES,
  RISK_MITIGATION_STRATEGIES,
  RISK_ITEM_STATUSES,
  RISK_SCORE_VALUES,
  type ConfigurationItem,
  type Milestone,
  type RiskItem,
  type Role,
} from "../types";
import { deriveRiskLevel } from "../utils/riskItem";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<RiskItem>>;
  roles: Role[];
  milestones: Milestone[];
  cis: ConfigurationItem[];
}

// Scores (likelihood, consequenceCost/Schedule/Performance) are edited via
// type: "select" (EntityForm has no native numeric input) and converted
// number<->string at the form boundary, mirroring CotsRecordsPage's own
// textarea<->array conversion pattern.
type RiskItemFormValues = Omit<
  RiskItem,
  "likelihood" | "consequenceCost" | "consequenceSchedule" | "consequencePerformance"
> & {
  likelihood: string;
  consequenceCost: string;
  consequenceSchedule: string;
  consequencePerformance: string;
};

const SCORE_OPTIONS = RISK_SCORE_VALUES.map(String);

export function RiskItemsPage({ entity, roles, milestones, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<RiskItem | "new" | null>(null);

  const roleLabels = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const roleName = (id: string | null) => (id ? roleLabels[id] ?? "(unknown role)" : "—");
  const milestoneLabels = Object.fromEntries(milestones.map((m) => [m.id, m.event]));
  const milestoneName = (id: string | null) => (id ? milestoneLabels[id] ?? "(unknown milestone)" : "—");
  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string | null) => (id ? ciLabels[id] ?? "(unknown CI)" : "—");

  const fields: FieldDef<RiskItemFormValues>[] = [
    { key: "itemType", label: "Type", type: "select", options: RISK_ITEM_TYPES },
    { key: "category", label: "Category", type: "text" },
    {
      key: "likelihood",
      label: "Likelihood (1-5; leave unset for Issue — already occurred)",
      type: "select",
      options: ["", ...SCORE_OPTIONS],
      optionLabels: { "": "(n/a — Issue)" },
    },
    { key: "consequenceCost", label: "Consequence — Cost (1-5)", type: "select", options: SCORE_OPTIONS },
    { key: "consequenceSchedule", label: "Consequence — Schedule (1-5)", type: "select", options: SCORE_OPTIONS },
    { key: "consequencePerformance", label: "Consequence — Performance (1-5)", type: "select", options: SCORE_OPTIONS },
    { key: "mitigationStrategy", label: "Mitigation strategy", type: "select", options: RISK_MITIGATION_STRATEGIES },
    { key: "status", label: "Status", type: "select", options: RISK_ITEM_STATUSES },
    {
      key: "ownerRoleId",
      label: "Owner role (optional)",
      type: "select",
      options: ["", ...roles.map((r) => r.id)],
      optionLabels: { "": "(unassigned)", ...roleLabels },
    },
    {
      key: "linkedMilestoneId",
      label: "Linked milestone (optional)",
      type: "select",
      options: ["", ...milestones.map((m) => m.id)],
      optionLabels: { "": "(none)", ...milestoneLabels },
    },
    {
      key: "linkedCiId",
      label: "Linked CI (optional)",
      type: "select",
      options: ["", ...cis.map((c) => c.id)],
      optionLabels: { "": "(none)", ...ciLabels },
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "identifiedDate", label: "Identified date", type: "date" },
    { key: "approvalDate", label: "Approval date (optional)", type: "date" },
    { key: "plannedClosureDate", label: "Planned closure date (optional)", type: "date" },
    { key: "actualClosureDate", label: "Actual closure date (optional)", type: "date" },
  ];

  const emptyRow: Partial<RiskItemFormValues> = {
    projectId: "project-001",
    itemType: "Risk",
    category: "",
    likelihood: "",
    consequenceCost: "1",
    consequenceSchedule: "1",
    consequencePerformance: "1",
    mitigationStrategy: "Accept",
    ownerRoleId: null,
    linkedMilestoneId: null,
    linkedCiId: null,
    description: "",
    identifiedDate: null,
    approvalDate: null,
    plannedClosureDate: null,
    actualClosureDate: null,
    status: "Identified",
  };

  const columns: ColumnDef<RiskItem>[] = [
    { key: "itemType", label: "Type", filterOptions: RISK_ITEM_TYPES, filterValue: (r) => r.itemType },
    { key: "category", label: "Category" },
    { key: "description", label: "Description", render: (r) => <span className="truncate">{r.description}</span> },
    { key: "riskLevel", label: "Risk level (derived)", render: (r) => deriveRiskLevel(r) },
    { key: "mitigationStrategy", label: "Mitigation", filterOptions: RISK_MITIGATION_STRATEGIES, filterValue: (r) => r.mitigationStrategy },
    { key: "status", label: "Status", filterOptions: RISK_ITEM_STATUSES, filterValue: (r) => r.status },
    { key: "ownerRoleId", label: "Owner role", render: (r) => roleName(r.ownerRoleId) },
    { key: "linkedMilestoneId", label: "Linked milestone", render: (r) => milestoneName(r.linkedMilestoneId) },
    { key: "linkedCiId", label: "Linked CI", render: (r) => ciName(r.linkedCiId) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="riskItems.heading" defaultValue="Risks, Issues & Opportunities" as="h2" />
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Risk Item
        </button>
      </div>
      <EditableText
        contentKey="riskItems.hint"
        defaultValue="Risk level is derived from likelihood x max consequence per a standard 5x5 risk matrix, not stored. Issues have no likelihood score (treated as 1 — already occurred)."
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
            if (confirm("Delete this risk item?")) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Risk Item" : "Edit Risk Item"} onClose={() => setEditing(null)}>
          <EntityForm<RiskItemFormValues>
            fields={fields}
            initialValues={
              editing === "new"
                ? emptyRow
                : {
                    ...editing,
                    likelihood: editing.likelihood === null ? "" : String(editing.likelihood),
                    consequenceCost: String(editing.consequenceCost),
                    consequenceSchedule: String(editing.consequenceSchedule),
                    consequencePerformance: String(editing.consequencePerformance),
                  }
            }
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = {
                ...values,
                likelihood: values.likelihood ? Number(values.likelihood) : null,
                consequenceCost: Number(values.consequenceCost),
                consequenceSchedule: Number(values.consequenceSchedule),
                consequencePerformance: Number(values.consequencePerformance),
                ownerRoleId: values.ownerRoleId || null,
                linkedMilestoneId: values.linkedMilestoneId || null,
                linkedCiId: values.linkedCiId || null,
                identifiedDate: values.identifiedDate || null,
                approvalDate: values.approvalDate || null,
                plannedClosureDate: values.plannedClosureDate || null,
                actualClosureDate: values.actualClosureDate || null,
              };
              if (editing === "new") await create(payload as unknown as Partial<RiskItem>);
              else await update(editing.id, payload as unknown as Partial<RiskItem>);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
