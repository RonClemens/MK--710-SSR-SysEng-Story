import { useEffect, useState } from "react";
import { useEntity } from "./hooks/useEntity";
import {
  abCompatibilityApi,
  cisApi,
  cotsRecordsApi,
  deltaMatrixApi,
  recommendationsApi,
} from "./api/entities";
import { api } from "./api/client";
import { CisPage } from "./pages/CisPage";
import { DeltaMatrixPage } from "./pages/DeltaMatrixPage";
import { AbCompatibilityPage } from "./pages/AbCompatibilityPage";
import { CotsRecordsPage } from "./pages/CotsRecordsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { CiDetailPage } from "./pages/CiDetailPage";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { ExportImport } from "./components/ExportImport";

type Tab = "cis" | "delta" | "ab" | "cots" | "recommendations";

const TABS: { key: Tab; label: string }[] = [
  { key: "cis", label: "CI Inventory" },
  { key: "delta", label: "Delta Matrix" },
  { key: "ab", label: "A/B Compatibility" },
  { key: "cots", label: "COTS Records" },
  { key: "recommendations", label: "Recommendations" },
];

export default function App() {
  const cis = useEntity(cisApi);
  const deltaMatrix = useEntity(deltaMatrixApi);
  const abCompatibility = useEntity(abCompatibilityApi);
  const cotsRecords = useEntity(cotsRecordsApi);
  const recommendations = useEntity(recommendationsApi);

  const [tab, setTab] = useState<Tab>("cis");
  const [selectedCiId, setSelectedCiId] = useState<string | null>(null);
  const [serverAiEnabled, setServerAiEnabled] = useState(false);

  useEffect(() => {
    api.config().then((cfg) => setServerAiEnabled(cfg.aiEnabled));
  }, []);

  function refreshAll() {
    cis.refresh();
    deltaMatrix.refresh();
    abCompatibility.refresh();
    cotsRecords.refresh();
    recommendations.refresh();
  }

  const selectedCi = selectedCiId ? cis.rows.find((c) => c.id === selectedCiId) : null;

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
              deltaRows={deltaMatrix.rows.filter((r) => r.ciId === selectedCi.id)}
              abRows={abCompatibility.rows.filter((r) => r.ciId === selectedCi.id)}
              cotsRecords={cotsRecords.rows.filter((r) => r.ciId === selectedCi.id)}
              recommendations={recommendations.rows.filter((r) => r.relatedCiId === selectedCi.id)}
              onBack={() => setSelectedCiId(null)}
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
              {tab === "cis" && <CisPage entity={cis} onSelectCi={setSelectedCiId} />}
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
