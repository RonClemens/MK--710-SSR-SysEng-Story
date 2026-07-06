import { IS_STATIC_MODE } from "./deployMode";
import { getLocalDb, replaceLocalDb } from "./localStore";
import { buildSystemPrompt, SUMMARY_PROMPT } from "./aiContext";
import { sendDirectMessage } from "./directAi";
import type { Database } from "../types";

const BASE = "/api";

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

export interface Crud<T> {
  list(): Promise<T[]>;
  create(row: Partial<T>): Promise<T>;
  update(id: string, row: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function makeCrud<T extends { id: string }>(path: string): Crud<T> {
  return {
    list: () => request<T[]>(path),
    create: (row) => request<T>(path, { method: "POST", body: JSON.stringify(row) }),
    update: (id, row) => request<T>(`${path}/${id}`, { method: "PUT", body: JSON.stringify(row) }),
    remove: (id) => request<void>(`${path}/${id}`, { method: "DELETE" }),
  };
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export const api = {
  config: async () => {
    if (IS_STATIC_MODE) return { aiEnabled: true, aiProvider: "direct-browser (bring your own key)" };
    return request<{ aiEnabled: boolean; aiProvider: string }>("/config");
  },
  exportData: async () => {
    if (IS_STATIC_MODE) return getLocalDb() as unknown as Record<string, unknown>;
    return request<Record<string, unknown>>("/data/export");
  },
  importData: async (data: unknown) => {
    if (IS_STATIC_MODE) {
      replaceLocalDb(data as Database);
      return { ok: true };
    }
    return request<{ ok: boolean }>("/data/import", { method: "POST", body: JSON.stringify(data) });
  },
  chat: async (messages: ChatMessage[]) => {
    if (IS_STATIC_MODE) {
      const reply = await sendDirectMessage({ system: buildSystemPrompt(), messages });
      return { reply };
    }
    return request<{ reply: string }>("/ai/chat", { method: "POST", body: JSON.stringify({ messages }) });
  },
  summary: async () => {
    if (IS_STATIC_MODE) {
      const summary = await sendDirectMessage({
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: SUMMARY_PROMPT }],
        maxTokens: 3000,
      });
      return { summary };
    }
    return request<{ summary: string }>("/ai/summary", { method: "POST" });
  },
};
