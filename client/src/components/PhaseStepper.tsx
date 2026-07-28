import { MCA_MILESTONE_GATES, type AcquisitionPhaseId, type AcquisitionPhaseMeta } from "../../../methodology/guidance/aafPhaseGuidance";
import { useSiteContent } from "../contexts/SiteContentContext";

interface Props {
  phases: AcquisitionPhaseMeta[];
  currentPhaseId: AcquisitionPhaseId | null;
  selectedPhaseId: AcquisitionPhaseId;
  onSelectPhase: (id: AcquisitionPhaseId) => void;
}

export function PhaseStepper({ phases, currentPhaseId, selectedPhaseId, onSelectPhase }: Props) {
  const { getValue } = useSiteContent();
  return (
    <nav className="phase-stepper">
      {phases.map((phase) => {
        const isActive = phase.id === selectedPhaseId;
        const isCurrent = phase.id === currentPhaseId;
        const gate = phase.entryMilestone ? MCA_MILESTONE_GATES[phase.entryMilestone] : null;
        return (
          <button
            key={phase.id}
            type="button"
            className={[
              "phase-step",
              isActive ? "active" : "",
              isCurrent ? "current" : "",
              !phase.inScope ? "out-of-scope" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectPhase(phase.id)}
            aria-current={isCurrent ? "step" : undefined}
          >
            {gate && (
              <span className="phase-step-gate-badge">{getValue(`aafMilestone.${gate.id}.name`, gate.name)}</span>
            )}
            <span className="phase-step-name">{getValue(`aafPhase.${phase.id}.name`, phase.name)}</span>
            {isCurrent && <span className="phase-step-current-label">Current</span>}
            {!phase.inScope && <span className="phase-step-current-label">Not modeled</span>}
          </button>
        );
      })}
    </nav>
  );
}
