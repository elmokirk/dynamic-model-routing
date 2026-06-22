# Changelog

All notable changes to DMR are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

---

## [0.3.0] — 2026-06-22

### Changed
- **Breaking:** Model tiers renamed from `haiku/sonnet/opus` to `low/mid/high/max` — provider-agnostic names that work across Claude, Codex, OpenAI, and Ollama without leaking Claude brand names
- Router now iterates `config.allowedModels` dynamically instead of a hardcoded list, enabling the opt-in `max` tier
- CLI confirm prompt updated: `l/m/h/x` keys replace `h/s/o`

### Added
- `max` tier: opt-in 4th tier for o3 / kimi-k2.6:cloud / deepseek-v4-pro:cloud — add to `allowedModels` and `rules.max` to enable
- `OPENAI_MODEL_IDS` in `src/types.ts` — current OpenAI API models (gpt-4.1-mini / gpt-4.1 / o4-mini / o3)
- `OLLAMA_MODEL_IDS` in `src/types.ts` — Ollama local defaults, env-var overridable (DMR_OLLAMA_LOW/MID/HIGH/MAX)
- OpenCode plugin: `src/opencode-plugin.ts` with `chat.params` hook, auto-discovered via `.opencode/plugins/dmr.ts`
- `docs/models-codex.md`: full Codex/OpenAI model decision table, effort mapping, cost reference
- `docs/models-ollama.md`: top 5 Ollama cloud models (Feb–Jun 2026) + local models by VRAM tier (8/16/24/32GB)

### Fixed
- Removed `gpt-oss` — replaced with real 2026 models: deepseek-v4-flash, minimax-m3, kimi-k2.6, deepseek-v4-pro
- All `yourname` placeholders replaced with `elmokirk`

---

## [0.2.0] — 2026-06-22

### Added
- **Codex CLI plugin**: `src/codex-hook.ts` + `src/codex-session-start.ts` — same router, `gpt-5.x` model IDs, no effort flag
- `.codex-plugin/plugin.json`: Codex marketplace manifest
- `codex-hooks/hooks.json`: Codex hook registration using `${CODEX_PLUGIN_ROOT}`
- `AGENTS.md`: Codex project instructions (mirrors CLAUDE.md)
- `CLAUDE_MODEL_IDS` + `CODEX_MODEL_IDS` constants in `src/types.ts`
- Installer fix: `dmr install` now writes both `UserPromptSubmit` and `SessionStart` hooks in one call

---

## [0.1.0] — 2026-06-22

### Added
- Keyword router: zero-cost model + effort routing, 100% accuracy on 30-prompt corpus, 7 µs avg latency
- Three modes: `confirm` (interactive accept/change/cancel), `auto` (silent), `off`
- `UserPromptSubmit` hook: prints DMR recommendation box before every Claude response
- `SessionStart` hook: injects sub-agent model routing rules at session start
- Tilde (`~`) bypass prefix: skip routing for a single turn
- CLI: `dmr run | mode | status | install`
- Slash commands: `/dmr run`, `/dmr mode`, `/dmr status`, `/dmr install`
- Inline skill: `/dmr` for on-demand routing advice inside Claude Code
- Three-level config merge: user → project → local
- Session-scoped mode switching via `.claude/dmr-session.json`
- Optional LLM fallback classifier (`useLLMFallback: true`)
- Installer: `dmr install --global | --project | --local`
- Benchmark suite: 30-prompt accuracy, token cost, latency, ease-of-use score (`npm run bench`)
- Community files: CONTRIBUTING.md, SECURITY.md, GitHub issue + PR templates
