import { describe, expect, it } from 'vitest'
import { firstDivergence } from './runQuestions'

describe('firstDivergence', () => {
  it('returns null for identical outputs', () => {
    expect(firstDivergence(['Paris', '.'], ['Paris', '.'])).toBeNull()
  })

  it('finds the first differing token', () => {
    expect(firstDivergence(['The', ' answer', ' is', ' 4'], ['The', ' answer', ' was', ' 4'])).toBe(2)
  })

  it('treats a shorter output as diverging where it ends', () => {
    expect(firstDivergence(['7', '5'], ['7'])).toBe(1)
  })
})
