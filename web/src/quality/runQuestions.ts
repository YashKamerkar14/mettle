// Answers fixed questions with fixed settings and records exactly what the
// model produced. Used both by the offline reference run (eval.html, driven by
// Playwright) and by the in-browser consistency check, so both go through the
// same code path. Scoring is not done here: the reference side scores in
// Python, and the consistency check compares outputs, not correctness.

import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'

// Greedy decoding, but not via temperature 0: WebLLM clamps temperature to
// 1e-6, which makes the softmax one-hot, so every log-prob margin comes out
// infinite. Instead sample at temperature 1 with top_p at its 1e-5 floor. The
// top token always has probability >= 1/49152 (about 2e-5) > 1e-5, so the
// nucleus holds exactly one token (the argmax), and log-probs reflect the
// model's real distribution.
export const QUALITY_SETTINGS = {
  temperature: 1,
  top_p: 1e-5,
  max_tokens: 16,
  top_logprobs: 2,
} as const

export interface Question {
  id: string
  category: string
  prompt: string
  max_tokens?: number
}

export interface Answer {
  id: string
  text: string
  /** Generated tokens as strings, in order. */
  tokens: string[]
  /**
   * log p(top-1) - log p(top-2) at each step: how close the greedy choice was.
   * null when the gap is not finite (JSON has no Infinity).
   */
  margins: (number | null)[]
  finishReason: string | null
  completionTokens: number
  ms: number
}

export async function answerQuestion(engine: WebWorkerMLCEngine, q: Question): Promise<Answer> {
  // Each question starts from an empty conversation and KV cache.
  await engine.resetChat()
  const t0 = performance.now()
  const reply = await engine.chat.completions.create({
    messages: [{ role: 'user', content: q.prompt }],
    temperature: QUALITY_SETTINGS.temperature,
    top_p: QUALITY_SETTINGS.top_p,
    max_tokens: q.max_tokens ?? QUALITY_SETTINGS.max_tokens,
    logprobs: true,
    top_logprobs: QUALITY_SETTINGS.top_logprobs,
    stream: false,
  })
  const ms = performance.now() - t0
  const choice = reply.choices[0]
  const steps = choice.logprobs?.content ?? []
  return {
    id: q.id,
    text: choice.message.content ?? '',
    tokens: steps.map((s) => s.token),
    margins: steps.map((s) => {
      const [first, second] = s.top_logprobs
      const gap = first && second ? first.logprob - second.logprob : Number.NaN
      return Number.isFinite(gap) ? gap : null
    }),
    finishReason: choice.finish_reason,
    completionTokens: reply.usage?.completion_tokens ?? steps.length,
    ms,
  }
}

export async function answerAll(
  engine: WebWorkerMLCEngine,
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
): Promise<Answer[]> {
  const out: Answer[] = []
  for (const q of questions) {
    out.push(await answerQuestion(engine, q))
    onProgress?.(out.length, questions.length)
  }
  return out
}

/** Index of the first token where two outputs differ, or null if identical. */
export function firstDivergence(a: string[], b: string[]): number | null {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i
  return a.length === b.length ? null : n
}
