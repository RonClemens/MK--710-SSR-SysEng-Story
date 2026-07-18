import { useState } from "react";
import { levelLabel } from "../data/didGuidance";
import { CDRL_CATALOG, hazardCategoryForLevel } from "../data/safetyGuidance";
import {
  SAFETY_APPLICABILITIES,
  SPEC_BASELINES,
  SPEC_LEVELS,
  SPEC_STATUSES,
  type ConfigurationItem,
  type LogicalSubsystem,
  type SafetyApplicability,
  type SpecBaseline,
  type SpecLevel,
  type SpecStatus,
} from "../types";

export interface SafetyDeliverableValues {
  title: string;
  level: SpecLevel;
  cdrlType: string;
  applicability: SafetyApplicability;
  baseline: SpecBaseline;
  status: SpecStatus;
  linkedSubsystemId: string | null;
  linkedCiId: string | null;
  hazardExample: string;
  cdrlDescription: string;
  deliveryMilestone: string;
}

interface Props {
  initial: SafetyDeliverableValues;
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  onSubmit: (values: SafetyDeliverableValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SafetyDeliverableForm({ initial, subsystems, cis, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [level, setLevel] = useState<SpecLevel>(initial.level);
  const [cdrlType, setCdrlType] = useState(initial.cdrlType);
  const [applicability, setApplicability] = useState<SafetyApplicability>(initial.applicability);
  const [baseline, setBaseline] = useState<SpecBaseline>(initial.baseline);
  const [status, setStatus] = useState<SpecStatus>(initial.status);
  const [linkedSubsystemId, setLinkedSubsystemId] = useState(initial.linkedSubsystemId ?? "");
  const [linkedCiId, setLinkedCiId] = useState(initial.linkedCiId ?? "");
  const [hazardExample, setHazardExample] = useState(initial.hazardExample);
  const [cdrlDescription, setCdrlDescription] = useState(initial.cdrlDescription);
  const [deliveryMilestone, setDeliveryMilestone] = useState(initial.deliveryMilestone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalog = CDRL_CATALOG[level];

  function handleLevelChange(next: SpecLevel) {
    setLevel(next);
    const stillValid = CDRL_CATALOG[next].some((c) => c.name === cdrlType);
    if (!stillValid) {
      const first = CDRL_CATALOG[next][0];
      setCdrlType(first.name);
      setApplicability(first.applicability);
    }
  }

  function handleCdrlTypeChange(name: string) {
    setCdrlType(name);
    const match = catalog.find((c) => c.name === name);
    if (match) setApplicability(match.applicability);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        level,
        cdrlType,
        applicability,
        baseline,
        status,
        linkedSubsystemId: level === "Subsystem" ? linkedSubsystemId || null : null,
        linkedCiId: level === "CI" ? linkedCiId || null : null,
        hazardExample,
        cdrlDescription,
        deliveryMilestone,
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
        <select value={level} onChange={(e) => handleLevelChange(e.target.value as SpecLevel)}>
          {SPEC_LEVELS.map((l) => (
            <option key={l} value={l}>
              {levelLabel(l)} ({hazardCategoryForLevel(l)})
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
        <span>CDRL type</span>
        <select value={cdrlType} onChange={(e) => handleCdrlTypeChange(e.target.value)}>
          {catalog.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Applicability</span>
        <select value={applicability} onChange={(e) => setApplicability(e.target.value as SafetyApplicability)}>
          {SAFETY_APPLICABILITIES.map((a) => (
            <option key={a} value={a}>
              {a}
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
      <label className="form-field">
        <span>Example hazard</span>
        <textarea value={hazardExample} onChange={(e) => setHazardExample(e.target.value)} rows={3} />
      </label>
      <label className="form-field">
        <span>What this CDRL documents/reports</span>
        <textarea value={cdrlDescription} onChange={(e) => setCdrlDescription(e.target.value)} rows={3} />
      </label>
      <label className="form-field">
        <span>Delivery milestone</span>
        <input
          type="text"
          value={deliveryMilestone}
          placeholder="e.g. PDR, CDR, TRR"
          onChange={(e) => setDeliveryMilestone(e.target.value)}
        />
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
