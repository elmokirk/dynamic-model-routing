# DMR — Dynamic Model Routing

Claude Code plugin + CLI. TypeScript, Node 20, esbuild, Vitest. Package manager: pnpm.

## Run tests
pnpm test

## Build
pnpm build  # outputs dist/cli.js, dist/hook.js, dist/session-start.js, dist/codex-hook.js, dist/codex-session-start.js, dist/opencode-plugin.js

## Dev (no build)
pnpm dev "your prompt here"

## Key files
- src/router.ts — scoring logic (change routing rules here)
- src/types.ts — model tier definitions and model ID maps
- src/config.ts — config merge priority
- hooks/hooks.json — Claude Code UserPromptSubmit hook wiring
- codex-hooks/hooks.json — Codex hook wiring
- .opencode/plugins/dmr.ts — OpenCode plugin entry
- .claude-plugin/plugin.json — Claude Code marketplace manifest
- .codex-plugin/plugin.json — Codex marketplace manifest
