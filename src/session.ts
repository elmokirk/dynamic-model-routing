import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { type Mode, type SessionState } from './types.js'

function sessionPath(cwd: string) {
  return join(cwd, '.claude', 'dmr-session.json')
}

export function readSession(cwd = process.cwd()): SessionState | null {
  try {
    return JSON.parse(readFileSync(sessionPath(cwd), 'utf8'))
  } catch {
    return null
  }
}

export function writeSession(mode: Mode, cwd = process.cwd()): void {
  mkdirSync(join(cwd, '.claude'), { recursive: true })
  const state: SessionState = { mode, updatedAt: new Date().toISOString() }
  writeFileSync(sessionPath(cwd), JSON.stringify(state, null, 2))
}

export function getEffectiveMode(cwd = process.cwd(), configMode: Mode): Mode {
  return readSession(cwd)?.mode ?? configMode
}
