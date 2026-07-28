import { useState } from "react";
import { AttachmentLinks } from "../components/AttachmentLinks";
import { EditableText } from "../components/EditableText";
import { Modal } from "../components/Modal";
import { SpecMetadataForm, type SpecMetadataValues } from "../components/SpecMetadataForm";
import {
  LEVEL_GUIDANCE,
  SECTION_META,
  SECTION_RELEVANCE,
  SPEC_TYPE_GUIDANCE,
  ORDERED_SECTION_KEYS,
  COMPETENCY_CLASS,
  levelLabel,
} from "../../../methodology/guidance/didGuidance";
import { HAZARD_ANALYSIS_META, SAFETY_BY_LEVEL } from "../../../methodology/guidance/safetyGuidance";
import { attachmentsToText, textToAttachments } from "../utils/attachments";
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
  const [attachmentsDraft, setAttachmentsDraft] = useState(attachmentsToText(spec.attachments));
  const [attachmentsSaving, setAttachmentsSaving] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(spec.sections);
  const attachmentsDirty = attachmentsDraft !== attachmentsToText(spec.attachments);
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

  async function handleSaveAttachments() {
    setAttachmentsSaving(true);
    setAttachmentsError(null);
    try {
      await onUpdate(spec.id, { attachments: textToAttachments(attachmentsDraft) });
    } catch (err) {
      setAttachmentsError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setAttachmentsSaving(false);
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
              <EditableText contentKey="specDetail.linkedSubsystemLabel" defaultValue="Linked subsystem:" as="span" />{" "}
              <button className="link-button" onClick={() => onSelectSubsystem(linkedSubsystem.id)}>
                {linkedSubsystem.name}
              </button>
            </>
          ) : (
            <EditableText contentKey="specDetail.notLinkedSubsystemHint" defaultValue="Not yet linked to a subsystem." as="span" />
          ))}
        {spec.level === "CI" &&
          (linkedCi ? (
            <>
              <EditableText contentKey="specDetail.linkedCiLabel" defaultValue="Linked CI:" as="span" />{" "}
              <button className="link-button" onClick={() => onSelectCi(linkedCi.id)}>
                {linkedCi.name}
              </button>
            </>
          ) : (
            <EditableText contentKey="specDetail.notLinkedCiHint" defaultValue="Not yet linked to a CI." as="span" />
          ))}
        {spec.level === "System" && (
          <EditableText
            contentKey="specDetail.systemScopedHint"
            defaultValue="Scoped to the whole system — not linked to a specific subsystem or CI."
            as="span"
          />
        )}
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
        <h3>
          <EditableText contentKey="specDetail.whyLevelPrefix" defaultValue="Why" as="span" />{" "}
          {levelLabel(spec.level, spec.domain)}
          <EditableText contentKey="specDetail.whyLevelSuffix" defaultValue="-level?" as="span" />
        </h3>
        <EditableText contentKey={`did.level.${spec.level}.summary`} defaultValue={LEVEL_GUIDANCE[spec.level].summary} as="p" />
        <p className={`did-guidance-label ${COMPETENCY_CLASS[LEVEL_GUIDANCE[spec.level].competency.weight]}`}>
          {LEVEL_GUIDANCE[spec.level].competency.weight}
        </p>
        <EditableText
          contentKey={`did.level.${spec.level}.competencyNote`}
          defaultValue={LEVEL_GUIDANCE[spec.level].competency.note}
          as="p"
        />
        <div className="did-guidance-grid did-guidance-grid-2">
          <div>
            <EditableText contentKey="did.prosLabel" defaultValue="Pros" as="p" className="did-guidance-label did-pro" />
            <ul>
              {LEVEL_GUIDANCE[spec.level].pros.map((p, i) => (
                <EditableText key={i} contentKey={`did.level.${spec.level}.pros.${i}`} defaultValue={p} as="li" />
              ))}
            </ul>
          </div>
          <div>
            <EditableText contentKey="did.consLabel" defaultValue="Cons" as="p" className="did-guidance-label did-con" />
            <ul>
              {LEVEL_GUIDANCE[spec.level].cons.map((c, i) => (
                <EditableText key={i} contentKey={`did.level.${spec.level}.cons.${i}`} defaultValue={c} as="li" />
              ))}
            </ul>
          </div>
        </div>
        <p className="hint">
          <strong>{spec.specType} spec:</strong>{" "}
          <EditableText
            contentKey={`did.specType.${spec.specType}.summary`}
            defaultValue={SPEC_TYPE_GUIDANCE[spec.specType].summary}
            as="span"
          />{" "}
          <EditableText
            contentKey={`did.specType.${spec.specType}.whenUsed`}
            defaultValue={SPEC_TYPE_GUIDANCE[spec.specType].whenUsed}
            as="span"
          />
        </p>

        <EditableText
          contentKey="specDetail.systemSafetyLabel"
          defaultValue="System safety at this level (MIL-STD-882E / JSSSEH)"
          as="p"
          className="did-guidance-label"
        />
        <div className="safety-badge-row">
          {SAFETY_BY_LEVEL[spec.level].analyses.map((type) => (
            <span key={type} className="safety-badge" title={HAZARD_ANALYSIS_META[type].name}>
              {type}
            </span>
          ))}
        </div>
        <EditableText
          contentKey={`safety.level.${spec.level}.safetyContent`}
          defaultValue={SAFETY_BY_LEVEL[spec.level].safetyContent}
          as="p"
        />
        <EditableText
          contentKey={`safety.level.${spec.level}.decompositionDependency`}
          defaultValue={SAFETY_BY_LEVEL[spec.level].decompositionDependency}
          as="p"
          className="hint"
        />
      </section>

      <section>
        <EditableText contentKey="specDetail.sectionsLabel" defaultValue="Sections" as="h3" />
        {ORDERED_SECTION_KEYS.map((key) => (
          <div className="form-field spec-section" key={key}>
            <span className="spec-section-heading">
              <EditableText contentKey={`did.section.${key}.label`} defaultValue={SECTION_META[key].label} as="span" />{" "}
              <span className={`badge ${RELEVANCE_CLASS[relevance[key]]}`}>{relevance[key]}</span>
              {key === "safety" &&
                SAFETY_BY_LEVEL[spec.level].analyses.map((type) => (
                  <span key={type} className="safety-badge" title={HAZARD_ANALYSIS_META[type].name} style={{ marginLeft: "0.4rem" }}>
                    {type}
                  </span>
                ))}
            </span>
            <EditableText contentKey={`did.section.${key}.description`} defaultValue={SECTION_META[key].description} as="span" className="hint" />
            {key === "applicableDocuments" && (
              <p className="hint">
                <EditableText
                  contentKey="pointerSpec.detailHint"
                  defaultValue={
                    "Citing a MIL-STD, ASME standard, or handbook here (a \"pointer specification\")? See the " +
                    "Pointer Specifications guidance on the Specifications tab list view for the recommended " +
                    "cite-tailor-flow down approach before restating standard text here."
                  }
                  as="span"
                />
              </p>
            )}
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

      <section>
        <EditableText contentKey="specDetail.attachmentsLabel" defaultValue="Attachments" as="h3" />
        <EditableText
          contentKey="specDetail.attachmentsHint"
          defaultValue="Linked files/documents (one per line: label | url) — no file content is stored in this app, just references to wherever the real document lives."
          as="p"
          className="hint"
        />
        <AttachmentLinks attachments={spec.attachments} />
        <textarea
          value={attachmentsDraft}
          onChange={(e) => setAttachmentsDraft(e.target.value)}
          placeholder="ICD-TS-014 | https://..."
          rows={3}
        />
        {attachmentsError && <p className="form-error">{attachmentsError}</p>}
        <div className="form-actions">
          <button
            className="button-primary"
            onClick={handleSaveAttachments}
            disabled={attachmentsSaving || !attachmentsDirty}
          >
            {attachmentsSaving ? "Saving…" : attachmentsDirty ? "Save Changes" : "Saved"}
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
