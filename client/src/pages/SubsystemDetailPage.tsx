import { EditableText } from "../components/EditableText";
import { UNVERIFIED_SUBSYSTEM_SAFETY_NOTE } from "../data/safetyGuidance";
import type { ConfigurationItem, LogicalSubsystem, SafetyDeliverable, Specification } from "../types";

interface Props {
  subsystem: LogicalSubsystem;
  servingCis: ConfigurationItem[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  onBack: () => void;
  onSelectCi: (id: string) => void;
  onSelectSpecification: (id: string) => void;
}

export function SubsystemDetailPage({
  subsystem,
  servingCis,
  specifications,
  safetyDeliverables,
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
        <span className="badge">{subsystem.source}</span>
      </div>
      <dl className="detail-grid">
        <dt>Description</dt>
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
        <h3>CIs serving this subsystem</h3>
        {servingCis.length === 0 ? (
          <p className="hint">No CIs currently link to this subsystem.</p>
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
        <h3>Requirement Specifications</h3>
        {specifications.length === 0 ? (
          <p className="hint">No specifications linked to this subsystem yet.</p>
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
            </div>
          ))
        )}
      </section>

      <section>
        <h3>Safety Deliverables</h3>
        {safetyDeliverables.length === 0 ? (
          <p className="hint">No safety deliverables linked to this subsystem yet.</p>
        ) : (
          safetyDeliverables.map((sd) => (
            <div className="detail-card" key={sd.id}>
              <p>
                <strong>{sd.title}</strong> <span className="badge">{sd.cdrlType}</span>{" "}
                <span className="badge">{sd.applicability}</span> <span className="badge">{sd.baseline}</span>{" "}
                <span className="badge badge-info">{sd.status}</span>
              </p>
              <p className="hint">{sd.cdrlDescription}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
