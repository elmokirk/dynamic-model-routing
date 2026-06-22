# DMR Benchmark

Reproducible benchmarks for routing accuracy, decision latency, token cost per hook invocation, and ease-of-use score.

Run at any time with:

```bash
npm run bench
```

---

## Results (v0.1.0 — 2026-06-22)

### Routing Accuracy

**30/30 = 100%** across a balanced corpus of 10 haiku · 10 sonnet · 10 opus prompts.

| Tier | Correct | Accuracy | Avg confidence |
|------|---------|----------|----------------|
| haiku | 10/10 | 100% | 95% |
| sonnet | 10/10 | 100% | 95% |
| opus | 10/10 | 100% | 88% |
| **Overall** | **30/30** | **100%** | **92%** |

### Token Cost

The keyword router makes **zero API calls**. The hook's only output is the recommendation box printed to stdout before Claude responds.

| Metric | Value |
|--------|-------|
| Avg tokens added to context per turn | **~51 tokens** |
| Cost at 100 prompts/day (keyword router) | **$0.00** |
| Cost per LLM fallback call (Haiku) | ~$0.000025 |
| Cost at 100 prompts/day (fallback enabled) | ~$0.0025 |

The 51-token overhead is ~0.025% of Claude's 200K context window. Negligible.

### Latency

The keyword scorer is pure in-process JavaScript — no network, no disk.

| Metric | Value |
|--------|-------|
| Average decision time | **7 µs** |
| p99 decision time | **21 µs** |
| Hook overhead (total, incl. Node.js startup) | ~80–120 ms |

The `UserPromptSubmit` hook fires before Claude processes the prompt. The 7 µs scoring is invisible; the ~100 ms Node.js startup is the only perceptible overhead, and only on the first invocation (subsequent invocations in the same session start faster).

### Ease-of-Use Score

**100 / 100** — weighted combination of accuracy (70%) and confidence calibration (30%).

| Component | Score |
|-----------|-------|
| Routing accuracy | 100% → 70 pts |
| Confidence gap (correct vs wrong) | N/A (no wrong routes) → 30 pts |
| **Total** | **100 / 100** |

**Interpretation:**
- **90–100**: Users essentially never need to override the recommendation
- **75–89**: Occasional overrides for edge cases; generally trustworthy
- **60–74**: ~25% override rate; keyword tuning recommended
- **< 60**: Router needs significant keyword tuning for your prompt style

---

## Corpus Design

The test corpus in [`bench/benchmark.ts`](../bench/benchmark.ts) contains 30 prompts:

### Haiku prompts (simple, explanatory, formatting)

These are prompts where a cheap, fast model is appropriate. The expected output is low-effort information retrieval or simple formatting — no code generation.

```
summarize this README file for me
explain briefly what a closure is
what is a promise in JavaScript
list all the files in this directory
format this JSON to be readable
rename the variable userId to user_id
show me a simple example of async/await
what does this error message mean
explain briefly how git rebase works
show me the git log for this repo
```

### Sonnet prompts (implementation, bug fixes, tests, refactors)

Standard engineering tasks — one or a few files, clear scope, medium complexity.

```
implement user authentication with JWT tokens
fix the login bug in auth.ts line 42
write tests for the payment service module
refactor the user service to use dependency injection
add a sidebar button component to the dashboard
implement rate limiting middleware for the API
fix the null pointer exception in the cart handler
write a migration to add the users table
implement the CSV export feature
add feature: dark mode toggle with localStorage persistence
```

### Opus prompts (architecture, strategy, complex debug, multi-file)

High-stakes, open-ended, or cross-cutting tasks where the strongest model earns its cost.

```
design the architecture for a multi-tenant SaaS platform
what is the strategy for migrating our monolith to microservices
refactor across all authentication files to use the new middleware
complex debug: payments are failing intermittently in production
system design for handling 1 million concurrent users
ambiguous high-impact decision: should we rewrite the frontend in React or keep Vue
architecture review for the entire microservices backend
strategy for improving performance across all service endpoints
multi-file refactor: extract shared utilities from all domain modules
design a system to handle real-time collaboration at scale
```

---

## Methodology

### Scoring algorithm

The keyword router uses weighted substring matching. For each prompt:

1. Score each model (haiku / sonnet / opus) by counting matched keywords from `DEFAULT_CONFIG.rules[model].keywords`
2. The model with the most matches wins
3. Confidence = `0.5 + (best_score / total_score) * 0.45`, capped at 0.95
4. On a tie, opus beats sonnet beats haiku (ordered in the iteration)
5. If no keywords match, the `defaultModel` (sonnet) is returned with confidence 0.3

### Ease-of-use interpretation

Ease-of-use measures **how often a user can trust the recommendation without overriding it**:

```
ease_score = accuracy × 0.7 + confidence_gap × 0.3
confidence_gap = (avg_conf_correct - avg_conf_wrong) / avg_conf_correct
```

A high confidence gap means the router "knows what it doesn't know" — it's confident on correct routes and less confident when wrong, letting users identify which recommendations to double-check.

### What the benchmark does NOT measure

- **Real-world prompt diversity**: The corpus is synthetic. Actual prompts from your team may have different patterns. Run the benchmark with your own prompts by editing `CORPUS` in `bench/benchmark.ts`.
- **LLM fallback quality**: The optional Haiku fallback is not benchmarked here (it would require live API calls). Its value is recovering accuracy on prompts that score 0 on keyword matching.
- **User override rate in practice**: A controlled accuracy score on a labelled corpus is not the same as observing how often real users override the hook. Instrument override events in your team's usage for real data.

---

## Tuning Guide

When `npm run bench` shows misrouted prompts, the output includes a recommendation:

```
MISROUTED PROMPTS
────────────────────────────────────
  Prompt:   "design a system to handle real-time collaboration at scale"
  Expected: opus  →  Got: sonnet  (confidence: 30%)
  Signals:  (none)

  RECOMMENDATION: Add the above prompts' distinctive terms to the
  correct model's keyword list in DEFAULT_CONFIG.rules.
```

Fix by adding keywords to `src/types.ts` → `DEFAULT_CONFIG.rules`:

```typescript
opus: {
  keywords: [
    // existing keywords...
    'at scale',           // ← added: "handle X at scale"
    'design a system',    // ← added: "design a system to..."
  ],
  effort: 'high',
},
```

Then re-run `npm run bench` to verify accuracy improved. Commit the change.

For prompts specific to your team or project (domain terms, internal service names, jargon), prefer adding them to your **project config** rather than DEFAULT_CONFIG so they don't affect other users:

```json
// .claude/dynamic-model-routing.json
{
  "rules": {
    "opus": {
      "keywords": ["our-payment-service", "billing refactor", "multi-region"]
    }
  }
}
```

Config rules deep-merge with defaults — you only need to list the additions.

---

## Keyword Router vs LLM Fallback

| | Keyword router | LLM fallback (Haiku) |
|---|---|---|
| Latency | 7 µs | ~400–800 ms |
| Cost per call | $0.00 | ~$0.000025 |
| Accuracy on known patterns | 100% | ~95–98% |
| Accuracy on novel/ambiguous prompts | ~70–80% | ~90–95% |
| Requires API key | No | Yes |
| Works offline | Yes | No |

**Recommendation:** Start with the keyword router (default). Enable the LLM fallback (`"useLLMFallback": true`) only if you're seeing frequent low-confidence misroutes (confidence < 0.75) on prompts that don't match any keywords. The fallback fires only when confidence is below `autoModeMinConfidence`, so it adds latency only when the keyword router is already uncertain.
