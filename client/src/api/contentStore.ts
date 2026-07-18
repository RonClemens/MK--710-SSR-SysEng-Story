import { IS_STATIC_MODE } from "./deployMode";
import { getLocalDb, replaceLocalDb } from "./localStore";
import type { ContentEntry } from "../types";

const BASE = "/api/content";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listContent(): Promise<ContentEntry[]> {
  if (IS_STATIC_MODE) return getLocalDb().content;
  return request<ContentEntry[]>("/");
}

export async function upsertContent(key: string, value: string): Promise<ContentEntry> {
  if (IS_STATIC_MODE) {
    const db = getLocalDb();
    const now = new Date().toISOString();
    const existing = db.content.find((e) => e.key === key);
    let entry: ContentEntry;
    if (existing) {
      existing.history.push({ value: existing.value, updatedAt: existing.updatedAt });
      existing.value = value;
      existing.updatedAt = now;
      entry = existing;
    } else {
      entry = { key, value, history: [], updatedAt: now };
      db.content.push(entry);
    }
    replaceLocalDb(db);
    return entry;
  }
  return request<ContentEntry>(`/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) });
}

export async function resetContent(key: string): Promise<void> {
  if (IS_STATIC_MODE) {
    const db = getLocalDb();
    db.content = db.content.filter((e) => e.key !== key);
    replaceLocalDb(db);
    return;
  }
  await request<void>(`/${encodeURIComponent(key)}`, { method: "DELETE" });
}
