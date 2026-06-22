# Dynamic Model Routing (DMR)

Claude Code plugin + CLI that recommends or auto-selects the best model and effort level for every prompt.

## Quick Start

### As a Claude Code plugin
Install via the Claude Code plugin marketplace or manually:
```bash
claude plugin install github:yourname/cc-dynamic-model-routing
```

Then install the hook:
```
/dmr install --project
```

### As a CLI
```bash
npm install -g cc-dynamic-model-routing
dmr run "implement user authentication"
```

## Modes

| Mode | Behavior |
|---|---|
| `confirm` | Shows recommendation, waits for accept/change/cancel (CLI only) |
| `auto` | Applies recommendation immediately, prints what it did |
| `off` | Does nothing |

Switch mode for the current session:
```bash
dmr mode auto
# or in Claude Code:
/dmr mode auto
```

## Default Routing

| Prompt type | Model | Effort |
|---|---|---|
| Summarize, explain briefly, format, rename | haiku | low |
| Implement, fix, test, refactor, write | sonnet | medium |
| Architecture, system design, complex debug, strategy | opus | high |

## Config

User config: `~/.claude/dynamic-model-routing.json`
Project config: `.claude/dynamic-model-routing.json`
Local override: `.claude/dynamic-model-routing.local.json`

Later sources override earlier ones.

Example:
```json
{
  "mode": "confirm",
  "useLLMFallback": false,
  "writeClaudeSettings": false
}
```

## Decision Object

```json
{
  "model": "haiku | sonnet | opus",
  "effort": "low | medium | high | xhigh | max",
  "confidence": 0.82,
  "reason": "matched 2 sonnet signal(s)",
  "signals": ["implement", "fix"]
}
```

## Known Limitations

1. **Hook confirm mode is advisory only.** The UserPromptSubmit hook prints the recommendation before Claude responds but cannot open an interactive prompt inside Claude Code's UI. Use `dmr run` in the terminal for the full confirm/cancel flow.

2. **Current-turn model cannot switch via hook.** The hook fires before Claude responds but the model for that turn is already determined. The hook shows what *should* be used — switch via `--model` flag on the next session.

3. **`writeClaudeSettings: true` writes `effortLevel` only.** This is the only documented writable field.

4. **LLM fallback costs tokens.** The Haiku classifier (`useLLMFallback: true`) makes an API call per prompt. Keep it off for free routing.

5. **`claude auto-mode` is different.** Claude Code's built-in `auto-mode` classifies permission decisions (allow/block). DMR routes to the right model — complementary, not overlapping.
