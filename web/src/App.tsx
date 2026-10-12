import { useEffect, useRef, useState, type ReactNode } from 'react'
import { detectDevice, type DeviceReport } from './gpu/detect'
import { runInstantScore, type InstantScoreResult } from './gpu/instantScore'
import type { Phase, SpeedHarness, SpeedResult, SustainedPoint } from './bench/harness'
import { pickBuild, type ModelBuild, type Precision } from './llm/models'
import type { Summary } from './bench/stats'
import { Sparkline } from './components/Sparkline'
import { SPEED_MAX_TOKENS } from './bench/prompt'
import { runConsistencyCheck, type ConsistencyResult } from './quality/consistency'
import { SubmitPanel } from './leaderboard/SubmitPanel'
import { FINDINGS, LINKS } from './findings'

type Busy = null | 'instant' | 'full' | 'sustained'
type UiPhase = Phase | 'check'

interface BuildResult {
  build: ModelBuild
  speed: SpeedResult
  check: ConsistencyResult | null
}

export default function App() {
  const [device, setDevice] = useState<DeviceReport | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)

  const [instant, setInstant] = useState<InstantScoreResult | null>(null)

  const [phase, setPhase] = useState<{ phase: UiPhase; detail: string } | null>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [results, setResults] = useState<Partial<Record<Precision, BuildResult>>>({})
  const [running, setRunning] = useState<Precision | null>(null)
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
      setRunning(null)
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
      setRunning(precision)
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
  const progress =
    phase && busy !== 'instant' ? (
      <Progress phase={phase} loadProgress={loadProgress} liveText={busy !== 'sustained' && phase.phase !== 'check' ? liveText : ''} />
    ) : null

  return (
    <>
      <Hero />

      <main>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <DeviceStrip device={device} />

        {device && !device.webgpu && <NoWebGpu reason={device.reason} />}

        {device?.webgpu && q4 && q0 && (
          <>
            <Step n={1} title="Instant score" meta="No download · about 1 second">
              <p className="muted">A matrix multiply written in WGSL, run on your graphics chip and checked on the CPU.</p>
              <button onClick={runInstant} disabled={busy !== null}>
                {busy === 'instant' ? 'Running…' : instant ? 'Run again' : 'Run instant score'}
              </button>
              {instant && <InstantView instant={instant} />}
            </Step>

            <Step n={2} title="Full test, 4-bit model" meta={`${q4.downloadMB} MB download, cached after`}>
              <p className="muted">
                Runs SmolLM2-360M on your GPU: one warm-up and three timed runs of {SPEED_MAX_TOKENS} tokens, then 25
                fixed questions whose answers are checked against our reference device, token by token.
              </p>
              <button onClick={() => runBuild('q4')} disabled={busy !== null}>
                {running === 'q4' ? 'Running…' : r4 ? 'Run again' : `Start full test`}
              </button>
              {running === 'q4' && progress}
              {r4 && <BuildResultView result={r4} />}
              {r4?.check && <SubmitPanel device={device} instant={instant} speed={r4.speed} check={r4.check} label="4-bit" />}
            </Step>

            <Step
              n={3}
              title="Compare with full precision"
              meta={`${q0.downloadMB} MB download`}
              locked={!r4?.check}
              lockedText="Finish step 2 first."
            >
              <p className="muted">
                The same test on the uncompressed model, so you can see what 4-bit compression buys on your device.
              </p>
              <button onClick={() => runBuild('q0')} disabled={busy !== null}>
                {running === 'q0' ? 'Running…' : r0 ? 'Run again' : 'Run full precision'}
              </button>
              {running === 'q0' && progress}
              {r0 && <BuildResultView result={r0} />}
              {r0?.check && (
                <SubmitPanel device={device} instant={instant} speed={r0.speed} check={r0.check} label="full-precision" />
              )}
              {r4?.check && r0?.check && <Comparison q4={r4} q0={r0} />}
            </Step>

            {(r4 || r0) && (
              <section className="extras">
                <details>
                  <summary>More: 60-second heat test and raw data</summary>
                  <p className="muted">
                    Generates non-stop for a minute. A page can't read temperature, so a steady drop in speed is the
                    stand-in for a device that's heating up.
                  </p>
                  <div className="row">
                    <button className="secondary" onClick={runSustained} disabled={busy !== null}>
                      {busy === 'sustained' ? 'Running…' : 'Run 60-second test'}
                    </button>
                    <button className="secondary" onClick={copyRaw}>
                      Copy raw result (JSON)
                    </button>
                  </div>
                  {busy === 'sustained' && progress}
                  {sustained && <SustainedResult points={sustained} />}
                </details>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  )
}

function Hero() {
  return (
    <header className="hero">
      <div className="hero-inner">
        <p className="eyebrow">In-browser LLM benchmark · WebGPU</p>
        <h1>Mettle</h1>
        <p className="tagline">Test your machine's mettle.</p>
        <p className="lede">
          Runs a small language model on your own graphics chip, times it, and checks what compressing the model to
          4-bit costs in answer quality. Everything runs in your browser.
        </p>
        <div className="stats">
          <Stat value={FINDINGS.speedRatio} label="faster with 4-bit" note={`${FINDINGS.speedDevice}, ${FINDINGS.speedCi}`} />
          <Stat value={FINDINGS.accuracyDiff} label="accuracy change" note={`${FINDINGS.accuracyCi}, not significant`} />
          <Stat
            value={`${FINDINGS.formatFull} → ${FINDINGS.formatQuant}`}
            label="followed “answer only”"
            note="full precision → 4-bit"
          />
        </div>
        <p className="hero-links">
          <a href={LINKS.findings}>Read the findings</a> · <a href={LINKS.plan}>Pre-registered plan</a> ·{' '}
          <a href={LINKS.repo}>Code</a>
        </p>
      </div>
    </header>
  )
}

function Stat({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-note">{note}</span>
    </div>
  )
}

function DeviceStrip({ device }: { device: DeviceReport | null }) {
  if (!device) return <p className="muted device-strip">Checking WebGPU support…</p>
  const gpu = [device.vendor, device.architecture].filter(Boolean).join(' · ') || 'GPU not reported'
  return (
    <section className="device-strip">
      <span className="chip">
        <span className="chip-key">GPU</span> {device.webgpu ? gpu : 'none'}
      </span>
      <span className="chip">
        <span className="chip-key">Browser</span> {device.browser} · {device.os}
      </span>
      {device.webgpu && (
        <span className="chip">
          <span className="chip-key">16-bit</span> {device.hasF16 ? 'yes' : 'no, using f32 builds'}
        </span>
      )}
      {device.webgpu && /intel|amd/i.test(device.vendor) && (
        <p className="muted hint">
          Two graphics chips? Browsers often pick the weaker built-in one. On Windows: Settings → Display → Graphics →
          your browser → High performance, then reload.
        </p>
      )}
    </section>
  )
}

function NoWebGpu({ reason }: { reason?: string }) {
  return (
    <section className="step">
      <h2>This browser can't run the test</h2>
      <p className="muted">
        {reason} Try a recent Chrome, Edge or Safari on a laptop or desktop. The findings above came from the
        author's own runs and are documented in full in <a href={LINKS.findings}>the findings</a>.
      </p>
    </section>
  )
}

function Step(props: { n: number; title: string; meta: string; locked?: boolean; lockedText?: string; children: ReactNode }) {
  const { n, title, meta, locked, lockedText, children } = props
  return (
    <section className={`step${locked ? ' locked' : ''}`}>
      <div className="step-head">
        <span className="step-n">{n}</span>
        <div>
          <h2>{title}</h2>
          <p className="step-meta">{meta}</p>
        </div>
      </div>
      {locked ? <p className="muted">{lockedText}</p> : <div className="step-body">{children}</div>}
    </section>
  )
}

const PHASE_LABEL: Record<UiPhase, string> = {
  download: 'Downloading model',
  load: 'Loading onto GPU',
  warmup: 'Warming up',
  run: 'Measuring',
  sustained: 'Sustained run',
  check: 'Checking answers',
  done: 'Done',
}

function Progress(props: { phase: { phase: UiPhase; detail: string }; loadProgress: number; liveText: string }) {
  const { phase, loadProgress, liveText } = props
  const showBar = phase.phase === 'download' || phase.phase === 'load'
  return (
    <div className="progress" aria-live="polite">
      <p>
        <span className="pulse" /> <strong>{PHASE_LABEL[phase.phase]}</strong> <span className="muted">{phase.detail}</span>
      </p>
      {showBar && <progress value={loadProgress} max={1} />}
      {liveText && <pre className="live">{liveText}</pre>}
    </div>
  )
}

function InstantView({ instant }: { instant: InstantScoreResult }) {
  return (
    <div className="result">
      <p className="big">
        {fmt(instant.gflops.median, 0)}<span className="unit"> GFLOPS</span>
      </p>
      <p className="muted small">
        range {fmt(instant.gflops.min, 0)}–{fmt(instant.gflops.max, 0)} over {instant.gflops.n} samples ·{' '}
        {fmt(instant.totalMs / 1000, 1)} s ·{' '}
        {instant.verified ? (
          <span className="ok">result verified on CPU</span>
        ) : (
          <span className="bad">CPU check failed (max error {instant.maxAbsError})</span>
        )}
      </p>
    </div>
  )
}

function BuildResultView({ result }: { result: BuildResult }) {
  const { build, speed, check } = result
  return (
    <div className="result">
      <p className="result-title">{build.label}</p>
      <p className="big">
        {fmt(speed.decodeTokPerSec.median, 1)}<span className="unit"> tokens / s</span>
      </p>
      <div className="tiles">
        <Tile label="First token" value={`${fmt(speed.ttftMs.median, 0)} ms`} />
        <Tile label="Prompt reading" value={`${fmt(speed.prefillTokPerSec.median, 0)} tok/s`} />
        <Tile label="Load" value={`${fmt(speed.loadMs / 1000, 1)} s`} />
        <Tile label="Download" value={speed.cacheHit ? 'cached' : `${fmt(speed.downloadMs / 1000, 1)} s`} />
      </div>
      <details>
        <summary>All timings</summary>
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
            <SummaryRow label="Time to first token" unit="ms" s={speed.ttftMs} engine={avg(speed, 'ttftMs')} digits={0} />
            <SummaryRow label="Prompt reading" unit="tok/s" s={speed.prefillTokPerSec} engine={avg(speed, 'prefillTokPerSec')} digits={0} />
            <SummaryRow label="Generation" unit="tok/s" s={speed.decodeTokPerSec} engine={avg(speed, 'decodeTokPerSec')} digits={1} />
          </tbody>
        </table>
        <p className="muted small">
          {speed.runs[0].promptTokens} prompt tokens · {build.id} · WebLLM {speed.runtimeVersion}
        </p>
      </details>
      {check && <CheckView check={check} />}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
    </div>
  )
}

function CheckView({ check }: { check: ConsistencyResult }) {
  const mismatches = check.items.filter((i) => !i.match)
  const all = mismatches.length === 0
  return (
    <div className="check">
      <div className="check-head">
        <p>
          <strong>
            {check.matched}/{check.total}
          </strong>{' '}
          answers identical to our reference device
        </p>
        <div className="dots" role="img" aria-label={`${check.matched} of ${check.total} answers match`}>
          {check.items.map((i) => (
            <span key={i.id} className={`dot ${i.match ? 'dot-ok' : 'dot-bad'}`} title={`${i.category}: ${i.match ? 'match' : 'differs'}`} />
          ))}
        </div>
      </div>
      <p className="muted small">
        {all
          ? `Same words, token for token, as ${check.referenceDevice}.`
          : 'Different graphics chips add numbers in slightly different orders, which can tip the model toward a different word when two choices are nearly tied.'}
      </p>
      {!all && (
        <details>
          <summary>Where your device differs ({mismatches.length})</summary>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Your device</th>
                <th>Reference</th>
                <th>From token</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((i) => (
                <tr key={i.id}>
                  <td>{i.prompt.split('\n')[0].replace(/ Answer with.*$/, '')}</td>
                  <td>{i.text}</td>
                  <td>{i.referenceText}</td>
                  <td>{i.divergence === null ? 'ends differently' : i.divergence + 1}</td>
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
  const a = q4.speed.decodeTokPerSec.median
  const b = q0.speed.decodeTokPerSec.median
  const max = Math.max(a, b)
  return (
    <div className="comparison">
      <p className="result-title">What compression buys on your device</p>
      <p className="big">
        {fmt(a / b, 2)}×<span className="unit"> generation speed with 4-bit</span>
      </p>
      <div className="bars">
        <Bar label="4-bit" value={a} max={max} accent />
        <Bar label="Full precision" value={b} max={max} />
      </div>
      <p className="muted small">
        One session on your device, so expect some variation. Download is {Math.round(q0.build.downloadMB / q4.build.downloadMB)}×
        smaller with 4-bit.
      </p>
      <p className="cost">
        <strong>And what it costs:</strong> on our {FINDINGS.questions}-question test, 4-bit showed no measurable
        difference in getting the answer right ({FINDINGS.accuracyDiff}, {FINDINGS.accuracyCi}, too wide to call them
        equal), but followed “answer with only…” far less often ({FINDINGS.formatQuant} vs {FINDINGS.formatFull}). It lost{' '}
        {FINDINGS.arithmetic.replace('−', '')} on arithmetic and gained {FINDINGS.capitals.replace('+', '')} on capitals.{' '}
        <a href={LINKS.findings}>Read the findings</a>
      </p>
    </div>
  )
}

function Bar({ label, value, max, accent }: { label: string; value: number; max: number; accent?: boolean }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className={`bar-fill${accent ? ' accent' : ''}`} style={{ width: `${(100 * value) / max}%` }} />
      </span>
      <span className="bar-value">{fmt(value, 1)} tok/s</span>
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
      <Sparkline values={points.map((p) => p.decodeTokPerSec)} label="Generation speed over 60 seconds" />
      <p className="muted small">
        {fmt(first, 1)} → {fmt(last, 1)} tok/s over {points.length} runs ({change >= 0 ? '+' : ''}
        {fmt(change, 0)}%).
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer>
      <p>
        Runs entirely in your browser. Nothing leaves your device unless you choose to add a result to the open
        dataset.
      </p>
      <p>
        <a href={LINKS.repo}>GitHub</a> · <a href={LINKS.findings}>Findings</a> · <a href={LINKS.plan}>Analysis plan</a> ·{' '}
        <a href={LINKS.methodology}>Methodology</a> · Model: SmolLM2-360M-Instruct via WebLLM
      </p>
    </footer>
  )
}

function avg(speed: SpeedResult, key: 'ttftMs' | 'prefillTokPerSec' | 'decodeTokPerSec'): number | null {
  const vals = speed.runs.map((r) => r.engine?.[key]).filter((v): v is number => typeof v === 'number')
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function fmt(x: number, digits: number): string {
  return x.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
