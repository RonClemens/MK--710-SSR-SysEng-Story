import type { AiClient } from "./types.js";
import { createPublicProvider } from "./publicProvider.js";
import { createBedrockProvider } from "./bedrockProvider.js";

let cachedClient: AiClient | null = null;

export async function getAiClient(): Promise<AiClient> {
  if (cachedClient) return cachedClient;

  const provider = process.env.AI_PROVIDER || "public";
  if (provider === "public") {
    cachedClient = createPublicProvider();
  } else if (provider === "bedrock") {
    cachedClient = await createBedrockProvider();
  } else {
    throw new Error(`Unknown AI_PROVIDER "${provider}". Expected "public" or "bedrock".`);
  }
  return cachedClient;
}

export type { AiClient, ChatMessage, SendMessageParams } from "./types.js";
