// Opt-in submission of a result to the crowd dataset, via the `submit` edge
// function. Nothing is sent unless the visitor clicks the button.

import type { DeviceReport } from '../gpu/detect'
import type { InstantScoreResult } from '../gpu/instantScore'
import type { SpeedResult } from '../bench/harness'
import type { ConsistencyResult } from '../quality/consistency'
import { SCHEMA_VERSION, type Submission } from '../../../supabase/functions/_shared/submission'

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''
const PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

export const leaderboardEnabled = Boolean(SUPABASE_URL && PUBLISHABLE_KEY && TURNSTILE_SITE_KEY)

const CLIENT_ID_KEY = 'mettle.clientId'

/** Random id kept in this browser so repeat runs can be told apart from new devices. */
export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
    return id
  } catch {
    // Storage blocked (private mode etc.): a fresh id per page load.
    return crypto.randomUUID()
  }
}

export function buildSubmission(args: {
  device: DeviceReport
  instant: InstantScoreResult | null
  speed: SpeedResult
  check: ConsistencyResult
  confirmedDevice: string | null
}): Submission {
  const { device, instant, speed, check, confirmedDevice } = args
  return {
    schemaVersion: SCHEMA_VERSION,
    clientId: getClientId(),
    runtimeVersion: speed.runtimeVersion,
    promptVersion: speed.promptVersion,
    subsetSha256: check.subsetSha256,
    buildId: speed.buildId,
    device: {
      vendor: device.vendor,
      architecture: device.architecture,
      device: device.device,
      description: device.description,
      browser: device.browser,
      os: device.os,
      hasF16: device.hasF16,
      isFallbackAdapter: device.isFallbackAdapter,
    },
    confirmedDevice: confirmedDevice?.trim() || null,
    instant: instant ? { gflops: instant.gflops.median, verified: instant.verified } : null,
    speed: {
      cacheHit: speed.cacheHit,
      downloadMs: speed.downloadMs,
      loadMs: speed.loadMs,
      ttftMs: speed.ttftMs.median,
      prefillTokPerSec: speed.prefillTokPerSec.median,
      decodeTokPerSec: speed.decodeTokPerSec.median,
      decodeMin: speed.decodeTokPerSec.min,
      decodeMax: speed.decodeTokPerSec.max,
      promptTokens: speed.runs[0].promptTokens,
    },
    check: {
      matched: check.matched,
      total: check.total,
      items: check.items.map((i) => ({ id: i.id, match: i.match, divergence: i.divergence })),
    },
  }
}

export async function submitResult(submission: Submission, turnstileToken: string): Promise<{ id: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY },
    body: JSON.stringify({ ...submission, turnstileToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(data.problems) ? `: ${data.problems.join('; ')}` : ''
    throw new Error(`${data.error ?? `Submission failed (${res.status})`}${detail}`)
  }
  return data
}
