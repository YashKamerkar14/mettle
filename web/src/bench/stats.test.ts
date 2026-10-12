import { describe, expect, it } from 'vitest'
import { median, quantile, relativeSpread, summarize } from './stats'

describe('quantile', () => {
  it('matches numpy linear interpolation', () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75)
    expect(quantile([1, 2, 3, 4], 0.75)).toBeCloseTo(3.25)
  })

  it('does not reorder the input', () => {
    const xs = [3, 1, 2]
    quantile(xs, 0.5)
    expect(xs).toEqual([3, 1, 2])
  })

  it('rejects empty samples and bad q', () => {
    expect(() => quantile([], 0.5)).toThrow()
    expect(() => quantile([1], 1.5)).toThrow()
  })
})

describe('median', () => {
  it('handles odd and even lengths', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('summarize', () => {
  it('reports spread around the median', () => {
    const s = summarize([40, 42, 44])
    expect(s).toMatchObject({ n: 3, median: 42, min: 40, max: 44 })
    expect(relativeSpread(s)).toBeCloseTo(4 / 42)
  })
})
