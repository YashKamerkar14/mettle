// Instant score: f32 matrix-multiply throughput in GFLOPS, no model download.
// Timing is wall clock around batches of dispatches, each batch sized to take
// roughly TARGET_BATCH_MS so per-submit overhead is small next to GPU work.
// The output is checked against a CPU reference so a broken driver (or a
// tampered client) cannot produce a score for work it did not do.

import shaderSource from './matmul.wgsl?raw'
import { mulberry32 } from './rng'
import { summarize, type Summary } from '../bench/stats'

const N = 1024
const TILE = 16
const TARGET_BATCH_MS = 60
const MAX_DISPATCHES_PER_BATCH = 64
const SAMPLES = 7
const CHECK_CELLS = 32

export interface InstantScoreResult {
  gflops: Summary
  n: number
  dispatchesPerBatch: number
  verified: boolean
  maxAbsError: number
  totalMs: number
}

export async function runInstantScore(seed = 1234): Promise<InstantScoreResult> {
  const started = performance.now()
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  if (!adapter) throw new Error('No WebGPU adapter')
  const device = await adapter.requestDevice()

  try {
    const rand = mulberry32(seed)
    const a = new Float32Array(N * N).map(() => rand() * 2 - 1)
    const b = new Float32Array(N * N).map(() => rand() * 2 - 1)

    const bytes = N * N * 4
    const bufA = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
    const bufB = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
    const bufC = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC })
    const bufParams = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    device.queue.writeBuffer(bufA, 0, a)
    device.queue.writeBuffer(bufB, 0, b)
    device.queue.writeBuffer(bufParams, 0, new Uint32Array([N, 0, 0, 0]))

    const module = device.createShaderModule({ code: shaderSource })
    const pipeline = await device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    })
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: bufA } },
        { binding: 1, resource: { buffer: bufB } },
        { binding: 2, resource: { buffer: bufC } },
        { binding: 3, resource: { buffer: bufParams } },
      ],
    })

    const runBatch = async (dispatches: number): Promise<number> => {
      const encoder = device.createCommandEncoder()
      const pass = encoder.beginComputePass()
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      for (let i = 0; i < dispatches; i++) pass.dispatchWorkgroups(N / TILE, N / TILE)
      pass.end()
      const t0 = performance.now()
      device.queue.submit([encoder.finish()])
      await device.queue.onSubmittedWorkDone()
      return performance.now() - t0
    }

    // Warm-up (driver compilation, clocks ramping), then calibrate batch size.
    await runBatch(1)
    const oneMs = Math.max(await runBatch(1), 0.1)
    const dispatchesPerBatch = Math.min(MAX_DISPATCHES_PER_BATCH, Math.max(1, Math.round(TARGET_BATCH_MS / oneMs)))

    const flopsPerDispatch = 2 * N ** 3
    const gflops: number[] = []
    for (let i = 0; i < SAMPLES; i++) {
      const ms = await runBatch(dispatchesPerBatch)
      gflops.push((flopsPerDispatch * dispatchesPerBatch) / (ms * 1e6))
    }

    const c = await readBuffer(device, bufC, bytes)
    const maxAbsError = checkCells(a, b, c, rand)

    for (const buf of [bufA, bufB, bufC, bufParams]) buf.destroy()

    return {
      gflops: summarize(gflops),
      n: N,
      dispatchesPerBatch,
      verified: maxAbsError < 1e-2,
      maxAbsError,
      totalMs: performance.now() - started,
    }
  } finally {
    device.destroy()
  }
}

async function readBuffer(device: GPUDevice, src: GPUBuffer, size: number): Promise<Float32Array> {
  const staging = device.createBuffer({ size, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  const encoder = device.createCommandEncoder()
  encoder.copyBufferToBuffer(src, 0, staging, 0, size)
  device.queue.submit([encoder.finish()])
  await staging.mapAsync(GPUMapMode.READ)
  const out = new Float32Array(staging.getMappedRange().slice(0))
  staging.unmap()
  staging.destroy()
  return out
}

/** Recompute random cells of C on the CPU in float64; return the worst error. */
function checkCells(a: Float32Array, b: Float32Array, c: Float32Array, rand: () => number): number {
  let worst = 0
  for (let k = 0; k < CHECK_CELLS; k++) {
    const row = Math.floor(rand() * N)
    const col = Math.floor(rand() * N)
    let expected = 0
    for (let i = 0; i < N; i++) expected += a[row * N + i] * b[i * N + col]
    const err = Math.abs(expected - c[row * N + col])
    if (Number.isNaN(err)) return Infinity
    worst = Math.max(worst, err)
  }
  return worst
}
