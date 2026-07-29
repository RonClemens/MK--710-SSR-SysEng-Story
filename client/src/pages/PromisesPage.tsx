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
  type Role,
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
  roles: Role[];
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

interface PromiseElement {
  entity: string;
  recordId: string;
  recordLabel: string;
  fields: { field: string; value: string }[];
}

interface PromiseGroup {
  group: string;
  elements: PromiseElement[];
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

// Major groups are a curated consolidation of the ~18 underlying entity
// types above, grouped by SE domain area rather than 1:1 with each type --
// this is what makes the collapse/expand view usable instead of just
// replacing one long flat list with 18 short ones.
const ENTITY_GROUPS: Record<string, string> = {
  Program: "Program & Project",
  Project: "Program & Project",
  Milestone: "Schedule & Milestones",
  Requirement: "Requirements & Verification",
  "Verification Event": "Requirements & Verification",
  "Checklist Item": "Requirements & Verification",
  Gap: "Gaps & Recommendations",
  Recommendation: "Gaps & Recommendations",
  Role: "Gaps & Recommendations",
  "Logical Subsystem": "Technical Baseline",
  "Configuration Item": "Technical Baseline",
  Interface: "Technical Baseline",
  "Delta Matrix Row": "Traceability & Compatibility",
  "A/B Compatibility Row": "Traceability & Compatibility",
  "COTS Record": "COTS & Parts",
  "Qualified Alternate (COTS Record)": "COTS & Parts",
  Specification: "Specifications",
  "Specification Section": "Specifications",
  "Safety Deliverable": "Safety",
  "Program Planning Deliverable": "Program Planning",
};

const GROUP_ORDER = [
  "Program & Project",
  "Schedule & Milestones",
  "Requirements & Verification",
  "Gaps & Recommendations",
  "Technical Baseline",
  "Traceability & Compatibility",
  "COTS & Parts",
  "Specifications",
  "Safety",
  "Program Planning",
  "Attachments",
];

function groupFor(entity: string): string {
  if (entity.startsWith("Attachment")) return "Attachments";
  return ENTITY_GROUPS[entity] ?? "Other";
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
  roles,
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
      // PKM Migration Step 9 (per PKM Migration Plan v0.3.0 §8): Milestone
      // now covers both SETR and AcquisitionGate records in one table --
      // this one rowsFor call surfaces both, no separate "Acquisition
      // Milestone" group needed anymore (see data-schema manifest).
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
      ...rowsFor("Role", roles, (r) => r.name, ["name", "authorityDescription"]),
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
      roles,
      recommendations,
      interfaces,
      specifications,
      safetyDeliverables,
      planningDeliverables,
    ],
  );

  // Two-level hierarchy: major group -> data element (entity + record),
  // each element carrying its own field/value pairs as leaves.
  const groupedData = useMemo<PromiseGroup[]>(() => {
    const elementsByGroup = new Map<string, Map<string, PromiseElement>>();
    for (const row of allRows) {
      const group = groupFor(row.entity);
      if (!elementsByGroup.has(group)) elementsByGroup.set(group, new Map());
      const elements = elementsByGroup.get(group)!;
      const key = `${row.entity}::${row.recordId}`;
      let element = elements.get(key);
      if (!element) {
        element = { entity: row.entity, recordId: row.recordId, recordLabel: row.recordLabel, fields: [] };
        elements.set(key, element);
      }
      element.fields.push({ field: row.field, value: row.value });
    }
    const extraGroups = Array.from(elementsByGroup.keys()).filter((g) => !GROUP_ORDER.includes(g));
    return [...GROUP_ORDER, ...extraGroups]
      .filter((g) => elementsByGroup.has(g))
      .map((group) => ({ group, elements: Array.from(elementsByGroup.get(group)!.values()) }));
  }, [allRows]);

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of groupedData) {
      counts.set(
        g.group,
        g.elements.reduce((sum, el) => sum + el.fields.length, 0),
      );
    }
    return counts;
  }, [groupedData]);

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const searchTerm = search.trim().toLowerCase();

  function toggleGroupFilter(group: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function toggleCollapsed(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  // Search filters down to matching field rows, but never drops the
  // group/element headers wrapping them -- a match always stays visible
  // inside its full hierarchical context, never as a bare flat row.
  const visibleGroups = useMemo(() => {
    return groupedData
      .filter((g) => selectedGroups.size === 0 || selectedGroups.has(g.group))
      .map((g) => {
        if (!searchTerm) return g;
        const elements = g.elements
          .map((el) => {
            const wholeRecordMatches =
              el.entity.toLowerCase().includes(searchTerm) || el.recordLabel.toLowerCase().includes(searchTerm);
            const fields = wholeRecordMatches
              ? el.fields
              : el.fields.filter(
                  (f) => f.field.toLowerCase().includes(searchTerm) || f.value.toLowerCase().includes(searchTerm),
                );
            return { ...el, fields };
          })
          .filter((el) => el.fields.length > 0);
        return { ...g, elements };
      })
      .filter((g) => g.elements.length > 0);
  }, [groupedData, selectedGroups, searchTerm]);

  const visibleValueCount = visibleGroups.reduce(
    (sum, g) => sum + g.elements.reduce((s, el) => s + el.fields.length, 0),
    0,
  );

  // A search match always forces its group open, regardless of manual
  // collapse state, so results are never hidden behind a closed header.
  const isExpanded = (group: string) => searchTerm !== "" || !collapsedGroups.has(group);

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="promises.heading" defaultValue="PDKM Promises" as="h2" />
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
        {visibleValueCount} promised value{visibleValueCount === 1 ? "" : "s"} shown, {allRows.length} total across{" "}
        {groupedData.length} groups
      </p>

      <div className="pill-filter-row">
        <button
          type="button"
          className={`pill-filter${selectedGroups.size === 0 ? " active" : ""}`}
          onClick={() => setSelectedGroups(new Set())}
        >
          All
        </button>
        {groupedData.map((g) => (
          <button
            key={g.group}
            type="button"
            className={`pill-filter${selectedGroups.has(g.group) ? " active" : ""}`}
            onClick={() => toggleGroupFilter(g.group)}
          >
            {g.group} ({groupCounts.get(g.group) ?? 0})
          </button>
        ))}
      </div>

      <label className="filter-control search-control">
        <span>Search</span>
        <input
          type="text"
          placeholder="Search entity, record, field, or value…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className="promises-groups">
        {visibleGroups.length === 0 ? (
          <EditableText
            contentKey="promises.noMatchesEmptyState"
            defaultValue="No promised values match this filter."
            as="p"
            className="empty-row"
          />
        ) : (
          visibleGroups.map((g) => {
            const expanded = isExpanded(g.group);
            const groupValueCount = g.elements.reduce((s, el) => s + el.fields.length, 0);
            return (
              <div className="promise-group" key={g.group}>
                <button
                  type="button"
                  className="promise-group-header"
                  onClick={() => toggleCollapsed(g.group)}
                  aria-expanded={expanded}
                >
                  <span className={`promise-group-chevron${expanded ? " expanded" : ""}`}>▶</span>
                  <span className="promise-group-title">{g.group}</span>
                  <span className="promise-group-count">
                    {groupValueCount} value{groupValueCount === 1 ? "" : "s"}
                  </span>
                </button>
                {expanded && (
                  <div className="promise-group-body">
                    {g.elements.map((el) => (
                      <div className="promise-element" key={`${el.entity}-${el.recordId}`}>
                        <div className="promise-element-name">
                          <span className="promise-element-entity">{el.entity}</span>
                          <span className="promise-element-label">{el.recordLabel}</span>
                        </div>
                        <dl className="promise-element-fields">
                          {el.fields.map((f) => (
                            <div className="promise-field-row" key={f.field}>
                              <dt>{f.field}</dt>
                              <dd>{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
