import Anthropic from "@anthropic-ai/sdk";
import type { AiClient, SendMessageParams } from "./types.js";

export function createPublicProvider(): AiClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI_PROVIDER=public requires ANTHROPIC_API_KEY to be set (see .env.example)."
    );
  }
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("AI_PROVIDER=public requires ANTHROPIC_MODEL to be set (see .env.example).");
  }

  const client = new Anthropic({ apiKey, baseURL });

  return {
    async sendMessage({ system, messages, maxTokens }: SendMessageParams) {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens ?? 2048,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock && textBlock.type === "text" ? textBlock.text : "";
    },
  };
}
