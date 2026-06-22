import Anthropic from '@anthropic-ai/sdk'
import { type DmrConfig, type Decision } from './types.js'

const MODEL_IDS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
}

const SYSTEM = `You are a model routing classifier. Given a user prompt, output ONLY valid JSON matching this exact schema — no prose, no markdown:
{"model":"haiku|sonnet|opus","effort":"low|medium|high|xhigh","confidence":0.0,"reason":"string","signals":["string"]}`

export async function classifyWithLLM(prompt: string, config: DmrConfig): Promise<Decision | null> {
  try {
    const client = new Anthropic()
    const res = await client.messages.create({
      model: MODEL_IDS[config.llmClassifierModel],
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
    return JSON.parse(text) as Decision
  } catch {
    return null
  }
}
