import { AttachmentLinks } from "../components/AttachmentLinks";
import { EditableText } from "../components/EditableText";
import { EntityComments } from "../components/EntityComments";
import { UNVERIFIED_SUBSYSTEM_SAFETY_NOTE } from "../../../methodology/guidance/safetyGuidance";
import type {
  Comment,
  ConfigurationItem,
  LogicalSubsystem,
  ProgramPlanningDeliverable,
  Role,
  SafetyDeliverable,
  Specification,
} from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  subsystem: LogicalSubsystem;
  servingCis: ConfigurationItem[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  planningDeliverables: ProgramPlanningDeliverable[];
  comments: ReturnType<typeof useEntity<Comment>>;
  roles: Role[];
  onBack: () => void;
  onSelectCi: (id: string) => void;
  onSelectSpecification: (id: string) => void;
}

export function SubsystemDetailPage({
  subsystem,
  servingCis,
  specifications,
  safetyDeliverables,
  planningDeliverables,
  comments,
  roles,
  onBack,
  onSelectCi,
  onSelectSpecification,
}: Props) {
  return (
    <div className="page">
      <button className="link-button" onClick={onBack}>
        ← Back to Subsystems
      </button>
      <div className="page-header">
        <h2>{subsystem.name}</h2>
        <span className="badge">{subsystem.baseline}</span>
        <span className="badge">{subsystem.source}</span>
      </div>
      <EntityComments entityType="LogicalSubsystem" entityId={subsystem.id} comments={comments} roles={roles} />
      <dl className="detail-grid">
        <dt><EditableText contentKey="subsystemDetail.descriptionLabel" defaultValue="Description" as="span" /></dt>
        <dd>{subsystem.description || "—"}</dd>
      </dl>

      {subsystem.source === "Inherited from SSDD structure — unverified" && (
        <div className="safety-callout">
          <EditableText
            contentKey="safety.subsystemDetail.unverifiedNote"
            defaultValue={UNVERIFIED_SUBSYSTEM_SAFETY_NOTE}
            as="span"
          />
        </div>
      )}

      <section>
        <EditableText contentKey="subsystemDetail.servingCisLabel" defaultValue="CIs serving this subsystem" as="h3" />
        {servingCis.length === 0 ? (
          <EditableText
            contentKey="subsystemDetail.noServingCisHint"
            defaultValue="No CIs currently link to this subsystem."
            as="p"
            className="hint"
          />
        ) : (
          <>
            {servingCis.length >= 2 && (
              <p className="hint">
                {servingCis.length} CIs serve this subsystem —{" "}
                <EditableText
                  contentKey="page.subsystemDetail.overlapNote"
                  defaultValue="that overlap is expected signal for a true functional boundary, not necessarily a problem to resolve."
                  as="span"
                />
              </p>
            )}
            <ul>
              {servingCis.map((ci) => (
                <li key={ci.id}>
                  <button className="link-button" onClick={() => onSelectCi(ci.id)}>
                    {ci.name}
                  </button>
                  {ci.subsystemIds.length >= 2 && (
                    <span className="badge badge-info" style={{ marginLeft: "0.5rem" }}>
                      also serves {ci.subsystemIds.length - 1} other subsystem{ci.subsystemIds.length - 1 === 1 ? "" : "s"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <EditableText contentKey="subsystemDetail.specificationsLabel" defaultValue="Requirement Specifications" as="h3" />
        {specifications.length === 0 ? (
          <EditableText
            contentKey="subsystemDetail.noSpecificationsHint"
            defaultValue="No specifications linked to this subsystem yet."
            as="p"
            className="hint"
          />
        ) : (
          specifications.map((spec) => (
            <div className="detail-card" key={spec.id}>
              <p>
                <button className="link-button" onClick={() => onSelectSpecification(spec.id)}>
                  <strong>{spec.title}</strong>
                </button>{" "}
                <span className="badge">{spec.domain}</span> <span className="badge">{spec.specType}</span>{" "}
                <span className="badge">{spec.baseline}</span> <span className="badge badge-info">{spec.status}</span>
              </p>
              <AttachmentLinks attachments={spec.attachments} />
            </div>
          ))
        )}
      </section>

      <section>
        <EditableText contentKey="subsystemDetail.safetyDeliverablesLabel" defaultValue="Safety Deliverables" as="h3" />
        {safetyDeliverables.length === 0 ? (
          <EditableText
            contentKey="subsystemDetail.noSafetyDeliverablesHint"
            defaultValue="No safety deliverables linked to this subsystem yet."
            as="p"
            className="hint"
          />
        ) : (
          safetyDeliverables.map((sd) => (
            <div className="detail-card" key={sd.id}>
              <p>
                <strong>{sd.title}</strong> <span className="badge">{sd.cdrlType}</span>{" "}
                <span className="badge">{sd.applicability}</span> <span className="badge">{sd.baseline}</span>{" "}
                <span className="badge badge-info">{sd.status}</span>
              </p>
              <p className="hint">{sd.cdrlDescription}</p>
              <AttachmentLinks attachments={sd.attachments} />
            </div>
          ))
        )}
      </section>

      <section>
        <EditableText contentKey="subsystemDetail.planningDeliverablesLabel" defaultValue="Program Planning Deliverables" as="h3" />
        {planningDeliverables.length === 0 ? (
          <EditableText
            contentKey="subsystemDetail.noPlanningDeliverablesHint"
            defaultValue="No planning deliverables linked to this subsystem yet."
            as="p"
            className="hint"
          />
        ) : (
          planningDeliverables.map((pd) => (
            <div className="detail-card" key={pd.id}>
              <p>
                <strong>{pd.title}</strong> <span className="badge">{pd.cdrlType}</span>{" "}
                <span className="badge">{pd.applicability}</span> <span className="badge">{pd.baseline}</span>{" "}
                <span className="badge badge-info">{pd.status}</span>
              </p>
              <p className="hint">{pd.cdrlDescription}</p>
              <AttachmentLinks attachments={pd.attachments} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
