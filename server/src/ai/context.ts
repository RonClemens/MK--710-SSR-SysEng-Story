import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "../db.js";

// Loaded from the shared /methodology/prompts tree (Architecture Guidance v1.3.0 §5) so the
// server and the static client build read the exact same source instead of hand-duplicated
// copies. See client/src/api/aiContext.ts for the browser-side counterpart.
const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT_TEMPLATE_PATH = join(__dirname, "..", "..", "..", "methodology", "prompts", "system-prompt.md");

export function buildSystemPrompt(): string {
  const db = getDb();
  const template = readFileSync(SYSTEM_PROMPT_TEMPLATE_PATH, "utf-8");
  return template.replace("{{appData}}", JSON.stringify(db, null, 2));
}
