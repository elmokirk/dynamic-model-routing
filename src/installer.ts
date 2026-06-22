import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

type Target = 'global' | 'project' | 'local'

const DMR_HOOK_ID = 'dmr-model-router'

function targetPath(target: Target, cwd: string): string {
  if (target === 'global') return join(homedir(), '.claude', 'settings.json')
  if (target === 'project') return join(cwd, '.claude', 'settings.json')
  return join(cwd, '.claude', 'settings.local.json')
}

function readSettings(path: string): Record<string, unknown> {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return {} }
}

export function installHook(target: Target = 'project', pluginRoot: string, cwd = process.cwd()): string {
  const settingsPath = targetPath(target, cwd)
  mkdirSync(join(settingsPath, '..'), { recursive: true })

  const settings = readSettings(settingsPath)
  const hooks = (settings.hooks as Record<string, unknown[]> | undefined) ?? {}
  const existing = (hooks['UserPromptSubmit'] as unknown[]) ?? []

  const alreadyInstalled = existing.some(
    (h: unknown) => (h as { id?: string }).id === DMR_HOOK_ID
  )
  if (alreadyInstalled) return `Hook already installed in ${settingsPath}`

  const hookEntry = {
    id: DMR_HOOK_ID,
    type: 'command',
    command: `node "${pluginRoot}/dist/hook.js"`,
    async: false,
    description: 'DMR: recommend model and effort before each turn',
  }

  settings.hooks = { ...hooks, UserPromptSubmit: [...existing, hookEntry] }
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  return `DMR hook installed → ${settingsPath}`
}
