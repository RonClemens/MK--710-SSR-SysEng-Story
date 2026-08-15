import { useState } from "react";
import type { CdrlPathModel, CdrlPathWorkflowOverlay } from "../types/cdrlPath";
import { generateDisciplineGuide, generateOrientationGuide } from "../utils/cdrlPathGuideGenerator";

interface Props {
  model: CdrlPathModel;
  workflowOverlay: CdrlPathWorkflowOverlay;
}

// Same Blob + object URL + anchor click mechanism as CdrlPathExportManager's JSON download —
// deliberately no second download path. Both guide types read the live `model` (and, for the
// Discipline Guide, the live `workflowOverlay`) directly rather than a synced or exported copy,
// per the Subway Design chat's 2026-08-15 steer: the design chat has no direct repo access and
// never has, so building this as an in-app feature next to the existing export button avoids
// inventing a live-JSON API or a manually-synced copy — there's nothing to keep in sync when
// the generator and the data live in the same runtime.
function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CdrlPathGuideExport({ model, workflowOverlay }: Props) {
  const [domainId, setDomainId] = useState(model.lines[0]?.id ?? "");

  function handleDisciplineExport() {
    const content = generateDisciplineGuide(model, domainId, workflowOverlay);
    downloadMarkdown(`cdrl-path-discipline-guide-${domainId.toLowerCase()}.md`, content);
  }

  function handleOrientationExport() {
    downloadMarkdown("cdrl-path-orientation-guide.md", generateOrientationGuide(model));
  }

  return (
    <div className="cdrl-path-guide-export">
      <div className="cdrl-badge-row">
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="cdrl-guide-domain-select"
          aria-label="Discipline for guide export"
        >
          {model.lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.label}
            </option>
          ))}
        </select>
        <button type="button" className="button-secondary" onClick={handleDisciplineExport}>
          Export Discipline Guide
        </button>
        <button type="button" className="button-secondary" onClick={handleOrientationExport}>
          Export Orientation Guide
        </button>
      </div>
      <p className="hint">
        Markdown + Mermaid, generated live from the current model and workflow state — regenerate after any update to stay
        current. Some sections (role framing, discipline-contribution copy) are placeholders pending authored content.
      </p>
    </div>
  );
}
