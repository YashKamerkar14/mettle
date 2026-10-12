// Shape and plausibility checks for a crowd submission. Shared by the
// `submit` edge function (Deno) and the site's unit tests (Vitest), so it
// uses no runtime-specific APIs.

export const SCHEMA_VERSION = 1
export const RUNTIME_VERSION = '0.2.86'
export const PROMPT_VERSION = 1
export const SUBSET_SHA256 = '65aacbb304ab0e2579c0d7e1fcf760dd4a785264a86235a082a707260e847082'
export const SUBSET_SIZE = 25
export const BUILD_IDS = [
  'SmolLM2-360M-Instruct-q4f16_1-MLC',
  'SmolLM2-360M-Instruct-q4f32_1-MLC',
  'SmolLM2-360M-Instruct-q0f16-MLC',
  'SmolLM2-360M-Instruct-q0f32-MLC',
]

export interface Submission {
  schemaVersion: number
  clientId: string
  runtimeVersion: string
  promptVersion: number
  subsetSha256: string
  buildId: string
  device: {
    vendor: string
    architecture: string
    device: string
    description: string
    browser: string
    os: string
    hasF16: boolean
    isFallbackAdapter: boolean
  }
  confirmedDevice: string | null
  instant: { gflops: number; verified: boolean } | null
  speed: {
    cacheHit: boolean
    downloadMs: number
    loadMs: number
    ttftMs: number
    prefillTokPerSec: number
    decodeTokPerSec: number
    decodeMin: number
    decodeMax: number
    promptTokens: number
  }
  check: {
    matched: number
    total: number
    items: { id: string; match: boolean; divergence: number | null }[]
  }
}

/** Database row for public.results, minus the server-side fields. */
export type ResultRow = Record<string, string | number | boolean | null | object>

type Check = [boolean, string]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function num(x: unknown, lo: number, hi: number): boolean {
  return typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi
}

function str(x: unknown, max: number): boolean {
  return typeof x === 'string' && x.length <= max
}

/** Returns the list of problems; empty means the submission is acceptable. */
export function validate(body: unknown): string[] {
  const s = body as Submission
  if (!s || typeof s !== 'object') return ['body must be a JSON object']
  const d = s.device ?? ({} as Submission['device'])
  const sp = s.speed ?? ({} as Submission['speed'])
  const ch = s.check ?? ({} as Submission['check'])
  const items = Array.isArray(ch.items) ? ch.items : []

  const checks: Check[] = [
    [s.schemaVersion === SCHEMA_VERSION, `schemaVersion must be ${SCHEMA_VERSION}`],
    [typeof s.clientId === 'string' && UUID.test(s.clientId), 'clientId must be a UUID'],
    [s.runtimeVersion === RUNTIME_VERSION, `runtimeVersion must be ${RUNTIME_VERSION}`],
    [s.promptVersion === PROMPT_VERSION, `promptVersion must be ${PROMPT_VERSION}`],
    [s.subsetSha256 === SUBSET_SHA256, 'subsetSha256 does not match the frozen subset'],
    [BUILD_IDS.includes(s.buildId), 'unknown buildId'],

    [str(d.vendor, 100) && str(d.architecture, 100) && str(d.device, 100) && str(d.description, 200), 'device strings missing or too long'],
    [str(d.browser, 60) && str(d.os, 40), 'browser/os missing or too long'],
    [typeof d.hasF16 === 'boolean' && typeof d.isFallbackAdapter === 'boolean', 'device flags must be booleans'],
    [s.confirmedDevice === null || s.confirmedDevice === undefined || str(s.confirmedDevice, 100), 'confirmedDevice too long'],
    [!(s.buildId ?? '').includes('f16') || d.hasF16 === true, 'an f16 build needs shader-f16'],

    [
      s.instant === null || s.instant === undefined || (num(s.instant.gflops, 0.01, 200_000) && typeof s.instant.verified === 'boolean'),
      'instant score out of range',
    ],

    [typeof sp.cacheHit === 'boolean', 'cacheHit must be a boolean'],
    [num(sp.downloadMs, 0, 3_600_000), 'downloadMs out of range'],
    [num(sp.loadMs, 1, 600_000), 'loadMs out of range'],
    [num(sp.ttftMs, 1, 120_000), 'ttftMs out of range'],
    [num(sp.prefillTokPerSec, 0.1, 200_000), 'prefill speed out of range'],
    // Plan exclusion: decode above 2,000 tok/s is not plausible for this model in a browser.
    [num(sp.decodeTokPerSec, 0.1, 2_000), 'decode speed out of range'],
    [num(sp.decodeMin, 0.1, 2_000) && num(sp.decodeMax, 0.1, 2_000), 'decode range out of range'],
    [sp.decodeMin <= sp.decodeTokPerSec && sp.decodeTokPerSec <= sp.decodeMax, 'decode median outside its own range'],
    [num(sp.promptTokens, 300, 700), 'promptTokens out of range'],

    [ch.total === SUBSET_SIZE && items.length === SUBSET_SIZE, `check must cover the ${SUBSET_SIZE} subset questions`],
    [
      items.every(
        (i) =>
          str(i?.id, 40) &&
          typeof i.match === 'boolean' &&
          (i.divergence === null || num(i.divergence, 0, 64)) &&
          (!i.match || i.divergence === null),
      ),
      'malformed check item',
    ],
    [new Set(items.map((i) => i?.id)).size === items.length, 'duplicate check item ids'],
    [ch.matched === items.filter((i) => i?.match).length, 'matched does not equal the number of matching items'],
  ]
  return checks.filter(([ok]) => !ok).map(([, msg]) => msg)
}

export function toRow(s: Submission): ResultRow {
  return {
    schema_version: s.schemaVersion,
    client_id: s.clientId,
    runtime_version: s.runtimeVersion,
    prompt_version: s.promptVersion,
    subset_sha256: s.subsetSha256,
    build_id: s.buildId,
    gpu_vendor: s.device.vendor,
    gpu_architecture: s.device.architecture,
    gpu_device: s.device.device,
    gpu_description: s.device.description,
    browser: s.device.browser,
    os: s.device.os,
    has_f16: s.device.hasF16,
    is_fallback_adapter: s.device.isFallbackAdapter,
    confirmed_device: s.confirmedDevice ?? null,
    instant_gflops: s.instant?.gflops ?? null,
    instant_verified: s.instant?.verified ?? null,
    cache_hit: s.speed.cacheHit,
    download_ms: s.speed.downloadMs,
    load_ms: s.speed.loadMs,
    ttft_ms: s.speed.ttftMs,
    prefill_tok_s: s.speed.prefillTokPerSec,
    decode_tok_s: s.speed.decodeTokPerSec,
    decode_tok_s_min: s.speed.decodeMin,
    decode_tok_s_max: s.speed.decodeMax,
    prompt_tokens: s.speed.promptTokens,
    check_matched: s.check.matched,
    check_total: s.check.total,
    check_items: s.check.items.map(({ id, match, divergence }) => ({ id, match, divergence })),
  }
}
