import { useRef, useState } from "react";
import { api } from "../api/client";

interface Props {
  onImported: () => void;
}

export function ExportImport({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `se-workbench-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importData(data);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="export-import">
      <button className="button-secondary" onClick={handleExport}>
        Export JSON
      </button>
      <button
        className="button-secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
      >
        {importing ? "Importing…" : "Import JSON"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (confirm("Importing will replace all current data. Continue?")) {
              handleImportFile(file);
            } else if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
