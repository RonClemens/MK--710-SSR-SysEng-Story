// Direct browser-to-Anthropic calls for the static (GitHub Pages) demo build,
// which has no backend to proxy through. The visitor supplies their own API
// key; it is stored only in their browser's localStorage and is sent only to
// api.anthropic.com, never to any server this app controls. This is
// Anthropic's documented opt-in pattern for browser-side prototyping
// (the anthropic-dangerous-direct-browser-access header) — anyone with
// devtools open can read the key out of network requests, so this is meant
// for personal/demo use with a key you're comfortable exposing that way, not
// for sharing this page's URL as if it were a hosted service.

const KEY_STORAGE = "pdr-workbench.byok-api-key";
const MODEL_STORAGE = "pdr-workbench.byok-model";
const DEFAULT_MODEL = "claude-sonnet-5";

export function getStoredApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setStoredApiKey(key: string) {
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
}

export function getStoredModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
}

export function setStoredModel(model: string) {
  if (model) localStorage.setItem(MODEL_STORAGE, model);
  else localStorage.removeItem(MODEL_STORAGE);
}

interface DirectMessageParams {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

export async function sendDirectMessage({ system, messages, maxTokens }: DirectMessageParams): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("Enter your Anthropic API key in the AI Assistant settings first.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: getStoredModel(),
      max_tokens: maxTokens ?? 2048,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body?.error?.message || response.statusText;
    throw new Error(`Anthropic API request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}
