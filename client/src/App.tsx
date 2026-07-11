import { useEffect, useState } from "react";
import { useEntity } from "./hooks/useEntity";
import {
  abCompatibilityApi,
  cisApi,
  cotsRecordsApi,
  deltaMatrixApi,
  interfacesApi,
  logicalSubsystemsApi,
  recommendationsApi,
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
import { CiDetailPage } from "./pages/CiDetailPage";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { ExportImport } from "./components/ExportImport";

type Tab = "subsystems" | "n2" | "cis" | "delta" | "ab" | "cots" | "recommendations";

const TABS: { key: Tab; label: string }[] = [
  { key: "subsystems", label: "Subsystems" },
  { key: "n2", label: "N² Diagram" },
  { key: "cis", label: "CI Inventory" },
  { key: "delta", label: "Delta Matrix" },
  { key: "ab", label: "A/B Compatibility" },
  { key: "cots", label: "COTS Records" },
  { key: "recommendations", label: "Recommendations" },
];

export default function App() {
  const logicalSubsystems = useEntity(logicalSubsystemsApi);
  const cis = useEntity(cisApi);
  const deltaMatrix = useEntity(deltaMatrixApi);
  const abCompatibility = useEntity(abCompatibilityApi);
  const cotsRecords = useEntity(cotsRecordsApi);
  const recommendations = useEntity(recommendationsApi);
  const interfaces = useEntity(interfacesApi);

  const [tab, setTab] = useState<Tab>("subsystems");
  const [selectedCiId, setSelectedCiId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [serverAiEnabled, setServerAiEnabled] = useState(false);

  useEffect(() => {
    api.config().then((cfg) => setServerAiEnabled(cfg.aiEnabled));
  }, []);

  function refreshAll() {
    logicalSubsystems.refresh();
    cis.refresh();
    deltaMatrix.refresh();
    abCompatibility.refresh();
    cotsRecords.refresh();
    recommendations.refresh();
    interfaces.refresh();
  }

  function selectCi(id: string) {
    setSelectedSubsystemId(null);
    setSelectedCiId(id);
  }

  function selectSubsystem(id: string) {
    setSelectedCiId(null);
    setSelectedSubsystemId(id);
  }

  function clearSelection() {
    setSelectedCiId(null);
    setSelectedSubsystemId(null);
  }

  const selectedCi = selectedCiId ? cis.rows.find((c) => c.id === selectedCiId) : null;
  const selectedSubsystem = selectedSubsystemId
    ? logicalSubsystems.rows.find((s) => s.id === selectedSubsystemId)
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>PDR Reconciliation & Baseline Alignment Workbench</h1>
          <p className="subtitle">
            Illustrative/demo data only — not a real program's CI names or requirements.
          </p>
        </div>
        <ExportImport onImported={refreshAll} />
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
              onBack={clearSelection}
              onSelectSubsystem={selectSubsystem}
            />
          ) : selectedSubsystem ? (
            <SubsystemDetailPage
              subsystem={selectedSubsystem}
              servingCis={cis.rows.filter((c) => c.subsystemIds.includes(selectedSubsystem.id))}
              onBack={clearSelection}
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
              {tab === "cis" && <CisPage entity={cis} subsystems={logicalSubsystems.rows} onSelectCi={selectCi} />}
              {tab === "delta" && <DeltaMatrixPage entity={deltaMatrix} cis={cis.rows} />}
              {tab === "ab" && <AbCompatibilityPage entity={abCompatibility} cis={cis.rows} />}
              {tab === "cots" && <CotsRecordsPage entity={cotsRecords} cis={cis.rows} />}
              {tab === "recommendations" && (
                <RecommendationsPage entity={recommendations} cis={cis.rows} />
              )}
            </>
          )}
        </main>
        <AiAssistantPanel serverAiEnabled={serverAiEnabled} />
      </div>
    </div>
  );
}
