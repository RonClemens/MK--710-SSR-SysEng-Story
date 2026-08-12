// Formal graph representation for CDRL Path's track routing, per Ron's steer: "employ
// dijkstra's algorithm to this entire network... describe the network in the data structure
// feeding the diagram as an optimization / linear programming representation." One graph per
// domain ("shortest path... calculated for every color, not just the overall shortest path"),
// solved independently — see docs/cdrl-path/DECISIONS.md #25 for the full formulation.
//
// Nodes are (SETR ring, candidate angle) pairs; edges connect ring r to ring r+1, weighted by
// the angular distance moved. A domain's mandatory multi-domain meetings (see
// cdrlPathLayout.ts's `meetings`) become hard constraints: at a meeting ring, the only legal
// node is the one at that meeting's angle, so the shortest path is forced through it. The
// objective — "minimize distance between all the lines constrained at each SETR event" — is
// exactly total edge weight along the path: the least total angular travel that still visits
// every required meeting in ring order.

export interface GraphNode {
  id: string;
  ring: number;
  angle: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

export function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, GraphEdge[]>();
  edges.forEach((edge) => {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge);
    adjacency.set(edge.from, list);
  });
  return { nodes: nodeMap, adjacency };
}

/** Textbook Dijkstra: linear-scan "extract min" rather than a binary heap, since these graphs
 * are tiny (a handful of candidate angles per ring, at most ~11 rings) — O(V^2) is negligible
 * at this scale and keeps the implementation easy to verify by inspection. Returns the node id
 * sequence from startId to endId (inclusive), or null if endId is unreachable. */
export function dijkstraShortestPath(graph: Graph, startId: string, endId: string): string[] | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  for (const id of graph.nodes.keys()) dist.set(id, Infinity);
  dist.set(startId, 0);

  while (visited.size < graph.nodes.size) {
    let currentId: string | null = null;
    let currentDist = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < currentDist) {
        currentDist = d;
        currentId = id;
      }
    }
    if (currentId === null || currentId === endId) break;
    visited.add(currentId);
    (graph.adjacency.get(currentId) ?? []).forEach((edge) => {
      if (visited.has(edge.to)) return;
      const alt = currentDist + edge.weight;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, currentId as string);
      }
    });
  }

  if ((dist.get(endId) ?? Infinity) === Infinity) return null;
  const path: string[] = [];
  let cur: string | undefined = endId;
  while (cur !== undefined) {
    path.unshift(cur);
    if (cur === startId) break;
    cur = prev.get(cur);
  }
  return path[0] === startId ? path : null;
}
