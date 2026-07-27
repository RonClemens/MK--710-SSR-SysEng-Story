import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { useSiteContent } from "../contexts/SiteContentContext";

// Placeholder-only gate for this development stage. A hardcoded client-side
// string is visible to anyone reading the bundled JS or opening devtools --
// this is deliberate friction against accidental edits while multiple
// people share this environment, not real access control. Replace with an
// actual auth check before this app ever handles real program data.
const EDIT_MODE_PASSWORD = "edit";

export function EditModeFab() {
  const { editMode, setEditMode } = useSiteContent();
  const [promptOpen, setPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (editMode) {
      setEditMode(false);
      return;
    }
    setPassword("");
    setError(null);
    setPromptOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password === EDIT_MODE_PASSWORD) {
      setEditMode(true);
      setPromptOpen(false);
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <>
      <button
        type="button"
        className={`edit-mode-fab${editMode ? " active" : ""}`}
        onClick={handleClick}
        aria-label={editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        title={editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
      >
        ✎
      </button>
      {promptOpen && (
        <Modal title="Enter Edit Mode" onClose={() => setPromptOpen(false)}>
          <form className="entity-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="off"
              />
            </label>
            <p className="hint">
              A placeholder gate for this development stage, not real access control — anyone reading this app's
              source can see the password.
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="button-secondary" onClick={() => setPromptOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Unlock
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
