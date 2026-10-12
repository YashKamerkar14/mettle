import { useEffect, useRef, useState } from 'react'
import { detectDevice, type DeviceReport } from './gpu/detect'
import { runInstantScore, type InstantScoreResult } from './gpu/instantScore'
import type { Phase, SpeedHarness, SpeedResult, SustainedPoint } from './bench/harness'
import { pickBuild, type ModelBuild, type Precision } from './llm/models'
import type { Summary } from './bench/stats'
import { Sparkline } from './components/Sparkline'
import { SPEED_MAX_TOKENS } from './bench/prompt'
import { runConsistencyCheck, type ConsistencyResult } from './quality/consistency'
import { SubmitPanel } from './leaderboard/SubmitPanel'

type Busy = null | 'instant' | 'full' | 'sustained'
type UiPhase = Phase | 'check'

interface BuildResult {
  build: ModelBuild
  speed: SpeedResult
  check: ConsistencyResult | null
}

const FINDINGS_URL = 'https://github.com/YashKamerkar14/mettle/blob/main/docs/findings.md'

export default function App() {
  const [device, setDevice] = useState<DeviceReport | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)

  const [instant, setInstant] = useState<InstantScoreResult | null>(null)

  const [phase, setPhase] = useState<{ phase: UiPhase; detail: string } | null>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [results, setResults] = useState<Partial<Record<Precision, BuildResult>>>({})
  const [sustained, setSustained] = useState<SustainedPoint[] | null>(null)

  const harness = useRef<SpeedHarness | null>(null)

  useEffect(() => {
    detectDevice().then(setDevice, (e) => setError(String(e)))
    return () => void harness.current?.dispose()
  }, [])

  const q4 = device ? pickBuild('q4', device.hasF16) : null
  const q0 = device ? pickBuild('q0', device.hasF16) : null

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

  const runBuild = (precision: Precision) =>
    guarded('full', async () => {
      if (!device) return
      const build = pickBuild(precision, device.hasF16)
      setSustained(null)
      setLiveText('')
      setLoadProgress(0)
      // WebLLM is ~2 MB gzipped; load it only once someone opts into the full test.
      harness.current ??= new (await import('./bench/harness')).SpeedHarness()
      const speed = await harness.current.runSpeedTest(build, callbacks)
      setResults((r) => ({ ...r, [precision]: { build, speed, check: null } }))

      setPhase({ phase: 'check', detail: '' })
      const check = await runConsistencyCheck(harness.current.host.current, build.id, (done, total) =>
        setPhase({ phase: 'check', detail: `${done} of ${total}` }),
      )
      setResults((r) => ({ ...r, [precision]: { build, speed, check } }))
    })

  const runSustained = () =>
    guarded('sustained', async () => {
      if (!harness.current) return
      setSustained(await harness.current.runSustained(callbacks))
    })

  const copyRaw = () =>
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          device,
          instant,
          results: Object.fromEntries(
            Object.entries(results).map(([k, v]) => [k, { build: v.build.id, speed: v.speed, check: v.check }]),
          ),
          sustained,
        },
        null,
        2,
      ),
    )

  const r4 = results.q4
  const r0 = results.q0

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

      {device?.webgpu && q4 && q0 && (
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
              Downloads the 4-bit SmolLM2-360M once (about {q4.downloadMB} MB, cached after that), times one warm-up and
              three runs of {SPEED_MAX_TOKENS} tokens, then answers 25 fixed questions and checks the answers match our
              reference device token for token.
            </p>
            <button onClick={() => runBuild('q4')} disabled={busy !== null}>
              {busy === 'full' && !r4 ? 'Running…' : r4 ? 'Run 4-bit again' : `Start full test (${q4.downloadMB} MB)`}
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

            {liveText && (busy === 'full' || busy === 'sustained') && phase?.phase !== 'check' && (
              <pre className="live">{liveText}</pre>
            )}

            {r4 && <BuildResultView result={r4} />}
            {r4?.check && (
              <SubmitPanel device={device} instant={instant} speed={r4.speed} check={r4.check} label="4-bit" />
            )}

            {r4?.check && (
              <div className="result">
                <h3>Compare with full precision</h3>
                <p className="muted">
                  Runs the same test on the uncompressed model ({q0.downloadMB} MB download, {q0.vramMB} MB graphics
                  memory) so you can see what 4-bit compression buys on this device.
                </p>
                <button onClick={() => runBuild('q0')} disabled={busy !== null}>
                  {busy === 'full' && r4 && !r0 ? 'Running…' : r0 ? 'Run full precision again' : `Run full precision (${q0.downloadMB} MB)`}
                </button>
              </div>
            )}

            {r0 && <BuildResultView result={r0} />}
            {r0?.check && (
              <SubmitPanel device={device} instant={instant} speed={r0.speed} check={r0.check} label="full-precision" />
            )}
            {r4 && r0 && <Comparison q4={r4} q0={r0} />}

            {(r4 || r0) && (
              <div className="result">
                <button onClick={runSustained} disabled={busy !== null}>
                  {busy === 'sustained' ? 'Running…' : 'Run 60-second sustained test'}
                </button>
                {sustained && <SustainedResult points={sustained} />}
              </div>
            )}
          </section>

          {(instant || r4) && (
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

const PHASE_LABEL: Record<UiPhase, string> = {
  download: 'Downloading',
  load: 'Loading onto GPU',
  warmup: 'Warming up',
  run: 'Measuring',
  sustained: 'Sustained run',
  check: 'Checking answers',
  done: 'Done',
}

function BuildResultView({ result }: { result: BuildResult }) {
  const { build, speed, check } = result
  return (
    <div className="result">
      <h3>{build.label}</h3>
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
            <td colSpan={3}>{speed.cacheHit ? 'Cached (no download)' : `${fmt(speed.downloadMs / 1000, 1)} s`}</td>
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
        {speed.runs[0].promptTokens} prompt tokens · WebLLM {speed.runtimeVersion} · {build.id}
      </p>
      {check && <CheckView check={check} />}
    </div>
  )
}

function CheckView({ check }: { check: ConsistencyResult }) {
  const mismatches = check.items.filter((i) => !i.match)
  return (
    <div className="check">
      <p>
        <strong>
          Answers match the reference: {check.matched} of {check.total}
        </strong>
      </p>
      <p className="muted">
        {mismatches.length === 0
          ? `Your device produced exactly the same words as our reference device (${check.referenceDevice}) on every question.`
          : `Different graphics chips do arithmetic in slightly different orders, which can tip the model toward a different word when two choices are nearly tied.`}
      </p>
      {mismatches.length > 0 && (
        <details>
          <summary>Where your device differs ({mismatches.length})</summary>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Your device</th>
                <th>Reference</th>
                <th>Differs at token</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((i) => (
                <tr key={i.id}>
                  <td>{i.prompt.split('\n')[0].replace(/ Answer with.*$/, '')}</td>
                  <td>{i.text}</td>
                  <td>{i.referenceText}</td>
                  <td>{i.divergence === null ? 'stops differently' : i.divergence + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}

function Comparison({ q4, q0 }: { q4: BuildResult; q0: BuildResult }) {
  const ratio = q4.speed.decodeTokPerSec.median / q0.speed.decodeTokPerSec.median
  return (
    <div className="result comparison">
      <h3>What compression buys on this device</h3>
      <p className="big">
        {fmt(ratio, 2)}× <span className="unit">faster generation with 4-bit</span>
      </p>
      <p className="muted">
        {fmt(q4.speed.decodeTokPerSec.median, 1)} vs {fmt(q0.speed.decodeTokPerSec.median, 1)} tokens/s, with a{' '}
        {Math.round(q0.build.downloadMB / q4.build.downloadMB)}× smaller download. One session, so expect some variation.
      </p>
      <p>
        <strong>And what it costs:</strong> on our 500-question test, 4-bit showed no measurable difference in getting
        the answer right (−0.4 points, 95% CI −5.8 to +5.0, too wide to call them equal), but followed "answer with only…" instructions far less often (9% vs
        48%). It lost 19 points on arithmetic and gained 21 on capitals. <a href={FINDINGS_URL}>Read the findings</a>.
      </p>
    </div>
  )
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
