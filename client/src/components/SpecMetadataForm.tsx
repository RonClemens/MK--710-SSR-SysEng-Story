import { useState } from "react";
import { levelLabel } from "../../../methodology/guidance/didGuidance";
import {
  SPEC_BASELINES,
  SPEC_DOMAINS,
  SPEC_LEVELS,
  SPEC_STATUSES,
  SPEC_TYPES,
  type ConfigurationItem,
  type LogicalSubsystem,
  type SpecBaseline,
  type SpecDomain,
  type SpecLevel,
  type SpecStatus,
  type SpecType,
} from "../types";

export interface SpecMetadataValues {
  title: string;
  level: SpecLevel;
  domain: SpecDomain;
  specType: SpecType;
  baseline: SpecBaseline;
  status: SpecStatus;
  linkedSubsystemId: string | null;
  linkedCiId: string | null;
}

interface Props {
  initial: SpecMetadataValues;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  onSubmit: (values: SpecMetadataValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SpecMetadataForm({ initial, subsystems, cis, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [level, setLevel] = useState<SpecLevel>(initial.level);
  const [domain, setDomain] = useState<SpecDomain>(initial.domain);
  const [specType, setSpecType] = useState<SpecType>(initial.specType);
  const [baseline, setBaseline] = useState<SpecBaseline>(initial.baseline);
  const [status, setStatus] = useState<SpecStatus>(initial.status);
  const [linkedSubsystemId, setLinkedSubsystemId] = useState(initial.linkedSubsystemId ?? "");
  const [linkedCiId, setLinkedCiId] = useState(initial.linkedCiId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        level,
        domain,
        specType,
        baseline,
        status,
        linkedSubsystemId: level === "Subsystem" ? linkedSubsystemId || null : null,
        linkedCiId: level === "CI" ? linkedCiId || null : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="form-field">
        <span>Level</span>
        <select value={level} onChange={(e) => setLevel(e.target.value as SpecLevel)}>
          {SPEC_LEVELS.map((l) => (
            <option key={l} value={l}>
              {levelLabel(l, domain)}
            </option>
          ))}
        </select>
      </label>
      {level === "Subsystem" && (
        <label className="form-field">
          <span>Linked subsystem</span>
          <select value={linkedSubsystemId} onChange={(e) => setLinkedSubsystemId(e.target.value)}>
            <option value="">(none yet)</option>
            {subsystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {level === "CI" && (
        <label className="form-field">
          <span>Linked CI</span>
          <select value={linkedCiId} onChange={(e) => setLinkedCiId(e.target.value)}>
            <option value="">(none yet)</option>
            {cis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="form-field">
        <span>Domain</span>
        <select value={domain} onChange={(e) => setDomain(e.target.value as SpecDomain)}>
          {SPEC_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Spec type</span>
        <select value={specType} onChange={(e) => setSpecType(e.target.value as SpecType)}>
          {SPEC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Baseline</span>
        <select value={baseline} onChange={(e) => setBaseline(e.target.value as SpecBaseline)}>
          {SPEC_BASELINES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as SpecStatus)}>
          {SPEC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={saving || !title.trim()}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
