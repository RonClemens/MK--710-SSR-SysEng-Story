import { Router } from "express";
import { getDb, replaceDb } from "../db.js";
import type { Database } from "../types.js";

const REQUIRED_KEYS: (keyof Database)[] = [
  "logicalSubsystems",
  "cis",
  "deltaMatrix",
  "abCompatibility",
  "cotsRecords",
  "recommendations",
  "interfaces",
];

export const dataRouter = Router();

dataRouter.get("/export", (_req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=pdr-workbench-export.json");
  res.json(getDb());
});

dataRouter.post("/import", (req, res) => {
  const body = req.body as Partial<Database>;
  for (const key of REQUIRED_KEYS) {
    if (!Array.isArray(body[key])) {
      res.status(400).json({ error: `Import payload missing array field "${key}"` });
      return;
    }
  }
  replaceDb(body as Database);
  res.json({ ok: true });
});
