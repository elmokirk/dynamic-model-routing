import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
await import(join(__dir, '..', 'dist', 'hook.js'))
