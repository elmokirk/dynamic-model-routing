# Codex / OpenAI Model Decision Guide

DMR abstract tiers (`haiku / sonnet / opus`) map to concrete OpenAI model IDs.
This document covers the full current lineup so you can tune `CODEX_MODEL_IDS`
in `src/types.ts` to match your Codex CLI version or OpenAI API plan.

---

## Model Tier Mapping (default)

| DMR Tier | Codex CLI Model | OpenAI API Model | Effort analog |
|----------|----------------|-----------------|---------------|
| haiku | `gpt-5.4-mini` | `gpt-4.1-mini` | low |
| sonnet | `gpt-5.4` | `gpt-4.1` | medium |
| opus | `gpt-5.5` | `o4-mini` (reasoning) | high |

> **Note:** Codex CLI model names (`gpt-5.x`) are the next-gen OpenAI family
> used inside the Codex CLI product. OpenAI API model names are used when
> routing through OpenCode or direct API calls.

---

## Full Model Decision Table

### Generation Models (fast, no chain-of-thought)

| Model | CODEX CLI name | API name | Cost | Speed | Best For |
|-------|---------------|----------|------|-------|----------|
| **Haiku** | `gpt-5.4-mini` | `gpt-4.1-nano` | ¢ | Fastest | Format, rename, trivial edits, git commands, shell one-liners |
| **Haiku+** | `gpt-5.4-mini` | `gpt-4.1-mini` | $ | Very fast | Explain, summarize, simple Q&A, small bug fixes |
| **Sonnet** | `gpt-5.4` | `gpt-4.1` | $$$ | Fast | Implement features, write tests, refactor, fix bugs, write components |
| **Codex-mini** | `codex-mini-latest` | `codex-mini-latest` | $ | Fast | Code-only completions, fill-in-the-middle, tab-complete tasks |

### Reasoning Models (slower, chain-of-thought, no `--effort` flag)

| Model | API name | Cost | Speed | Best For |
|-------|----------|------|-------|----------|
| **Opus** | `o4-mini` | $$ | Medium | Complex implementations, architecture, multi-file refactors, debugging |
| **Opus+** | `o3` | $$$$$ | Slow | System design, security audits, hard algorithmic problems, strategic planning |

> Reasoning models use `reasoning_effort: low | medium | high` instead of `--effort`.
> DMR does not yet expose this — opus tier maps to default `reasoning_effort: high`.

---

## Decision Tree

```
Is the task purely mechanical (rename, format, shell cmd)?
  └─ YES → haiku (gpt-5.4-mini / gpt-4.1-mini)

Is the task a standard dev task (implement, fix, test, refactor)?
  └─ YES → sonnet (gpt-5.4 / gpt-4.1)

Does the task require sustained reasoning (architecture, complex debug, multi-file)?
  └─ YES → opus (gpt-5.5 / o4-mini)

Is the task a hard research/design problem with no clear answer?
  └─ YES → opus+ (o3) — not yet in DMR default, set manually
```

---

## Effort Levels

Codex CLI has no `--effort` flag. All routing is model-selection only.

For OpenAI API reasoning models (`o3`, `o4-mini`), the equivalent is:

| DMR Effort | API `reasoning_effort` | Notes |
|------------|----------------------|-------|
| low | `low` | Fast, fewer reasoning steps |
| medium | `medium` | Balanced |
| high | `high` | Full reasoning chain (default for opus tier) |
| xhigh | `high` | Same as high — no higher option |
| max | `high` | Same as high |

---

## Cost Reference (approximate, per 1M tokens)

| Model | Input | Output | Routing recommendation |
|-------|-------|--------|----------------------|
| `gpt-4.1-nano` | $0.10 | $0.40 | haiku tasks only |
| `gpt-4.1-mini` | $0.40 | $1.60 | haiku / simple sonnet |
| `gpt-4.1` | $2.00 | $8.00 | standard sonnet |
| `o4-mini` | $1.10 | $4.40 | opus tasks (reasoning) |
| `o3` | $10.00 | $40.00 | opus+ / special cases |

---

## Customizing Model IDs

Edit `src/types.ts`:

```typescript
// For Codex CLI
export const CODEX_MODEL_IDS: Record<Model, string> = {
  haiku: 'gpt-5.4-mini',
  sonnet: 'gpt-5.4',
  opus: 'gpt-5.5',
}

// For OpenAI API (OpenCode / direct API)
export const OPENAI_MODEL_IDS: Record<Model, string> = {
  haiku: 'gpt-4.1-mini',
  sonnet: 'gpt-4.1',
  opus: 'o4-mini',
}
```

Override per-project in `.claude/dynamic-model-routing.json`:
```json
{
  "defaultModel": "sonnet"
}
```
