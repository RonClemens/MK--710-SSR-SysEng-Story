import { SEED_DATA } from "../../../mock-data/seed";
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
    baseline: ci.baseline ?? "Baseline A",
    projectId: ci.projectId ?? null,
    baselineId: ci.baselineId ?? null,
    gapId: ci.gapId ?? null,
    attachments: ci.attachments ?? [],
  }));
  const logicalSubsystems = (db.logicalSubsystems ?? []).map((s) => ({
    ...s,
    baseline: s.baseline ?? "Baseline A",
    projectId: s.projectId ?? null,
    baselineId: s.baselineId ?? null,
  }));
  const deltaMatrix = (db.deltaMatrix ?? []).map((r) => ({
    ...r,
    requirementId: r.requirementId ?? null,
    gapId: r.gapId ?? null,
  }));
  const cotsRecords = (db.cotsRecords ?? []).map((r) => ({
    ...r,
    verificationEventId: r.verificationEventId ?? null,
    attachments: r.attachments ?? [],
  }));
  const specifications = (db.specifications ?? []).map((s) => ({
    ...s,
    projectId: s.projectId ?? null,
    baselineId: s.baselineId ?? null,
    attachments: s.attachments ?? [],
  }));
  const safetyDeliverables = (db.safetyDeliverables ?? []).map((s) => ({
    ...s,
    projectId: s.projectId ?? null,
    baselineId: s.baselineId ?? null,
    milestoneId: s.milestoneId ?? null,
    attachments: s.attachments ?? [],
  }));
  const programPlanningDeliverables = (db.programPlanningDeliverables ?? []).map((p) => ({
    ...p,
    projectId: p.projectId ?? null,
    baselineId: p.baselineId ?? null,
    milestoneId: p.milestoneId ?? null,
    attachments: p.attachments ?? [],
  }));
  return {
    programs: db.programs ?? [],
    projects: db.projects ?? [],
    baselines: db.baselines ?? [],
    reconciliationEvents: db.reconciliationEvents ?? [],
    milestones: db.milestones ?? [],
    requirements: db.requirements ?? [],
    verificationEvents: db.verificationEvents ?? [],
    checklistItems: db.checklistItems ?? [],
    gaps: db.gaps ?? [],
    logicalSubsystems,
    cis,
    deltaMatrix,
    abCompatibility: db.abCompatibility ?? [],
    cotsRecords,
    roles: db.roles ?? [],
    recommendations: db.recommendations ?? [],
    riskItems: db.riskItems ?? [],
    interfaces: db.interfaces ?? [],
    specifications,
    safetyDeliverables,
    programPlanningDeliverables,
    comments: db.comments ?? [],
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
    db.safetyDeliverables === undefined ||
    db.programPlanningDeliverables === undefined ||
    db.programs === undefined ||
    db.projects === undefined ||
    db.baselines === undefined ||
    db.milestones === undefined ||
    db.requirements === undefined ||
    db.verificationEvents === undefined ||
    db.checklistItems === undefined ||
    db.gaps === undefined ||
    db.roles === undefined ||
    db.riskItems === undefined ||
    db.reconciliationEvents === undefined ||
    db.comments === undefined;
  return {
    db: {
      ...db,
      logicalSubsystems: db.logicalSubsystems ?? SEED_DATA.logicalSubsystems,
      interfaces: db.interfaces ?? SEED_DATA.interfaces,
      specifications: db.specifications ?? SEED_DATA.specifications,
      safetyDeliverables: db.safetyDeliverables ?? SEED_DATA.safetyDeliverables,
      programPlanningDeliverables: db.programPlanningDeliverables ?? SEED_DATA.programPlanningDeliverables,
      programs: db.programs ?? SEED_DATA.programs,
      projects: db.projects ?? SEED_DATA.projects,
      baselines: db.baselines ?? SEED_DATA.baselines,
      milestones: db.milestones ?? SEED_DATA.milestones,
      requirements: db.requirements ?? SEED_DATA.requirements,
      verificationEvents: db.verificationEvents ?? SEED_DATA.verificationEvents,
      checklistItems: db.checklistItems ?? SEED_DATA.checklistItems,
      gaps: db.gaps ?? SEED_DATA.gaps,
      roles: db.roles ?? SEED_DATA.roles,
      riskItems: db.riskItems ?? SEED_DATA.riskItems,
      reconciliationEvents: db.reconciliationEvents ?? SEED_DATA.reconciliationEvents,
      comments: db.comments ?? SEED_DATA.comments,
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
