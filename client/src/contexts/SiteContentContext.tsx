import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { listContent, resetContent, upsertContent } from "../api/contentStore";
import type { ContentEntry, ContentEntryHistoryItem } from "../types";

const EDIT_MODE_KEY = "pdr-workbench.edit-mode";

interface SiteContentContextValue {
  editMode: boolean;
  setEditMode: (next: boolean) => void;
  loaded: boolean;
  getValue: (key: string, defaultValue: string) => string;
  hasOverride: (key: string) => boolean;
  getHistory: (key: string) => ContentEntryHistoryItem[];
  setValue: (key: string, value: string) => Promise<void>;
  resetValue: (key: string) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, ContentEntry>>({});
  const [loaded, setLoaded] = useState(false);
  const [editMode, setEditModeState] = useState<boolean>(() => localStorage.getItem(EDIT_MODE_KEY) === "true");

  useEffect(() => {
    listContent().then((rows) => {
      setEntries(Object.fromEntries(rows.map((entry) => [entry.key, entry])));
      setLoaded(true);
    });
  }, []);

  const setEditMode = useCallback((next: boolean) => {
    setEditModeState(next);
    localStorage.setItem(EDIT_MODE_KEY, next ? "true" : "false");
  }, []);

  const getValue = useCallback((key: string, defaultValue: string) => entries[key]?.value ?? defaultValue, [entries]);
  const hasOverride = useCallback((key: string) => entries[key] !== undefined, [entries]);
  const getHistory = useCallback((key: string) => entries[key]?.history ?? [], [entries]);

  const setValue = useCallback(async (key: string, value: string) => {
    const entry = await upsertContent(key, value);
    setEntries((prev) => ({ ...prev, [key]: entry }));
  }, []);

  const resetValue = useCallback(async (key: string) => {
    await resetContent(key);
    setEntries((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  return (
    <SiteContentContext.Provider
      value={{ editMode, setEditMode, loaded, getValue, hasOverride, getHistory, setValue, resetValue }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContentContextValue {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within a SiteContentProvider");
  return ctx;
}
