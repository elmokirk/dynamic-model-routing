# DMR — Dynamic Model Routing

**Right model. Right effort. Every prompt.**

DMR is a multi-provider plugin + CLI that automatically routes each prompt to the right model tier (`low` / `mid` / `high` / `max`) using a zero-cost keyword scorer — no API calls, ~7 µs per decision.

Works with **Claude Code**, **Codex CLI**, **OpenCode**, and **Ollama** (local + cloud).

```
╔═ DMR (confirm) ══════════════════════╗
  Model:      high (claude-opus-4-8)
  Effort:     high
  Confidence: 95%
  Reason:     matched 2 high signal(s)
╚═══════════════════════════════════════╝
  [Enter] accept / l low / m mid / h high / x max / c cancel:
```

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-10%2F10-brightgreen)](./tests/router.test.ts)
[![Accuracy](https://img.shields.io/badge/routing%20accuracy-100%25-brightgreen)](./docs/benchmark.md)
[![Token cost](https://img.shields.io/badge/token%20cost%20per%20turn-%7E51%20tokens-blue)](./docs/benchmark.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Navigation

| Section | Description |
|---------|-------------|
| [Why DMR?](#why-dmr) | The problem it solves |
| [Model Tiers](#model-tiers) | low/mid/high/max across all providers |
| [Features](#features) | Full feature list |
| [Install](#install) | Claude Code · Codex · OpenCode · CLI |
| [Usage](#usage) | Confirm · Auto · Hook · Bypass · Mode |
| [Default Routing](#default-routing) | Keyword → tier table |
| [Configuration](#configuration) | Full schema · max tier · per-project keywords |
| [Decision Object](#decision-object) | TypeScript interface |
| [Benchmark](#benchmark) | 100% accuracy · 7µs · 51 tokens |
| [Model Guides](#model-guides) | Codex/OpenAI · Ollama cloud + local |
| [Architecture](#architecture) | Hook flow + source file map |
| [Plugin Commands](#plugin-commands) | `/dmr run\|mode\|status\|install` |
| [Compatibility](#compatibility) | Claude Code · Codex · OpenCode · IDE |
| [Known Limitations](#known-limitations) | What the hook can and can't do |
| [Development](#development) | Build · test · benchmark · extend |
| [Roadmap](#roadmap) | Planned improvements |

**Docs:**
| File | Contents |
|------|----------|
| [docs/benchmark.md](./docs/benchmark.md) | Full benchmark methodology, corpus, tuning guide |
| [docs/models-codex.md](./docs/models-codex.md) | Codex CLI + OpenAI API model decision table |
| [docs/models-ollama.md](./docs/models-ollama.md) | Ollama cloud top 5 + local models by VRAM tier |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |
| [SECURITY.md](./SECURITY.md) | Security policy |

---

## Why DMR?

Choosing the wrong model is a quiet tax on every coding session:

- Sending architecture questions to a **low** tier model → shallow answers, re-prompting, wasted time
- Sending rename tasks to a **high** tier model → burning tokens and budget on trivial work
- Manually picking a model every session → cognitive overhead, inconsistency

DMR eliminates that decision. It fires before every prompt, scores the task, and either shows a recommendation (Confirm Mode) or applies the choice automatically (Auto Mode).

---

## Model Tiers

Provider-agnostic tier names map to the best concrete model per provider:

| DMR Tier | Claude | Codex CLI | OpenAI API | Ollama (24GB) | Ollama Cloud |
|----------|--------|-----------|------------|---------------|--------------|
| `low` | claude-haiku | gpt-5.4-mini | gpt-4.1-mini | qwen2.5-coder:7b | deepseek-v4-flash:cloud |
| `mid` | claude-sonnet | gpt-5.4 | gpt-4.1 | qwen2.5-coder:32b | minimax-m3:cloud |
| `high` | claude-opus | gpt-5.5 | o4-mini | qwen3-coder:30b | kimi-k2.6:cloud |
| `max` *(opt-in)* | claude-opus | gpt-5.5 | o3 | deepseek-v4-pro:cloud | deepseek-v4-pro:cloud |

---

## Features

- **Zero-cost routing** — pure keyword scorer, no API calls, no latency on the critical path
- **~51 token overhead** per turn — negligible against 200K context
- **7 µs per decision** — invisible to the user
- **100% accuracy** on a 30-prompt balanced corpus (low/mid/high)
- **Four tiers**: low / mid / high / max (max is opt-in)
- **Three modes**: confirm (interactive), auto (silent), off
- **Session-scoped mode switching** — `dmr mode auto` only affects the current project session
- **Three-level config**: user → project → local, later overrides earlier
- **Optional LLM fallback** for ambiguous prompts
- **Tilde bypass** — prefix any prompt with `~` to skip routing for that turn
- **Multi-provider**: Claude Code, Codex CLI, OpenCode (Anthropic / OpenAI / Ollama)

---

## Install

### Claude Code (plugin marketplace)

```bash
claude plugin install github:elmokirk/dynamic-model-routing
```

Then wire up the hook once per project (or globally):

```bash
/dmr install --project     # .claude/settings.json
/dmr install --global      # ~/.claude/settings.json
```

### Codex CLI (plugin marketplace)

```bash
codex plugin install github:elmokirk/dynamic-model-routing
```

### OpenCode (local plugin)

The `.opencode/plugins/dmr.ts` file is auto-discovered when you open the project in OpenCode. Set your provider:

```bash
export DMR_PROVIDER=anthropic   # default
export DMR_PROVIDER=openai      # gpt-4.1 family
export DMR_PROVIDER=ollama      # local or cloud Ollama models
opencode
```

### Standalone CLI

```bash
pnpm add -g dynamic-model-routing
dmr run "implement user authentication with JWT"
```

---

## Usage

### Confirm Mode (default)

Shows the recommendation and waits for your input before starting the model:

```
$ dmr run "design the architecture for a multi-tenant SaaS platform"

  Recommended: high + high
  Confidence:  95%
  Reason:      matched 2 high signal(s)

  [Enter] accept / l low / m mid / h high / x max / c cancel:
```

Keys:
- **Enter** — accept the recommendation and launch
- **l / m / h / x** — override to low / mid / high / max and launch
- **c** — cancel

### Auto Mode

Applies the recommendation immediately and prints what it did:

```bash
dmr mode auto
dmr run "fix the null pointer exception in cart.ts"
```

```
  Recommended: mid + medium
  Confidence:  95%
  Reason:      matched 1 mid signal(s)

[DMR AUTO] Running: claude --model claude-sonnet-4-6 --effort medium "fix the null pointer exception in cart.ts"
```

### In Claude Code / Codex / OpenCode (hook)

DMR prints its recommendation **before every response**:

```
╔═ DMR (auto) ══════════════════════════╗
  Model:      low (claude-haiku-4-5-20251001)
  Effort:     low
  Confidence: 95%
  Reason:     matched 1 low signal(s)
╚═══════════════════════════════════════╝
```

### Bypass routing for one turn

```
~ just explain what this function does
```

Prefix with `~` — DMR exits immediately, no recommendation shown.

### Switch mode for the current session

```bash
dmr mode confirm    # or: /dmr mode confirm
dmr mode auto       # or: /dmr mode auto
dmr mode off        # or: /dmr mode off
```

Mode is stored in `.claude/dmr-session.json` and never touches `settings.json`.

### Check current state

```bash
dmr status
# [DMR] Mode: auto (config default: confirm)
# [DMR] LLM fallback: false
# [DMR] Write settings: false
```

---

## Default Routing

| Prompt type | Examples | Tier | Effort |
|-------------|----------|------|--------|
| Summaries, explanations, formatting | "summarize this", "explain briefly", "what is", "rename" | **low** | low |
| Implementation, bugfixes, tests, refactors | "implement", "fix", "write tests", "refactor", "add feature" | **mid** | medium |
| Architecture, strategy, complex debug, multi-file | "architecture", "system design", "complex debug", "at scale", "strategy" | **high** | high |
| Security audits, full-codebase analysis *(opt-in)* | "security audit", "full codebase", "entire codebase" | **max** | max |

---

## Configuration

DMR merges config from three sources, in order (later wins):

| Source | Path |
|--------|------|
| User (global) | `~/.claude/dynamic-model-routing.json` |
| Project | `.claude/dynamic-model-routing.json` |
| Local override | `.claude/dynamic-model-routing.local.json` |

### Full config schema

```json
{
  "mode": "confirm",
  "defaultModel": "mid",
  "defaultEffort": "medium",
  "allowedModels": ["low", "mid", "high"],
  "autoModeMinConfidence": 0.75,
  "useLLMFallback": false,
  "llmClassifierModel": "low",
  "showReason": true,
  "logDecisions": true,
  "writeClaudeSettings": false,
  "rules": {
    "high": {
      "keywords": ["architecture", "strategy", "multi-file", "complex debug",
                   "system design", "refactor across", "ambiguous", "high-impact",
                   "at scale", "design a system", "design the system"],
      "effort": "high"
    },
    "mid": {
      "keywords": ["implement", "fix", "test", "refactor", "component",
                   "bugfix", "add feature", "write"],
      "effort": "medium"
    },
    "low": {
      "keywords": ["summarize", "explain briefly", "format", "rename",
                   "simple", "what is", "what does", "list", "show me",
                   "what error", "error mean"],
      "effort": "low"
    }
  }
}
```

### Enable the max tier

Add `max` to `allowedModels` and provide keywords:

```json
{
  "allowedModels": ["low", "mid", "high", "max"],
  "rules": {
    "max": {
      "keywords": ["security audit", "full codebase", "entire codebase", "greenfield"],
      "effort": "max"
    }
  }
}
```

### Adding project-specific keywords

You only need to list additions — they deep-merge with the defaults:

```json
{
  "rules": {
    "high": {
      "keywords": ["payment-service", "billing refactor", "cross-region failover"]
    }
  }
}
```

### Effort levels

Valid values: `low` · `medium` · `high` · `xhigh` · `max`

Maps directly to Claude Code's `--effort` CLI flag. Codex CLI and OpenCode/Ollama use model selection only (no effort flag).

---

## Decision Object

Every routing decision returns:

```typescript
interface Decision {
  model: 'low' | 'mid' | 'high' | 'max'
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  confidence: number    // 0.0 – 0.95
  reason: string        // "matched 2 high signal(s)"
  signals: string[]     // ["architecture", "system design"]
}
```

Confidence below `autoModeMinConfidence` (default: 0.75) triggers the optional LLM fallback when enabled.

---

## Benchmark

The keyword router achieves **100% accuracy** on a 30-prompt balanced corpus with **7 µs** average decision time and **zero API calls**.

```
  low      accuracy: ████████████████████  100%  (10/10)
  mid      accuracy: ████████████████████  100%  (10/10)
  high     accuracy: ████████████████████  100%  (10/10)

  Avg hook output:    ~51 tokens per turn  ($0.00)
  Avg latency:        7µs per decision
  Ease-of-use score:  100/100
```

Run the benchmark yourself:

```bash
pnpm bench
```

Full methodology, corpus, tuning guide, and keyword router vs LLM fallback comparison: **[docs/benchmark.md](./docs/benchmark.md)**

---

## Model Guides

- **[docs/models-codex.md](./docs/models-codex.md)** — Codex CLI + OpenAI API model decision table, effort mapping, cost reference
- **[docs/models-ollama.md](./docs/models-ollama.md)** — Top 5 Ollama cloud models (Feb–Jun 2026) + local models by VRAM tier (8/16/24/32GB)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Claude Code / Codex / OpenCode session             │
│                                                     │
│  UserPromptSubmit hook fires                        │
│       │                                             │
│       ▼                                             │
│  node dist/hook.js  ←── stdin: {"prompt":"..."}    │
│       │                                             │
│       ├── loadConfig()     user → project → local  │
│       ├── getEffectiveMode()  .claude/dmr-session   │
│       ├── route(prompt, config)  7µs keyword scorer │
│       └── console.log(recommendation box)           │
│                │                                    │
│                ▼ stdout (visible in transcript)      │
│       ╔═ DMR (confirm) ════════════════╗            │
│       ║  Model: mid · Effort: medium   ║            │
│       ╚════════════════════════════════╝            │
│                                                     │
│  Model responds normally                            │
└─────────────────────────────────────────────────────┘
```

### Source files

| File | Responsibility |
|------|---------------|
| [`src/types.ts`](./src/types.ts) | All types, model ID maps (Claude/Codex/OpenAI/Ollama), `DEFAULT_CONFIG` |
| [`src/router.ts`](./src/router.ts) | Keyword scorer → `Decision` object |
| [`src/config.ts`](./src/config.ts) | 3-level config merge (user → project → local) |
| [`src/session.ts`](./src/session.ts) | Read/write `.claude/dmr-session.json` |
| [`src/hook.ts`](./src/hook.ts) | Claude Code `UserPromptSubmit` hook entry |
| [`src/codex-hook.ts`](./src/codex-hook.ts) | Codex CLI `UserPromptSubmit` hook entry |
| [`src/opencode-plugin.ts`](./src/opencode-plugin.ts) | OpenCode `chat.params` plugin (Anthropic/OpenAI/Ollama) |
| [`src/session-start.ts`](./src/session-start.ts) | Claude Code `SessionStart` — injects sub-agent routing rules |
| [`src/codex-session-start.ts`](./src/codex-session-start.ts) | Codex `SessionStart` |
| [`src/cli.ts`](./src/cli.ts) | CLI entry — `dmr run\|mode\|status\|install` |
| [`src/installer.ts`](./src/installer.ts) | Writes both hooks into target `settings.json` |
| [`src/classifier.ts`](./src/classifier.ts) | Optional LLM fallback classifier (off by default) |

---

## Plugin Commands

When installed as a Claude Code plugin, these slash commands are available:

| Command | Description |
|---------|-------------|
| `/dmr run <prompt>` | Route a prompt and show recommendation |
| `/dmr mode confirm\|auto\|off` | Switch mode for this session |
| `/dmr status` | Show current config and active mode |
| `/dmr install --global\|--project\|--local` | Install both hooks into settings.json |

---

## Compatibility

| Context | Status |
|---------|--------|
| Claude Code desktop (Mac / Windows) | ✅ Both hooks fire |
| VS Code extension | ✅ |
| JetBrains extension | ✅ |
| CoWork app (Claude Code section) | ✅ |
| Codex CLI | ✅ Both hooks fire |
| OpenCode (Anthropic / OpenAI / Ollama) | ✅ `chat.params` plugin |
| Terminal CLI (`dmr run`) | ✅ Full confirm/auto/cancel UX |

---

## Known Limitations

**1. Hook confirm mode is advisory only in Claude Code / Codex.**
The `UserPromptSubmit` hook cannot open an interactive prompt inside the app UI. It prints the recommendation visibly, but the turn proceeds. For the full accept/change/cancel flow, use `dmr run` in the terminal.

**2. Current-turn model cannot be switched by the hook.**
The hook fires before the model responds, but the active model is already determined by your session's `--model` flag or settings. The hook recommends — it cannot override the running session. Use `--model` on the next invocation.

**3. `writeClaudeSettings: true` writes `effortLevel` only.**
This is the only documented, supported writable field in `settings.json`. No undocumented fields are written.

**4. LLM fallback costs tokens.**
When `useLLMFallback: true`, a low-tier API call fires for every prompt below the confidence threshold. ~$0.000025/call. Keep it off unless the keyword router is misrouting frequently.

**5. `claude auto-mode` is a different system.**
Claude Code's built-in `auto-mode` classifies permission decisions (allow/soft_deny/hard_deny). DMR routes to the right model. They are complementary — neither overlaps nor conflicts with the other.

---

## Development

```bash
git clone https://github.com/elmokirk/dynamic-model-routing
cd dynamic-model-routing
pnpm install

pnpm test          # 10 routing tests
pnpm bench         # 30-prompt accuracy + token cost benchmark
pnpm build         # compile src/ → dist/
pnpm dev           # run CLI via tsx (no build needed)
```

### Adding keywords

Edit `DEFAULT_CONFIG.rules` in [`src/types.ts`](./src/types.ts), then run `pnpm bench` to verify accuracy held. Commit both.

### Project-specific overrides

Create `.claude/dynamic-model-routing.json` in your project. Rules deep-merge with defaults.

---

## Roadmap

- [ ] **Bun runtime migration** — replace pnpm + tsx + vitest with a single Bun runtime. Bun runs TypeScript natively, has a built-in test runner, and installs in ~500ms. Planned for v0.4.0.
- [ ] **`max` tier keywords** — ship default keyword rules for the max tier (security audit, full-codebase analysis, greenfield design)
- [ ] **Reasoning effort passthrough** — map DMR effort levels to `reasoning_effort: low|medium|high` for o-series models (o3, o4-mini) via OpenCode
- [ ] **`dmr install` for OpenCode** — extend the installer CLI to write OpenCode config in addition to Claude/Codex settings
- [ ] **Codex app support** — verify and document hook behavior in the Codex desktop app once plugin architecture is public

---

## License

MIT © Kirk
