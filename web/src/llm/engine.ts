// Owns the Web Worker and the WebLLM engine inside it. The speed harness and
// the quality runner both go through this, so they load models identically.

import {
  CreateWebWorkerMLCEngine,
  hasModelInCache,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from '@mlc-ai/web-llm'

export interface LoadCallbacks {
  onPhase?: (phase: 'download' | 'load', detail: string) => void
  onLoadProgress?: (fraction: number, text: string) => void
}

export interface LoadTiming {
  cacheHit: boolean
  downloadMs: number
  loadMs: number
}

export class EngineHost {
  private engine: WebWorkerMLCEngine | null = null
  private worker: Worker | null = null
  private loadedId: string | null = null

  get current(): WebWorkerMLCEngine {
    if (!this.engine) throw new Error('Model not loaded')
    return this.engine
  }

  get loadedModelId(): string | null {
    return this.loadedId
  }

  async load(modelId: string, label: string, cb: LoadCallbacks = {}): Promise<LoadTiming> {
    const cacheHit = await hasModelInCache(modelId)
    const start = performance.now()
    let loadStartedAt: number | null = null
    cb.onPhase?.(cacheHit ? 'load' : 'download', label)

    const onProgress = (r: InitProgressReport) => {
      // WebLLM reports "Fetching param cache[...]" while downloading and
      // "Loading model from cache[...]" once it starts moving weights to the GPU.
      if (loadStartedAt === null && r.text.startsWith('Loading model from cache')) {
        loadStartedAt = performance.now()
        cb.onPhase?.('load', label)
      }
      cb.onLoadProgress?.(r.progress, r.text)
    }

    if (!this.engine) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      this.engine = await CreateWebWorkerMLCEngine(this.worker, modelId, { initProgressCallback: onProgress })
    } else {
      this.engine.setInitProgressCallback(onProgress)
      await this.engine.reload(modelId)
    }
    this.loadedId = modelId

    const end = performance.now()
    const split = loadStartedAt ?? start
    return { cacheHit, downloadMs: split - start, loadMs: end - split }
  }

  async dispose(): Promise<void> {
    await this.engine?.unload()
    this.worker?.terminate()
    this.engine = null
    this.worker = null
    this.loadedId = null
  }
}
