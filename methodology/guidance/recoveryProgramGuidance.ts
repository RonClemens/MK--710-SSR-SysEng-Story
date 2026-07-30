import type { Baseline, CiTier, ReconciliationEvent } from "../../client/src/types";

// Architecture Guidance §7 Step 5 / PKM Migration Step 2 (coordinated pass —
// see client/src/types/index.ts's Baseline entity comment for why these two
// steps land together here): this file previously hardcoded "Baseline B" and
// "Baseline A" as proper nouns in the two prose constants below. That's
// exactly the §1.1 anti-pattern (editable override ≠ real separation) —
// per-program specifics baked into methodology-layer defaultValue text.
//
// The fix: the prose below is now fully generic — it would read the same
// for any program, any pair of baselines. The specific fact ("it's Baseline
// B for this program") is no longer asserted in prose at all; it's derived
// from the Baseline entity's own reconciledFromBaselineId field via
// findReconciliationTargetBaseline() below, and rendered as an explicit,
// data-sourced "Applies to" line by whichever page consumes this guidance
// (see CisPage.tsx and sempExport.ts) — a real reference, not a string.
export const RECOVERY_PROGRAM_INTRO =
  "Per this program's Lead Systems Engineer: on the baseline currently undergoing reconciliation, this app's " +
  "existing CI Tier field isn't just a criticality ranking — it doubles as this program's configuration-delta " +
  "classification, reconciling each CI against a prior baseline. Assigning a CI's Tier on that baseline is the " +
  "same decision as classifying how much of that CI's prior design can be carried forward versus how much has " +
  "to be reworked.";

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
  "This mapping is specific to the baseline currently undergoing reconciliation, per this program's LSE — it is " +
  "not asserted here as a general rule for every baseline or for programs generally. A CI's Tier assignment on " +
  "that baseline should be read as this reconciliation decision; changing a CI's Tier there is a " +
  "delta-classification decision, not just a criticality re-rating, and should be dispositioned with the same " +
  "rigor as a Delta Matrix finding.";

// The data-sourced fact the prose above deliberately no longer hardcodes:
// which Baseline record this program's recovery delta-classification
// convention actually applies to. Modeled as "whichever Baseline is the
// `fromBaselineId` of a real ReconciliationEvent" (PKM Migration Step 12) --
// previously read the now-removed Baseline.reconciledFromBaselineId field
// directly; same derived fact, now sourced from the dedicated entity instead
// of a field pair on Baseline itself.
export function findReconciliationTargetBaseline(
  baselines: Baseline[],
  reconciliationEvents: ReconciliationEvent[],
): Baseline | undefined {
  const fromBaselineIds = new Set(reconciliationEvents.map((e) => e.fromBaselineId));
  return baselines.find((b) => fromBaselineIds.has(b.id));
}
