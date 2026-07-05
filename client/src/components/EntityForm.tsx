import { useState } from "react";
import type { ReactNode } from "react";

export interface FieldDef<T> {
  key: keyof T & string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "date";
  options?: string[];
  optionLabels?: Record<string, string>;
  placeholder?: string;
}

interface EntityFormProps<T> {
  fields: FieldDef<T>[];
  initialValues: Partial<T>;
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  extra?: ReactNode;
}

export function EntityForm<T>({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  extra,
}: EntityFormProps<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.key} className="form-field">
          <span>{field.label}</span>
          {field.type === "textarea" ? (
            <textarea
              value={(values[field.key] as string) ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setField(field.key, e.target.value)}
              rows={3}
            />
          ) : field.type === "select" ? (
            <select
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => setField(field.key, e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {field.optionLabels?.[opt] ?? opt}
                </option>
              ))}
            </select>
          ) : field.type === "boolean" ? (
            <input
              type="checkbox"
              checked={Boolean(values[field.key])}
              onChange={(e) => setField(field.key, e.target.checked)}
            />
          ) : field.type === "date" ? (
            <input
              type="date"
              value={(values[field.key] as string) ?? ""}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          ) : (
            <input
              type="text"
              value={(values[field.key] as string) ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          )}
        </label>
      ))}
      {extra}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
