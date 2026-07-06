// "server" (default): talk to the Express backend in api/client.ts, the AI
// Assistant proxies through the server-side provider abstraction.
// "static": no backend exists (e.g. GitHub Pages demo) — data lives in
// localStorage and the AI Assistant calls Anthropic directly from the browser
// using a key the visitor supplies themselves. Set at build time via
// VITE_DEPLOY_MODE=static (see .github/workflows/deploy-pages.yml).
export const DEPLOY_MODE: "server" | "static" =
  import.meta.env.VITE_DEPLOY_MODE === "static" ? "static" : "server";

export const IS_STATIC_MODE = DEPLOY_MODE === "static";
