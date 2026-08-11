import { useMemo } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCdrlPathModel } from "../hooks/useCdrlPathModel";
import { buildLevel1FlowElements } from "../utils/cdrlPathLayout";
import { EditableText } from "../components/EditableText";

// Phase 1 per docs/cdrl-path/cdrl-path-handoff.md: static Level 1 render only (7 lines +
// SETR/baseline interchange stations). Zoom tiers (Level 2/3), atomic edit, and batch
// import are later phases — this page intentionally does not wire up node click handlers,
// the decomposition-level filter, or AtomicEditPanel yet.
export function CdrlPathPage() {
  const model = useCdrlPathModel();
  const { nodes, edges } = useMemo(() => buildLevel1FlowElements(model), [model]);

  return (
    <div className="cdrl-path-page">
      <EditableText
        contentKey="cdrlPath.intro"
        defaultValue="Level 1 — system view: the 7 CDRL lines across the SETR sequence, with interchange stations marked. Click-to-expand (Level 2) and station detail (Level 3) are not built yet."
        as="p"
        className="hint"
      />
      <div style={{ width: "100%", height: 640, border: "1px solid var(--border-color, #333)" }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodesConnectable={false}
            nodesDraggable={false}
            elementsSelectable={false}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
