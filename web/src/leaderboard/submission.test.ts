import { describe, expect, it } from 'vitest'
import { SUBSET_SHA256, toRow, validate, type Submission } from '../../../supabase/functions/_shared/submission'

function valid(): Submission {
  return {
    schemaVersion: 1,
    clientId: '123e4567-e89b-42d3-a456-426614174000',
    runtimeVersion: '0.2.86',
    promptVersion: 1,
    subsetSha256: SUBSET_SHA256,
    buildId: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    device: {
      vendor: 'nvidia',
      architecture: 'lovelace',
      device: '',
      description: '',
      browser: 'Chrome 154',
      os: 'Windows',
      hasF16: true,
      isFallbackAdapter: false,
    },
    confirmedDevice: null,
    instant: { gflops: 1800, verified: true },
    speed: {
      cacheHit: true,
      downloadMs: 0,
      loadMs: 500,
      ttftMs: 75,
      prefillTokPerSec: 6000,
      decodeTokPerSec: 95,
      decodeMin: 92,
      decodeMax: 96,
      promptTokens: 458,
    },
    check: {
      matched: 24,
      total: 25,
      items: Array.from({ length: 25 }, (_, i) => ({ id: `q1-x-${i}`, match: i !== 3, divergence: i === 3 ? 2 : null })),
    },
  }
}

describe('validate', () => {
  it('accepts a real-looking submission', () => {
    expect(validate(valid())).toEqual([])
  })

  it('rejects impossible speeds (plan: decode above 2,000 tok/s)', () => {
    const s = valid()
    s.speed.decodeTokPerSec = 5000
    s.speed.decodeMax = 5000
    expect(validate(s)).toContain('decode speed out of range')
  })

  it('rejects a median outside its own range', () => {
    const s = valid()
    s.speed.decodeMin = 100
    expect(validate(s)).toContain('decode median outside its own range')
  })

  it('rejects mismatched versions and subset hashes', () => {
    const s = valid()
    s.runtimeVersion = '0.2.87'
    s.subsetSha256 = 'abc'
    expect(validate(s)).toEqual(
      expect.arrayContaining(['runtimeVersion must be 0.2.86', 'subsetSha256 does not match the frozen subset']),
    )
  })

  it('rejects a match count that does not add up', () => {
    const s = valid()
    s.check.matched = 25
    expect(validate(s)).toContain('matched does not equal the number of matching items')
  })

  it('rejects an f16 build on a device without shader-f16', () => {
    const s = valid()
    s.device.hasF16 = false
    expect(validate(s)).toContain('an f16 build needs shader-f16')
  })

  it('does not reject a failed instant-score CPU check (plan: report separately)', () => {
    const s = valid()
    s.instant = { gflops: 50, verified: false }
    expect(validate(s)).toEqual([])
  })

  it('handles garbage without throwing', () => {
    expect(validate(null).length).toBeGreaterThan(0)
    expect(validate({ check: { items: [null] } }).length).toBeGreaterThan(0)
  })
})

describe('toRow', () => {
  it('maps to database columns and keeps only the check fields', () => {
    const row = toRow(valid())
    expect(row).toMatchObject({ build_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', decode_tok_s: 95, check_matched: 24 })
    expect((row.check_items as unknown[])[3]).toEqual({ id: 'q1-x-3', match: false, divergence: 2 })
  })
})
