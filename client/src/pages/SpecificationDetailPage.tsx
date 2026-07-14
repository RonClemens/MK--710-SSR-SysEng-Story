import { useState } from "react";
import { Modal } from "../components/Modal";
import { SpecMetadataForm, type SpecMetadataValues } from "../components/SpecMetadataForm";
import {
  LEVEL_GUIDANCE,
  SECTION_META,
  SECTION_RELEVANCE,
  SPEC_TYPE_GUIDANCE,
  ORDERED_SECTION_KEYS,
  levelLabel,
} from "../data/didGuidance";
import type { ConfigurationItem, LogicalSubsystem, SpecSections, Specification } from "../types";

interface Props {
  spec: Specification;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Specification>) => Promise<Specification>;
  onDelete: (id: string) => Promise<void>;
  onSelectSubsystem: (id: string) => void;
  onSelectCi: (id: string) => void;
}

const RELEVANCE_CLASS: Record<string, string> = {
  Required: "badge-warning",
  Recommended: "badge-info",
  "Typically N/A": "badge",
};

export function SpecificationDetailPage({ spec, subsystems, cis, onBack, onUpdate, onDelete, onSelectSubsystem, onSelectCi }: Props) {
  const [draft, setDraft] = useState<SpecSections>(spec.sections);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(spec.sections);
  const relevance = SECTION_RELEVANCE[spec.level];

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(spec.id, { sections: draft });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const linkedSubsystem = spec.linkedSubsystemId ? subsystems.find((s) => s.id === spec.linkedSubsystemId) : null;
  const linkedCi = spec.linkedCiId ? cis.find((c) => c.id === spec.linkedCiId) : null;

  return (
    <div className="page">
      <button className="link-button" onClick={onBack}>
        ← Back to Specifications
      </button>
      <div className="page-header">
        <h2>{spec.title}</h2>
        <span className="badge">{levelLabel(spec.level, spec.domain)}</span>
        <span className="badge">{spec.domain}</span>
        <span className="badge">{spec.specType}</span>
        <span className="badge">{spec.baseline}</span>
        <span className="badge badge-info">{spec.status}</span>
      </div>

      <p className="hint">
        {spec.level === "Subsystem" &&
          (linkedSubsystem ? (
            <>
              Linked subsystem:{" "}
              <button className="link-button" onClick={() => onSelectSubsystem(linkedSubsystem.id)}>
                {linkedSubsystem.name}
              </button>
            </>
          ) : (
            "Not yet linked to a subsystem."
          ))}
        {spec.level === "CI" &&
          (linkedCi ? (
            <>
              Linked CI:{" "}
              <button className="link-button" onClick={() => onSelectCi(linkedCi.id)}>
                {linkedCi.name}
              </button>
            </>
          ) : (
            "Not yet linked to a CI."
          ))}
        {spec.level === "System" && "Scoped to the whole system — not linked to a specific subsystem or CI."}
      </p>

      <div className="form-actions" style={{ justifyContent: "flex-start" }}>
        <button className="button-secondary" onClick={() => setEditingMetadata(true)}>
          Edit metadata
        </button>
        <button
          className="link-button danger"
          onClick={() => {
            if (confirm(`Delete specification "${spec.title}"?`)) onDelete(spec.id);
          }}
        >
          Delete specification
        </button>
      </div>

      <section>
        <h3>Why {levelLabel(spec.level, spec.domain)}-level?</h3>
        <p>{LEVEL_GUIDANCE[spec.level].summary}</p>
        <div className="did-guidance-grid did-guidance-grid-2">
          <div>
            <p className="did-guidance-label did-pro">Pros</p>
            <ul>
              {LEVEL_GUIDANCE[spec.level].pros.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="did-guidance-label did-con">Cons</p>
            <ul>
              {LEVEL_GUIDANCE[spec.level].cons.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="hint">
          <strong>{spec.specType} spec:</strong> {SPEC_TYPE_GUIDANCE[spec.specType].summary}{" "}
          {SPEC_TYPE_GUIDANCE[spec.specType].whenUsed}
        </p>
      </section>

      <section>
        <h3>Sections</h3>
        {ORDERED_SECTION_KEYS.map((key) => (
          <div className="form-field spec-section" key={key}>
            <span className="spec-section-heading">
              {SECTION_META[key].label}{" "}
              <span className={`badge ${RELEVANCE_CLASS[relevance[key]]}`}>{relevance[key]}</span>
            </span>
            <span className="hint">{SECTION_META[key].description}</span>
            <textarea
              value={draft[key]}
              onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={3}
            />
          </div>
        ))}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button className="button-primary" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </section>

      {editingMetadata && (
        <Modal title="Edit Specification Metadata" onClose={() => setEditingMetadata(false)}>
          <SpecMetadataForm
            initial={{
              title: spec.title,
              level: spec.level,
              domain: spec.domain,
              specType: spec.specType,
              baseline: spec.baseline,
              status: spec.status,
              linkedSubsystemId: spec.linkedSubsystemId,
              linkedCiId: spec.linkedCiId,
            }}
            subsystems={subsystems}
            cis={cis}
            onCancel={() => setEditingMetadata(false)}
            onSubmit={async (values: SpecMetadataValues) => {
              await onUpdate(spec.id, values);
              setEditingMetadata(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
