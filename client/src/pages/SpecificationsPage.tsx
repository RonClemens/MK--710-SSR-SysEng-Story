import { useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { SpecMetadataForm, type SpecMetadataValues } from "../components/SpecMetadataForm";
import {
  LEVEL_GUIDANCE,
  SPEC_TYPE_GUIDANCE,
  COMPETENCY_FRAMEWORK_INTRO,
  COMPETENCY_CLASS,
  emptySections,
  levelLabel,
} from "../../../methodology/guidance/didGuidance";
import { HAZARD_ANALYSIS_META, SAFETY_BY_LEVEL, SAFETY_FRAMEWORK_INTRO } from "../../../methodology/guidance/safetyGuidance";
import {
  RECURRING_TECHNICAL_ACTIVITIES,
  RECURRING_TECHNICAL_ACTIVITIES_INTRO,
  SETR_EVENTS,
  SETR_FRAMEWORK_INTRO,
  SETR_GUIDANCE,
} from "../../../methodology/guidance/setrGuidance";
import { POINTER_SPEC_CATALOG, POINTER_SPEC_INTRO, POINTER_SPEC_PRINCIPLES } from "../../../methodology/guidance/pointerSpecGuidance";
import {
  CM_FUNCTIONAL_AREAS,
  FCA_PCA_NOTE,
  TDP_CONTENT_ELEMENTS,
  TDP_FRAMEWORK_INTRO,
  TDP_MATURITY_LEVELS,
  TDP_MATURITY_META,
} from "../../../methodology/guidance/tdpGuidance";
import { DbxMbxCard } from "../components/DbxMbxCard";
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../../../methodology/guidance/dbxMbxGuidance";

const specWritingDimension = DBX_MBX_DIMENSIONS.find((d) => d.id === "specificationWriting")!;
import {
  SPEC_BASELINES,
  SPEC_DOMAINS,
  SPEC_LEVELS,
  SPEC_STATUSES,
  SPEC_TYPES,
  type ConfigurationItem,
  type LogicalSubsystem,
  type Specification,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entity: ReturnType<typeof useEntity<Specification>>;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  onSelectSpecification: (id: string) => void;
}

export function SpecificationsPage({ entity, subsystems, cis, onSelectSpecification }: Props) {
  const { rows, loading, error, create, remove } = entity;
  const [showGuidance, setShowGuidance] = useState(true);
  const [creating, setCreating] = useState(false);

  const subsystemNames = Object.fromEntries(subsystems.map((s) => [s.id, s.name]));
  const ciNames = Object.fromEntries(cis.map((c) => [c.id, c.name]));

  function linkedTo(spec: Specification): string {
    if (spec.level === "Subsystem" && spec.linkedSubsystemId) return subsystemNames[spec.linkedSubsystemId] ?? "—";
    if (spec.level === "CI" && spec.linkedCiId) return ciNames[spec.linkedCiId] ?? "—";
    if (spec.level === "System") return "(whole system)";
    return "(not yet linked)";
  }

  const columns: ColumnDef<Specification>[] = [
    {
      key: "title",
      label: "Title",
      sortValue: (r) => r.title,
      render: (r) => (
        <button className="link-button" onClick={() => onSelectSpecification(r.id)}>
          {r.title}
        </button>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (r) => levelLabel(r.level, r.domain),
      filterOptions: SPEC_LEVELS,
      filterOptionLabels: { CI: "HWCI / CSCI" },
      filterValue: (r) => r.level,
    },
    { key: "domain", label: "Domain", filterOptions: SPEC_DOMAINS, filterValue: (r) => r.domain },
    { key: "specType", label: "Spec Type", filterOptions: SPEC_TYPES, filterValue: (r) => r.specType },
    { key: "baseline", label: "Baseline", filterOptions: SPEC_BASELINES, filterValue: (r) => r.baseline },
    { key: "status", label: "Status", filterOptions: SPEC_STATUSES, filterValue: (r) => r.status },
    { key: "linkedTo", label: "Linked to", render: linkedTo },
    {
      key: "attachments",
      label: "Links",
      render: (r) =>
        r.attachments.length === 0 ? (
          "—"
        ) : (
          <span className="badge" title={r.attachments.map((a) => a.label).join(", ")}>
            {r.attachments.length} 📎
          </span>
        ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="specifications.heading" defaultValue="Requirement Specifications" as="h2" />
        <EditableText
          contentKey="page.specifications.hint"
          defaultValue="DID-style templates for HRS/SRS at System, Subsystem, and HWCI/CSCI level."
          as="span"
          className="hint"
        />
        <button className="button-primary" onClick={() => setCreating(true)}>
          + Add Specification
        </button>
      </div>

      <button className="link-button" onClick={() => setShowGuidance((v) => !v)}>
        {showGuidance ? "Hide" : "Show"} level & spec-type guidance
      </button>

      {showGuidance && (
        <div className="did-guidance">
          <EditableText contentKey="did.frameworkIntro" defaultValue={COMPETENCY_FRAMEWORK_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {SPEC_LEVELS.map((level) => (
              <div className="detail-card" key={level}>
                <h4>{levelLabel(level)}</h4>
                <EditableText contentKey={`did.level.${level}.summary`} defaultValue={LEVEL_GUIDANCE[level].summary} as="p" />
                <p className={`did-guidance-label ${COMPETENCY_CLASS[LEVEL_GUIDANCE[level].competency.weight]}`}>
                  {LEVEL_GUIDANCE[level].competency.weight}
                </p>
                <EditableText
                  contentKey={`did.level.${level}.competencyNote`}
                  defaultValue={LEVEL_GUIDANCE[level].competency.note}
                  as="p"
                />
                <EditableText contentKey="did.prosLabel" defaultValue="Pros" as="p" className="did-guidance-label did-pro" />
                <ul>
                  {LEVEL_GUIDANCE[level].pros.map((p, i) => (
                    <EditableText key={i} contentKey={`did.level.${level}.pros.${i}`} defaultValue={p} as="li" />
                  ))}
                </ul>
                <EditableText contentKey="did.consLabel" defaultValue="Cons" as="p" className="did-guidance-label did-con" />
                <ul>
                  {LEVEL_GUIDANCE[level].cons.map((c, i) => (
                    <EditableText key={i} contentKey={`did.level.${level}.cons.${i}`} defaultValue={c} as="li" />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="did-guidance-grid">
            {SPEC_TYPES.map((type) => (
              <div className="detail-card" key={type}>
                <h4>
                  {type} <EditableText contentKey="specifications.specTypeSuffix" defaultValue="Specification" as="span" />
                </h4>
                <EditableText contentKey={`did.specType.${type}.summary`} defaultValue={SPEC_TYPE_GUIDANCE[type].summary} as="p" />
                <EditableText
                  contentKey={`did.specType.${type}.whenUsed`}
                  defaultValue={SPEC_TYPE_GUIDANCE[type].whenUsed}
                  as="p"
                  className="hint"
                />
              </div>
            ))}
          </div>
          <EditableText
            contentKey="did.baselineNote"
            defaultValue="Baseline A and Baseline B mature through Development → Production at different rates while influencing each other at UUT-relevant interfaces — track that relationship on the A/B Compatibility tab, not by duplicating content across specs."
            as="p"
            className="hint"
          />

          <EditableText contentKey="specifications.safetyDecompositionHeading" defaultValue="System Safety Decomposition (MIL-STD-882E / JSSSEH)" as="h3" />
          <EditableText contentKey="safety.frameworkIntro" defaultValue={SAFETY_FRAMEWORK_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {SPEC_LEVELS.map((level) => (
              <div className="detail-card" key={level}>
                <h4>{levelLabel(level)}</h4>
                <div className="safety-badge-row">
                  {SAFETY_BY_LEVEL[level].analyses.map((type) => (
                    <span key={type} className="safety-badge" title={HAZARD_ANALYSIS_META[type].name}>
                      {type}
                    </span>
                  ))}
                </div>
                <EditableText
                  contentKey={`safety.level.${level}.safetyContent`}
                  defaultValue={SAFETY_BY_LEVEL[level].safetyContent}
                  as="p"
                />
                <EditableText
                  contentKey={`safety.level.${level}.decompositionDependency`}
                  defaultValue={SAFETY_BY_LEVEL[level].decompositionDependency}
                  as="p"
                  className="hint"
                />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.setrMilestonesHeading" defaultValue="SETR Milestones: SRR → SFR → SSR" as="h3" />
          <EditableText contentKey="setr.frameworkIntro" defaultValue={SETR_FRAMEWORK_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {SETR_EVENTS.map((event) => (
              <div className="detail-card" key={event}>
                <h4>
                  {event}{" "}
                  <span className="badge">
                    <EditableText contentKey={`setr.${event}.name`} defaultValue={SETR_GUIDANCE[event].name} as="span" />
                  </span>
                </h4>
                <EditableText contentKey={`setr.${event}.summary`} defaultValue={SETR_GUIDANCE[event].summary} as="p" />
                <EditableText contentKey="setr.decompositionLabel" defaultValue="System Decomposition" as="p" className="did-guidance-label" />
                <EditableText contentKey={`setr.${event}.decomposition`} defaultValue={SETR_GUIDANCE[event].decomposition} as="p" />
                <EditableText contentKey="setr.safetyPlanningLabel" defaultValue="System Safety Planning" as="p" className="did-guidance-label" />
                <EditableText contentKey={`setr.${event}.safetyPlanning`} defaultValue={SETR_GUIDANCE[event].safetyPlanning} as="p" />
                <EditableText contentKey="setr.softwarePlanningLabel" defaultValue="System Software Planning" as="p" className="did-guidance-label" />
                <EditableText contentKey={`setr.${event}.softwarePlanning`} defaultValue={SETR_GUIDANCE[event].softwarePlanning} as="p" />
                <EditableText contentKey="setr.specGenerationLabel" defaultValue="Spec Generation" as="p" className="did-guidance-label" />
                <EditableText contentKey={`setr.${event}.specGeneration`} defaultValue={SETR_GUIDANCE[event].specGeneration} as="p" />
                <EditableText contentKey="setr.tdpMaturityLabel" defaultValue="TDP Maturity (MIL-STD-31000)" as="p" className="did-guidance-label" />
                <EditableText contentKey={`setr.${event}.tdpMaturity`} defaultValue={SETR_GUIDANCE[event].tdpMaturity} as="p" />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.recurringActivitiesHeading" defaultValue="Recurring Technical Activities: Beyond the Milestone Gates" as="h3" />
          <EditableText
            contentKey="recurringTechActivities.intro"
            defaultValue={RECURRING_TECHNICAL_ACTIVITIES_INTRO}
            as="p"
            className="hint"
          />
          <div className="did-guidance-grid">
            {RECURRING_TECHNICAL_ACTIVITIES.map((activity) => (
              <div className="detail-card" key={activity.id}>
                <EditableText contentKey={`recurringTechActivities.${activity.id}.name`} defaultValue={activity.name} as="h4" />
                <EditableText contentKey="recurringTechActivities.cadenceLabel" defaultValue="Cadence" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`recurringTechActivities.${activity.id}.cadence`}
                  defaultValue={activity.cadence}
                  as="p"
                  className="hint"
                />
                <EditableText contentKey="recurringTechActivities.purposeLabel" defaultValue="Purpose" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`recurringTechActivities.${activity.id}.purpose`}
                  defaultValue={activity.purpose}
                  as="p"
                />
                <EditableText
                  contentKey="recurringTechActivities.distinctionLabel"
                  defaultValue="Distinction from a SETR milestone gate"
                  as="p"
                  className="did-guidance-label"
                />
                <EditableText
                  contentKey={`recurringTechActivities.${activity.id}.distinctionFromSetr`}
                  defaultValue={activity.distinctionFromSetr}
                  as="p"
                  className="hint"
                />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.pointerSpecHeading" defaultValue="Pointer Specifications: Citing Higher-Level Standards" as="h3" />
          <EditableText contentKey="pointerSpec.frameworkIntro" defaultValue={POINTER_SPEC_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {POINTER_SPEC_PRINCIPLES.map((principle, i) => (
              <div className="detail-card" key={principle.title}>
                <EditableText contentKey={`pointerSpec.principles.${i}.title`} defaultValue={principle.title} as="h4" />
                <EditableText contentKey={`pointerSpec.principles.${i}`} defaultValue={principle.text} as="p" />
              </div>
            ))}
          </div>
          <div className="did-guidance-grid">
            {POINTER_SPEC_CATALOG.map((entry) => (
              <div className="detail-card" key={entry.id}>
                <h4>
                  <EditableText contentKey={`pointerSpec.catalog.${entry.id}.designator`} defaultValue={entry.designator} as="span" />{" "}
                  <span className="badge">{entry.domain}</span>
                </h4>
                <EditableText contentKey={`pointerSpec.catalog.${entry.id}.title`} defaultValue={entry.title} as="p" className="hint" />
                <div className="safety-badge-row">
                  {entry.levels.map((level) => (
                    <span key={level} className="safety-badge">
                      {levelLabel(level)}
                    </span>
                  ))}
                </div>
                <EditableText contentKey="pointerSpec.whyItMattersLabel" defaultValue="Why it matters" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`pointerSpec.catalog.${entry.id}.whyItMatters`}
                  defaultValue={entry.whyItMatters}
                  as="p"
                />
                <EditableText contentKey="pointerSpec.recommendedApproachLabel" defaultValue="Recommended approach" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`pointerSpec.catalog.${entry.id}.recommendedApproach`}
                  defaultValue={entry.recommendedApproach}
                  as="p"
                />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.tdpAlignmentHeading" defaultValue="Technical Data Package (TDP) Alignment — MIL-STD-31000 / EIA-649" as="h3" />
          <EditableText contentKey="tdp.frameworkIntro" defaultValue={TDP_FRAMEWORK_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            {TDP_MATURITY_LEVELS.map((level) => (
              <div className="detail-card" key={level}>
                <EditableText contentKey={`tdp.maturity.${level}.name`} defaultValue={TDP_MATURITY_META[level].name} as="h4" />
                <EditableText
                  contentKey={`tdp.maturity.${level}.description`}
                  defaultValue={TDP_MATURITY_META[level].description}
                  as="p"
                />
                <EditableText contentKey="tdp.specTypeCorrelationLabel" defaultValue="Spec-Type Correlation" as="p" className="did-guidance-label" />
                <EditableText
                  contentKey={`tdp.maturity.${level}.specTypeCorrelation`}
                  defaultValue={TDP_MATURITY_META[level].specTypeCorrelation}
                  as="p"
                />
                <p className="hint">
                  <EditableText contentKey="tdp.setrRangeLabel" defaultValue="SETR range:" as="span" />{" "}
                  <EditableText contentKey={`tdp.maturity.${level}.setrRange`} defaultValue={TDP_MATURITY_META[level].setrRange} as="span" />
                </p>
              </div>
            ))}
          </div>
          <EditableText contentKey="tdp.fcaPcaNote" defaultValue={FCA_PCA_NOTE} as="p" className="hint" />

          <EditableText contentKey="specifications.tdpContentElementsHeading" defaultValue="TDP Content Elements" as="h4" />
          <div className="did-guidance-grid">
            {TDP_CONTENT_ELEMENTS.map((el) => (
              <div className="detail-card" key={el.id}>
                <EditableText contentKey={`tdp.content.${el.id}.name`} defaultValue={el.name} as="h4" />
                <EditableText contentKey={`tdp.content.${el.id}.description`} defaultValue={el.description} as="p" className="hint" />
                <EditableText contentKey="tdp.inThisAppLabel" defaultValue="In this app" as="p" className="did-guidance-label" />
                <EditableText contentKey={`tdp.content.${el.id}.appMapping`} defaultValue={el.appMapping} as="p" />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.cmFunctionalAreasHeading" defaultValue="EIA-649 Configuration Management Functional Areas" as="h4" />
          <div className="did-guidance-grid">
            {CM_FUNCTIONAL_AREAS.map((area) => (
              <div className="detail-card" key={area.id}>
                <EditableText contentKey={`cm.area.${area.id}.name`} defaultValue={area.name} as="h4" />
                <EditableText contentKey={`cm.area.${area.id}.description`} defaultValue={area.description} as="p" className="hint" />
                <EditableText contentKey="cm.inThisAppLabel" defaultValue="In this app" as="p" className="did-guidance-label" />
                <EditableText contentKey={`cm.area.${area.id}.appMapping`} defaultValue={area.appMapping} as="p" />
              </div>
            ))}
          </div>

          <EditableText contentKey="specifications.dbxMbxHeading" defaultValue="Document-Based (DBx) vs Model-Based (MBx) Specification" as="h3" />
          <EditableText contentKey="dbxMbx.intro" defaultValue={DBX_MBX_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            <DbxMbxCard dimension={specWritingDimension} />
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={(row) => onSelectSpecification(row.id)}
          onDelete={(row) => {
            if (confirm(`Delete specification "${row.title}"?`)) remove(row.id);
          }}
          emptyMessage="No specifications yet."
        />
      )}

      {creating && (
        <Modal title="Add Specification" onClose={() => setCreating(false)}>
          <SpecMetadataForm
            initial={{
              title: "",
              level: "CI",
              domain: "Hardware",
              specType: "Development",
              baseline: "Baseline A",
              status: "Draft",
              linkedSubsystemId: null,
              linkedCiId: null,
            }}
            subsystems={subsystems}
            cis={cis}
            onCancel={() => setCreating(false)}
            onSubmit={async (values: SpecMetadataValues) => {
              const created = await create({ ...values, sections: emptySections(), attachments: [] });
              setCreating(false);
              onSelectSpecification(created.id);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
