import { getLocalDb } from "./localStore";

// Loaded from the shared /methodology/prompts tree (Architecture Guidance v1.7.0 §5) via Vite's
// `?raw` import, so the static/browser build and the server (server/src/ai/context.ts,
// server/src/routes/ai.ts) read the exact same source instead of hand-duplicated copies.
import systemPromptTemplate from "../../../methodology/prompts/system-prompt.md?raw";
import summaryPrompt from "../../../methodology/prompts/pdr-summary.md?raw";

export function buildSystemPrompt(): string {
  const db = getLocalDb();
  return systemPromptTemplate.replace("{{appData}}", JSON.stringify(db, null, 2));
}

export const SUMMARY_PROMPT = summaryPrompt;
