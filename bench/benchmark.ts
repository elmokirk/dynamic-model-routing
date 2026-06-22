/**
 * DMR Benchmark — routing accuracy, latency, token cost, ease-of-use score
 *
 * Runs 30 labelled prompts through the keyword router, measures:
 *   - Routing accuracy (correct model %)
 *   - Avg / p99 decision latency (microseconds — it's pure JS)
 *   - Hook output token cost (chars of recommendation box / 4 ≈ tokens)
 *   - Ease-of-use score (weighted: accuracy + confidence calibration)
 */

import { route } from '../src/router.js'
import { DEFAULT_CONFIG, type Model } from '../src/types.js'

// ─── Test corpus ──────────────────────────────────────────────────────────────
// Each entry: [prompt, expectedModel]
const CORPUS: [string, Model][] = [
  // ── HAIKU (simple, explanatory, formatting) ──────────────────────────────
  ['summarize this README file for me', 'haiku'],
  ['explain briefly what a closure is', 'haiku'],
  ['what is a promise in JavaScript', 'haiku'],
  ['list all the files in this directory', 'haiku'],
  ['format this JSON to be readable', 'haiku'],
  ['rename the variable userId to user_id', 'haiku'],
  ['show me a simple example of async/await', 'haiku'],
  ['what does this error message mean', 'haiku'],
  ['explain briefly how git rebase works', 'haiku'],
  ['show me the git log for this repo', 'haiku'],

  // ── SONNET (implement, fix, test, refactor) ────────────────────────────────
  ['implement user authentication with JWT tokens', 'sonnet'],
  ['fix the login bug in auth.ts line 42', 'sonnet'],
  ['write tests for the payment service module', 'sonnet'],
  ['refactor the user service to use dependency injection', 'sonnet'],
  ['add a sidebar button component to the dashboard', 'sonnet'],
  ['implement rate limiting middleware for the API', 'sonnet'],
  ['fix the null pointer exception in the cart handler', 'sonnet'],
  ['write a migration to add the users table', 'sonnet'],
  ['implement the CSV export feature', 'sonnet'],
  ['add feature: dark mode toggle with localStorage persistence', 'sonnet'],

  // ── OPUS (architecture, strategy, complex debug, multi-file) ──────────────
  ['design the architecture for a multi-tenant SaaS platform', 'opus'],
  ['what is the strategy for migrating our monolith to microservices', 'opus'],
  ['refactor across all authentication files to use the new middleware', 'opus'],
  ['complex debug: payments are failing intermittently in production', 'opus'],
  ['system design for handling 1 million concurrent users', 'opus'],
  ['ambiguous high-impact decision: should we rewrite the frontend in React or keep Vue', 'opus'],
  ['architecture review for the entire microservices backend', 'opus'],
  ['strategy for improving performance across all service endpoints', 'opus'],
  ['multi-file refactor: extract shared utilities from all domain modules', 'opus'],
  ['design a system to handle real-time collaboration at scale', 'opus'],
]

// ─── Token estimation ─────────────────────────────────────────────────────────
function estimateHookTokens(model: Model, effort: string, confidence: number, reason: string, mode = 'confirm'): number {
  const modelId = { haiku: 'claude-haiku-4-5-20251001', sonnet: 'claude-sonnet-4-6', opus: 'claude-opus-4-8' }[model]
  const box = [
    `╔═ DMR (${mode}) ══════════════════════╗`,
    `  Model:      ${model} (${modelId})`,
    `  Effort:     ${effort}`,
    `  Confidence: ${Math.round(confidence * 100)}%`,
    `  Reason:     ${reason}`,
    `╚═══════════════════════════════════════╝`,
  ].join('\n')
  return Math.ceil(box.length / 4)
}

// ─── Benchmark runner ─────────────────────────────────────────────────────────
interface Result {
  prompt: string
  expected: Model
  actual: Model
  correct: boolean
  confidence: number
  latencyUs: number
  hookTokens: number
  signals: string[]
}

function pad(s: string, n: number) { return s.slice(0, n).padEnd(n) }
function rpad(s: string, n: number) { return s.slice(0, n).padStart(n) }

function run(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗')
  console.log('║              DMR BENCHMARK — Routing Accuracy & Token Cost                  ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n')

  const results: Result[] = []

  // Warm up (JIT)
  route('warmup', DEFAULT_CONFIG)

  for (const [prompt, expected] of CORPUS) {
    const t0 = performance.now()
    const decision = route(prompt, DEFAULT_CONFIG)
    const t1 = performance.now()
    const latencyUs = Math.round((t1 - t0) * 1000)

    results.push({
      prompt,
      expected,
      actual: decision.model,
      correct: decision.model === expected,
      confidence: decision.confidence,
      latencyUs,
      hookTokens: estimateHookTokens(decision.model, decision.effort, decision.confidence, decision.reason),
      signals: decision.signals,
    })
  }

  // ── Per-prompt table ───────────────────────────────────────────────────────
  console.log('ROUTING DECISIONS')
  console.log('─'.repeat(92))
  console.log(`${'Prompt'.padEnd(50)} ${'Expected'.padEnd(8)} ${'Got'.padEnd(8)} ${'Conf'.padEnd(6)} ${'Tokens'.padEnd(7)} Status`)
  console.log('─'.repeat(92))

  for (const r of results) {
    const status = r.correct ? '✓' : `✗ (→${r.actual})`
    const conf = `${Math.round(r.confidence * 100)}%`
    const truncated = r.prompt.length > 48 ? r.prompt.slice(0, 47) + '…' : r.prompt
    console.log(
      `${pad(truncated, 50)} ${pad(r.expected, 8)} ${pad(r.actual, 8)} ${rpad(conf, 5)}  ${rpad(String(r.hookTokens), 6)}  ${status}`
    )
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const correct = results.filter(r => r.correct).length
  const accuracy = correct / results.length
  const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length
  const latencies = results.map(r => r.latencyUs).sort((a, b) => a - b)
  const avgLatency = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
  const p99Latency = latencies[Math.floor(latencies.length * 0.99)]
  const avgTokens = Math.round(results.reduce((s, r) => s + r.hookTokens, 0) / results.length)

  // Per-tier accuracy
  const tiers: Model[] = ['haiku', 'sonnet', 'opus']
  const tierStats = tiers.map(tier => {
    const subset = results.filter(r => r.expected === tier)
    const tierCorrect = subset.filter(r => r.correct).length
    return { tier, accuracy: tierCorrect / subset.length, n: subset.length }
  })

  // Confidence calibration (avg conf on correct vs wrong)
  const correctConf = results.filter(r => r.correct).reduce((s, r) => s + r.confidence, 0) / correct
  const wrongResults = results.filter(r => !r.correct)
  const wrongConf = wrongResults.length > 0
    ? wrongResults.reduce((s, r) => s + r.confidence, 0) / wrongResults.length
    : 0

  // Ease-of-use score: weighted accuracy (70%) + confidence gap calibration (30%)
  // Confidence gap = correct answers should have high conf, wrong ones lower
  const confGap = wrongResults.length > 0 ? (correctConf - wrongConf) / correctConf : 1
  const easeScore = Math.round((accuracy * 0.7 + Math.min(1, confGap) * 0.3) * 100)

  console.log('\n' + '─'.repeat(92))
  console.log('\nSUMMARY\n')

  console.log(`  Corpus size:      ${results.length} prompts (${tiers.map(t => `10 ${t}`).join(' · ')})`)
  console.log(`  Overall accuracy: ${correct}/${results.length} = ${(accuracy * 100).toFixed(0)}%`)
  console.log()

  for (const { tier, accuracy: ta, n } of tierStats) {
    const bar = '█'.repeat(Math.round(ta * 20)) + '░'.repeat(20 - Math.round(ta * 20))
    console.log(`  ${pad(tier, 8)} accuracy: ${bar}  ${(ta * 100).toFixed(0)}%  (${Math.round(ta * n)}/${n})`)
  }

  console.log()
  console.log('TOKEN COST PER HOOK INVOCATION')
  console.log(`  Avg hook output:  ~${avgTokens} tokens per turn  (keyword router — zero API calls)`)
  console.log(`  LLM fallback:     ~200-400 tokens per call via Haiku API  (off by default)`)
  console.log(`  Haiku API cost:   ~$0.000025 per fallback call  (@$0.80/M input + $4/M output)`)
  console.log(`  At 100 prompts/day with fallback OFF:  ~${avgTokens * 100} tokens added to context (~$0.00)`)
  console.log()

  console.log('LATENCY (keyword router — pure JS, no network)')
  console.log(`  Avg:  ${avgLatency}µs per decision`)
  console.log(`  p99:  ${p99Latency ?? avgLatency}µs per decision`)
  console.log(`  This runs in the UserPromptSubmit hook before Claude responds — effectively instant.`)
  console.log()

  console.log('CONFIDENCE CALIBRATION')
  console.log(`  Avg confidence on CORRECT routes: ${(correctConf * 100).toFixed(0)}%`)
  if (wrongResults.length > 0) {
    console.log(`  Avg confidence on WRONG routes:   ${(wrongConf * 100).toFixed(0)}%  (gap = ${((correctConf - wrongConf) * 100).toFixed(0)}pp)`)
  } else {
    console.log(`  Avg confidence on WRONG routes:   N/A (no wrong routes!)`)
  }
  console.log(`  Avg overall confidence:           ${(avgConf * 100).toFixed(0)}%`)
  console.log()

  console.log('EASE-OF-USE SCORE')
  const easeBar = '█'.repeat(Math.round(easeScore / 5)) + '░'.repeat(20 - Math.round(easeScore / 5))
  console.log(`  ${easeBar}  ${easeScore}/100`)
  console.log()
  if (easeScore >= 90) {
    console.log('  Excellent — users rarely need to override the recommendation.')
  } else if (easeScore >= 75) {
    console.log('  Good — occasional overrides for edge cases, but generally trustworthy.')
  } else if (easeScore >= 60) {
    console.log('  Fair — users may override ~25% of the time. Consider tuning keywords.')
  } else {
    console.log('  Poor — router needs keyword tuning for the corpus in use.')
  }

  // ── Wrong routes detail ────────────────────────────────────────────────────
  if (wrongResults.length > 0) {
    console.log('\nMISROUTED PROMPTS')
    console.log('─'.repeat(80))
    for (const r of wrongResults) {
      console.log(`  Prompt:   "${r.prompt}"`)
      console.log(`  Expected: ${r.expected}  →  Got: ${r.actual}  (confidence: ${(r.confidence * 100).toFixed(0)}%)`)
      console.log(`  Signals:  ${r.signals.length > 0 ? r.signals.join(', ') : '(none)'}`)
      console.log()
    }
    console.log('  RECOMMENDATION: Add the above prompts\' distinctive terms to the')
    console.log(`  correct model's keyword list in DEFAULT_CONFIG.rules.`)
  } else {
    console.log('  No misrouted prompts — perfect accuracy on this corpus.')
  }

  console.log('\n' + '═'.repeat(92))

  // Exit with error code if accuracy is below 80%
  if (accuracy < 0.8) {
    console.error('\n⚠  Accuracy below 80% threshold — router needs keyword tuning.')
    process.exit(1)
  }
}

run()
