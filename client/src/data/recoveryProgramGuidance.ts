import type { CiTier } from "../types";

// This program's own recovery-program context, per this program's Lead
// Systems Engineer: Baseline B's existing CI Tier classification (already
// modeled by this app — see the CI Inventory tab) doubles as this program's
// configuration-delta classification for reconciling a prior baseline
// against current requirements. This is not a generic MIL-STD-961E tiering
// scheme layered on top of something else — the tier a CI is assigned IS
// the delta-classification decision for that CI on Baseline B.
export const RECOVERY_PROGRAM_INTRO =
  "Per this program's Lead Systems Engineer: on Baseline B, this app's existing CI Tier field isn't just a " +
  "criticality ranking — it doubles as this program's configuration-delta classification, reconciling each CI " +
  "against a prior baseline. Assigning a CI's Tier on Baseline B is the same decision as classifying how much of " +
  "that CI's prior design can be carried forward versus how much has to be reworked.";

export type RecoveryDeltaClass = "Class 1 — Carry Forward" | "Class 2 — Modified" | "Class 3 — Re-Architected";

export const RECOVERY_DELTA_CLASSES: RecoveryDeltaClass[] = [
  "Class 1 — Carry Forward",
  "Class 2 — Modified",
  "Class 3 — Re-Architected",
];

export interface RecoveryDeltaClassMeta {
  tier: CiTier;
  description: string;
  workRequired: string;
}

export const RECOVERY_DELTA_CLASS_TIER_MAPPING: Record<RecoveryDeltaClass, RecoveryDeltaClassMeta> = {
  "Class 1 — Carry Forward": {
    tier: "Tier 3",
    description:
      "The CI's prior design is fundamentally sound and meets current requirements as-is. Work is limited to " +
      "confirming currency of the prior artifacts, importing them into the current configuration-controlled " +
      "baseline, and closing any open prior action items — not new design.",
    workRequired:
      "Lowest reconciliation effort of the three classes — mirrors the lowest-criticality Tier 3 designation " +
      "already used for this CI.",
  },
  "Class 2 — Modified": {
    tier: "Tier 2",
    description:
      "The CI's prior design is sound at its core but requires targeted modification to close a specific " +
      "compliance or requirements gap. Work is delta design: change what's needed, justify it against the prior " +
      "baseline, and update only the affected artifacts — the rest of the prior design remains valid.",
    workRequired:
      "Moderate reconciliation effort — mirrors the mid-criticality Tier 2 designation already used for this CI.",
  },
  "Class 3 — Re-Architected": {
    tier: "Tier 1",
    description:
      "The CI's prior design approach cannot close the gap through modification alone and requires genuine " +
      "re-architecture, treated as new design proceeding through a full review cycle rather than a delta.",
    workRequired:
      "Highest reconciliation effort of the three classes — mirrors the highest-criticality Tier 1 designation " +
      "already used for this CI, and the one most likely to drive schedule risk if not identified early.",
  },
};

export const RECOVERY_DELTA_CLASS_SCOPE_NOTE =
  "This mapping is specific to Baseline B, per this program's LSE — it is not asserted here as a general rule " +
  "for Baseline A or for programs generally. A CI's Tier assignment on Baseline B should be read as this " +
  "reconciliation decision; changing a CI's Tier on Baseline B is a delta-classification decision, not just a " +
  "criticality re-rating, and should be dispositioned with the same rigor as a Delta Matrix finding.";
