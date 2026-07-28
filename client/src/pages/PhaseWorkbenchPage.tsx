import { useEffect, useMemo, useState } from "react";
import { EditableText } from "../components/EditableText";
import { PhaseStepper } from "../components/PhaseStepper";
import { GuidedChecklistPanel } from "../components/GuidedChecklistPanel";
import { CdrlPhasePanel } from "../components/CdrlPhasePanel";
import {
  AAF_PHASE_FRAMEWORK_INTRO,
  MCA_MILESTONE_GATES,
  MCA_PHASES,
  type AcquisitionPhaseId,
} from "../../../methodology/guidance/aafPhaseGuidance";
import {
  cdrlsForPhase,
  deriveCurrentMilestone,
  deriveCurrentPhase,
  milestoneStatusesForPhase,
} from "../utils/acquisitionPhase";
import { findIncoseSubProcess } from "../../../methodology/guidance/incoseGuidance";
import type {
  Baseline,
  ChecklistItem,
  Milestone,
  ProgramPlanningDeliverable,
  SafetyDeliverable,
  SpecStatus,
} from "../types";
import type { useEntity } from "../hooks/useEntity";
import type { PhaseCdrl } from "../utils/acquisitionPhase";

type AllTabsTarget = "safetyDeliverables" | "planningDeliverables";

interface Props {
  baselines: Baseline[];
  milestones: Milestone[];
  checklistItems: ReturnType<typeof useEntity<ChecklistItem>>;
  safetyDeliverables: ReturnType<typeof useEntity<SafetyDeliverable>>;
  planningDeliverables: ReturnType<typeof useEntity<ProgramPlanningDeliverable>>;
  onSwitchToAllTabs: (tab?: AllTabsTarget) => void;
}

export function PhaseWorkbenchPage({
  baselines,
  milestones,
  checklistItems,
  safetyDeliverables,
  planningDeliverables,
  onSwitchToAllTabs,
}: Props) {
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

  const currentMilestone = selectedBaselineId ? deriveCurrentMilestone(milestones, selectedBaselineId) : null;
  const isViewingCurrentPhase = currentPhase !== null && selectedPhaseId === currentPhase.id;
  const cdrls = selectedBaselineId
    ? cdrlsForPhase(safetyDeliverables.rows, planningDeliverables.rows, milestones, selectedBaselineId, selectedPhase)
    : [];

  function updateCdrlStatus(cdrl: PhaseCdrl, status: SpecStatus) {
    if (cdrl.kind === "safety") safetyDeliverables.update(cdrl.record.id, { status });
    else planningDeliverables.update(cdrl.record.id, { status });
  }

  return (
    <div className="page">
      <div className="page-header">
        <EditableText contentKey="phaseWorkbench.heading" defaultValue="Acquisition Phase Workbench" as="h2" />
        <button className="button-secondary" onClick={() => onSwitchToAllTabs()}>
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
        <EditableText
          contentKey="phaseWorkbench.noBaselinesEmptyState"
          defaultValue="No baselines yet."
          as="p"
          className="empty-row"
        />
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
            <EditableText
              contentKey={`aafPhase.${selectedPhase.id}.name`}
              defaultValue={selectedPhase.name}
              as="h3"
            />
            <EditableText
              contentKey={`aafPhase.${selectedPhase.id}.summary`}
              defaultValue={selectedPhase.summary}
              as="p"
              className="hint"
            />

            {!selectedPhase.inScope && selectedPhase.outOfScopeNote && (
              <EditableText
                contentKey={`aafPhase.${selectedPhase.id}.outOfScopeNote`}
                defaultValue={selectedPhase.outOfScopeNote}
                as="p"
                className="hint"
              />
            )}

            {(entryGate || exitGate) && (
              <dl className="detail-grid">
                {entryGate && (
                  <>
                    <dt>
                      <EditableText contentKey="phaseWorkbench.entryGateLabel" defaultValue="Entry gate" as="span" />
                    </dt>
                    <dd>
                      <EditableText
                        contentKey={`aafMilestone.${entryGate.id}.name`}
                        defaultValue={entryGate.name}
                        as="span"
                      />{" "}
                      —{" "}
                      <EditableText
                        contentKey={`aafMilestone.${entryGate.id}.decisionSummary`}
                        defaultValue={entryGate.decisionSummary}
                        as="span"
                      />
                    </dd>
                  </>
                )}
                {exitGate && (
                  <>
                    <dt>
                      <EditableText contentKey="phaseWorkbench.exitGateLabel" defaultValue="Exit gate" as="span" />
                    </dt>
                    <dd>
                      <EditableText
                        contentKey={`aafMilestone.${exitGate.id}.name`}
                        defaultValue={exitGate.name}
                        as="span"
                      />{" "}
                      —{" "}
                      <EditableText
                        contentKey={`aafMilestone.${exitGate.id}.decisionSummary`}
                        defaultValue={exitGate.decisionSummary}
                        as="span"
                      />
                    </dd>
                  </>
                )}
              </dl>
            )}

            {milestoneStatuses.length > 0 && (
              <>
                <EditableText
                  contentKey="phaseWorkbench.setrEventsLabel"
                  defaultValue="SETR events in this phase"
                  as="p"
                  className="did-guidance-label"
                />
                <ul>
                  {milestoneStatuses.map(({ event, milestone }) => (
                    <li key={event}>
                      {event}:{" "}
                      {milestone ? (
                        milestone.status
                      ) : (
                        <EditableText
                          contentKey="phaseWorkbench.notYetScheduledLabel"
                          defaultValue="Not yet scheduled"
                          as="span"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedPhase.incoseFraming && (
              <>
                <EditableText
                  contentKey="phaseWorkbench.incoseFramingLabel"
                  defaultValue="INCOSE Systems Engineering Handbook framing"
                  as="p"
                  className="did-guidance-label"
                />
                <EditableText
                  contentKey={`aafPhase.${selectedPhase.id}.incoseFraming`}
                  defaultValue={selectedPhase.incoseFraming}
                  as="p"
                  className="hint"
                />
              </>
            )}

            {selectedPhase.emphasizedIncoseSubProcesses.length > 0 && (
              <>
                <EditableText
                  contentKey="phaseWorkbench.emphasizedProcessesLabel"
                  defaultValue="Emphasized INCOSE technical processes"
                  as="p"
                  className="did-guidance-label"
                />
                <ul>
                  {selectedPhase.emphasizedIncoseSubProcesses.map((name) => {
                    const subProcess = findIncoseSubProcess(name);
                    return (
                      <li key={name}>
                        <strong>{name}</strong>
                        {subProcess && <> — {subProcess.appMapping}</>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {selectedPhase.inScope && (
            <CdrlPhasePanel cdrls={cdrls} onUpdateStatus={updateCdrlStatus} onViewInAllTabs={onSwitchToAllTabs} />
          )}

          {isViewingCurrentPhase && currentMilestone && (
            <GuidedChecklistPanel milestone={currentMilestone} entity={checklistItems} />
          )}
        </>
      )}
    </div>
  );
}
