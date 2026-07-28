import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { getAiClient } from "../ai/index.js";
import { buildSystemPrompt } from "../ai/context.js";
import type { ChatMessage } from "../ai/types.js";

// Loaded from /methodology/prompts (Architecture Guidance v1.4.0 §5) — see
// client/src/api/aiContext.ts for the browser-side counterpart of this same file.
const __dirname = dirname(fileURLToPath(import.meta.url));
const PDR_SUMMARY_PROMPT = readFileSync(
  join(__dirname, "..", "..", "..", "methodology", "prompts", "pdr-summary.md"),
  "utf-8",
);

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Request body must include a non-empty messages array." });
    return;
  }
  try {
    const client = await getAiClient();
    const reply = await client.sendMessage({ system: buildSystemPrompt(), messages });
    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "AI request failed" });
  }
});

aiRouter.post("/summary", async (_req, res) => {
  try {
    const client = await getAiClient();
    const reply = await client.sendMessage({
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: PDR_SUMMARY_PROMPT }],
      maxTokens: 3000,
    });
    res.json({ summary: reply });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "AI request failed" });
  }
});
