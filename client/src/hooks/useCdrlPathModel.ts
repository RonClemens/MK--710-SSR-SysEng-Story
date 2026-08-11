import { useMemo } from "react";
import cdrlPathModelJson from "../../../docs/cdrl-path/cdrl-did-data-model.json";
import type { CdrlPathModel } from "../types/cdrlPath";

// Phase 1 loads only the bundled default copy (the single source of truth stays at
// docs/cdrl-path/cdrl-did-data-model.json — see docs/cdrl-path/DECISIONS.md #5 for why it
// isn't duplicated into the client tree). A file-picker override for this reference model,
// and the per-program status overlay's separate useEntity-backed load, are later phases.
export function useCdrlPathModel(): CdrlPathModel {
  return useMemo(() => cdrlPathModelJson as unknown as CdrlPathModel, []);
}
