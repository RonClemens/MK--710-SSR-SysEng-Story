import { useEffect, useMemo, useState } from "react";
import { EditableText } from "../components/EditableText";
import { PhaseStepper } from "../components/PhaseStepper";
import {
  AAF_PHASE_FRAMEWORK_INTRO,
  MCA_MILESTONE_GATES,
  MCA_PHASES,
  type AcquisitionPhaseId,
} from "../../../methodology/guidance/aafPhaseGuidance";
import { deriveCurrentPhase, milestoneStatusesForPhase } from "../utils/acquisitionPhase";
import type { Baseline, Milestone } from "../types";

interface Props {
  baselines: Baseline[];
  milestones: Milestone[];
  onSwitchToAllTabs: () => void;
}

export function PhaseWorkbenchPage({ baselines, milestones, onSwitchToAllTabs }: Props) {
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>("");
  const [selectedPhaseId, setSelectedPhaseId] = useState<AcquisitionPhaseId>("tmrr");
  const [hasInitialized, setHasInitialized] = useState(false);

  // baselines/milestones load asynchronously via useEntity, so they're []
  // on first render -- initialize the default selection once real data
  // arrives, rather than baking in an empty default that never updates.
  useEffect(() => {
    if (!hasInitialized && baselines.length > 0) {
      const id = baselines[0].id;
      setSelectedBaselineId(id);
      setSelectedPhaseId(deriveCurrentPhase(milestones, id)?.id ?? "tmrr");
      setHasInitialized(true);
    }
  }, [baselines, milestones, hasInitialized]);

  const currentPhase = useMemo(
    () => (selectedBaselineId ? deriveCurrentPhase(milestones, selectedBaselineId) : null),
    [milestones, selectedBaselineId],
  );

  function selectBaseline(id: string) {
    setSelectedBaselineId(id);
    const phase = deriveCurrentPhase(milestones, id);
    setSelectedPhaseId(phase?.id ?? "tmrr");
  }

  const selectedPhase = MCA_PHASES.find((p) => p.id === selectedPhaseId) ?? MCA_PHASES[0];
  const milestoneStatuses = selectedBaselineId
    ? milestoneStatusesForPhase(milestones, selectedBaselineId, selectedPhase)
    : [];
  const entryGate = selectedPhase.entryMilestone ? MCA_MILESTONE_GATES[selectedPhase.entryMilestone] : null;
  const exitGate = selectedPhase.exitMilestone ? MCA_MILESTONE_GATES[selectedPhase.exitMilestone] : null;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Acquisition Phase Workbench</h2>
        <button className="button-secondary" onClick={onSwitchToAllTabs}>
          All Tabs
        </button>
      </div>

      <EditableText
        contentKey="phaseWorkbench.intro"
        defaultValue={AAF_PHASE_FRAMEWORK_INTRO}
        as="p"
        className="hint"
      />

      {baselines.length === 0 ? (
        <p className="empty-row">No baselines yet.</p>
      ) : (
        <>
          <div className="pill-filter-row">
            {baselines.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`pill-filter${selectedBaselineId === b.id ? " active" : ""}`}
                onClick={() => selectBaseline(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>

          <PhaseStepper
            phases={MCA_PHASES}
            currentPhaseId={currentPhase?.id ?? null}
            selectedPhaseId={selectedPhaseId}
            onSelectPhase={setSelectedPhaseId}
          />

          <div className="phase-detail-panel">
            <h3>{selectedPhase.name}</h3>
            <p className="hint">{selectedPhase.summary}</p>

            {!selectedPhase.inScope && selectedPhase.outOfScopeNote && (
              <p className="hint">{selectedPhase.outOfScopeNote}</p>
            )}

            {(entryGate || exitGate) && (
              <dl className="detail-grid">
                {entryGate && (
                  <>
                    <dt>Entry gate</dt>
                    <dd>
                      {entryGate.name} — {entryGate.decisionSummary}
                    </dd>
                  </>
                )}
                {exitGate && (
                  <>
                    <dt>Exit gate</dt>
                    <dd>
                      {exitGate.name} — {exitGate.decisionSummary}
                    </dd>
                  </>
                )}
              </dl>
            )}

            {milestoneStatuses.length > 0 && (
              <>
                <p className="did-guidance-label">SETR events in this phase</p>
                <ul>
                  {milestoneStatuses.map(({ event, milestone }) => (
                    <li key={event}>
                      {event}: {milestone ? milestone.status : "Not yet scheduled"}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
