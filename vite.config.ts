import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// single source of truth for the displayed app version (the firmware stamp
// under the wordmark, and anywhere else that needs it)
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @kabelsalat/web (pulled in by @strudel/core) declares `module` but no
      // `exports` map, so Node's resolver falls back to `main` — an IIFE
      // bundle with no named exports — and any Node-side import of Strudel
      // dies with "does not provide an export named 'SalatRepl'". Vite already
      // picks the ESM build here, so this is a no-op for the browser bundle
      // and insurance for anything that runs the graph under Node.
      "@kabelsalat/web": "@kabelsalat/web/dist/index.mjs",
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
