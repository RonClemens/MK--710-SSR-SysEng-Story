# /provider

Per [Architecture Guidance](/vendor/architecture-guidance-v1.4.0.md) §3, every app should code against one AI
provider interface, never against Anthropic's or Bedrock's SDK directly in application logic. This directory
documents this app's contract and where it's actually implemented; it does not duplicate the runtime code.

## The contract, as implemented here

This app's provider interface lives at `server/src/ai/types.ts`:

```ts
export interface AiClient {
  sendMessage(params: SendMessageParams): Promise<string>;
}
```

This differs from the guidance's example shape (`complete()` / `completeStructured()`) in naming only. Per §3,
"an existing app using different method names... satisfies the guidance as long as the same three properties
hold. Don't rename working code just to match this example verbatim." This app's shape holds all three:

1. One shared interface (`AiClient`), implemented identically by every backend.
2. Both backends — `server/src/ai/publicProvider.ts` (Anthropic direct) and `server/src/ai/bedrockProvider.ts`
   (AWS GovCloud) — implement it identically.
3. Application/route code (`server/src/routes/ai.ts`) calls only `client.sendMessage(...)`; it never imports the
   Anthropic or Bedrock SDKs directly, and never branches on which provider is active.

`server/src/ai/index.ts` selects the implementation via the `AI_PROVIDER` env var (`public` | `bedrock`) — see
§4's scope note on `config.json` not needing to own settings that already have a working home.

`completeStructured()` (schema-validated structured output) is intentionally not implemented — this app doesn't
validate any AI response against a schema today. Per §3's own note, a single `complete()`/`sendMessage()`-style
method is sufficient until that changes.

## §3.1 Exception: this app's static/BYOK deployment mode

This app ships two builds from the same client codebase:

- **Server-backed mode** — the provider abstraction above applies in full.
- **Static/GitHub Pages mode** (`client/src/api/directAi.ts`) — a fully client-only build with no backend. It
  calls `api.anthropic.com` directly from the browser using a visitor-supplied API key (Anthropic's documented
  `anthropic-dangerous-direct-browser-access` opt-in pattern for browser-side prototyping).

Per §3.1, this is a named, accepted exception, not a violation: the static build is public-only by construction
(GitHub Pages cannot host or reach CUI data), and there is no server in that build to hold GovCloud credentials —
a direct browser-to-Bedrock call is neither practical nor safe. **The provider-abstraction requirement applies
fully to this app's server-backed mode; the static mode is out of scope for CUI deployment entirely, by design,
and is documented here explicitly per §3.1's requirement that the exception not be left as a silent deviation.**
