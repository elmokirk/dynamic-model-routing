// DMR plugin for OpenCode — loaded automatically from .opencode/plugins/
// Swaps the model before each prompt based on keyword routing.
//
// Provider selection (set in shell before launching opencode):
//   export DMR_PROVIDER=anthropic   # default — claude-haiku/sonnet/opus
//   export DMR_PROVIDER=openai      # gpt-4.1-mini / gpt-4.1 / o4-mini
//   export DMR_PROVIDER=ollama      # qwen2.5-coder:7b / :32b / qwen3-coder:30b
//
// Ollama model override:
//   export DMR_OLLAMA_HAIKU=phi4-mini
//   export DMR_OLLAMA_SONNET=deepseek-coder-v2:16b
//   export DMR_OLLAMA_OPUS=deepseek-r1:14b
//
// Skip routing for one turn: prefix your prompt with ~

export { default } from '../../dist/opencode-plugin.js'
