// Live WebGPU background for the hero. It must never compete with a
// measurement: while `paused` (any test running) or the tab is hidden it
// submits no GPU work at all. Renders at half resolution and ~30 fps, asks
// for the low-power adapter, and draws a single still frame for visitors who
// prefer reduced motion.

import { useEffect, useRef, useState } from 'react'
import shaderSource from '../gpu/background.wgsl?raw'

type Status = 'off' | 'live' | 'paused' | 'still'

const SCALE = 0.5
const FRAME_MS = 33

export function GpuBackground({ paused }: { paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const [status, setStatus] = useState<Status>('off')
  const [reduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    let raf = 0
    let disposed = false
    let device: GPUDevice | null = null
    const mouse = { x: 0.3, y: 0.3, tx: 0.3, ty: 0.3, active: 0, tActive: 0 }
    const onMove = (e: PointerEvent) => {
      const el = canvas.current
      if (!el) return
      const r = el.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) / r.width
      mouse.ty = (e.clientY - r.top) / r.height
      mouse.tActive = mouse.ty >= 0 && mouse.ty <= 1 ? 1 : 0
    }

    ;(async () => {
      const el = canvas.current
      if (!el || !navigator.gpu) return
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' })
      if (!adapter || disposed) return
      device = await adapter.requestDevice()
      if (disposed) {
        device.destroy()
        return
      }
      const ctx = el.getContext('webgpu')
      if (!ctx) return
      const format = navigator.gpu.getPreferredCanvasFormat()
      ctx.configure({ device, format, alphaMode: 'premultiplied' })

      const module = device.createShaderModule({ code: shaderSource })
      const pipeline = await device.createRenderPipelineAsync({
        layout: 'auto',
        vertex: { module, entryPoint: 'vs' },
        fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      })
      const uniforms = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniforms } }],
      })
      const dark = matchMedia('(prefers-color-scheme: dark)')
      const start = performance.now()
      let last = 0

      const draw = (now: number) => {
        if (!device) return
        const w = Math.max(1, Math.round(el.clientWidth * devicePixelRatio * SCALE))
        const h = Math.max(1, Math.round(el.clientHeight * devicePixelRatio * SCALE))
        if (el.width !== w || el.height !== h) {
          el.width = w
          el.height = h
        }
        mouse.x += (mouse.tx - mouse.x) * 0.08
        mouse.y += (mouse.ty - mouse.y) * 0.08
        mouse.active += (mouse.tActive - mouse.active) * 0.05
        device.queue.writeBuffer(
          uniforms,
          0,
          new Float32Array([w, h, (now - start) / 1000, dark.matches ? 1 : 0, mouse.x, mouse.y, mouse.active, 0]),
        )
        const encoder = device.createCommandEncoder()
        const pass = encoder.beginRenderPass({
          colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 0] }],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3)
        pass.end()
        device.queue.submit([encoder.finish()])
      }

      if (reduced) {
        draw(start + 20_000)
        setStatus('still')
        return
      }

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const idle = pausedRef.current || document.hidden
        setStatus((s) => {
          const next = idle ? 'paused' : 'live'
          return s === next ? s : next
        })
        if (idle || now - last < FRAME_MS) return
        last = now
        draw(now)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(loop)
    })().catch((e) => {
      // Decorative only: if WebGPU drawing fails, the CSS gradient remains.
      console.warn('Mettle background disabled:', e)
      setStatus('off')
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      device?.destroy()
    }
  }, [reduced])

  return (
    <>
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      {status !== 'off' && (
        <span className={`gpu-badge ${status}`}>
          <span className="gpu-badge-dot" />
          {status === 'paused' ? 'Background paused while measuring' : 'Background rendered live by your GPU'}
        </span>
      )}
    </>
  )
}
