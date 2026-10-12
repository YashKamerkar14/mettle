// The four SmolLM2-360M builds Mettle compares. Sizes come from each build's
// tensor-cache.json on the Hugging Face hub (WebLLM v0.2.86). The f32 builds are
// stored as bf16 and widened on load, so they download the same bytes as f16.

export type Precision = 'q4' | 'q0'
export type ComputeType = 'f16' | 'f32'

export interface ModelBuild {
  id: string
  precision: Precision
  compute: ComputeType
  label: string
  downloadMB: number
  vramMB: number
}

export const MODEL_BUILDS: ModelBuild[] = [
  { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', precision: 'q4', compute: 'f16', label: '4-bit (f16)', downloadMB: 204, vramMB: 376 },
  { id: 'SmolLM2-360M-Instruct-q4f32_1-MLC', precision: 'q4', compute: 'f32', label: '4-bit (f32 fallback)', downloadMB: 204, vramMB: 580 },
  { id: 'SmolLM2-360M-Instruct-q0f16-MLC', precision: 'q0', compute: 'f16', label: 'Full precision (f16)', downloadMB: 724, vramMB: 872 },
  { id: 'SmolLM2-360M-Instruct-q0f32-MLC', precision: 'q0', compute: 'f32', label: 'Full precision (f32 fallback)', downloadMB: 724, vramMB: 1744 },
]

export function pickBuild(precision: Precision, hasF16: boolean): ModelBuild {
  const compute: ComputeType = hasF16 ? 'f16' : 'f32'
  const build = MODEL_BUILDS.find((b) => b.precision === precision && b.compute === compute)
  if (!build) throw new Error(`No build for ${precision}/${compute}`)
  return build
}
