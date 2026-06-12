#!/usr/bin/env node
// Enforce pnpm (via corepack) as the only supported package manager.
const agent = process.env.npm_config_user_agent ?? "";

if (!agent.startsWith("pnpm")) {
  console.error(
    `\nThis project uses pnpm (via corepack), not "${agent.split("/")[0] || "npm/yarn"}".\n\nRun:\n  corepack enable\n  pnpm install\n`,
  );
  process.exit(1);
}
