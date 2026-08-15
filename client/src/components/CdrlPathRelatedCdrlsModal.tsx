import { useState } from "react";
import { Modal } from "./Modal";
import { CdrlPathNodeDetail } from "./CdrlPathNodeDetail";
import type { CdrlPathModel, CdrlPathWorkflowOverlay } from "../types/cdrlPath";

interface Props {
  model: CdrlPathModel;
  title: string;
  relatedNodeIds: string[];
  decompositionLevel: string;
  workflowOverlay: CdrlPathWorkflowOverlay;
  onClose: () => void;
}

// Per Ron's steer: clicking a station or transfer hub opens a modal listing the CDRLs related
// to it — itself plus its influences/influenced_by for a single station or interchange (see
// relatedIdsForNode in CdrlPathPage.tsx), or every CDRL sharing a handoff hub's relationship
// cluster (see relatedNodeIds/modalTitle baked into handoff-hub nodes in cdrlPathLayout.ts) —
// rather than jumping straight to one node's own detail. Each list entry expands as a side
// drawer INSIDE this same modal, not a second stacked modal.
export function CdrlPathRelatedCdrlsModal({ model, title, relatedNodeIds, decompositionLevel, workflowOverlay, onClose }: Props) {
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);
  const relatedNodes = relatedNodeIds
    .map((id) => model.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);
  const drawerNode = drawerNodeId ? relatedNodes.find((n) => n.id === drawerNodeId) : undefined;

  return (
    <Modal title={title} onClose={onClose} className="cdrl-related-modal">
      <div className={`cdrl-related-modal-layout${drawerNode ? " drawer-open" : ""}`}>
        <ul className="cdrl-related-list">
          {relatedNodes.map((node) => {
            const isOpen = drawerNodeId === node.id;
            return (
              <li key={node.id} className={`cdrl-related-list-item${isOpen ? " expanded" : ""}`}>
                <button
                  type="button"
                  className="cdrl-related-list-item-toggle"
                  onClick={() => setDrawerNodeId((current) => (current === node.id ? null : node.id))}
                  aria-expanded={isOpen}
                >
                  <span className="cdrl-related-list-item-title">{node.title}</span>
                  <span className="hint">{node.did ?? node.id}</span>
                  <span className="cdrl-related-list-item-caret">{isOpen ? "◂" : "▸"}</span>
                </button>
              </li>
            );
          })}
          {relatedNodes.length === 0 && <li className="empty-row">No related CDRLs on file.</li>}
        </ul>

        {drawerNode && (
          <div className="cdrl-related-drawer">
            <div className="cdrl-related-drawer-header">
              <h4>{drawerNode.title}</h4>
              <button className="icon-button" onClick={() => setDrawerNodeId(null)} aria-label="Close drawer">
                ×
              </button>
            </div>
            <div className="cdrl-related-drawer-body">
              <CdrlPathNodeDetail model={model} node={drawerNode} decompositionLevel={decompositionLevel} workflowOverlay={workflowOverlay} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
