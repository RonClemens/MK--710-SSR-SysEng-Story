import { Router } from "express";
import { getDb, save } from "../db.js";
import type { ContentEntry } from "../types.js";

// Bespoke router (not crudRouter) since ContentEntry is upserted by a stable
// string `key` chosen at the call site, not created with a random id.
export const contentRouter = Router();

contentRouter.get("/", (_req, res) => {
  res.json(getDb().content);
});

contentRouter.put("/:key", (req, res) => {
  const db = getDb();
  const key = decodeURIComponent(req.params.key);
  const value = req.body?.value;
  if (typeof value !== "string") {
    res.status(400).json({ error: "Request body must include a string `value`." });
    return;
  }
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
  save();
  res.json(entry);
});

contentRouter.delete("/:key", (req, res) => {
  const db = getDb();
  const key = decodeURIComponent(req.params.key);
  const idx = db.content.findIndex((e) => e.key === key);
  if (idx !== -1) {
    db.content.splice(idx, 1);
    save();
  }
  res.status(204).end();
});
