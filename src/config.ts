import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { DEFAULT_CONFIG, type DmrConfig } from './types.js'

function safeReadJson(path: string): Partial<DmrConfig> {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return {}
  }
}

export function loadConfig(cwd = process.cwd()): DmrConfig {
  const user = safeReadJson(join(homedir(), '.claude', 'dynamic-model-routing.json'))
  const project = safeReadJson(join(cwd, '.claude', 'dynamic-model-routing.json'))
  const local = safeReadJson(join(cwd, '.claude', 'dynamic-model-routing.local.json'))

  return {
    ...DEFAULT_CONFIG,
    ...user,
    ...project,
    ...local,
    rules: {
      ...DEFAULT_CONFIG.rules,
      ...(user.rules ?? {}),
      ...(project.rules ?? {}),
      ...(local.rules ?? {}),
    },
  }
}
