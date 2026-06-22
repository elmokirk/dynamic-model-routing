# DMR — Dynamic Model Routing

Codex plugin + Claude Code plugin + CLI. TypeScript, Node 20, esbuild, Vitest.

## Run tests
npm test

## Build
npm run build  # outputs dist/cli.js, dist/hook.js, dist/session-start.js, dist/codex-hook.js, dist/codex-session-start.js

## Dev (no build)
npx tsx src/cli.ts run "your prompt here"

## Key files
- src/router.ts — scoring logic (change routing rules here)
- src/types.ts — model tier definitions, CLAUDE_MODEL_IDS, CODEX_MODEL_IDS
- src/config.ts — config merge priority
- src/hook.ts — Claude Code UserPromptSubmit hook
- src/codex-hook.ts — Codex UserPromptSubmit hook
- hooks/hooks.json — Claude Code hook registration
- codex-hooks/hooks.json — Codex hook registration
- .claude-plugin/plugin.json — Claude Code marketplace manifest
- .codex-plugin/plugin.json — Codex marketplace manifest
