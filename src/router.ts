import { type DmrConfig, type Decision, type Model } from './types.js'

function score(prompt: string, keywords: string[]): { score: number; matched: string[] } {
  const lower = prompt.toLowerCase()
  const matched = keywords.filter(k => lower.includes(k.toLowerCase()))
  return { score: matched.length, matched }
}

export function route(prompt: string, config: DmrConfig): Decision {
  const models: Model[] = ['opus', 'sonnet', 'haiku']

  const scores = models.map(model => {
    const rule = config.rules[model]
    const { score: s, matched } = score(prompt, rule.keywords)
    return { model, score: s, matched, effort: rule.effort }
  })

  const total = scores.reduce((sum, s) => sum + s.score, 0)
  const best = scores.reduce((a, b) => (a.score >= b.score ? a : b))

  const hasMatch = best.score > 0
  const confidence = hasMatch
    ? Math.min(0.95, 0.5 + (best.score / Math.max(total, 1)) * 0.45)
    : 0.3

  if (!hasMatch || !config.allowedModels.includes(best.model)) {
    return {
      model: config.defaultModel,
      effort: config.defaultEffort,
      confidence: 0.3,
      reason: 'no strong signals — using default',
      signals: [],
    }
  }

  return {
    model: best.model,
    effort: best.effort,
    confidence,
    reason: `matched ${best.matched.length} ${best.model} signal(s)`,
    signals: best.matched,
  }
}
