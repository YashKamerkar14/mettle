// Speed harness: load one model build, do one warm-up generation, then
// TIMED_RUNS timed generations with a fixed prompt and a fixed output length.
//
// Five numbers are kept apart because they measure different things:
//   download  - network (zero-ish on a cache hit, which is flagged)
//   load      - weights into GPU memory plus shader compilation
//   TTFT      - request to first token; dominated by reading the prompt
//   prefill   - prompt tokens / TTFT
//   decode    - tokens after the first / time from first to last token
// Only prefill and decode feed the score.
//
// Our own timestamps are taken on the main thread from streamed chunks, so
// they include worker message latency. WebLLM's internal figures are recorded
// next to them for comparison.

import type { CompletionUsage } from '@mlc-ai/web-llm'
import { EngineHost } from '../llm/engine'
import type { ModelBuild } from '../llm/models'
import { SPEED_MAX_TOKENS, SPEED_PROMPT, SPEED_PROMPT_VERSION } from './prompt'
import { summarize, type Summary } from './stats'

export const TIMED_RUNS = 3
export const SUSTAINED_SECONDS = 60

export type Phase = 'download' | 'load' | 'warmup' | 'run' | 'sustained' | 'done'

export interface HarnessCallbacks {
  onPhase?: (phase: Phase, detail: string) => void
  onLoadProgress?: (fraction: number, text: string) => void
  onToken?: (textSoFar: string) => void
}

export interface ChunkTimes {
  requestAt: number
  firstTokenAt: number
  lastTokenAt: number
  promptTokens: number
  completionTokens: number
}

export interface RunTiming {
  ttftMs: number
  prefillTokPerSec: number
  decodeTokPerSec: number
  promptTokens: number
  completionTokens: number
  engine: { ttftMs: number; prefillTokPerSec: number; decodeTokPerSec: number } | null
}

export interface SpeedResult {
  buildId: string
  runtimeVersion: string
  promptVersion: number
  cacheHit: boolean
  downloadMs: number
  loadMs: number
  runs: RunTiming[]
  ttftMs: Summary
  prefillTokPerSec: Summary
  decodeTokPerSec: Summary
  sampleOutput: string
}

export interface SustainedPoint {
  elapsedS: number
  decodeTokPerSec: number
}

/** Turn raw timestamps from one streamed generation into rates. */
export function computeRunTiming(t: ChunkTimes): Omit<RunTiming, 'engine'> {
  const ttftMs = t.firstTokenAt - t.requestAt
  const decodeMs = t.lastTokenAt - t.firstTokenAt
  return {
    ttftMs,
    prefillTokPerSec: ttftMs > 0 ? t.promptTokens / (ttftMs / 1000) : 0,
    decodeTokPerSec: decodeMs > 0 ? (t.completionTokens - 1) / (decodeMs / 1000) : 0,
    promptTokens: t.promptTokens,
    completionTokens: t.completionTokens,
  }
}

export class SpeedHarness {
  readonly host: EngineHost

  constructor(host = new EngineHost()) {
    this.host = host
  }

  async runSpeedTest(build: ModelBuild, cb: HarnessCallbacks = {}): Promise<SpeedResult> {
    const loaded = await this.host.load(build.id, build.label, cb)

    cb.onPhase?.('warmup', 'Warm-up run (not timed)')
    await this.generateOnce(cb)

    const runs: RunTiming[] = []
    let sampleOutput = ''
    for (let i = 0; i < TIMED_RUNS; i++) {
      cb.onPhase?.('run', `Timed run ${i + 1} of ${TIMED_RUNS}`)
      const { timing, text } = await this.generateOnce(cb)
      runs.push(timing)
      sampleOutput = text
    }
    cb.onPhase?.('done', '')

    return {
      buildId: build.id,
      runtimeVersion: __WEBLLM_VERSION__,
      promptVersion: SPEED_PROMPT_VERSION,
      ...loaded,
      runs,
      ttftMs: summarize(runs.map((r) => r.ttftMs)),
      prefillTokPerSec: summarize(runs.map((r) => r.prefillTokPerSec)),
      decodeTokPerSec: summarize(runs.map((r) => r.decodeTokPerSec)),
      sampleOutput,
    }
  }

  /**
   * Stand-in for thermal throttling, which a page cannot read directly:
   * generate back to back for SUSTAINED_SECONDS and record decode speed over time.
   * Call after runSpeedTest so the model is already loaded.
   */
  async runSustained(cb: HarnessCallbacks = {}, seconds = SUSTAINED_SECONDS): Promise<SustainedPoint[]> {
    const points: SustainedPoint[] = []
    const start = performance.now()
    while (performance.now() - start < seconds * 1000) {
      cb.onPhase?.('sustained', `${Math.round((performance.now() - start) / 1000)} of ${seconds} s`)
      const { timing } = await this.generateOnce(cb)
      points.push({ elapsedS: (performance.now() - start) / 1000, decodeTokPerSec: timing.decodeTokPerSec })
    }
    cb.onPhase?.('done', '')
    return points
  }

  async dispose(): Promise<void> {
    await this.host.dispose()
  }

  private async generateOnce(cb: HarnessCallbacks): Promise<{ timing: RunTiming; text: string }> {
    const engine = this.host.current
    // Start every run from an empty KV cache so no run reuses another's prompt.
    await engine.resetChat()

    const requestAt = performance.now()
    const stream = await engine.chat.completions.create({
      messages: [{ role: 'user', content: SPEED_PROMPT }],
      max_tokens: SPEED_MAX_TOKENS,
      ignore_eos: true,
      temperature: 0,
      stream: true,
      stream_options: { include_usage: true },
    })

    let firstTokenAt: number | null = null
    let lastTokenAt = requestAt
    let text = ''
    let usage: CompletionUsage | null = null

    for await (const chunk of stream) {
      if (chunk.choices.length > 0) {
        const now = performance.now()
        firstTokenAt ??= now
        lastTokenAt = now
        text += chunk.choices[0].delta.content ?? ''
        cb.onToken?.(text)
      }
      if (chunk.usage) usage = chunk.usage
    }

    if (firstTokenAt === null || !usage) throw new Error('Generation produced no tokens')

    const timing = computeRunTiming({
      requestAt,
      firstTokenAt,
      lastTokenAt,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    })
    const extra = usage.extra
    return {
      text,
      timing: {
        ...timing,
        engine: extra
          ? {
              ttftMs: extra.time_to_first_token_s * 1000,
              prefillTokPerSec: extra.prefill_tokens_per_s,
              decodeTokPerSec: extra.decode_tokens_per_s,
            }
          : null,
      },
    }
  }
}
