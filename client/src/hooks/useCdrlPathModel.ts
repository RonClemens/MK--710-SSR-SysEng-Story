import { useMemo, useState } from "react";
import cdrlPathModelJson from "../../../docs/cdrl-path/cdrl-did-data-model.json";
import type { CdrlPathModel } from "../types/cdrlPath";

const DEFAULT_MODEL = cdrlPathModelJson as unknown as CdrlPathModel;

export interface UseCdrlPathModelResult {
  model: CdrlPathModel;
  /** Replaces the working model wholesale — used by CdrlPathModelEditor after a successful
   * parse + validate, for both an in-place edit and a full offline-edited replacement. */
  setModel: (next: CdrlPathModel) => void;
  /** True once the working model differs from the bundled default — the reference model is
   * Export/Download-only (see DECISIONS.md #5), so this drives the "unsaved changes" banner
   * rather than any auto-save. */
  isDirty: boolean;
  resetToDefault: () => void;
}

// The bundled default copy (docs/cdrl-path/cdrl-did-data-model.json — see DECISIONS.md #5 for
// why it isn't duplicated into the client tree) is now the INITIAL value of live, editable
// state rather than a fixed return — CdrlPathModelEditor can replace it wholesale (batch
// import of an offline-edited file) or in place (a small direct edit), matching the atomic
// edit / batch import pathways in cdrl-path-import-export-architecture.md, which both commit
// through the same in-memory state and the same validateModel() gate.
export function useCdrlPathModel(): UseCdrlPathModelResult {
  const [model, setModel] = useState<CdrlPathModel>(DEFAULT_MODEL);
  const isDirty = useMemo(() => model !== DEFAULT_MODEL, [model]);
  return { model, setModel, isDirty, resetToDefault: () => setModel(DEFAULT_MODEL) };
}
