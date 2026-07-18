import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { COMPATIBILITY_STATUSES, type AbCompatibilityRow, type ConfigurationItem } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<AbCompatibilityRow>>;
  cis: ConfigurationItem[];
}

export function AbCompatibilityPage({ entity, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<AbCompatibilityRow | "new" | null>(null);

  const tier1Cis = cis.filter((c) => c.tier === "Tier 1");
  const ciOptions = tier1Cis.map((c) => c.id);
  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string) => ciLabels[id] ?? "(unknown CI)";

  const fields: FieldDef<AbCompatibilityRow>[] = [
    { key: "ciId", label: "Interface / CI (Tier 1 only)", type: "select", options: ciOptions, optionLabels: ciLabels },
    { key: "baselineAState", label: "Baseline A current state", type: "textarea" },
    { key: "baselineBIntent", label: "Baseline B design intent", type: "textarea" },
    { key: "compatibilityStatus", label: "Compatibility status", type: "select", options: COMPATIBILITY_STATUSES },
    { key: "riskNote", label: "Risk note / mitigation plan", type: "textarea" },
    { key: "lastReviewedDate", label: "Last reviewed date", type: "date" },
  ];

  const emptyRow: Partial<AbCompatibilityRow> = {
    ciId: ciOptions[0] ?? "",
    baselineAState: "",
    baselineBIntent: "",
    compatibilityStatus: "Aligned",
    riskNote: "",
    lastReviewedDate: new Date().toISOString().slice(0, 10),
  };

  const columns: ColumnDef<AbCompatibilityRow>[] = [
    { key: "ciId", label: "Interface / CI", sortValue: (r) => ciName(r.ciId), render: (r) => ciName(r.ciId) },
    {
      key: "compatibilityStatus",
      label: "Status",
      filterOptions: COMPATIBILITY_STATUSES,
      filterValue: (r) => r.compatibilityStatus,
    },
    { key: "riskNote", label: "Risk note", render: (r) => <span className="truncate">{r.riskNote}</span> },
    { key: "lastReviewedDate", label: "Last reviewed", sortValue: (r) => r.lastReviewedDate },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>A/B Compatibility Matrix</h2>
        <EditableText
          contentKey="page.abCompatibility.hint"
          defaultValue="Scoped to Tier 1 (UUT-relevant) interfaces"
          as="span"
          className="hint"
        />
        <button className="button-primary" onClick={() => setEditing("new")} disabled={ciOptions.length === 0}>
          + Add Row
        </button>
      </div>
      {ciOptions.length === 0 && <p className="hint">Mark at least one CI as Tier 1 before adding A/B rows.</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={(row) => setEditing(row)}
          onDelete={(row) => {
            if (confirm("Delete this A/B compatibility row?")) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add A/B Compatibility Row" : "Edit A/B Compatibility Row"} onClose={() => setEditing(null)}>
          <EntityForm<AbCompatibilityRow>
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
