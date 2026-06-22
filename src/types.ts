export type Model = 'haiku' | 'sonnet' | 'opus'
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
    opus: RuleSet
    sonnet: RuleSet
    haiku: RuleSet
  }
}

export interface SessionState {
  mode: Mode
  updatedAt: string
}

export const CLAUDE_MODEL_IDS: Record<Model, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
}

export const CODEX_MODEL_IDS: Record<Model, string> = {
  haiku: 'gpt-5.4-mini',
  sonnet: 'gpt-5.4',
  opus: 'gpt-5.5',
}

// Current OpenAI API models — used by OpenCode with provider=openai
export const OPENAI_MODEL_IDS: Record<Model, string> = {
  haiku: 'gpt-4.1-mini',
  sonnet: 'gpt-4.1',
  opus: 'o4-mini',
}

// Ollama local models — defaults to 16-24GB sweet spot
// Override via DMR_OLLAMA_HAIKU / DMR_OLLAMA_SONNET / DMR_OLLAMA_OPUS env vars
export const OLLAMA_MODEL_IDS: Record<Model, string> = {
  haiku: process.env.DMR_OLLAMA_HAIKU ?? 'qwen2.5-coder:7b',
  sonnet: process.env.DMR_OLLAMA_SONNET ?? 'qwen2.5-coder:32b',
  opus: process.env.DMR_OLLAMA_OPUS ?? 'qwen3-coder:30b',
}

export const DEFAULT_CONFIG: DmrConfig = {
  mode: 'confirm',
  defaultModel: 'sonnet',
  defaultEffort: 'medium',
  allowedModels: ['haiku', 'sonnet', 'opus'],
  autoModeMinConfidence: 0.75,
  useLLMFallback: false,
  llmClassifierModel: 'haiku',
  showReason: true,
  logDecisions: true,
  writeClaudeSettings: false,
  rules: {
    opus: {
      keywords: ['architecture', 'strategy', 'multi-file', 'complex debug', 'system design', 'refactor across', 'ambiguous', 'high-impact', 'at scale', 'design a system', 'design the system'],
      effort: 'high',
    },
    sonnet: {
      keywords: ['implement', 'fix', 'test', 'refactor', 'component', 'bugfix', 'add feature', 'write'],
      effort: 'medium',
    },
    haiku: {
      keywords: ['summarize', 'explain briefly', 'format', 'rename', 'simple', 'what is', 'what does', 'list', 'show me', 'what error', 'error mean'],
      effort: 'low',
    },
  },
}
