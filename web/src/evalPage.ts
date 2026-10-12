// Headless entry point for the offline reference run (eval/reference.mjs).
// Exposes a small API on window for Playwright; no UI.

import { prebuiltAppConfig } from '@mlc-ai/web-llm'
import { EngineHost } from './llm/engine'
import { MODEL_BUILDS } from './llm/models'
import { detectDevice } from './gpu/detect'
import { answerQuestion, QUALITY_SETTINGS, type Answer, type Question } from './quality/runQuestions'

const host = new EngineHost()

const api = {
  runtimeVersion: __WEBLLM_VERSION__,
  settings: QUALITY_SETTINGS,
  builds: MODEL_BUILDS.map((b) => b.id),
  // Where WebLLM fetches each build's weights and compiled library from.
  modelRecords: prebuiltAppConfig.model_list
    .filter((m) => MODEL_BUILDS.some((b) => b.id === m.model_id))
    .map((m) => ({ id: m.model_id, model: m.model, modelLib: m.model_lib })),
  device: () => detectDevice(),
  load: (modelId: string) => host.load(modelId, modelId),
  answer: async (questions: Question[]): Promise<Answer[]> => {
    const out: Answer[] = []
    for (const q of questions) out.push(await answerQuestion(host.current, q))
    return out
  },
  unload: () => host.dispose(),
}

declare global {
  interface Window {
    mettleEval: typeof api
  }
}

window.mettleEval = api
document.body.dataset.ready = 'true'
