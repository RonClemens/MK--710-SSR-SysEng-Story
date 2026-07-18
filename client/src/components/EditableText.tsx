import { useState, type ElementType } from "react";
import { Modal } from "./Modal";
import { useSiteContent } from "../contexts/SiteContentContext";

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  as?: ElementType;
  className?: string;
}

export function EditableText({ contentKey, defaultValue, as, className }: EditableTextProps) {
  const { editMode, getValue, hasOverride, getHistory, setValue, resetValue } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = getValue(contentKey, defaultValue);
  const Tag: ElementType = as ?? "span";

  if (!editMode) {
    return <Tag className={className}>{value}</Tag>;
  }

  function openEditor() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setValue(contentKey, draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setError(null);
    try {
      await resetValue(contentKey);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  }

  const history = getHistory(contentKey);

  return (
    <>
      <Tag className={`editable-text ${className ?? ""}`}>
        {value}
        <button type="button" className="editable-text-pencil" onClick={openEditor} aria-label="Edit text" title="Edit text">
          ✎
        </button>
      </Tag>
      {editing && (
        <Modal title="Edit Text" onClose={() => setEditing(false)}>
          <div className="form-field">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} autoFocus />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="button-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            {hasOverride(contentKey) && (
              <button className="link-button danger" onClick={handleReset} disabled={saving}>
                Reset to original
              </button>
            )}
            <button className="button-primary" onClick={handleSave} disabled={saving || draft === value}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {history.length > 0 && (
            <details className="editable-text-history">
              <summary>Version history ({history.length})</summary>
              <ul>
                {[...history].reverse().map((h, i) => (
                  <li key={i}>
                    <div className="editable-text-history-meta">
                      <span className="hint">{new Date(h.updatedAt).toLocaleString()}</span>
                      <button type="button" className="link-button" onClick={() => setDraft(h.value)}>
                        Revert to this
                      </button>
                    </div>
                    <p className="editable-text-history-value">{h.value}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Modal>
      )}
    </>
  );
}
