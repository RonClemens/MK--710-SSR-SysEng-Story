import { useRef, useState } from "react";
import type { CdrlPathModel } from "../types/cdrlPath";
import { validateCdrlPathModel } from "../utils/cdrlPathValidation";

interface Props {
  model: CdrlPathModel;
  onApply: (next: CdrlPathModel) => void;
}

interface ModelDiff {
  added: string[];
  removed: string[];
  changed: string[];
  otherSectionsChanged: string[];
}

// Lightweight stand-in for the full match/diff/conflict-bucket pipeline described in
// cdrl-path-import-export-architecture.md's batch-import section (exact-match, alias-match,
// per-field trusted-override-vs-conflict rules). This compares whole nodes by id instead of
// field-by-field, which is enough to show what a paste/upload actually changes before
// committing it, without building the fuller reconciliation UI the architecture doc
// describes for Ron's eventual real CDRL-schedule import — a documented v1 simplification,
// not a replacement for that spec. `nodes` gets the detailed added/removed/changed-by-id
// treatment since that's where day-to-day edits concentrate; every other top-level section
// (lines, lifecycle_lanes, decomposition_dimension, etc. — e.g. a line's color_hint) is
// checked too, just as a coarser "this section differs" flag rather than a per-field diff.
const NODE_KEYS_EXCLUDED: (keyof CdrlPathModel)[] = ["nodes"];
function diffModels(current: CdrlPathModel, next: CdrlPathModel): ModelDiff {
  const currentById = new Map(current.nodes.map((n) => [n.id, n]));
  const nextById = new Map(next.nodes.map((n) => [n.id, n]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const id of nextById.keys()) {
    if (!currentById.has(id)) added.push(id);
    else if (JSON.stringify(currentById.get(id)) !== JSON.stringify(nextById.get(id))) changed.push(id);
  }
  for (const id of currentById.keys()) {
    if (!nextById.has(id)) removed.push(id);
  }

  const otherSectionsChanged: string[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(next)]) as Set<keyof CdrlPathModel>;
  for (const key of allKeys) {
    if (NODE_KEYS_EXCLUDED.includes(key)) continue;
    if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) otherSectionsChanged.push(key);
  }
  return { added, removed, changed, otherSectionsChanged };
}

// One tool above the subway chart for both pathways cdrl-path-import-export-architecture.md
// describes — atomic edit (make a small change directly in the textarea, which starts
// pre-filled with the current model) and batch import (load a file edited offline, replacing
// the working copy wholesale) — since both already share the same validate-then-commit
// foundation the architecture doc calls for ("never implement two separate validation code
// paths"). See DECISIONS.md for why this consolidates into one JSON-level editor for v1
// rather than the separate per-field AtomicEditPanel + three-bucket ImportManager preview UI
// the fuller spec describes.
export function CdrlPathModelEditor({ model, onApply }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof validateCdrlPathModel> | null>(null);
  const [diff, setDiff] = useState<ModelDiff | null>(null);
  const [parsed, setParsed] = useState<CdrlPathModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openEditor() {
    setText(JSON.stringify(model, null, 2));
    setParseError(null);
    setValidation(null);
    setDiff(null);
    setParsed(null);
    setExpanded(true);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      setParseError(null);
      setValidation(null);
      setDiff(null);
      setParsed(null);
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  function handleValidate() {
    let candidate: CdrlPathModel;
    try {
      candidate = JSON.parse(text) as CdrlPathModel;
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
      setValidation(null);
      setDiff(null);
      setParsed(null);
      return;
    }
    setParseError(null);
    setParsed(candidate);
    setValidation(validateCdrlPathModel(candidate));
    setDiff(diffModels(model, candidate));
  }

  function handleApply() {
    if (!parsed || !validation?.valid) return;
    onApply(parsed);
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <div className="cdrl-path-model-editor">
        <button className="button-secondary" onClick={openEditor}>
          Edit Model
        </button>
      </div>
    );
  }

  const hasNoChanges =
    diff && diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && diff.otherSectionsChanged.length === 0;

  return (
    <div className="cdrl-path-model-editor cdrl-path-model-editor-open">
      <p className="hint">
        Edit the model directly (a small change) or load a JSON file edited offline (a bulk replacement), then Validate before
        applying — this only updates the working copy in your browser; use Export JSON afterward to save it.
      </p>
      <div className="cdrl-badge-row">
        <button className="button-secondary" onClick={() => fileInputRef.current?.click()}>
          Load JSON File
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelected} style={{ display: "none" }} />
        <button className="button-secondary" onClick={handleValidate}>
          Validate
        </button>
        <button className="button-primary" onClick={handleApply} disabled={!parsed || !validation?.valid}>
          Apply to Map
        </button>
        <button className="link-button" onClick={() => setExpanded(false)}>
          Cancel
        </button>
      </div>

      <textarea
        className="cdrl-path-model-editor-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setParseError(null);
          setValidation(null);
          setDiff(null);
          setParsed(null);
        }}
        spellCheck={false}
        rows={16}
      />

      {parseError && <p className="cdrl-path-model-editor-error">Invalid JSON: {parseError}</p>}

      {validation && (
        <div className="cdrl-path-model-editor-result">
          <span className={`badge ${validation.valid ? "badge-info" : "badge-warning"}`}>
            {validation.valid ? "Valid — ready to apply" : `${validation.issues.length} validation issue${validation.issues.length === 1 ? "" : "s"}`}
          </span>
          {!validation.valid && (
            <ul className="cdrl-path-validation-issues">
              {validation.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {diff && (
        <div className="cdrl-path-model-editor-diff">
          <strong>Changes vs. the current map:</strong>
          {hasNoChanges ? (
            <p className="hint">No differences from the current working model.</p>
          ) : (
            <ul>
              {diff.added.length > 0 && <li>Nodes added ({diff.added.length}): {diff.added.join(", ")}</li>}
              {diff.removed.length > 0 && <li>Nodes removed ({diff.removed.length}): {diff.removed.join(", ")}</li>}
              {diff.changed.length > 0 && <li>Nodes changed ({diff.changed.length}): {diff.changed.join(", ")}</li>}
              {diff.otherSectionsChanged.length > 0 && (
                <li>Other sections changed: {diff.otherSectionsChanged.join(", ")}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
