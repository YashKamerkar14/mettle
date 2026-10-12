import { describe, expect, it, vi } from 'vitest'

// The harness module imports WebLLM, which expects a browser; the pure timing
// math under test does not touch it.
vi.mock('@mlc-ai/web-llm', () => ({}))

const { computeRunTiming } = await import('./harness')

describe('computeRunTiming', () => {
  it('splits prompt reading from generation', () => {
    const t = computeRunTiming({
      requestAt: 1000,
      firstTokenAt: 1250, // 250 ms to read 500 prompt tokens
      lastTokenAt: 3790, // 127 more tokens over 2.54 s
      promptTokens: 500,
      completionTokens: 128,
    })
    expect(t.ttftMs).toBe(250)
    expect(t.prefillTokPerSec).toBeCloseTo(2000)
    expect(t.decodeTokPerSec).toBeCloseTo(50)
  })

  it('does not divide by zero on degenerate timings', () => {
    const t = computeRunTiming({ requestAt: 0, firstTokenAt: 0, lastTokenAt: 0, promptTokens: 10, completionTokens: 1 })
    expect(t.prefillTokPerSec).toBe(0)
    expect(t.decodeTokPerSec).toBe(0)
  })
})
