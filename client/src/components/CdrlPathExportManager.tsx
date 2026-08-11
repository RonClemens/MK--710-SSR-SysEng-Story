import { useState } from "react";
import type { CdrlPathModel } from "../types/cdrlPath";
import { validateCdrlPathModel } from "../utils/cdrlPathValidation";

interface Props {
  model: CdrlPathModel;
  // Always false until Phase 4 (atomic edit) introduces in-memory mutation — this app has
  // no edit UI yet, so nothing can make the loaded model differ from cdrl-did-data-model.json.
  // Threaded through now so Phase 4 only has to flip a boolean, not build this component.
  isDirty: boolean;
}

// Phase 3 per cdrl-path-handoff.md: "Wire up <ExportManager /> and the dirty-state
// indicator. This should work even with no import/edit UI yet — it's the safety net the
// next two phases depend on." Export follows this app's existing ExportImport.tsx pattern
// (Blob + object URL + anchor click) rather than introducing a second download mechanism.
export function CdrlPathExportManager({ model, isDirty }: Props) {
  const [showIssues, setShowIssues] = useState(false);
  const result = validateCdrlPathModel(model);

  function handleExport() {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cdrl-did-data-model.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cdrl-path-export-manager">
      <div className="cdrl-badge-row">
        <button className="button-secondary" onClick={handleExport} disabled={!result.valid}>
          Export JSON
        </button>
        <span className={`badge ${result.valid ? "badge-info" : "badge-warning"}`}>
          {result.valid ? "Model valid" : `${result.issues.length} validation issue${result.issues.length === 1 ? "" : "s"}`}
        </span>
        {!result.valid && (
          <button className="link-button" onClick={() => setShowIssues((v) => !v)}>
            {showIssues ? "Hide issues" : "Show issues"}
          </button>
        )}
        {isDirty && <span className="badge badge-warning">Unsaved changes — export to save</span>}
      </div>
      {!result.valid && showIssues && (
        <ul className="cdrl-path-validation-issues">
          {result.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
      {!result.valid && (
        <p className="hint">Export is disabled until validation passes — matches validateModel()'s role as the gate both import and edit pathways share.</p>
      )}
    </div>
  );
}
