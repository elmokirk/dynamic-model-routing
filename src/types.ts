export type Model = 'low' | 'mid' | 'high' | 'max'
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'
export type Mode = 'confirm' | 'auto' | 'off'

export interface Decision {
  model: Model
  effort: Effort
  confidence: number
  reason: string
  signals: string[]
}

export interface RuleSet {
  keywords: string[]
  effort: Effort
}

export interface DmrConfig {
  mode: Mode
  defaultModel: Model
  defaultEffort: Effort
  allowedModels: Model[]
  autoModeMinConfidence: number
  useLLMFallback: boolean
  llmClassifierModel: Model
  showReason: boolean
  logDecisions: boolean
  writeClaudeSettings: boolean
  rules: {
    low: RuleSet
    mid: RuleSet
    high: RuleSet
    max?: RuleSet
  }
}

export interface SessionState {
  mode: Mode
  updatedAt: string
}

export const CLAUDE_MODEL_IDS: Record<Model, string> = {
  low:  'claude-haiku-4-5-20251001',
  mid:  'claude-sonnet-4-6',
  high: 'claude-opus-4-8',
  max:  'claude-opus-4-8',   // no higher Claude tier yet; override when available
}

export const CODEX_MODEL_IDS: Record<Model, string> = {
  low:  'gpt-5.4-mini',
  mid:  'gpt-5.4',
  high: 'gpt-5.5',
  max:  'gpt-5.5',           // map to flagship until o-series lands in Codex CLI
}

// Current OpenAI API models — used by OpenCode with DMR_PROVIDER=openai
export const OPENAI_MODEL_IDS: Record<Model, string> = {
  low:  'gpt-4.1-mini',
  mid:  'gpt-4.1',
  high: 'o4-mini',           // reasoning model for complex tasks
  max:  'o3',                // full reasoning — expensive, use deliberately
}

// Ollama local models — defaults to 16-24GB sweet spot
// Override via DMR_OLLAMA_LOW / _MID / _HIGH / _MAX env vars
export const OLLAMA_MODEL_IDS: Record<Model, string> = {
  low:  process.env.DMR_OLLAMA_LOW  ?? 'qwen2.5-coder:7b',
  mid:  process.env.DMR_OLLAMA_MID  ?? 'qwen2.5-coder:32b',
  high: process.env.DMR_OLLAMA_HIGH ?? 'qwen3-coder:30b',
  max:  process.env.DMR_OLLAMA_MAX  ?? 'kimi-k2.6:cloud',
}

export const DEFAULT_CONFIG: DmrConfig = {
  mode: 'confirm',
  defaultModel: 'mid',
  defaultEffort: 'medium',
  allowedModels: ['low', 'mid', 'high'],   // max is opt-in
  autoModeMinConfidence: 0.75,
  useLLMFallback: false,
  llmClassifierModel: 'low',
  showReason: true,
  logDecisions: true,
  writeClaudeSettings: false,
  rules: {
    high: {
      keywords: ['architecture', 'strategy', 'multi-file', 'complex debug', 'system design', 'refactor across', 'ambiguous', 'high-impact', 'at scale', 'design a system', 'design the system'],
      effort: 'high',
    },
    mid: {
      keywords: ['implement', 'fix', 'test', 'refactor', 'component', 'bugfix', 'add feature', 'write'],
      effort: 'medium',
    },
    low: {
      keywords: ['summarize', 'explain briefly', 'format', 'rename', 'simple', 'what is', 'what does', 'list', 'show me', 'what error', 'error mean'],
      effort: 'low',
    },
    // max tier — opt-in, add to allowedModels to enable:
    // max: {
    //   keywords: ['security audit', 'full codebase', 'entire codebase', 'greenfield', 'migrate everything'],
    //   effort: 'max',
    // },
  },
}
