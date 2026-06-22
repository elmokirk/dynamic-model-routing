import { loadConfig } from './config.js'
import { getEffectiveMode } from './session.js'
import { route } from './router.js'
import { CODEX_MODEL_IDS } from './types.js'

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

  if (prompt.startsWith('~')) process.exit(0)

  const config = loadConfig()
  const mode = getEffectiveMode(process.cwd(), config.mode)

  if (mode === 'off') process.exit(0)

  const decision = route(prompt, config)
  const modelId = CODEX_MODEL_IDS[decision.model]

  const lines = [
    `╔═ DMR (${mode}) ══════════════════════╗`,
    `  Model:      ${decision.model} (${modelId})`,
    `  Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
    ...(config.showReason ? [`  Reason:     ${decision.reason}`] : []),
    `╚═══════════════════════════════════════╝`,
  ]
  console.log(lines.join('\n'))

  process.exit(0)
}

main().catch(() => process.exit(0))
