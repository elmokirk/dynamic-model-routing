# Changelog

All notable changes to DMR are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

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
- Optional Haiku LLM fallback classifier (`useLLMFallback: true`)
- Installer: `dmr install --global | --project | --local`
- Benchmark suite: 30-prompt accuracy, token cost, latency, ease-of-use score (`npm run bench`)
- Community files: CONTRIBUTING.md, SECURITY.md, GitHub issue + PR templates
