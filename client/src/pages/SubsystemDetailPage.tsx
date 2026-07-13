import type { ConfigurationItem, LogicalSubsystem, Specification } from "../types";

interface Props {
  subsystem: LogicalSubsystem;
  servingCis: ConfigurationItem[];
  specifications: Specification[];
  onBack: () => void;
  onSelectCi: (id: string) => void;
  onSelectSpecification: (id: string) => void;
}

export function SubsystemDetailPage({
  subsystem,
  servingCis,
  specifications,
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

      <section>
        <h3>CIs serving this subsystem</h3>
        {servingCis.length === 0 ? (
          <p className="hint">No CIs currently link to this subsystem.</p>
        ) : (
          <>
            {servingCis.length >= 2 && (
              <p className="hint">
                {servingCis.length} CIs serve this subsystem — that overlap is expected signal for a true
                functional boundary, not necessarily a problem to resolve.
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
    </div>
  );
}
