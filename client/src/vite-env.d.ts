/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_MODE?: "server" | "static";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
