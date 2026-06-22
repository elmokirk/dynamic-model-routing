import { describe, it, expect } from 'vitest'
import { route } from '../src/router.js'
import { DEFAULT_CONFIG } from '../src/types.js'

describe('router', () => {
  it('routes architecture prompts to opus', () => {
    const d = route('design the architecture for a multi-tenant system', DEFAULT_CONFIG)
    expect(d.model).toBe('opus')
  })

  it('routes simple explanation to haiku', () => {
    const d = route('explain briefly what a closure is', DEFAULT_CONFIG)
    expect(d.model).toBe('haiku')
  })

  it('routes bugfix to sonnet', () => {
    const d = route('fix the login bug in auth.ts', DEFAULT_CONFIG)
    expect(d.model).toBe('sonnet')
  })

  it('routes test writing to sonnet', () => {
    const d = route('write tests for the user service', DEFAULT_CONFIG)
    expect(d.model).toBe('sonnet')
  })

  it('routes summarize to haiku', () => {
    const d = route('summarize the README', DEFAULT_CONFIG)
    expect(d.model).toBe('haiku')
  })

  it('routes multi-file refactor to opus', () => {
    const d = route('refactor across all auth files to use the new middleware', DEFAULT_CONFIG)
    expect(d.model).toBe('opus')
  })

  it('confidence is between 0 and 1', () => {
    const d = route('implement a button component', DEFAULT_CONFIG)
    expect(d.confidence).toBeGreaterThan(0)
    expect(d.confidence).toBeLessThanOrEqual(1)
  })

  it('includes at least one signal for matched keyword', () => {
    const d = route('what is a promise', DEFAULT_CONFIG)
    expect(d.signals.length).toBeGreaterThan(0)
  })

  it('returns default model for empty prompt', () => {
    const d = route('', DEFAULT_CONFIG)
    expect(d.model).toBe('sonnet')
    expect(d.confidence).toBeLessThan(0.5)
  })

  it('routes strategy + complex debug to opus', () => {
    const d = route('strategy for complex debug of the payment system', DEFAULT_CONFIG)
    expect(d.model).toBe('opus')
  })
})
