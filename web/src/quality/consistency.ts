// In-browser consistency check (docs/analysis-plan.md, "Cross-device
// consistency"): answer the 25 frozen subset questions on this device and
// compare token by token with the reference device's outputs for the same
// build. A match means identical tokens and identical finish reason.

import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'
import { answerQuestion, firstDivergence, type Answer, type Question } from './runQuestions'

export interface ReferenceAnswer {
  tokens: string[]
  text: string
  finishReason: string | null
}

export interface ReferenceFile {
  version: number
  subsetSha256: string
  runtimeVersion: string
  referenceDevice: string
  questions: (Question & { category: string })[]
  references: Record<string, Record<string, ReferenceAnswer>>
}

export interface ItemCheck {
  id: string
  category: string
  prompt: string
  match: boolean
  /** First token index where this device's output differs; null if identical. */
  divergence: number | null
  text: string
  referenceText: string
}

export interface ConsistencyResult {
  buildId: string
  subsetSha256: string
  referenceDevice: string
  matched: number
  total: number
  items: ItemCheck[]
  answers: Answer[]
}

export async function loadReference(): Promise<ReferenceFile> {
  const res = await fetch(`${import.meta.env.BASE_URL}reference/subset.v1.json`)
  if (!res.ok) throw new Error(`Could not load reference answers (${res.status})`)
  return res.json()
}

export function compareToReference(
  questions: ReferenceFile['questions'],
  answers: Answer[],
  reference: Record<string, ReferenceAnswer>,
): ItemCheck[] {
  const byId = new Map(answers.map((a) => [a.id, a]))
  return questions.map((q) => {
    const a = byId.get(q.id)
    const ref = reference[q.id]
    if (!a || !ref) throw new Error(`Missing answer or reference for ${q.id}`)
    const divergence = firstDivergence(a.tokens, ref.tokens)
    return {
      id: q.id,
      category: q.category,
      prompt: q.prompt,
      match: divergence === null && a.finishReason === ref.finishReason,
      divergence,
      text: a.text,
      referenceText: ref.text,
    }
  })
}

export async function runConsistencyCheck(
  engine: WebWorkerMLCEngine,
  buildId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ConsistencyResult> {
  const ref = await loadReference()
  if (ref.runtimeVersion !== __WEBLLM_VERSION__) {
    throw new Error(`Reference answers are for WebLLM ${ref.runtimeVersion}, this page runs ${__WEBLLM_VERSION__}`)
  }
  const reference = ref.references[buildId]
  if (!reference) throw new Error(`No reference answers for ${buildId}`)

  const answers: Answer[] = []
  for (const q of ref.questions) {
    answers.push(await answerQuestion(engine, q))
    onProgress?.(answers.length, ref.questions.length)
  }
  const items = compareToReference(ref.questions, answers, reference)
  return {
    buildId,
    subsetSha256: ref.subsetSha256,
    referenceDevice: ref.referenceDevice,
    matched: items.filter((i) => i.match).length,
    total: items.length,
    items,
    answers,
  }
}
