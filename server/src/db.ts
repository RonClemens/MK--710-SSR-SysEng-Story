import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const DATA_DIR = join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "db.json");

// dataSource resolution (Architecture Guidance v1.4.0 §4): root config.json can point at a
// real program data file for a CUI deployment, without hand-editing anything under
// /mock-data or /methodology. Falls back to the public mock-data seed when config.json is
// absent or doesn't set dataSource — see /mock-data/README.md and root config.json.
function resolveSeedPath(): string {
  const configPath = join(REPO_ROOT, "config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as { dataSource?: string };
      // resolve() (not join()) so an absolute dataSource path is honored as-is instead of
      // being nested under REPO_ROOT; relative paths still resolve relative to the repo root.
      if (config.dataSource) return resolve(REPO_ROOT, config.dataSource);
    } catch {
      // Malformed config.json falls through to the default below rather than crashing startup.
    }
  }
  return join(REPO_ROOT, "mock-data", "seed.json");
}

const SEED_PATH = resolveSeedPath();

function loadOrInit(): Database {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    const seed = readFileSync(SEED_PATH, "utf-8");
    writeFileSync(DB_PATH, seed);
  }
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as Database;
}

let db: Database = loadOrInit();

function persist() {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDb(): Database {
  return db;
}

export function replaceDb(next: Database) {
  db = next;
  persist();
}

export function save() {
  persist();
}
