import { useCallback, useState } from 'react'
import type { DeviceReport } from '../gpu/detect'
import type { InstantScoreResult } from '../gpu/instantScore'
import type { SpeedResult } from '../bench/harness'
import type { ConsistencyResult } from '../quality/consistency'
import { buildSubmission, leaderboardEnabled, submitResult, TURNSTILE_SITE_KEY } from './submit'
import { Turnstile } from './Turnstile'

const DEVICE_SUGGESTIONS = [
  'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4',
  'NVIDIA RTX 3060 Laptop', 'NVIDIA RTX 4060 Laptop', 'NVIDIA RTX 4070', 'NVIDIA RTX 4080 Laptop', 'NVIDIA RTX 4090',
  'AMD Radeon 780M (integrated)', 'AMD Radeon 610M (integrated)', 'Intel Iris Xe (integrated)', 'Intel Arc (integrated)',
  'Qualcomm Adreno (phone)', 'Apple A17 Pro (iPhone)',
]

type State = { kind: 'idle' } | { kind: 'open' } | { kind: 'sending' } | { kind: 'done'; id: string } | { kind: 'error'; message: string }

export function SubmitPanel(props: {
  device: DeviceReport
  instant: InstantScoreResult | null
  speed: SpeedResult
  check: ConsistencyResult
  label: string
}) {
  const { device, instant, speed, check, label } = props
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [confirmed, setConfirmed] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const onError = useCallback((e: Error) => setState({ kind: 'error', message: e.message }), [])

  if (!leaderboardEnabled) return null

  const send = async () => {
    if (!token) return
    setState({ kind: 'sending' })
    try {
      const { id } = await submitResult(buildSubmission({ device, instant, speed, check, confirmedDevice: confirmed }), token)
      setState({ kind: 'done', id })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
      setToken(null)
    }
  }

  if (state.kind === 'done') {
    return <p className="muted">Thanks! Your {label} result was added to the open dataset.</p>
  }

  return (
    <div className="submit">
      {state.kind === 'idle' ? (
        <button className="secondary" onClick={() => setState({ kind: 'open' })}>
          Add my {label} result to the open dataset
        </button>
      ) : (
        <>
          <p className="muted">
            Sends the numbers above, the 25 answer-check results, and your browser's GPU description. No names, no
            precise device ID; your IP address is only used, salted and hashed, to limit spam. The anonymised data is
            published openly.
          </p>
          <label className="field">
            <span>Confirm your graphics chip (optional, shown as self-reported)</span>
            <input
              list="mettle-devices"
              value={confirmed}
              maxLength={100}
              placeholder={[device.vendor, device.architecture].filter(Boolean).join(' ') || 'e.g. Apple M2'}
              onChange={(e) => setConfirmed(e.target.value)}
            />
            <datalist id="mettle-devices">
              {DEVICE_SUGGESTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>
          {state.kind !== 'sending' && <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setToken} onError={onError} />}
          <button onClick={send} disabled={!token || state.kind === 'sending'}>
            {state.kind === 'sending' ? 'Sending…' : 'Submit'}
          </button>
          {state.kind === 'error' && <p className="error">{state.message}</p>}
        </>
      )}
    </div>
  )
}
