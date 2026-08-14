import type { CdrlPathDecompositionLevel, CdrlPathModel } from "../types/cdrlPath";

// Port of the shared validation engine described in cdrl-path-import-export-architecture.md
// §"Shared validation engine" — both ImportManager (Phase 5) and AtomicEditPanel (Phase 4)
// must call this same function before committing any change, never a second code path.

export interface CdrlPathValidationResult {
  valid: boolean;
  issues: string[];
}

// Nodes explicitly allowed to have no maturity data at all — the architecture doc names
// CDD as the example ("Government-provided top-level input; anchors the input line before
// SRR" — it has no DID/submission cadence of its own to track). Not derived from the JSON
// itself since no formal exemption-list field exists there yet; flagged here so it's a
// single visible place to extend if more exemptions are confirmed later.
const MATURITY_EXEMPT_NODE_IDS = new Set(["CDD"]);

// Best-effort short tags for maturity_states_by_level entries in the generated summary,
// e.g. "RVTM[SYS](draft)". Only SYS and CI are attested in the current data (RVTM is the
// only multi-level node so far); the rest are inferred for when more nodes gain this shape.
const LEVEL_TAG: Record<CdrlPathDecompositionLevel, string> = {
  SYSTEM: "SYS",
  ELEMENT_SUBSYSTEM: "SUB",
  CONFIGURATION_ITEM: "CI",
  COMPONENT: "COMP",
  UNIT: "UNIT",
};

/**
 * Regenerates station_summary_by_setr_event from node maturity data — per
 * confirmed_patterns.station_summary_generation in the data model, this field must never be
 * hand-edited, only produced by this function. Deliberately uses EXACT event-id matching
 * (not the fuzzy multi-token resolver used for chart positioning in cdrlPathLayout.ts):
 * the summary is a precise text index, not a best-effort visual placement, so an
 * unresolvable at_event (a Milestone/contract-day marker, an ECP-lockstep phrase) is
 * correctly omitted rather than guessed at. Recurring UPDATE states with a range/phrase
 * at_event ("every SETR through PRR") are omitted too — the chart's repeating-halo marker
 * is where that cadence is shown; a text index entry per occurrence would just be noise.
 * A recurring UPDATE with a single fixed at_event (e.g. SAR's "PRR") is still included.
 */
export function generateStationSummaryBySetrEvent(model: CdrlPathModel): Record<string, string[]> {
  const summary: Record<string, string[]> = {};
  for (const event of model.lifecycle_lanes.setr_events) summary[event.id] = [];

  function addIfResolvable(nodeId: string, levelTag: string | null, state: { state: string; at_event: string; recurring?: boolean }) {
    const isUpdate = state.state.toUpperCase() === "UPDATE";
    if (isUpdate && state.recurring) {
      const exact = model.lifecycle_lanes.setr_events.some((e) => e.id === state.at_event.trim());
      if (!exact) return; // range/phrase recurring UPDATE — omitted, chart shows the cadence instead
    }
    const event = model.lifecycle_lanes.setr_events.find((e) => e.id === state.at_event.trim());
    if (!event) return;
    const label = levelTag ? `${nodeId}[${levelTag}](${state.state.toLowerCase()})` : `${nodeId}(${state.state.toLowerCase()})`;
    summary[event.id].push(label);
  }

  for (const node of model.nodes) {
    if (node.maturity_states_by_level) {
      for (const [level, states] of Object.entries(node.maturity_states_by_level)) {
        const tag = LEVEL_TAG[level as CdrlPathDecompositionLevel] ?? level;
        for (const state of states ?? []) addIfResolvable(node.id, tag, state);
      }
    } else {
      for (const state of node.maturity_states ?? []) addIfResolvable(node.id, null, state);
    }
  }

  return summary;
}

function nodeIdFromSummaryEntry(entry: string): string {
  const bracketOrParen = entry.search(/[[(]/);
  return bracketOrParen === -1 ? entry : entry.slice(0, bracketOrParen);
}

/** Distinct CDRL ids required at each SETR event, derived from `generateStationSummaryBySetrEvent`
 * by stripping its per-state/per-level tags and deduplicating. Used by the map's per-ring click
 * targets (see cdrlPathLayout.ts) to answer "what's due at this SETR event," a coarser question
 * than the exact-state text index the summary itself renders. */
export function getRequiredNodeIdsBySetrEvent(model: CdrlPathModel): Record<string, string[]> {
  const summary = generateStationSummaryBySetrEvent(model);
  const result: Record<string, string[]> = {};
  for (const [eventId, entries] of Object.entries(summary)) {
    result[eventId] = Array.from(new Set(entries.map(nodeIdFromSummaryEntry)));
  }
  return result;
}

function isPlaceholderDid(did: string | undefined): boolean {
  if (!did) return true;
  return /\[VERIFY\]/i.test(did) || /^N\/A/i.test(did.trim());
}

export function validateCdrlPathModel(model: CdrlPathModel): CdrlPathValidationResult {
  const issues: string[] = [];
  const nodeIds = new Set(model.nodes.map((n) => n.id));

  // 1. No dangling influences/influenced_by references ("ALL" is a valid special case).
  for (const node of model.nodes) {
    for (const field of ["influences", "influenced_by"] as const) {
      for (const targetId of node[field] ?? []) {
        if (targetId !== "ALL" && !nodeIds.has(targetId)) {
          issues.push(`${node.id}.${field} references unknown node "${targetId}"`);
        }
      }
    }
  }

  // 2. Every node has maturity data or is explicitly exempt.
  for (const node of model.nodes) {
    if (MATURITY_EXEMPT_NODE_IDS.has(node.id)) continue;
    const hasFlat = (node.maturity_states?.length ?? 0) > 0;
    const hasByLevel = node.maturity_states_by_level && Object.values(node.maturity_states_by_level).some((s) => (s?.length ?? 0) > 0);
    if (!hasFlat && !hasByLevel) {
      issues.push(`${node.id} has no maturity_states, no maturity_states_by_level, and is not in the maturity exemption list`);
    }
  }

  // 3 & 4. station_summary_by_setr_event: always validated against a freshly regenerated
  // copy (never the possibly-stale stored field), which is how check #4 ("regenerated from
  // node data, never hand-edited — call the generator function") is actually enforced here
  // — there is no separate stored-vs-regenerated diff step, the app simply never trusts a
  // stored copy in the first place. See the function doc comment above for why this reads
  // as an architectural rule for the implementer rather than a runtime drift assertion.
  const regenerated = generateStationSummaryBySetrEvent(model);
  const validEventIds = new Set(model.lifecycle_lanes.setr_events.map((e) => e.id));
  for (const [eventId, entries] of Object.entries(regenerated)) {
    if (!validEventIds.has(eventId)) {
      issues.push(`station_summary_by_setr_event has a key "${eventId}" that isn't a valid SETR event id`);
      continue;
    }
    for (const entry of entries) {
      const referencedNodeId = nodeIdFromSummaryEntry(entry);
      if (!nodeIds.has(referencedNodeId)) {
        issues.push(`station_summary_by_setr_event["${eventId}"] entry "${entry}" references unknown node "${referencedNodeId}"`);
      }
    }
  }

  // 5. No duplicate DID numbers across distinct nodes, excluding [VERIFY]/N/A placeholders.
  const didToNodeIds = new Map<string, string[]>();
  for (const node of model.nodes) {
    if (isPlaceholderDid(node.did)) continue;
    const did = node.did!.trim();
    didToNodeIds.set(did, [...(didToNodeIds.get(did) ?? []), node.id]);
  }
  for (const [did, nodeIdsForDid] of didToNodeIds) {
    if (nodeIdsForDid.length > 1) {
      issues.push(`DID "${did}" is used by more than one node: ${nodeIdsForDid.join(", ")}`);
    }
  }

  // 6. No dangling derived_from references. Unlike influences/influenced_by, "ALL" isn't a
  // valid target here — developmental lineage is always a specific parent, never "everything."
  for (const node of model.nodes) {
    for (const parentId of node.derived_from ?? []) {
      if (!nodeIds.has(parentId)) {
        issues.push(`${node.id}.derived_from references unknown node "${parentId}"`);
      }
    }
  }

  // 7. derived_from must form a DAG — a real derivation lineage can't cycle back on itself
  // (a document can't be built from a document that was itself built from it). Standard
  // three-color DFS cycle detection.
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>(model.nodes.map((n) => [n.id, WHITE]));
  const nodeByIdForCycleCheck = new Map(model.nodes.map((n) => [n.id, n]));
  const cycleNodesReported = new Set<string>();
  function visit(nodeId: string, path: string[]) {
    color.set(nodeId, GRAY);
    const node = nodeByIdForCycleCheck.get(nodeId);
    for (const parentId of node?.derived_from ?? []) {
      if (!nodeIds.has(parentId)) continue; // already reported by check 6
      const parentColor = color.get(parentId);
      if (parentColor === GRAY) {
        const cycleKey = [...path, nodeId, parentId].sort().join(">");
        if (!cycleNodesReported.has(cycleKey)) {
          cycleNodesReported.add(cycleKey);
          issues.push(`derived_from cycle: ${[...path, nodeId, parentId].join(" → ")}`);
        }
      } else if (parentColor === WHITE) {
        visit(parentId, [...path, nodeId]);
      }
    }
    color.set(nodeId, BLACK);
  }
  for (const node of model.nodes) {
    if (color.get(node.id) === WHITE) visit(node.id, []);
  }

  return { valid: issues.length === 0, issues };
}
