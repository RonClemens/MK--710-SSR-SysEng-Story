import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { EntityForm, type FieldDef } from "../components/EntityForm";
import type { ConfigurationItem, CotsRecord, QualifiedAlternate } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<CotsRecord>>;
  cis: ConfigurationItem[];
}

// qualifiedAlternates is edited as free text, one "part number | lifecycle status" per line.
function alternatesToText(alts: QualifiedAlternate[]): string {
  return alts.map((a) => `${a.makeModelPartNumber} | ${a.lifecycleStatus}`).join("\n");
}
function textToAlternates(text: string): QualifiedAlternate[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [makeModelPartNumber, lifecycleStatus = ""] = line.split("|").map((s) => s.trim());
      return { makeModelPartNumber, lifecycleStatus };
    });
}

type CotsFormValues = Omit<CotsRecord, "qualifiedAlternates"> & { qualifiedAlternates: string };

export function CotsRecordsPage({ entity, cis }: Props) {
  const { rows, loading, error, create, update, remove } = entity;
  const [editing, setEditing] = useState<CotsRecord | "new" | null>(null);

  const cotsCis = cis.filter((c) => c.type === "COTS");
  const ciOptions = cotsCis.map((c) => c.id);
  const ciLabels = Object.fromEntries(cis.map((c) => [c.id, c.name]));
  const ciName = (id: string) => ciLabels[id] ?? "(unknown CI)";

  const fields: FieldDef<CotsFormValues>[] = [
    { key: "ciId", label: "CI (COTS only)", type: "select", options: ciOptions, optionLabels: ciLabels },
    { key: "functionalRequirement", label: "Functional / performance requirement", type: "textarea" },
    { key: "interfaceRequirement", label: "Interface requirement (ref ICD)", type: "text" },
    { key: "formFitConstraints", label: "Form & fit constraints", type: "textarea" },
    { key: "verificationMethod", label: "Verification method", type: "text" },
    { key: "rationale", label: "Rationale / traceability statement", type: "textarea" },
    { key: "partsListEntry", label: "Parts list entry (make/model/part #, lifecycle)", type: "text" },
    {
      key: "qualifiedAlternates",
      label: "Qualified alternates (one per line: part number | lifecycle status)",
      type: "textarea",
    },
    { key: "obsolescenceMonitoringNotes", label: "Obsolescence monitoring notes", type: "textarea" },
  ];

  const emptyRow: CotsFormValues = {
    id: "",
    ciId: ciOptions[0] ?? "",
    functionalRequirement: "",
    interfaceRequirement: "",
    formFitConstraints: "",
    verificationMethod: "inspection of vendor data sheet",
    rationale: "",
    partsListEntry: "",
    qualifiedAlternates: "",
    obsolescenceMonitoringNotes: "",
    createdAt: "",
    updatedAt: "",
  };

  const columns: ColumnDef<CotsRecord>[] = [
    { key: "ciId", label: "CI", sortValue: (r) => ciName(r.ciId), render: (r) => ciName(r.ciId) },
    { key: "partsListEntry", label: "Parts list entry" },
    { key: "verificationMethod", label: "Verification method" },
    {
      key: "qualifiedAlternates",
      label: "Qualified alternates",
      render: (r) => r.qualifiedAlternates.length,
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>COTS Item Records</h2>
        <button className="button-primary" onClick={() => setEditing("new")} disabled={ciOptions.length === 0}>
          + Add Record
        </button>
      </div>
      {ciOptions.length === 0 && <p className="hint">Mark at least one CI as type "COTS" before adding records.</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={(row) => setEditing(row)}
          onDelete={(row) => {
            if (confirm("Delete this COTS record?")) remove(row.id);
          }}
        />
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add COTS Record" : "Edit COTS Record"} onClose={() => setEditing(null)}>
          <EntityForm<CotsFormValues>
            fields={fields}
            initialValues={
              editing === "new" ? emptyRow : { ...editing, qualifiedAlternates: alternatesToText(editing.qualifiedAlternates) }
            }
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const payload = {
                ...values,
                qualifiedAlternates: textToAlternates(values.qualifiedAlternates ?? ""),
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
