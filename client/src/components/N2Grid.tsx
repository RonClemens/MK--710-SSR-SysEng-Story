import { useState } from "react";
import { Modal } from "./Modal";
import { EditableText } from "./EditableText";
import type { InterfaceRecord, InterfaceScope } from "../types";

export interface N2Element {
  id: string;
  name: string;
}

interface N2GridProps {
  scope: InterfaceScope;
  elements: N2Element[];
  interfaces: InterfaceRecord[];
  getDerivedHint: (aId: string, bId: string) => string[];
  onSave: (params: { id?: string; aId: string; bId: string; description: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectElement: (id: string) => void;
  /** Subsystem-scope grids only: drill into the CI×CI grid filtered to the CIs serving these two subsystems. */
  onDrillDown?: (aId: string, bId: string) => void;
}

function shortCode(index: number): string {
  return `E${index + 1}`;
}

function findInterface(interfaces: InterfaceRecord[], aId: string, bId: string): InterfaceRecord | undefined {
  return interfaces.find((r) => (r.aId === aId && r.bId === bId) || (r.aId === bId && r.bId === aId));
}

export function N2Grid({
  scope,
  elements,
  interfaces,
  getDerivedHint,
  onSave,
  onDelete,
  onSelectElement,
  onDrillDown,
}: N2GridProps) {
  const [editingPair, setEditingPair] = useState<{ aId: string; bId: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documented = interfaces.filter((r) => r.scope === scope);

  function openCell(aId: string, bId: string) {
    const existing = findInterface(documented, aId, bId);
    if (existing) {
      setDraft(existing.description);
    } else {
      const hint = getDerivedHint(aId, bId);
      setDraft(hint.length > 0 ? `Shared via: ${hint.join(", ")}` : "");
    }
    setError(null);
    setEditingPair({ aId, bId });
  }

  async function handleSave() {
    if (!editingPair) return;
    setSaving(true);
    setError(null);
    try {
      const existing = findInterface(documented, editingPair.aId, editingPair.bId);
      await onSave({ id: existing?.id, aId: editingPair.aId, bId: editingPair.bId, description: draft });
      setEditingPair(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingPair) return;
    const existing = findInterface(documented, editingPair.aId, editingPair.bId);
    if (!existing) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(existing.id);
      setEditingPair(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  const editingA = editingPair ? elements.find((e) => e.id === editingPair.aId) : null;
  const editingB = editingPair ? elements.find((e) => e.id === editingPair.bId) : null;
  const editingExisting = editingPair ? findInterface(documented, editingPair.aId, editingPair.bId) : undefined;

  return (
    <div>
      <div className="table-scroll">
        <table className="n2-table">
          <thead>
            <tr>
              <th className="n2-corner" />
              {elements.map((el, j) => (
                <th key={el.id} className="n2-axis-label" title={el.name}>
                  {shortCode(j)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elements.map((rowEl, i) => (
              <tr key={rowEl.id}>
                <th className="n2-axis-label" title={rowEl.name}>
                  {shortCode(i)}
                </th>
                {elements.map((colEl, j) => {
                  if (i === j) {
                    return (
                      <td key={colEl.id} className="n2-diagonal">
                        <button className="link-button" onClick={() => onSelectElement(rowEl.id)}>
                          {rowEl.name}
                        </button>
                      </td>
                    );
                  }
                  const existing = findInterface(documented, rowEl.id, colEl.id);
                  const hint = existing ? [] : getDerivedHint(rowEl.id, colEl.id);
                  const cls = existing ? "n2-documented" : hint.length > 0 ? "n2-derived" : "n2-empty";
                  const titleText = existing
                    ? `${rowEl.name} ↔ ${colEl.name}: ${existing.description}`
                    : hint.length > 0
                      ? `${rowEl.name} ↔ ${colEl.name} — derived via: ${hint.join(", ")} (click to document)`
                      : `${rowEl.name} ↔ ${colEl.name} — click to document an interface`;
                  return (
                    <td
                      key={colEl.id}
                      className={cls}
                      title={titleText}
                      onClick={() => openCell(rowEl.id, colEl.id)}
                      role="button"
                    >
                      {existing ? "●" : hint.length > 0 ? "○" : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditableText
        contentKey={`n2Grid.${scope}.legend`}
        defaultValue={`● documented interface · ○ derived only (shares a ${
          scope === "subsystem" ? "CI, not yet documented" : "subsystem, not yet documented"
        }) · click any off-diagonal cell to add or edit`}
        as="p"
        className="hint"
      />

      <section>
        <h3>
          <EditableText contentKey="n2Grid.documentedInterfacesLabel" defaultValue="Documented Interfaces" as="span" />{" "}
          ({documented.length})
        </h3>
        {documented.length === 0 ? (
          <EditableText
            contentKey="n2Grid.emptyState"
            defaultValue="No interfaces documented yet — click a cell above to add one."
            as="p"
            className="hint"
          />
        ) : (
          documented.map((r) => {
            const a = elements.find((e) => e.id === r.aId);
            const b = elements.find((e) => e.id === r.bId);
            if (!a || !b) return null;
            return (
              <div className="detail-card" key={r.id}>
                <p>
                  <button className="link-button" onClick={() => onSelectElement(a.id)}>
                    {a.name}
                  </button>{" "}
                  ↔{" "}
                  <button className="link-button" onClick={() => onSelectElement(b.id)}>
                    {b.name}
                  </button>{" "}
                  <button className="link-button" onClick={() => openCell(a.id, b.id)}>
                    Edit
                  </button>
                  {onDrillDown && (
                    <button className="link-button" onClick={() => onDrillDown(a.id, b.id)}>
                      View CI-level interfaces →
                    </button>
                  )}
                </p>
                <p>{r.description}</p>
              </div>
            );
          })
        )}
      </section>

      {editingPair && editingA && editingB && (
        <Modal title={`${editingA.name} ↔ ${editingB.name}`} onClose={() => setEditingPair(null)}>
          <div className="entity-form">
            <label className="form-field">
              <span>Interface description</span>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
            </label>
            {error && <p className="form-error">{error}</p>}
            {onDrillDown && editingPair && (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  onDrillDown(editingPair.aId, editingPair.bId);
                  setEditingPair(null);
                }}
              >
                View CI-level interfaces for these subsystems →
              </button>
            )}
            <div className="form-actions">
              {editingExisting && (
                <button type="button" className="link-button danger" onClick={handleDelete} disabled={saving}>
                  Delete
                </button>
              )}
              <button type="button" className="button-secondary" onClick={() => setEditingPair(null)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="button-primary" onClick={handleSave} disabled={saving || !draft.trim()}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
