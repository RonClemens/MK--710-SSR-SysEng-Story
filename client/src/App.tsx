import { useEffect, useState } from "react";
import { useEntity } from "./hooks/useEntity";
import {
  abCompatibilityApi,
  baselinesApi,
  checklistItemsApi,
  cisApi,
  cotsRecordsApi,
  deltaMatrixApi,
  gapsApi,
  interfacesApi,
  logicalSubsystemsApi,
  milestonesApi,
  programPlanningDeliverablesApi,
  programsApi,
  projectsApi,
  recommendationsApi,
  requirementsApi,
  safetyDeliverablesApi,
  specificationsApi,
  verificationEventsApi,
} from "./api/entities";
import { api } from "./api/client";
import { SubsystemsPage } from "./pages/SubsystemsPage";
import { SubsystemDetailPage } from "./pages/SubsystemDetailPage";
import { NSquaredPage } from "./pages/NSquaredPage";
import { CisPage } from "./pages/CisPage";
import { DeltaMatrixPage } from "./pages/DeltaMatrixPage";
import { AbCompatibilityPage } from "./pages/AbCompatibilityPage";
import { CotsRecordsPage } from "./pages/CotsRecordsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { SpecificationsPage } from "./pages/SpecificationsPage";
import { SpecificationDetailPage } from "./pages/SpecificationDetailPage";
import { SafetyDeliverablesPage } from "./pages/SafetyDeliverablesPage";
import { PlanningDeliverablesPage } from "./pages/PlanningDeliverablesPage";
import { SempMigrationPage } from "./pages/SempMigrationPage";
import { PromisesPage } from "./pages/PromisesPage";
import { CiDetailPage } from "./pages/CiDetailPage";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { EditableText } from "./components/EditableText";
import { ExportImport } from "./components/ExportImport";
import { ArchitectureFooter } from "./components/ArchitectureFooter";
import { useSiteContent } from "./contexts/SiteContentContext";

type Tab =
  | "subsystems"
  | "n2"
  | "cis"
  | "delta"
  | "ab"
  | "cots"
  | "specifications"
  | "safetyDeliverables"
  | "planningDeliverables"
  | "recommendations"
  | "sempMigration"
  | "promises";

const TABS: { key: Tab; label: string }[] = [
  { key: "subsystems", label: "Subsystems" },
  { key: "n2", label: "N² Diagram" },
  { key: "cis", label: "CI Inventory" },
  { key: "delta", label: "Delta Matrix" },
  { key: "ab", label: "A/B Compatibility" },
  { key: "cots", label: "COTS Records" },
  { key: "specifications", label: "Specifications" },
  { key: "safetyDeliverables", label: "Safety Deliverables" },
  { key: "planningDeliverables", label: "Program Planning" },
  { key: "recommendations", label: "Recommendations" },
  { key: "sempMigration", label: "SEMP Migration" },
  { key: "promises", label: "PDKM Promises" },
];

export default function App() {
  const programs = useEntity(programsApi);
  const projects = useEntity(projectsApi);
  const baselines = useEntity(baselinesApi);
  const milestones = useEntity(milestonesApi);
  const requirements = useEntity(requirementsApi);
  const verificationEvents = useEntity(verificationEventsApi);
  const checklistItems = useEntity(checklistItemsApi);
  const gaps = useEntity(gapsApi);
  const logicalSubsystems = useEntity(logicalSubsystemsApi);
  const cis = useEntity(cisApi);
  const deltaMatrix = useEntity(deltaMatrixApi);
  const abCompatibility = useEntity(abCompatibilityApi);
  const cotsRecords = useEntity(cotsRecordsApi);
  const recommendations = useEntity(recommendationsApi);
  const interfaces = useEntity(interfacesApi);
  const specifications = useEntity(specificationsApi);
  const safetyDeliverables = useEntity(safetyDeliverablesApi);
  const planningDeliverables = useEntity(programPlanningDeliverablesApi);

  const [tab, setTab] = useState<Tab>("subsystems");
  const [selectedCiId, setSelectedCiId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [serverAiEnabled, setServerAiEnabled] = useState(false);
  const { editMode, setEditMode } = useSiteContent();

  useEffect(() => {
    api.config().then((cfg) => setServerAiEnabled(cfg.aiEnabled));
  }, []);

  function refreshAll() {
    programs.refresh();
    projects.refresh();
    baselines.refresh();
    milestones.refresh();
    requirements.refresh();
    verificationEvents.refresh();
    checklistItems.refresh();
    gaps.refresh();
    logicalSubsystems.refresh();
    cis.refresh();
    deltaMatrix.refresh();
    abCompatibility.refresh();
    cotsRecords.refresh();
    recommendations.refresh();
    interfaces.refresh();
    specifications.refresh();
    safetyDeliverables.refresh();
    planningDeliverables.refresh();
  }

  function selectCi(id: string) {
    setSelectedSubsystemId(null);
    setSelectedSpecId(null);
    setSelectedCiId(id);
  }

  function selectSubsystem(id: string) {
    setSelectedCiId(null);
    setSelectedSpecId(null);
    setSelectedSubsystemId(id);
  }

  function selectSpecification(id: string) {
    setSelectedCiId(null);
    setSelectedSubsystemId(null);
    setSelectedSpecId(id);
  }

  function clearSelection() {
    setSelectedCiId(null);
    setSelectedSubsystemId(null);
    setSelectedSpecId(null);
  }

  const selectedCi = selectedCiId ? cis.rows.find((c) => c.id === selectedCiId) : null;
  const selectedSubsystem = selectedSubsystemId
    ? logicalSubsystems.rows.find((s) => s.id === selectedSubsystemId)
    : null;
  const selectedSpec = selectedSpecId ? specifications.rows.find((s) => s.id === selectedSpecId) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>PDR Reconciliation & Baseline Alignment Workbench</h1>
          <EditableText
            contentKey="app.subtitle"
            defaultValue="Illustrative/demo data only — not a real program's CI names or requirements."
            as="p"
            className="subtitle"
          />
          {projects.rows[0] && (
            <p className="hint" title="PKM Migration Step 1: Program / Project scope">
              {programs.rows[0]?.name ?? "—"} → {projects.rows[0].name}
            </p>
          )}
        </div>
        <div className="header-actions">
          <label className="edit-mode-toggle">
            <input type="checkbox" checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />
            Edit Mode
          </label>
          <ExportImport onImported={refreshAll} />
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          {selectedCi ? (
            <CiDetailPage
              ci={selectedCi}
              subsystems={logicalSubsystems.rows}
              allCis={cis.rows}
              deltaRows={deltaMatrix.rows.filter((r) => r.ciId === selectedCi.id)}
              abRows={abCompatibility.rows.filter((r) => r.ciId === selectedCi.id)}
              cotsRecords={cotsRecords.rows.filter((r) => r.ciId === selectedCi.id)}
              recommendations={recommendations.rows.filter((r) => r.relatedCiId === selectedCi.id)}
              specifications={specifications.rows.filter((s) => s.linkedCiId === selectedCi.id)}
              safetyDeliverables={safetyDeliverables.rows.filter((sd) => sd.linkedCiId === selectedCi.id)}
              planningDeliverables={planningDeliverables.rows.filter((pd) => pd.linkedCiId === selectedCi.id)}
              onBack={clearSelection}
              onSelectSubsystem={selectSubsystem}
              onSelectSpecification={selectSpecification}
            />
          ) : selectedSubsystem ? (
            <SubsystemDetailPage
              subsystem={selectedSubsystem}
              servingCis={cis.rows.filter((c) => c.subsystemIds.includes(selectedSubsystem.id))}
              specifications={specifications.rows.filter((s) => s.linkedSubsystemId === selectedSubsystem.id)}
              safetyDeliverables={safetyDeliverables.rows.filter((sd) => sd.linkedSubsystemId === selectedSubsystem.id)}
              planningDeliverables={planningDeliverables.rows.filter((pd) => pd.linkedSubsystemId === selectedSubsystem.id)}
              onBack={clearSelection}
              onSelectCi={selectCi}
              onSelectSpecification={selectSpecification}
            />
          ) : selectedSpec ? (
            <SpecificationDetailPage
              spec={selectedSpec}
              subsystems={logicalSubsystems.rows}
              cis={cis.rows}
              onBack={clearSelection}
              onUpdate={specifications.update}
              onDelete={async (id) => {
                await specifications.remove(id);
                clearSelection();
              }}
              onSelectSubsystem={selectSubsystem}
              onSelectCi={selectCi}
            />
          ) : (
            <>
              <nav className="tab-bar">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`tab-button ${tab === t.key ? "active" : ""}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
              {tab === "subsystems" && (
                <SubsystemsPage entity={logicalSubsystems} cis={cis.rows} onSelectSubsystem={selectSubsystem} />
              )}
              {tab === "n2" && (
                <NSquaredPage
                  subsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                  interfacesEntity={interfaces}
                  onSelectSubsystem={selectSubsystem}
                  onSelectCi={selectCi}
                />
              )}
              {tab === "cis" && (
                <CisPage
                  entity={cis}
                  subsystems={logicalSubsystems.rows}
                  baselines={baselines.rows}
                  gaps={gaps.rows}
                  onSelectCi={selectCi}
                />
              )}
              {tab === "delta" && (
                <DeltaMatrixPage
                  entity={deltaMatrix}
                  cis={cis.rows}
                  requirements={requirements.rows}
                  gaps={gaps.rows}
                />
              )}
              {tab === "ab" && <AbCompatibilityPage entity={abCompatibility} cis={cis.rows} />}
              {tab === "cots" && (
                <CotsRecordsPage entity={cotsRecords} cis={cis.rows} verificationEvents={verificationEvents.rows} />
              )}
              {tab === "specifications" && (
                <SpecificationsPage
                  entity={specifications}
                  subsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                  onSelectSpecification={selectSpecification}
                />
              )}
              {tab === "safetyDeliverables" && (
                <SafetyDeliverablesPage
                  entity={safetyDeliverables}
                  subsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                />
              )}
              {tab === "planningDeliverables" && (
                <PlanningDeliverablesPage
                  entity={planningDeliverables}
                  subsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                />
              )}
              {tab === "recommendations" && (
                <RecommendationsPage entity={recommendations} cis={cis.rows} gaps={gaps.rows} />
              )}
              {tab === "sempMigration" && (
                <SempMigrationPage
                  baselines={baselines.rows}
                  milestones={milestones.rows}
                  logicalSubsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                  deltaMatrix={deltaMatrix.rows}
                  abCompatibility={abCompatibility.rows}
                  cotsRecords={cotsRecords.rows}
                  recommendations={recommendations.rows}
                  interfaces={interfaces.rows}
                  specifications={specifications.rows}
                  safetyDeliverables={safetyDeliverables.rows}
                  planningDeliverables={planningDeliverables.rows}
                />
              )}
              {tab === "promises" && (
                <PromisesPage
                  programs={programs.rows}
                  projects={projects.rows}
                  milestones={milestones.rows}
                  requirements={requirements.rows}
                  verificationEvents={verificationEvents.rows}
                  checklistItems={checklistItems.rows}
                  gaps={gaps.rows}
                  logicalSubsystems={logicalSubsystems.rows}
                  cis={cis.rows}
                  deltaMatrix={deltaMatrix.rows}
                  abCompatibility={abCompatibility.rows}
                  cotsRecords={cotsRecords.rows}
                  recommendations={recommendations.rows}
                  interfaces={interfaces.rows}
                  specifications={specifications.rows}
                  safetyDeliverables={safetyDeliverables.rows}
                  planningDeliverables={planningDeliverables.rows}
                />
              )}
            </>
          )}
        </main>
        <AiAssistantPanel serverAiEnabled={serverAiEnabled} />
      </div>
      <ArchitectureFooter />
    </div>
  );
}
