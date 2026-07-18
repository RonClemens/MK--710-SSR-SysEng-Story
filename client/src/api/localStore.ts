import { SEED_DATA } from "../data/seed";
import type { Database } from "../types";
import type { Crud } from "./client";

const STORAGE_KEY = "pdr-workbench.local-db";

// Backfills fields/collections added after a visitor's browser may have already
// cached a Database blob in localStorage (or after an old "Export JSON" file is
// re-imported), so older cached/imported data can't crash rendering by missing
// a field the current code assumes is always present (e.g. subsystemIds).
function normalize(db: Partial<Database>): Database {
  const cis = (db.cis ?? []).map((ci) => ({
    ...ci,
    subsystemIds: ci.subsystemIds ?? [],
  }));
  return {
    logicalSubsystems: db.logicalSubsystems ?? [],
    cis,
    deltaMatrix: db.deltaMatrix ?? [],
    abCompatibility: db.abCompatibility ?? [],
    cotsRecords: db.cotsRecords ?? [],
    recommendations: db.recommendations ?? [],
    interfaces: db.interfaces ?? [],
    specifications: db.specifications ?? [],
    safetyDeliverables: db.safetyDeliverables ?? [],
    content: db.content ?? [],
  };
}

// For a browser's own previously-cached blob only (not for explicit JSON
// imports, which should be honored exactly as given): if a whole collection
// key is missing entirely (undefined, as opposed to an intentionally emptied
// []), the cache predates that feature shipping. Seed it with the
// illustrative starter content instead of leaving it empty, since the
// alternative is this demo silently losing features on a stale cache.
function backfillNewCollectionsFromSeed(db: Partial<Database>): { db: Partial<Database>; changed: boolean } {
  const changed =
    db.logicalSubsystems === undefined ||
    db.interfaces === undefined ||
    db.specifications === undefined ||
    db.safetyDeliverables === undefined;
  return {
    db: {
      ...db,
      logicalSubsystems: db.logicalSubsystems ?? SEED_DATA.logicalSubsystems,
      interfaces: db.interfaces ?? SEED_DATA.interfaces,
      specifications: db.specifications ?? SEED_DATA.specifications,
      safetyDeliverables: db.safetyDeliverables ?? SEED_DATA.safetyDeliverables,
    },
    changed,
  };
}

function load(): Database {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = structuredClone(SEED_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  const { db: backfilled, changed } = backfillNewCollectionsFromSeed(JSON.parse(raw) as Partial<Database>);
  const normalized = normalize(backfilled);
  if (changed) persist(normalized);
  return normalized;
}

function persist(db: Database) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getLocalDb(): Database {
  return load();
}

export function replaceLocalDb(next: Partial<Database>) {
  persist(normalize(next));
}

function randomId(): string {
  return crypto.randomUUID();
}

export function makeLocalCrud<T extends { id: string }>(collection: keyof Database): Crud<T> {
  return {
    async list() {
      const db = load();
      return db[collection] as unknown as T[];
    },
    async create(row) {
      const db = load();
      const now = new Date().toISOString();
      const created = { ...row, id: randomId(), createdAt: now, updatedAt: now } as unknown as T;
      (db[collection] as unknown as T[]).push(created);
      persist(db);
      return created;
    },
    async update(id, row) {
      const db = load();
      const list = db[collection] as unknown as T[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${String(collection)} row not found`);
      const existing = list[idx] as unknown as Record<string, unknown>;
      const updated = {
        ...existing,
        ...row,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      } as unknown as T;
      list[idx] = updated;
      persist(db);
      return updated;
    },
    async remove(id) {
      const db = load();
      const list = db[collection] as unknown as T[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${String(collection)} row not found`);
      list.splice(idx, 1);
      persist(db);
    },
  };
}
