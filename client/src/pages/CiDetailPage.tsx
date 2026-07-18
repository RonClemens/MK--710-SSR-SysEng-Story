import { EditableText } from "../components/EditableText";
import { OVER_DECOMPOSITION_SAFETY_NOTE } from "../data/safetyGuidance";
import type {
  AbCompatibilityRow,
  ConfigurationItem,
  CotsRecord,
  DeltaMatrixRow,
  LogicalSubsystem,
  ProgramPlanningDeliverable,
  Recommendation,
  SafetyDeliverable,
  Specification,
} from "../types";

interface Props {
  ci: ConfigurationItem;
  subsystems: LogicalSubsystem[];
  allCis: ConfigurationItem[];
  deltaRows: DeltaMatrixRow[];
  abRows: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  planningDeliverables: ProgramPlanningDeliverable[];
  onBack: () => void;
  onSelectSubsystem: (id: string) => void;
  onSelectSpecification: (id: string) => void;
}

export function CiDetailPage({
  ci,
  subsystems,
  allCis,
  deltaRows,
  abRows,
  cotsRecords,
  recommendations,
  specifications,
  safetyDeliverables,
  planningDeliverables,
  onBack,
  onSelectSubsystem,
  onSelectSpecification,
}: Props) {
  const linkedSubsystems = subsystems.filter((s) => ci.subsystemIds.includes(s.id));

  return (
    <div className="page">
      <button className="link-button" onClick={onBack}>
        ← Back to CI Inventory
      </button>
      <div className="page-header">
        <h2>{ci.name}</h2>
        <span className="badge">{ci.baseline}</span>
        <span className={`badge tier-${ci.tier.replace(/\s/g, "")}`}>{ci.tier}</span>
        {ci.overDecompositionFlag && <span className="badge badge-warning">Over-decomposition flagged</span>}
      </div>
      <dl className="detail-grid">
        <dt>Type</dt>
        <dd>{ci.type}</dd>
        <dt>Status</dt>
        <dd>{ci.status || "—"}</dd>
        <dt>Notes</dt>
        <dd>{ci.notes || "—"}</dd>
        {ci.overDecompositionFlag && (
          <>
            <dt>Consolidation notes</dt>
            <dd>{ci.consolidationNotes || "—"}</dd>
          </>
        )}
      </dl>

      {ci.overDecompositionFlag && (
        <div className="safety-callout">
          <EditableText
            contentKey="safety.ciDetail.overDecompositionNote"
            defaultValue={OVER_DECOMPOSITION_SAFETY_NOTE}
            as="span"
          />
        </div>
      )}

      <section>
        <h3>Logical Subsystems Served{linkedSubsystems.length >= 2 ? ` (${linkedSubsystems.length})` : ""}</h3>
        {linkedSubsystems.length === 0 ? (
          <p className="hint">Not yet linked to a logical subsystem.</p>
        ) : (
          <>
            {linkedSubsystems.length >= 2 && (
              <EditableText
                contentKey="page.ciDetail.overlapNote"
                defaultValue="This CI serves multiple subsystems — that overlap is useful signal, not necessarily a problem."
                as="p"
                className="hint"
              />
            )}
            {linkedSubsystems.map((s) => {
              const siblings = allCis.filter((c) => c.id !== ci.id && c.subsystemIds.includes(s.id));
              return (
                <div className="detail-card" key={s.id}>
                  <p>
                    <button className="link-button" onClick={() => onSelectSubsystem(s.id)}>
                      <strong>{s.name}</strong>
                    </button>{" "}
                    <span className="badge">{s.source}</span>
                  </p>
                  <p>{s.description}</p>
                  {siblings.length > 0 && (
                    <p className="hint">Also served by: {siblings.map((c) => c.name).join(", ")}</p>
                  )}
                </div>
              );
            })}
          </>
        )}
      </section>

      <section>
        <h3>Delta / Traceability Matrix</h3>
        {deltaRows.length === 0 ? (
          <p className="hint">No delta matrix rows for this CI.</p>
        ) : (
          deltaRows.map((row) => (
            <div className="detail-card" key={row.id}>
              <p><strong>SFR allocation:</strong> {row.sfrAllocation}</p>
              <p><strong>Actual decomposition:</strong> {row.actualDecomposition}</p>
              <p><strong>Delta:</strong> {row.delta}</p>
              <p><strong>Delta source:</strong> {row.deltaSource}</p>
              <p><strong>Rationale:</strong> {row.rationale}</p>
              <p><strong>Disposition:</strong> {row.disposition}</p>
            </div>
          ))
        )}
      </section>

      <section>
        <h3>A/B Compatibility</h3>
        {abRows.length === 0 ? (
          <p className="hint">No A/B compatibility rows for this CI.</p>
        ) : (
          abRows.map((row) => (
            <div className="detail-card" key={row.id}>
              <p><strong>Baseline A state:</strong> {row.baselineAState}</p>
              <p><strong>Baseline B intent:</strong> {row.baselineBIntent}</p>
              <p><strong>Status:</strong> {row.compatibilityStatus}</p>
              <p><strong>Risk note:</strong> {row.riskNote}</p>
              <p><strong>Last reviewed:</strong> {row.lastReviewedDate}</p>
            </div>
          ))
        )}
      </section>

      <section>
        <h3>COTS Record</h3>
        {cotsRecords.length === 0 ? (
          <p className="hint">No COTS record for this CI.</p>
        ) : (
          cotsRecords.map((row) => (
            <div className="detail-card" key={row.id}>
              <p><strong>Functional requirement:</strong> {row.functionalRequirement}</p>
              <p><strong>Interface requirement:</strong> {row.interfaceRequirement}</p>
              <p><strong>Form & fit:</strong> {row.formFitConstraints}</p>
              <p><strong>Verification method:</strong> {row.verificationMethod}</p>
              <p><strong>Rationale:</strong> {row.rationale}</p>
              <p><strong>Parts list entry:</strong> {row.partsListEntry}</p>
              <p><strong>Obsolescence notes:</strong> {row.obsolescenceMonitoringNotes}</p>
            </div>
          ))
        )}
      </section>

      <section>
        <h3>Requirement Specifications</h3>
        {specifications.length === 0 ? (
          <p className="hint">No specifications linked to this CI yet.</p>
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
          <p className="hint">No safety deliverables linked to this CI yet.</p>
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

      <section>
        <h3>Program Planning Deliverables</h3>
        {planningDeliverables.length === 0 ? (
          <p className="hint">No planning deliverables linked to this CI yet.</p>
        ) : (
          planningDeliverables.map((pd) => (
            <div className="detail-card" key={pd.id}>
              <p>
                <strong>{pd.title}</strong> <span className="badge">{pd.cdrlType}</span>{" "}
                <span className="badge">{pd.applicability}</span> <span className="badge">{pd.baseline}</span>{" "}
                <span className="badge badge-info">{pd.status}</span>
              </p>
              <p className="hint">{pd.cdrlDescription}</p>
            </div>
          ))
        )}
      </section>

      <section>
        <h3>Related Recommendations</h3>
        {recommendations.length === 0 ? (
          <p className="hint">No recommendations reference this CI.</p>
        ) : (
          <ul>
            {recommendations.map((r) => (
              <li key={r.id}>
                <strong>[{r.status}]</strong> {r.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
