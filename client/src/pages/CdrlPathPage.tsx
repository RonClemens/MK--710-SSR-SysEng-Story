import { useEffect, useMemo, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, useNodesState, useEdgesState, type Node, type Edge, type EdgeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCdrlPathModel } from "../hooks/useCdrlPathModel";
import { buildCdrlPathFlowElements } from "../utils/cdrlPathLayout";
import { relatedIdsForNode } from "../utils/cdrlPathRelated";
import { EditableText } from "../components/EditableText";
import { CdrlPathRelatedCdrlsModal } from "../components/CdrlPathRelatedCdrlsModal";
import { CdrlPathMatrixView } from "../components/CdrlPathMatrixView";
import { CdrlPathExportManager } from "../components/CdrlPathExportManager";
import { CdrlPathGuideExport } from "../components/CdrlPathGuideExport";
import { CdrlPathModelEditor } from "../components/CdrlPathModelEditor";
import { CdrlPathTrackEdge } from "../components/CdrlPathTrackEdge";
import { CDRL_PATH_DEMO_WORKFLOW_OVERLAY } from "../utils/cdrlPathDemoWorkflowOverlay";
import type { CdrlPathDecompositionLevel, CdrlPathModel } from "../types/cdrlPath";

const EDGE_TYPES: EdgeTypes = { cdrlPathTrack: CdrlPathTrackEdge };

const LINE_ELEMENT_PREFIXES = ["line-label-", "line-edge-"];

type CdrlPathViewMode = "matrix" | "subway";

interface SelectedTarget {
  title: string;
  relatedNodeIds: string[];
}

function lineIdFromElementId(id: string): string | null {
  const prefix = LINE_ELEMENT_PREFIXES.find((p) => id.startsWith(p));
  return prefix ? id.slice(prefix.length) : null;
}

function nodeIdFromElementId(id: string): string | null {
  if (id.startsWith("station-")) return id.slice("station-".length);
  if (id.startsWith("maturity-")) return id.split("-")[1];
  return null;
}

/** A ring label, the PRR hub, and any terminal transfer hub all carry their own
 * relatedNodeIds/modalTitle straight from layout time (see cdrlPathLayout.ts) — they represent
 * "everything required at this SETR event," not one specific CDRL, so the page can't derive
 * that list from the element's id the way it can for a single CDRL's own station marker. */
function targetForElement(element: Node | Edge, model: CdrlPathModel): SelectedTarget | null {
  const data = (element as Node).data as { relatedNodeIds?: string[]; modalTitle?: string } | undefined;
  if (data?.relatedNodeIds && data?.modalTitle) {
    return { title: data.modalTitle, relatedNodeIds: data.relatedNodeIds };
  }
  const nodeId = nodeIdFromElementId(element.id);
  if (!nodeId) return null;
  const node = model.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  return { title: node.title, relatedNodeIds: relatedIdsForNode(node) };
}

// Phase 2 per docs/cdrl-path/cdrl-path-handoff.md: Level 2 (click a line, expand its
// full_station maturity timeline) and Level 3 (click a station, see its detail). Phase 4/5
// (atomic edit, batch import) are wired up via CdrlPathModelEditor — see its own doc comment
// and DECISIONS.md for how it consolidates both pathways into one JSON-level editor.
export function CdrlPathPage() {
  const { model, setModel, isDirty } = useCdrlPathModel();
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const [decompositionLevel, setDecompositionLevel] = useState<CdrlPathDecompositionLevel>("SYSTEM");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  // Matrix is the default per the Subway Design chat's 2026-08-14 research recommendation
  // ("adopt a discipline-swimlane × SETR-event maturity matrix as your primary broad-audience
  // view... keep the subway/transit-map metaphor as a secondary orientation graphic"). Both
  // views share the same model, decomposition-level filter, and related-CDRLs modal.
  const [viewMode, setViewMode] = useState<CdrlPathViewMode>("matrix");
  // Off by default — an additive overlay on top of the existing relationship-track connectors,
  // not a replacement, so it only adds clutter until someone specifically asks to see it.
  const [showLineage, setShowLineage] = useState(false);

  const computed = useMemo(
    () => buildCdrlPathFlowElements(model, { expandedLineId, decompositionLevel, showLineage }),
    [model, expandedLineId, decompositionLevel, showLineage],
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

  function handleElementClick(element: Node | Edge) {
    const target = targetForElement(element, model);
    if (target) {
      setSelectedTarget(target);
      return;
    }
    const clickedLineId = lineIdFromElementId(element.id);
    if (clickedLineId) {
      setExpandedLineId((current) => (current === clickedLineId ? null : clickedLineId));
    }
  }

  return (
    <div className="cdrl-path-page">
      <EditableText
        contentKey="cdrlPath.intro"
        defaultValue="Matrix view: each discipline's CDRLs by SETR event and Draft/Final/Update maturity — click any chip for detail. Switch to Subway Map for the domain-track/interchange visualization. Use Edit Model below to make a direct edit or load a JSON file edited offline."
        as="p"
        className="hint"
      />

      <CdrlPathExportManager model={model} isDirty={isDirty} />
      <CdrlPathGuideExport model={model} workflowOverlay={CDRL_PATH_DEMO_WORKFLOW_OVERLAY} />

      <div className="cdrl-badge-row" role="group" aria-label="View">
        <button
          type="button"
          className={`cdrl-status-pill${viewMode === "matrix" ? " selected" : ""}`}
          onClick={() => setViewMode("matrix")}
        >
          Matrix
        </button>
        <button
          type="button"
          className={`cdrl-status-pill${viewMode === "subway" ? " selected" : ""}`}
          onClick={() => setViewMode("subway")}
        >
          Subway Map
        </button>
      </div>

      {viewMode === "subway" && (
        <label className="cdrl-badge-row cdrl-lineage-toggle">
          <input type="checkbox" checked={showLineage} onChange={(e) => setShowLineage(e.target.checked)} />
          Show developmental lineage (derived_from flow-down arrows)
        </label>
      )}

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

      {viewMode === "matrix" ? (
        <CdrlPathMatrixView
          model={model}
          decompositionLevel={decompositionLevel}
          workflowOverlay={CDRL_PATH_DEMO_WORKFLOW_OVERLAY}
          onSelect={setSelectedTarget}
        />
      ) : (
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
              onNodeClick={(_, node: Node) => handleElementClick(node)}
              onEdgeClick={(_, edge: Edge) => handleElementClick(edge)}
            >
              <Background />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      {selectedTarget && (
        <CdrlPathRelatedCdrlsModal
          model={model}
          title={selectedTarget.title}
          relatedNodeIds={selectedTarget.relatedNodeIds}
          decompositionLevel={decompositionLevel}
          workflowOverlay={CDRL_PATH_DEMO_WORKFLOW_OVERLAY}
          onClose={() => setSelectedTarget(null)}
        />
      )}
    </div>
  );
}
