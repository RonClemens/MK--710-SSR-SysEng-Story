import { Router } from "express";
import { getAiClient } from "../ai/index.js";
import { buildSystemPrompt } from "../ai/context.js";
import type { ChatMessage } from "../ai/types.js";

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
      messages: [
        {
          role: "user",
          content:
            "Generate a markdown-formatted PDR readiness summary of the current program state, " +
            "organized under these headings: Baseline Fundamentals, CI Over-Decomposition, " +
            "Delta / Traceability Matrix, A/B Baseline Alignment, and Recommendations. Be concise " +
            "and specific, citing CI names/IDs and counts (e.g. how many open dispositions, how many " +
            "diverging A/B items). This should read like a section of a working paper the user can " +
            "copy directly into their document.",
        },
      ],
      maxTokens: 3000,
    });
    res.json({ summary: reply });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "AI request failed" });
  }
});
