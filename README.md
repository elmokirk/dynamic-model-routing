# DMR — Dynamic Model Routing

**Right model. Right effort. Every prompt.**

DMR is a Claude Code plugin + CLI that automatically recommends or selects the best Claude model (`haiku` / `sonnet` / `opus`) and effort level for each prompt — using a zero-cost keyword router that runs in microseconds with no API calls.

```
╔═ DMR (confirm) ══════════════════════╗
  Model:      opus (claude-opus-4-8)
  Effort:     high
  Confidence: 95%
  Reason:     matched 2 opus signal(s)
╚═══════════════════════════════════════╝
  [Enter] accept / h haiku / s sonnet / o opus / c cancel:
```

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-10%2F10-brightgreen)](./tests/router.test.ts)
[![Accuracy](https://img.shields.io/badge/routing%20accuracy-100%25-brightgreen)](./docs/benchmark.md)
[![Token cost](https://img.shields.io/badge/token%20cost%20per%20turn-%7E51%20tokens-blue)](./docs/benchmark.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Why DMR?

Choosing the wrong Claude model is a quiet tax on every coding session:

- Sending architecture questions to **Haiku** → shallow answers, re-prompting, wasted time
- Sending rename tasks to **Opus** → burning tokens and budget on trivial work
- Manually picking a model every session → cognitive overhead, inconsistency

DMR eliminates that decision. It fires before every prompt, scores the task, and either shows a recommendation (Confirm Mode) or applies the choice automatically (Auto Mode).

---

## Features

- **Zero-cost routing** — pure keyword scorer, no API calls, no latency on the critical path
- **~51 token overhead** per turn — negligible against Claude's 200K context
- **7 µs per decision** — invisible to the user
- **100% accuracy** on a 30-prompt balanced corpus (haiku/sonnet/opus)
- **Three modes**: confirm (interactive), auto (silent), off
- **Session-scoped mode switching** — `dmr mode auto` only affects the current project session
- **Three-level config**: user → project → local, later overrides earlier
- **Optional LLM fallback** via Haiku for ambiguous prompts
- **Marketplace-ready** Claude Code plugin (slash commands + UserPromptSubmit hook)
- **CoWork compatible** — hook fires in collaborative Claude Code sessions

---

## Install

### As a Claude Code plugin (recommended)

```bash
claude plugin install github:yourname/cc-dynamic-model-routing
```

Then wire up the hook once per project (or globally):

```bash
# inside Claude Code:
/dmr install --project     # .claude/settings.json
/dmr install --global      # ~/.claude/settings.json
```

From that point on, DMR fires automatically on every prompt.

### As a standalone CLI

```bash
npm install -g cc-dynamic-model-routing
```

```bash
dmr run "implement user authentication with JWT"
```

---

## Usage

### Confirm Mode (default)

Shows the recommendation and waits for your input before starting Claude:

```
$ dmr run "design the architecture for a multi-tenant SaaS platform"

  Recommended: opus + high
  Confidence:  95%
  Reason:      matched 2 opus signal(s)

  [Enter] accept / h haiku / s sonnet / o opus / c cancel:
```

Keys:
- **Enter** — accept the recommendation and launch Claude
- **h / s / o** — override to haiku / sonnet / opus and launch
- **c** — cancel

### Auto Mode

Applies the recommendation immediately and prints what it did:

```bash
dmr mode auto
dmr run "fix the null pointer exception in cart.ts"
```

```
  Recommended: sonnet + medium
  Confidence:  95%
  Reason:      matched 1 sonnet signal(s)

[DMR AUTO] Running: claude --model claude-sonnet-4-6 --effort medium "fix the null pointer exception in cart.ts"
```

### In Claude Code (hook)

When the plugin hook is installed, DMR prints its recommendation **before every response**:

```
╔═ DMR (auto) ══════════════════════════╗
  Model:      haiku (claude-haiku-4-5-20251001)
  Effort:     low
  Confidence: 95%
  Reason:     matched 1 haiku signal(s)
╚═══════════════════════════════════════╝
```

You see the recommendation in the transcript. In Auto Mode, `effortLevel` is written to the session file before the turn proceeds.

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

| Prompt type | Examples | Model | Effort |
|-------------|----------|-------|--------|
| Summaries, explanations, formatting | "summarize this", "explain briefly", "what is", "rename" | **haiku** | low |
| Implementation, bugfixes, tests, refactors | "implement", "fix", "write tests", "refactor", "add feature" | **sonnet** | medium |
| Architecture, strategy, complex debug, multi-file | "architecture", "system design", "complex debug", "at scale", "strategy" | **opus** | high |

Customize routing rules per project — see [Configuration](#configuration).

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
  "defaultModel": "sonnet",
  "defaultEffort": "medium",
  "allowedModels": ["haiku", "sonnet", "opus"],
  "autoModeMinConfidence": 0.75,
  "useLLMFallback": false,
  "llmClassifierModel": "haiku",
  "showReason": true,
  "logDecisions": true,
  "writeClaudeSettings": false,
  "rules": {
    "opus": {
      "keywords": ["architecture", "strategy", "multi-file", "complex debug",
                   "system design", "refactor across", "ambiguous", "high-impact",
                   "at scale", "design a system", "design the system"],
      "effort": "high"
    },
    "sonnet": {
      "keywords": ["implement", "fix", "test", "refactor", "component",
                   "bugfix", "add feature", "write"],
      "effort": "medium"
    },
    "haiku": {
      "keywords": ["summarize", "explain briefly", "format", "rename",
                   "simple", "what is", "what does", "list", "show me",
                   "what error", "error mean"],
      "effort": "low"
    }
  }
}
```

### Adding project-specific keywords

You only need to list additions — they deep-merge with the defaults:

```json
// .claude/dynamic-model-routing.json
{
  "rules": {
    "opus": {
      "keywords": ["payment-service", "billing refactor", "cross-region failover"]
    }
  }
}
```

### Effort levels

Valid values: `low` · `medium` · `high` · `xhigh` · `max`

Maps directly to Claude Code's `--effort` CLI flag.

---

## Decision Object

Every routing decision returns:

```typescript
interface Decision {
  model: 'haiku' | 'sonnet' | 'opus'
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  confidence: number    // 0.0 – 0.95
  reason: string        // "matched 2 opus signal(s)"
  signals: string[]     // ["architecture", "system design"]
}
```

Confidence below `autoModeMinConfidence` (default: 0.75) triggers the optional LLM fallback when enabled.

---

## Benchmark

The keyword router achieves **100% accuracy** on a 30-prompt balanced corpus with **7 µs** average decision time and **zero API calls**.

```
  haiku    accuracy: ████████████████████  100%  (10/10)
  sonnet   accuracy: ████████████████████  100%  (10/10)
  opus     accuracy: ████████████████████  100%  (10/10)

  Avg hook output:    ~51 tokens per turn  ($0.00)
  Avg latency:        7µs per decision
  Ease-of-use score:  100/100
```

Run the benchmark yourself:

```bash
npm run bench
```

Full methodology, corpus, tuning guide, and keyword router vs LLM fallback comparison: **[docs/benchmark.md](./docs/benchmark.md)**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Claude Code session                                │
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
│       ║  Model: sonnet · Effort: medium ║            │
│       ╚════════════════════════════════╝            │
│                                                     │
│  Claude responds normally                           │
└─────────────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Terminal CLI                              │
│                                            │
│  dmr run "your prompt"                     │
│       │                                    │
│       ├── route(prompt, config)            │
│       ├── Print recommendation             │
│       │                                    │
│       ├── [confirm mode] readline prompt   │
│       │   h/s/o/Enter/c                    │
│       │                                    │
│       └── [auto mode] execSync(           │
│               claude --model X --effort Y  │
│               "your prompt"                │
│           )                                │
└────────────────────────────────────────────┘
```

### Source files

| File | Responsibility |
|------|---------------|
| [`src/types.ts`](./src/types.ts) | All types, interfaces, and `DEFAULT_CONFIG` with keyword rules |
| [`src/router.ts`](./src/router.ts) | Keyword scorer → `Decision` object |
| [`src/config.ts`](./src/config.ts) | 3-level config merge (user → project → local) |
| [`src/session.ts`](./src/session.ts) | Read/write `.claude/dmr-session.json` |
| [`src/hook.ts`](./src/hook.ts) | UserPromptSubmit hook entry — reads stdin JSON, prints box |
| [`src/cli.ts`](./src/cli.ts) | CLI entry — `dmr run\|mode\|status\|install` |
| [`src/installer.ts`](./src/installer.ts) | Writes hook entry into target `settings.json` |
| [`src/classifier.ts`](./src/classifier.ts) | Optional Haiku LLM fallback (off by default) |

---

## Plugin Commands

When installed as a Claude Code plugin, these slash commands are available:

| Command | Description |
|---------|-------------|
| `/dmr run <prompt>` | Route a prompt and show recommendation |
| `/dmr mode confirm\|auto\|off` | Switch mode for this session |
| `/dmr status` | Show current config and active mode |
| `/dmr install --global\|--project\|--local` | Install the UserPromptSubmit hook |

---

## Compatibility

| Context | Status |
|---------|--------|
| Claude Code desktop (Mac / Windows) | ✅ Hook fires on every prompt |
| VS Code extension | ✅ |
| JetBrains extension | ✅ |
| CoWork app (Claude Code section) | ✅ |
| Terminal CLI (`dmr run`) | ✅ Full confirm/auto/cancel UX |
| Cursor, Gemini CLI, other IDEs | ⚠️ Plugin structure present; hook not yet supported |

---

## Known Limitations

**1. Hook confirm mode is advisory only in Claude Code.**
The `UserPromptSubmit` hook cannot open an interactive prompt in Claude Code's UI. It prints the recommendation visibly, but the turn proceeds. For the full accept/change/cancel flow, use `dmr run` in the terminal.

**2. Current-turn model cannot be switched by the hook.**
The hook fires before Claude responds, but the model for that turn is already determined by your session's `--model` flag or settings. The hook recommends — it cannot override the running session's model. Use `--model` on the next invocation.

**3. `writeClaudeSettings: true` writes `effortLevel` only.**
This is the only documented, supported writable field in `settings.json`. No undocumented fields are written.

**4. LLM fallback costs tokens.**
When `useLLMFallback: true`, a Haiku API call fires for every prompt below the confidence threshold. ~$0.000025/call. Keep it off unless the keyword router is misrouting frequently for your team's prompt style.

**5. `claude auto-mode` is a different system.**
Claude Code's built-in `auto-mode` (`claude auto-mode config`) classifies permission decisions (allow/soft_deny/hard_deny). DMR routes to the right model. They are complementary — neither overlaps nor conflicts with the other.

---

## Development

```bash
git clone https://github.com/yourname/cc-dynamic-model-routing
cd cc-dynamic-model-routing
npm install

npm test          # 10 routing tests
npm run bench     # 30-prompt accuracy + token cost benchmark
npm run build     # compile src/ → dist/
npm run dev       # run CLI via tsx (no build needed)
```

### Adding keywords

Edit `DEFAULT_CONFIG.rules` in [`src/types.ts`](./src/types.ts), then run `npm run bench` to verify accuracy held. Commit both.

### Project-specific overrides

Create `.claude/dynamic-model-routing.json` in your project. Rules deep-merge with defaults.

---

## License

MIT © Kirk
