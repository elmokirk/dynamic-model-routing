# DMR — Dynamic Model Routing

Claude Code plugin + CLI. TypeScript, Node 20, esbuild, Vitest.

## Run tests
npm test

## Build
npm run build  # outputs dist/cli.js and dist/hook.js

## Dev (no build)
npx tsx src/cli.ts run "your prompt here"

## Key files
- src/router.ts — scoring logic (change routing rules here)
- src/config.ts — config merge priority
- hooks/hooks.json — UserPromptSubmit hook wiring
- .claude-plugin/plugin.json — marketplace manifest
