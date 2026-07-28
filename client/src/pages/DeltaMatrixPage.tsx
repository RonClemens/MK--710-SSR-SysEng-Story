import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import { TRACEABILITY_HAZARD_NOTE } from "../../../methodology/guidance/safetyGuidance";
import { DELTA_SOURCES, DISPOSITIONS, type ConfigurationItem, type DeltaMatrixRow, type Gap, type Requirement } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<DeltaMatrixRow>>;
  cis: ConfigurationItem[];
  requirements: Requirement[];
  gaps: Gap[];
}

export function DeltaMatrixPage({ entity, cis, requirements, gaps }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<DeltaMatrixRow | "new" | null>(null);

  const ciOptions = cis.map((c) => c.id);
  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string) => ciLabels[id] ?? "(unknown CI)";
  const requirementsById = Object.fromEntries(requirements.map((r) => [r.id, r]));
  const gapsById = Object.fromEntries(gaps.map((g) => [g.id, g]));
  // PKM Migration Step 4: the requirement's *current* as-built satisfaction,
  // which can differ from this row's own sfrAllocation/actualDecomposition
  // text -- that's exactly the gap this row exists to record.
  function satisfiedBy(req: Requirement): string {
    return req.satisfiedByCiIds.length === 0 ? "(none)" : req.satisfiedByCiIds.map(ciName).join(", ");
  }

  const fields: FieldDef<DeltaMatrixRow>[] = [
    { key: "ciId", label: "CI", type: "select", options: ciOptions, optionLabels: ciLabels },
    { key: "sfrAllocation", label: "SFR-agreed allocation", type: "textarea" },
    { key: "actualDecomposition", label: "Actual / validated decomposition", type: "textarea" },
    { key: "delta", label: "Delta", type: "textarea" },
    { key: "deltaSource", label: "Delta source", type: "select", options: DELTA_SOURCES },
    { key: "rationale", label: "Rationale", type: "textarea" },
    { key: "disposition", label: "Disposition", type: "select", options: DISPOSITIONS },
  ];

  const emptyRow: Partial<DeltaMatrixRow> = {
    ciId: cis[0]?.id ?? "",
    sfrAllocation: "",
    actualDecomposition: "",
    delta: "",
    deltaSource: "None",
    rationale: "",
    disposition: "TBD pending analysis",
  };

  const columns: ColumnDef<DeltaMatrixRow>[] = [
    { key: "ciId", label: "CI", sortValue: (r) => ciName(r.ciId), render: (r) => ciName(r.ciId) },
    { key: "delta", label: "Delta", render: (r) => <span className="truncate">{r.delta}</span> },
    {
      key: "deltaSource",
      label: "Delta source",
      filterOptions: DELTA_SOURCES,
      filterValue: (r) => r.deltaSource,
    },
    {
      key: "disposition",
      label: "Disposition",
      filterOptions: DISPOSITIONS,
      filterValue: (r) => r.disposition,
    },
    {
      key: "requirementId",
      label: "Requirement (structural)",
      render: (r) => {
        const req = r.requirementId ? requirementsById[r.requirementId] : null;
        if (!req) return "(unlinked)";
        return (
          <span title={req.statement}>
            <span className="truncate">{req.statement}</span>
            <br />
            <span className="hint">satisfied by: {satisfiedBy(req)}</span>
          </span>
        );
      },
    },
    {
      key: "gapId",
      label: "Gap (structural)",
      render: (r) => {
        const gap = r.gapId ? gapsById[r.gapId] : null;
        if (!gap) return "(unlinked)";
        return <span title={gap.description}>{gap.disposition}</span>;
      },
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="deltaMatrix.heading" defaultValue="Delta / Traceability Matrix" as="h2" />
        <button className="button-primary" onClick={() => setEditing("new")} disabled={cis.length === 0}>
          + Add Row
        </button>
      </div>
      {cis.length === 0 && (
        <EditableText
          contentKey="deltaMatrix.noCiHint"
          defaultValue="Add a CI first before creating delta matrix rows."
          as="p"
          className="hint"
        />
      )}
      <div className="safety-callout">
        <EditableText contentKey="safety.deltaMatrix.traceabilityNote" defaultValue={TRACEABILITY_HAZARD_NOTE} as="span" />
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
            if (confirm("Delete this delta matrix row?")) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Delta Matrix Row" : "Edit Delta Matrix Row"} onClose={() => setEditing(null)}>
          <EntityForm<DeltaMatrixRow>
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
