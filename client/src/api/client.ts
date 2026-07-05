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

export const api = {
  config: () => request<{ aiEnabled: boolean; aiProvider: string }>("/config"),
  exportData: () => request<Record<string, unknown>>("/data/export"),
  importData: (data: unknown) =>
    request<{ ok: boolean }>("/data/import", { method: "POST", body: JSON.stringify(data) }),
  chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    request<{ reply: string }>("/ai/chat", { method: "POST", body: JSON.stringify({ messages }) }),
  summary: () => request<{ summary: string }>("/ai/summary", { method: "POST" }),
};
