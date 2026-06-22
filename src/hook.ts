import { loadConfig } from './config.js'
import { getEffectiveMode } from './session.js'
import { route } from './router.js'
import { classifyWithLLM } from './classifier.js'

async function main() {
  let prompt = ''
  try {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString().trim()
    if (raw) {
      try {
        const input = JSON.parse(raw)
        prompt = typeof input === 'string' ? input : (input?.prompt ?? '')
      } catch {
        prompt = raw
      }
    }
  } catch {
    process.exit(0)
  }

  const config = loadConfig()
  const mode = getEffectiveMode(process.cwd(), config.mode)

  if (mode === 'off') process.exit(0)

  let decision = route(prompt, config)

  if (config.useLLMFallback && decision.confidence < config.autoModeMinConfidence) {
    const llmDecision = await classifyWithLLM(prompt, config)
    if (llmDecision) decision = llmDecision
  }

  const modelId = {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6',
    opus: 'claude-opus-4-8',
  }[decision.model]

  const lines = [
    `╔═ DMR (${mode}) ══════════════════════╗`,
    `  Model:      ${decision.model} (${modelId})`,
    `  Effort:     ${decision.effort}`,
    `  Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
    ...(config.showReason ? [`  Reason:     ${decision.reason}`] : []),
    `╚═══════════════════════════════════════╝`,
  ]
  console.log(lines.join('\n'))

  process.exit(0)
}

main().catch(() => process.exit(0))
