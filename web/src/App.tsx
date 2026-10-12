import { useEffect, useRef, useState } from 'react'
import { detectDevice, type DeviceReport } from './gpu/detect'
import { runInstantScore, type InstantScoreResult } from './gpu/instantScore'
import type { Phase, SpeedHarness, SpeedResult, SustainedPoint } from './bench/harness'
import { pickBuild, type Precision } from './llm/models'
import type { Summary } from './bench/stats'
import { Sparkline } from './components/Sparkline'
import { SPEED_MAX_TOKENS } from './bench/prompt'

type Busy = null | 'instant' | 'full' | 'sustained'

export default function App() {
  const [device, setDevice] = useState<DeviceReport | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)

  const [instant, setInstant] = useState<InstantScoreResult | null>(null)

  const [precision, setPrecision] = useState<Precision>('q4')
  const [phase, setPhase] = useState<{ phase: Phase; detail: string } | null>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [speed, setSpeed] = useState<SpeedResult | null>(null)
  const [sustained, setSustained] = useState<SustainedPoint[] | null>(null)

  const harness = useRef<SpeedHarness | null>(null)

  useEffect(() => {
    detectDevice().then(setDevice, (e) => setError(String(e)))
    return () => void harness.current?.dispose()
  }, [])

  const build = device ? pickBuild(precision, device.hasF16) : null

  async function guarded(kind: Busy, fn: () => Promise<void>) {
    setBusy(kind)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
      setPhase(null)
    }
  }

  const callbacks = {
    onPhase: (p: Phase, detail: string) => setPhase({ phase: p, detail }),
    onLoadProgress: (f: number) => setLoadProgress(f),
    onToken: (t: string) => setLiveText(t),
  }

  const runInstant = () => guarded('instant', async () => setInstant(await runInstantScore()))

  const runFull = () =>
    guarded('full', async () => {
      if (!build) return
      setSpeed(null)
      setSustained(null)
      setLiveText('')
      setLoadProgress(0)
      // WebLLM is ~2 MB gzipped; load it only once someone opts into the full test.
      harness.current ??= new (await import('./bench/harness')).SpeedHarness()
      setSpeed(await harness.current.runSpeedTest(build, callbacks))
    })

  const runSustained = () =>
    guarded('sustained', async () => {
      if (!harness.current) return
      setSustained(await harness.current.runSustained(callbacks))
    })

  const copyRaw = () =>
    navigator.clipboard.writeText(JSON.stringify({ device, instant, speed, sustained }, null, 2))

  return (
    <main>
      <header>
        <h1>Mettle</h1>
        <p className="tagline">Test your machine's mettle.</p>
        <p className="lede">
          Runs a small language model on your own graphics chip, measures how fast it goes, and checks what
          compressing the model costs in answer quality.
        </p>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="card">
        <h2>Your device</h2>
        {!device ? (
          <p className="muted">Checking WebGPU support…</p>
        ) : !device.webgpu ? (
          <p className="error">{device.reason} Try a recent Chrome, Edge or Safari.</p>
        ) : (
          <dl className="facts">
            <dt>Graphics</dt>
            <dd>{[device.vendor, device.architecture].filter(Boolean).join(' · ') || 'Not reported by browser'}</dd>
            <dt>Browser</dt>
            <dd>{device.browser} on {device.os}</dd>
            <dt>16-bit shaders</dt>
            <dd>{device.hasF16 ? 'Supported' : 'Not supported (uses f32 builds)'}</dd>
          </dl>
        )}
        {device?.webgpu && /intel|amd/i.test(device.vendor) && (
          <p className="muted">
            Laptop with two graphics chips? Browsers often pick the weaker built-in one. On Windows, set your browser
            to "High performance" in Settings → Display → Graphics, then reload.
          </p>
        )}
      </section>

      {device?.webgpu && (
        <>
          <section className="card">
            <h2>Instant score</h2>
            <p className="muted">A matrix multiply on your graphics chip. No download, a few seconds.</p>
            <button onClick={runInstant} disabled={busy !== null}>
              {busy === 'instant' ? 'Running…' : instant ? 'Run again' : 'Run instant score'}
            </button>
            {instant && (
              <div className="result">
                <p className="big">
                  {fmt(instant.gflops.median, 0)} <span className="unit">GFLOPS</span>
                </p>
                <p className="muted">
                  {spread(instant.gflops, 0)} · {instant.n}×{instant.n} f32 · {instant.dispatchesPerBatch} dispatches per
                  sample · {fmt(instant.totalMs / 1000, 1)} s total ·{' '}
                  {instant.verified ? 'result verified on CPU' : `verification FAILED (max error ${instant.maxAbsError})`}
                </p>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Full test</h2>
            <p className="muted">
              Downloads SmolLM2-360M once (cached after that), then does one warm-up and three timed runs of{' '}
              {SPEED_MAX_TOKENS} tokens each.
            </p>
            <fieldset disabled={busy !== null}>
              <legend>Model build</legend>
              <label>
                <input type="radio" checked={precision === 'q4'} onChange={() => setPrecision('q4')} /> 4-bit
              </label>
              <label>
                <input type="radio" checked={precision === 'q0'} onChange={() => setPrecision('q0')} /> Full precision
              </label>
            </fieldset>
            {build && (
              <p className="muted">
                {build.id} · about {build.downloadMB} MB download · {build.vramMB} MB graphics memory
              </p>
            )}
            <button onClick={runFull} disabled={busy !== null}>
              {busy === 'full' ? 'Running…' : `Start full test (${build?.downloadMB ?? '…'} MB)`}
            </button>

            {phase && busy !== 'instant' && (
              <div className="progress">
                <p>
                  <strong>{PHASE_LABEL[phase.phase]}</strong> {phase.detail}
                </p>
                {(phase.phase === 'download' || phase.phase === 'load') && (
                  <progress value={loadProgress} max={1} />
                )}
              </div>
            )}

            {liveText && (busy === 'full' || busy === 'sustained') && <pre className="live">{liveText}</pre>}

            {speed && (
              <div className="result">
                <p className="big">
                  {fmt(speed.decodeTokPerSec.median, 1)} <span className="unit">tokens / s</span>
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Measure</th>
                      <th>Median</th>
                      <th>Range ({speed.runs.length} runs)</th>
                      <th>WebLLM's own</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Download</td>
                      <td colSpan={3}>
                        {speed.cacheHit ? 'Cached (no download)' : `${fmt(speed.downloadMs / 1000, 1)} s`}
                      </td>
                    </tr>
                    <tr>
                      <td>Load</td>
                      <td colSpan={3}>{fmt(speed.loadMs / 1000, 1)} s</td>
                    </tr>
                    <SummaryRow label="Time to first token" unit="ms" s={speed.ttftMs} engine={avg(speed, 'ttftMs')} digits={0} />
                    <SummaryRow label="Prompt reading" unit="tok/s" s={speed.prefillTokPerSec} engine={avg(speed, 'prefillTokPerSec')} digits={0} />
                    <SummaryRow label="Generation" unit="tok/s" s={speed.decodeTokPerSec} engine={avg(speed, 'decodeTokPerSec')} digits={1} />
                  </tbody>
                </table>
                <p className="muted">
                  {speed.runs[0].promptTokens} prompt tokens · WebLLM {speed.runtimeVersion}
                </p>
                <details>
                  <summary>Sample output</summary>
                  <pre className="live">{speed.sampleOutput}</pre>
                </details>
                <button onClick={runSustained} disabled={busy !== null}>
                  {busy === 'sustained' ? 'Running…' : 'Run 60-second sustained test'}
                </button>
              </div>
            )}

            {sustained && <SustainedResult points={sustained} />}
          </section>

          {(instant || speed) && (
            <p>
              <button className="secondary" onClick={copyRaw}>
                Copy raw result (JSON)
              </button>
            </p>
          )}
        </>
      )}
    </main>
  )
}

const PHASE_LABEL: Record<Phase, string> = {
  download: 'Downloading',
  load: 'Loading onto GPU',
  warmup: 'Warming up',
  run: 'Measuring',
  sustained: 'Sustained run',
  done: 'Done',
}

function SummaryRow(props: { label: string; unit: string; s: Summary; engine: number | null; digits: number }) {
  const { label, unit, s, engine, digits } = props
  return (
    <tr>
      <td>{label}</td>
      <td>
        {fmt(s.median, digits)} {unit}
      </td>
      <td>
        {fmt(s.min, digits)}–{fmt(s.max, digits)}
      </td>
      <td>{engine === null ? '—' : `${fmt(engine, digits)} ${unit}`}</td>
    </tr>
  )
}

function SustainedResult({ points }: { points: SustainedPoint[] }) {
  const first = points[0]?.decodeTokPerSec ?? 0
  const last = points.at(-1)?.decodeTokPerSec ?? 0
  const change = first > 0 ? ((last - first) / first) * 100 : 0
  return (
    <div className="result">
      <h3>Sustained generation</h3>
      <Sparkline values={points.map((p) => p.decodeTokPerSec)} label="Generation speed over 60 seconds" />
      <p className="muted">
        {fmt(first, 1)} → {fmt(last, 1)} tok/s over {points.length} runs ({change >= 0 ? '+' : ''}
        {fmt(change, 0)}%). A steady drop usually means the device is heating up and slowing down.
      </p>
    </div>
  )
}

function avg(speed: SpeedResult, key: 'ttftMs' | 'prefillTokPerSec' | 'decodeTokPerSec'): number | null {
  const vals = speed.runs.map((r) => r.engine?.[key]).filter((v): v is number => typeof v === 'number')
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function fmt(x: number, digits: number): string {
  return x.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function spread(s: Summary, digits: number): string {
  return `range ${fmt(s.min, digits)}–${fmt(s.max, digits)} over ${s.n} samples`
}
