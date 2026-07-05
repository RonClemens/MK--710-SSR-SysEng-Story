import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "db.json");
const SEED_PATH = join(DATA_DIR, "seed.json");

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
