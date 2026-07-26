import { useMemo, useState } from "react";
import { EditableText } from "../components/EditableText";
import {
  PDKM_PROMISES_INTRO,
  PDKM_PROMISE_CHANNELS,
  PDKM_PROMISE_RIPPLE_NOTE,
} from "../../../methodology/guidance/pdkmPromisesGuidance";
import {
  SPEC_SECTION_KEYS,
  type AbCompatibilityRow,
  type Attachment,
  type ChecklistItem,
  type ConfigurationItem,
  type CotsRecord,
  type DeltaMatrixRow,
  type Gap,
  type InterfaceRecord,
  type LogicalSubsystem,
  type Milestone,
  type Program,
  type ProgramPlanningDeliverable,
  type Project,
  type Recommendation,
  type Requirement,
  type SafetyDeliverable,
  type Specification,
  type VerificationEvent,
} from "../types";

interface Props {
  programs: Program[];
  projects: Project[];
  milestones: Milestone[];
  requirements: Requirement[];
  verificationEvents: VerificationEvent[];
  checklistItems: ChecklistItem[];
  gaps: Gap[];
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  interfaces: InterfaceRecord[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  planningDeliverables: ProgramPlanningDeliverable[];
}

interface PromiseRow {
  entity: string;
  recordId: string;
  recordLabel: string;
  field: string;
  value: string;
}

// This entity/field list must match data-schema/DOMAIN_PLACEHOLDER_FIELDS.md
// exactly -- kept in sync by hand, the same as every other dual-maintained
// list in this app (see that manifest's own note pointing back here).
function rowsFor<T extends { id: string }>(
  entity: string,
  rows: T[],
  labelOf: (row: T) => string,
  fields: (keyof T & string)[],
): PromiseRow[] {
  return rows.flatMap((row) =>
    fields.map((field) => ({
      entity,
      recordId: row.id,
      recordLabel: labelOf(row),
      field,
      value: String(row[field] ?? "—"),
    })),
  );
}

function attachmentRowsFor<T extends { id: string; attachments: Attachment[] }>(
  parentEntity: string,
  rows: T[],
  labelOf: (row: T) => string,
): PromiseRow[] {
  return rows.flatMap((row) =>
    row.attachments.map((a, i) => ({
      entity: `Attachment (${parentEntity})`,
      recordId: `${row.id}-attachment-${i}`,
      recordLabel: labelOf(row),
      field: "label",
      value: a.label,
    })),
  );
}

function qualifiedAlternateRows(cotsRecords: CotsRecord[]): PromiseRow[] {
  return cotsRecords.flatMap((r) =>
    r.qualifiedAlternates.flatMap((qa, i) => [
      {
        entity: "Qualified Alternate (COTS Record)",
        recordId: `${r.id}-alternate-${i}`,
        recordLabel: r.ciId,
        field: "makeModelPartNumber",
        value: qa.makeModelPartNumber,
      },
      {
        entity: "Qualified Alternate (COTS Record)",
        recordId: `${r.id}-alternate-${i}`,
        recordLabel: r.ciId,
        field: "lifecycleStatus",
        value: qa.lifecycleStatus,
      },
    ]),
  );
}

function specSectionRows(specifications: Specification[]): PromiseRow[] {
  return specifications.flatMap((s) =>
    SPEC_SECTION_KEYS.map((key) => ({
      entity: "Specification Section",
      recordId: `${s.id}-${key}`,
      recordLabel: s.title,
      field: key,
      value: s.sections[key],
    })),
  );
}

export function PromisesPage({
  programs,
  projects,
  milestones,
  requirements,
  verificationEvents,
  checklistItems,
  gaps,
  logicalSubsystems,
  cis,
  deltaMatrix,
  abCompatibility,
  cotsRecords,
  recommendations,
  interfaces,
  specifications,
  safetyDeliverables,
  planningDeliverables,
}: Props) {
  const allRows = useMemo<PromiseRow[]>(
    () => [
      ...rowsFor("Program", programs, (r) => r.name, ["name", "description"]),
      ...rowsFor("Project", projects, (r) => r.name, ["name", "description"]),
      ...rowsFor("Milestone", milestones, (r) => `${r.event} (${r.baselineId})`, ["actualDate", "plannedDate"]),
      ...rowsFor("Requirement", requirements, (r) => r.id, ["statement"]),
      ...rowsFor("Verification Event", verificationEvents, (r) => r.requirementId, ["evidenceSummary"]),
      ...rowsFor("Checklist Item", checklistItems, (r) => r.milestoneId, ["criterion"]),
      ...rowsFor("Gap", gaps, (r) => `${r.foundInEntityType}:${r.foundInEntityId}`, ["description"]),
      ...rowsFor("Logical Subsystem", logicalSubsystems, (r) => r.name, ["name", "description"]),
      ...rowsFor("Configuration Item", cis, (r) => r.name, ["name", "consolidationNotes", "status", "notes"]),
      ...attachmentRowsFor("Configuration Item", cis, (r) => r.name),
      ...rowsFor("Delta Matrix Row", deltaMatrix, (r) => r.ciId, [
        "sfrAllocation",
        "actualDecomposition",
        "delta",
        "rationale",
      ]),
      ...rowsFor("A/B Compatibility Row", abCompatibility, (r) => r.ciId, [
        "baselineAState",
        "baselineBIntent",
        "riskNote",
      ]),
      ...rowsFor("COTS Record", cotsRecords, (r) => r.ciId, [
        "functionalRequirement",
        "interfaceRequirement",
        "formFitConstraints",
        "verificationMethod",
        "rationale",
        "partsListEntry",
        "obsolescenceMonitoringNotes",
      ]),
      ...attachmentRowsFor("COTS Record", cotsRecords, (r) => r.ciId),
      ...qualifiedAlternateRows(cotsRecords),
      ...rowsFor("Recommendation", recommendations, (r) => r.category, ["text"]),
      ...rowsFor("Interface", interfaces, (r) => `${r.aId} ↔ ${r.bId}`, ["description"]),
      ...rowsFor("Specification", specifications, (r) => r.title, ["title"]),
      ...attachmentRowsFor("Specification", specifications, (r) => r.title),
      ...specSectionRows(specifications),
      ...rowsFor("Safety Deliverable", safetyDeliverables, (r) => r.title, [
        "title",
        "hazardExample",
        "cdrlDescription",
        "deliveryMilestone",
      ]),
      ...attachmentRowsFor("Safety Deliverable", safetyDeliverables, (r) => r.title),
      ...rowsFor("Program Planning Deliverable", planningDeliverables, (r) => r.title, [
        "title",
        "cdrlDescription",
        "deliveryMilestone",
      ]),
      ...attachmentRowsFor("Program Planning Deliverable", planningDeliverables, (r) => r.title),
    ],
    [
      programs,
      projects,
      milestones,
      requirements,
      verificationEvents,
      checklistItems,
      gaps,
      logicalSubsystems,
      cis,
      deltaMatrix,
      abCompatibility,
      cotsRecords,
      recommendations,
      interfaces,
      specifications,
      safetyDeliverables,
      planningDeliverables,
    ],
  );

  const entities = useMemo(() => Array.from(new Set(allRows.map((r) => r.entity))).sort(), [allRows]);
  const [entityFilter, setEntityFilter] = useState("");

  const visibleRows = entityFilter ? allRows.filter((r) => r.entity === entityFilter) : allRows;

  return (
    <div className="page">
      <div className="page-header">
        <h2>PDKM Promises</h2>
        <EditableText
          contentKey="page.promises.hint"
          defaultValue="Every synthetic value below is a promise — explore what changes once the real PDKM lands."
          as="span"
          className="hint"
        />
      </div>

      <EditableText contentKey="promises.intro" defaultValue={PDKM_PROMISES_INTRO} as="p" className="hint" />
      <EditableText contentKey="promises.channels" defaultValue={PDKM_PROMISE_CHANNELS} as="p" className="hint" />
      <EditableText contentKey="promises.rippleNote" defaultValue={PDKM_PROMISE_RIPPLE_NOTE} as="p" className="hint" />

      <p className="did-guidance-label">
        {visibleRows.length} promised value{visibleRows.length === 1 ? "" : "s"} shown, {allRows.length} total across{" "}
        {entities.length} entity types
      </p>

      <label className="filter-control">
        <span>Entity</span>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          <option value="">All</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Record</th>
              <th>Field</th>
              <th>Current (synthetic) value</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No promised values.
                </td>
              </tr>
            ) : (
              visibleRows.map((r) => (
                <tr key={`${r.entity}-${r.recordId}-${r.field}`}>
                  <td>{r.entity}</td>
                  <td className="truncate">{r.recordLabel}</td>
                  <td>{r.field}</td>
                  <td className="truncate">{r.value}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
