import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadConfig } from './config.js'
import { getEffectiveMode, writeSession } from './session.js'
import { route } from './router.js'
import { classifyWithLLM } from './classifier.js'
import { installHook } from './installer.js'
import { type Model, type Effort } from './types.js'

const MODEL_IDS: Record<Model, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
}

async function cmdRun(prompt: string) {
  const config = loadConfig()
  const mode = getEffectiveMode(process.cwd(), config.mode)

  if (mode === 'off') {
    console.log('[DMR] Mode is off — no routing.')
    return
  }

  let decision = route(prompt, config)

  if (config.useLLMFallback && decision.confidence < config.autoModeMinConfidence) {
    const llm = await classifyWithLLM(prompt, config)
    if (llm) decision = llm
  }

  console.log(`\n  Recommended: ${decision.model} + ${decision.effort}`)
  console.log(`  Confidence:  ${(decision.confidence * 100).toFixed(0)}%`)
  if (config.showReason) console.log(`  Reason:      ${decision.reason}`)
  console.log()

  if (mode === 'auto') {
    if (decision.confidence < config.autoModeMinConfidence) {
      console.log(`[DMR] Confidence too low for auto (${(decision.confidence * 100).toFixed(0)}% < ${config.autoModeMinConfidence * 100}%) — skipping.`)
      return
    }
    const modelId = MODEL_IDS[decision.model]
    const cmd = `claude --model ${modelId} --effort ${decision.effort} "${prompt.replace(/"/g, '\\"')}"`
    console.log(`[DMR AUTO] Running: ${cmd}\n`)
    execSync(cmd, { stdio: 'inherit' })
    return
  }

  // confirm mode
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  await new Promise<void>(resolve => {
    rl.question('  [Enter] accept / l low / m mid / h high / x max / c cancel: ', answer => {
      rl.close()
      const key = answer.trim().toLowerCase()
      const overrides: Record<string, Model> = { l: 'low', m: 'mid', h: 'high', x: 'max' }
      if (key === 'c') { console.log('[DMR] Cancelled.'); resolve(); return }
      const model: Model = overrides[key] ?? decision.model
      const effort: Effort = overrides[key] ? (config.rules[model]?.effort ?? config.defaultEffort) : decision.effort
      const modelId = MODEL_IDS[model]
      const cmd = `claude --model ${modelId} --effort ${effort} "${prompt.replace(/"/g, '\\"')}"`
      console.log(`\n[DMR] Running: ${cmd}\n`)
      execSync(cmd, { stdio: 'inherit' })
      resolve()
    })
  })
}

function cmdMode(mode: string) {
  if (!['confirm', 'auto', 'off'].includes(mode)) {
    console.error('Usage: dmr mode [confirm|auto|off]')
    process.exit(1)
  }
  writeSession(mode as 'confirm' | 'auto' | 'off')
  console.log(`[DMR] Mode set to: ${mode}`)
}

function cmdStatus() {
  const config = loadConfig()
  const mode = getEffectiveMode(process.cwd(), config.mode)
  console.log(`[DMR] Mode: ${mode} (config default: ${config.mode})`)
  console.log(`[DMR] LLM fallback: ${config.useLLMFallback}`)
  console.log(`[DMR] Write settings: ${config.writeClaudeSettings}`)
}

async function cmdInstall(target: 'global' | 'project' | 'local') {
  const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const result = installHook(target, pluginRoot)
  console.log(`[DMR] ${result}`)
}

const [,, cmd, ...args] = process.argv

switch (cmd) {
  case 'run':
    await cmdRun(args.join(' '))
    break
  case 'mode':
    cmdMode(args[0] ?? '')
    break
  case 'status':
    cmdStatus()
    break
  case 'install': {
    const target = (args.find(a => ['--global', '--project', '--local'].includes(a))?.replace('--', '') ?? 'project') as 'global' | 'project' | 'local'
    await cmdInstall(target)
    break
  }
  default:
    console.log('Usage: dmr [run|mode|status|install] [...args]')
}
