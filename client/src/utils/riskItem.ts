import type { RiskItem, RiskScoreValue } from "../types";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

// RIO's 5x5 risk-matrix scoring: score = likelihood x max(consequence dimensions).
// For itemType: "Issue", likelihood is null (an issue has already occurred, so
// probability isn't independently scored) -- this app's own reading of the PKM
// spec, treated as likelihood = 1 for the purposes of this derivation only.
// Banding follows the standard 5x5 matrix quadrants: 1-4 Low, 5-9 Moderate,
// 10-14 High, 15-25 Critical.
export function riskScore(item: RiskItem): number {
  const likelihood: RiskScoreValue = item.likelihood ?? 1;
  const maxConsequence = Math.max(item.consequenceCost, item.consequenceSchedule, item.consequencePerformance);
  return likelihood * maxConsequence;
}

export function deriveRiskLevel(item: RiskItem): RiskLevel {
  const score = riskScore(item);
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Moderate";
  return "Low";
}
