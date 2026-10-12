import { describe, expect, it } from 'vitest'
import { compareToReference } from './consistency'
import type { Answer } from './runQuestions'

const questions = [
  { id: 'a', category: 'capital', prompt: 'Capital of France?' },
  { id: 'b', category: 'arithmetic', prompt: '2 + 2?' },
]

function answer(id: string, tokens: string[], finishReason = 'stop'): Answer {
  return { id, text: tokens.join(''), tokens, margins: [], finishReason, completionTokens: tokens.length, ms: 1 }
}

const reference = {
  a: { tokens: ['Paris'], text: 'Paris', finishReason: 'stop' },
  b: { tokens: ['4'], text: '4', finishReason: 'stop' },
}

describe('compareToReference', () => {
  it('matches identical outputs', () => {
    const items = compareToReference(questions, [answer('a', ['Paris']), answer('b', ['4'])], reference)
    expect(items.every((i) => i.match)).toBe(true)
  })

  it('reports where outputs diverge', () => {
    const items = compareToReference(questions, [answer('a', ['Paris']), answer('b', ['5'])], reference)
    expect(items[1]).toMatchObject({ match: false, divergence: 0, text: '5', referenceText: '4' })
  })

  it('treats a different finish reason as a mismatch', () => {
    const items = compareToReference(questions, [answer('a', ['Paris'], 'length'), answer('b', ['4'])], reference)
    expect(items[0].match).toBe(false)
    expect(items[0].divergence).toBeNull()
  })

  it('fails loudly on a missing answer', () => {
    expect(() => compareToReference(questions, [answer('a', ['Paris'])], reference)).toThrow(/b/)
  })
})
