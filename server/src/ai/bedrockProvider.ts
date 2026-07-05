import type { AiClient, SendMessageParams } from "./types.js";

/**
 * NOTE: This provider is written and wired into the app's provider abstraction,
 * but has NOT been exercised end-to-end — there is no GovCloud access during
 * this build phase (see Project Brief §7.4). Treat as infrastructure-readiness,
 * not a tested integration. Validate against real GovCloud credentials before
 * relying on it, and confirm BEDROCK_MODEL_ID with the org's AWS account.
 *
 * The AnthropicBedrock import is loaded lazily (only on the IAM-credential path
 * below) so that an unused/untested `@anthropic-ai/bedrock-sdk` install can never
 * break server startup in the default `public` provider mode.
 */
export async function createBedrockProvider(): Promise<AiClient> {
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AI_PROVIDER=bedrock requires AWS_REGION to be set (see .env.example).");
  }
  const modelId = process.env.BEDROCK_MODEL_ID;
  if (!modelId) {
    throw new Error("AI_PROVIDER=bedrock requires BEDROCK_MODEL_ID to be set (see .env.example).");
  }

  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const gatewayBaseURL = process.env.BEDROCK_GATEWAY_BASE_URL;

  if (bearerToken) {
    // Bearer-token auth (AWS Bedrock API keys) - no AWS SigV4 signing required.
    const baseURL = gatewayBaseURL || `https://bedrock-runtime.${region}.amazonaws.com`;
    return {
      async sendMessage({ system, messages, maxTokens }: SendMessageParams) {
        const url = `${baseURL}/model/${encodeURIComponent(modelId)}/invoke`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: maxTokens ?? 2048,
            system,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!response.ok) {
          throw new Error(`Bedrock bearer-token request failed: ${response.status} ${await response.text()}`);
        }
        const data = (await response.json()) as { content: { type: string; text?: string }[] };
        const textBlock = data.content.find((block) => block.type === "text");
        return textBlock?.text ?? "";
      },
    };
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AI_PROVIDER=bedrock requires either AWS_BEARER_TOKEN_BEDROCK, or " +
        "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (see .env.example)."
    );
  }

  // Standard AWS credential chain (IAM access key / secret / optional session token).
  const { AnthropicBedrock } = await import("@anthropic-ai/bedrock-sdk");
  const client = new AnthropicBedrock({
    awsRegion: region,
    awsAccessKey: accessKeyId,
    awsSecretKey: secretAccessKey,
    awsSessionToken: process.env.AWS_SESSION_TOKEN,
    baseURL: gatewayBaseURL,
  });

  return {
    async sendMessage({ system, messages, maxTokens }: SendMessageParams) {
      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens ?? 2048,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const textBlock = response.content.find((block: { type: string }) => block.type === "text");
      return textBlock && textBlock.type === "text" ? textBlock.text : "";
    },
  };
}
