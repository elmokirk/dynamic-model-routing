import { loadConfig } from './config.js'
import { getEffectiveMode } from './session.js'
import { route } from './router.js'
import { CLAUDE_MODEL_IDS, OPENAI_MODEL_IDS, OLLAMA_MODEL_IDS } from './types.js'
import type { Model } from './types.js'

type ModelProvider = 'anthropic' | 'openai' | 'ollama'

function getModelIds(provider: ModelProvider): Record<Model, string> {
  if (provider === 'openai') return OPENAI_MODEL_IDS
  if (provider === 'ollama') return OLLAMA_MODEL_IDS
  return CLAUDE_MODEL_IDS
}

function extractPrompt(messages: unknown[]): string {
  if (!Array.isArray(messages) || messages.length === 0) return ''
  const last = messages[messages.length - 1]
  if (!last || typeof last !== 'object') return ''
  const content = (last as Record<string, unknown>).content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    const textPart = content.find((p: unknown) => (p as Record<string, unknown>)?.type === 'text')
    return (textPart as Record<string, unknown>)?.text as string ?? ''
  }
  return ''
}

export default function dmrPlugin() {
  return {
    hooks: {
      // fires before every model call — we swap the model based on DMR routing
      'chat.params': async (ctx: { messages?: unknown[] }, params: Record<string, unknown>) => {
        const prompt = extractPrompt(ctx.messages ?? [])
        if (!prompt || prompt.startsWith('~')) return params

        const config = loadConfig()
        const mode = getEffectiveMode(process.cwd(), config.mode)
        if (mode === 'off') return params

        const decision = route(prompt, config)
        const provider = (process.env.DMR_PROVIDER ?? 'anthropic') as ModelProvider
        const modelIds = getModelIds(provider)
        const modelId = modelIds[decision.model]

        const label = `[DMR] ${decision.model} → ${modelId} (${(decision.confidence * 100).toFixed(0)}% confidence)`
        if (config.showReason) console.log(`${label}\n  reason: ${decision.reason}`)
        else console.log(label)

        return { ...params, model: modelId }
      },
    },
  }
}
