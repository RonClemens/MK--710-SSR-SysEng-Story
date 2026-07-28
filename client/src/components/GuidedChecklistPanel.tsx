import { useState } from "react";
import { Modal } from "./Modal";
import { EditableText } from "./EditableText";
import { EntityForm, type FieldDef } from "./EntityForm";
import {
  CHECKLIST_ITEM_EVIDENCE_TYPES,
  CHECKLIST_ITEM_STATUSES,
  type ChecklistItem,
  type ChecklistItemStatus,
  type Milestone,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  milestone: Milestone;
  entity: ReturnType<typeof useEntity<ChecklistItem>>;
}

const CHECKLIST_ITEM_FIELDS: FieldDef<ChecklistItem>[] = [
  { key: "domain", label: "Domain", type: "text" },
  { key: "criterion", label: "Criterion", type: "textarea" },
  { key: "status", label: "Status", type: "select", options: CHECKLIST_ITEM_STATUSES },
  {
    key: "evidenceType",
    label: "Evidence Type (optional)",
    type: "select",
    options: ["", ...CHECKLIST_ITEM_EVIDENCE_TYPES],
    optionLabels: { "": "(none)" },
  },
  { key: "evidenceId", label: "Evidence ID (optional)", type: "text" },
];

function statusClass(status: ChecklistItemStatus): string {
  switch (status) {
    case "Met":
      return "met";
    case "Not Met":
      return "not-met";
    case "Waived":
      return "waived";
    default:
      return "not-evaluated";
  }
}

export function GuidedChecklistPanel({ milestone, entity }: Props) {
  const items = entity.rows.filter((c) => c.milestoneId === milestone.id);
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ChecklistItem | "new" | null>(null);

  const byDomain = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    if (!byDomain.has(item.domain)) byDomain.set(item.domain, []);
    byDomain.get(item.domain)!.push(item);
  }
  const domains = Array.from(byDomain.keys()).sort();

  function toggleDomain(domain: string) {
    setCollapsedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  const emptyRow: Partial<ChecklistItem> = {
    milestoneId: milestone.id,
    domain: "",
    criterion: "",
    status: "Not Evaluated",
    evidenceType: null,
    evidenceId: null,
  };

  return (
    <div className="guided-checklist-panel">
      <div className="page-header">
        <p className="did-guidance-label">
          <EditableText contentKey="guidedChecklist.readinessLabelPrefix" defaultValue="Readiness criteria for" as="span" />{" "}
          {milestone.event} ({items.length} item{items.length === 1 ? "" : "s"})
        </p>
        <button className="button-primary" onClick={() => setEditing("new")}>
          + Add Checklist Item
        </button>
      </div>

      {items.length === 0 ? (
        <EditableText
          contentKey="guidedChecklist.emptyState"
          defaultValue="No checklist items yet for this milestone."
          as="p"
          className="empty-row"
        />
      ) : (
        domains.map((domain) => {
          const expanded = !collapsedDomains.has(domain);
          const domainItems = byDomain.get(domain)!;
          return (
            <div className="promise-group" key={domain}>
              <button
                type="button"
                className="promise-group-header"
                onClick={() => toggleDomain(domain)}
                aria-expanded={expanded}
              >
                <span className={`promise-group-chevron${expanded ? " expanded" : ""}`}>▶</span>
                <span className="promise-group-title">{domain}</span>
                <span className="promise-group-count">
                  {domainItems.length} item{domainItems.length === 1 ? "" : "s"}
                </span>
              </button>
              {expanded && (
                <div className="promise-group-body">
                  {domainItems.map((item) => (
                    <div className="checklist-item-card" key={item.id}>
                      <p>{item.criterion}</p>
                      <div className="checklist-status-row">
                        {CHECKLIST_ITEM_STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`checklist-status-pill ${statusClass(status)}${
                              item.status === status ? " selected" : ""
                            }`}
                            onClick={() => entity.update(item.id, { status })}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      <p className="hint">
                        <EditableText contentKey="guidedChecklist.evidenceLabel" defaultValue="Evidence:" as="span" />{" "}
                        {item.evidenceType ? `${item.evidenceType} — ${item.evidenceId ?? "—"}` : "—"}
                      </p>
                      <button className="link-button" onClick={() => setEditing(item)}>
                        Edit full record
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add Checklist Item" : "Edit Checklist Item"} onClose={() => setEditing(null)}>
          <EntityForm<ChecklistItem>
            fields={CHECKLIST_ITEM_FIELDS}
            initialValues={editing === "new" ? emptyRow : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = {
                ...values,
                evidenceType: values.evidenceType || null,
                evidenceId: values.evidenceId || null,
              };
              if (editing === "new") await entity.create(payload);
              else await entity.update(editing.id, payload);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
