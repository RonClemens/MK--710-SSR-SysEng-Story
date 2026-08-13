import { useEffect, useMemo, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, useNodesState, useEdgesState, type Node, type Edge, type EdgeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCdrlPathModel } from "../hooks/useCdrlPathModel";
import { buildCdrlPathFlowElements } from "../utils/cdrlPathLayout";
import { EditableText } from "../components/EditableText";
import { CdrlPathStationDetailPanel } from "../components/CdrlPathStationDetailPanel";
import { CdrlPathExportManager } from "../components/CdrlPathExportManager";
import { CdrlPathModelEditor } from "../components/CdrlPathModelEditor";
import { CdrlPathTrackEdge } from "../components/CdrlPathTrackEdge";
import type { CdrlPathDecompositionLevel } from "../types/cdrlPath";

const EDGE_TYPES: EdgeTypes = { cdrlPathTrack: CdrlPathTrackEdge };

const LINE_ELEMENT_PREFIXES = ["line-label-", "line-edge-"];

function lineIdFromElementId(id: string): string | null {
  const prefix = LINE_ELEMENT_PREFIXES.find((p) => id.startsWith(p));
  return prefix ? id.slice(prefix.length) : null;
}

function nodeIdFromElementId(id: string): string | null {
  if (id.startsWith("station-")) return id.slice("station-".length);
  if (id.startsWith("related-")) return id.slice("related-".length);
  if (id.startsWith("maturity-")) return id.split("-")[1];
  return null;
}

// Phase 2 per docs/cdrl-path/cdrl-path-handoff.md: Level 2 (click a line, expand its
// full_station maturity timeline) and Level 3 (click a station, see its detail). Phase 4/5
// (atomic edit, batch import) are wired up via CdrlPathModelEditor — see its own doc comment
// and DECISIONS.md for how it consolidates both pathways into one JSON-level editor.
export function CdrlPathPage() {
  const { model, setModel, isDirty } = useCdrlPathModel();
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const [decompositionLevel, setDecompositionLevel] = useState<CdrlPathDecompositionLevel>("SYSTEM");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const computed = useMemo(
    () => buildCdrlPathFlowElements(model, { expandedLineId, decompositionLevel }),
    [model, expandedLineId, decompositionLevel],
  );
  // Routed through useNodesState/useEdgesState (React Flow's documented controlled-state
  // hooks) rather than passed as raw props — passing a fresh array directly as the `nodes`
  // prop left newly-appeared nodes (e.g. all of a just-expanded line's maturity markers)
  // rendering on top of each other at one shared position until something else forced a
  // remeasure. The hooks keep React Flow's internal store (which drives per-node
  // measurement) properly in sync with each recomputed layout.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(computed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(computed.edges);
  useEffect(() => {
    setNodes(computed.nodes);
    setEdges(computed.edges);
  }, [computed, setNodes, setEdges]);

  function handleElementClick(elementId: string) {
    const clickedNodeId = nodeIdFromElementId(elementId);
    if (clickedNodeId) {
      setSelectedNodeId(clickedNodeId);
      return;
    }
    const clickedLineId = lineIdFromElementId(elementId);
    if (clickedLineId) {
      setExpandedLineId((current) => (current === clickedLineId ? null : clickedLineId));
    }
  }

  const selectedNode = selectedNodeId ? model.nodes.find((n) => n.id === selectedNodeId) : undefined;

  return (
    <div className="cdrl-path-page">
      <EditableText
        contentKey="cdrlPath.intro"
        defaultValue="Level 1 — system view: the 7 CDRL lines across the SETR sequence, with interchange stations marked. Click a line to expand its full stations (Level 2); click any station for its detail (Level 3). Use Edit Model below to make a direct edit or load a JSON file edited offline."
        as="p"
        className="hint"
      />

      <CdrlPathExportManager model={model} isDirty={isDirty} />

      <div className="cdrl-badge-row" role="group" aria-label="Decomposition level">
        {model.decomposition_dimension.levels.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`cdrl-status-pill${decompositionLevel === level.id ? " selected" : ""}`}
            onClick={() => setDecompositionLevel(level.id)}
            title={level.notes}
          >
            {level.hw_term === level.sw_term ? level.hw_term : `${level.hw_term} / ${level.sw_term}`}
          </button>
        ))}
      </div>

      <CdrlPathModelEditor model={model} onApply={setModel} />

      <div style={{ width: "100%", height: 640, border: "1px solid var(--border-color, #333)" }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodesDraggable={false}
            fitView
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node: Node) => handleElementClick(node.id)}
            onEdgeClick={(_, edge: Edge) => handleElementClick(edge.id)}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {selectedNode && (
        <CdrlPathStationDetailPanel
          model={model}
          node={selectedNode}
          decompositionLevel={decompositionLevel}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
