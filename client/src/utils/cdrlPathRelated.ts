import type { CdrlPathNode } from "../types/cdrlPath";

/** The CDRLs to list for a clicked station/interchange marker or matrix chip: the CDRL itself
 * plus whatever it influences or is influenced by — "ALL" targets are skipped (see
 * confirmed_patterns.relationship_assessment_status; too broad to list). Shared between the
 * subway map (CdrlPathPage) and the maturity matrix (CdrlPathMatrixView) so both click into the
 * exact same related-CDRLs modal for the exact same reason. */
export function relatedIdsForNode(node: CdrlPathNode): string[] {
  const ids = new Set<string>([node.id]);
  (node.influences ?? []).forEach((id) => id !== "ALL" && ids.add(id));
  (node.influenced_by ?? []).forEach((id) => id !== "ALL" && ids.add(id));
  return Array.from(ids);
}
