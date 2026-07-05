import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getDb, save } from "../db.js";
import type { CollectionName } from "../types.js";

export function crudRouter<T extends { id: string }>(collection: CollectionName) {
  const router = Router();

  router.get("/", (_req, res) => {
    const db = getDb();
    res.json(db[collection] as unknown as T[]);
  });

  router.post("/", (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();
    const row = {
      ...req.body,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    (db[collection] as unknown as T[]).push(row);
    save();
    res.status(201).json(row);
  });

  router.put("/:id", (req, res) => {
    const db = getDb();
    const list = db[collection] as unknown as T[];
    const idx = list.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: `${collection} row not found` });
      return;
    }
    const existing = list[idx] as unknown as Record<string, unknown>;
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    } as unknown as T;
    list[idx] = updated;
    save();
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    const db = getDb();
    const list = db[collection] as unknown as T[];
    const idx = list.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: `${collection} row not found` });
      return;
    }
    list.splice(idx, 1);
    save();
    res.status(204).end();
  });

  return router;
}
