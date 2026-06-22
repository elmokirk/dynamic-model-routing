import * as esbuild from 'esbuild'

const shared = {
  bundle: true,
  platform: 'node' as const,
  target: 'node20',
  format: 'esm' as const,
  external: ['@anthropic-ai/sdk'],
}

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: ['src/cli.ts'],
    outfile: 'dist/cli.js',
    banner: { js: '#!/usr/bin/env node' },
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/hook.ts'],
    outfile: 'dist/hook.js',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/session-start.ts'],
    outfile: 'dist/session-start.js',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/codex-hook.ts'],
    outfile: 'dist/codex-hook.js',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/codex-session-start.ts'],
    outfile: 'dist/codex-session-start.js',
  }),
])
