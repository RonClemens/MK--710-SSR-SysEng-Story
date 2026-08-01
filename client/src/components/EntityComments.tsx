import { useState } from "react";
import type { Comment, Role } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  entityType: string;
  entityId: string;
  comments: ReturnType<typeof useEntity<Comment>>;
  roles: Role[];
}

// Architecture Guidance §13.1's "inline" surface: a small comment-count
// affordance on an existing entity detail view, expanding to a thread.
// entityType/entityId come from the surrounding page's own record, not user
// entry -- the whole point of the inline surface vs. the global list view.
export function EntityComments({ entityType, entityId, comments, roles }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftRoleId, setDraftRoleId] = useState("");

  const rows = comments.rows.filter((c) => c.entityType === entityType && c.entityId === entityId);
  const openCount = rows.filter((c) => c.status === "Open").length;
  const roleName = (id: string | null) => (id ? roles.find((r) => r.id === id)?.name ?? "(unknown role)" : "(unspecified)");

  async function submitDraft() {
    if (!draftText.trim()) return;
    await comments.create({
      projectId: "project-001",
      entityType,
      entityId,
      text: draftText.trim(),
      status: "Open",
      createdByRoleId: draftRoleId || null,
      createdDate: new Date().toISOString().slice(0, 10),
      resolvedDate: null,
    });
    setDraftText("");
    setDraftRoleId("");
    setAdding(false);
    setExpanded(true);
  }

  async function toggleResolved(c: Comment) {
    if (c.status === "Open") {
      await comments.update(c.id, { status: "Resolved", resolvedDate: new Date().toISOString().slice(0, 10) });
    } else {
      await comments.update(c.id, { status: "Open", resolvedDate: null });
    }
  }

  return (
    <div className="entity-comments">
      <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
        💬 {rows.length} comment{rows.length === 1 ? "" : "s"}
        {openCount > 0 ? ` (${openCount} open)` : ""}
      </button>
      {expanded && (
        <div className="entity-comments-panel">
          {rows.length === 0 ? (
            <p className="hint">No comments yet on this record.</p>
          ) : (
            <ul className="entity-comments-list">
              {rows.map((c) => (
                <li key={c.id} className={c.status === "Resolved" ? "resolved" : ""}>
                  <p>{c.text}</p>
                  <p className="hint">
                    {roleName(c.createdByRoleId)} · {c.createdDate}
                    {c.status === "Resolved" && c.resolvedDate ? ` · resolved ${c.resolvedDate}` : ""}
                  </p>
                  <button type="button" className="link-button" onClick={() => toggleResolved(c)}>
                    {c.status === "Open" ? "Mark Resolved" : "Reopen"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {adding ? (
            <div className="entity-comments-add">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Add a comment or TODO…"
                rows={2}
              />
              <select value={draftRoleId} onChange={(e) => setDraftRoleId(e.target.value)}>
                <option value="">(unspecified role)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div className="form-actions">
                <button type="button" className="button-secondary" onClick={() => setAdding(false)}>
                  Cancel
                </button>
                <button type="button" className="button-primary" onClick={submitDraft}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="button-secondary" onClick={() => setAdding(true)}>
              + Add Comment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
