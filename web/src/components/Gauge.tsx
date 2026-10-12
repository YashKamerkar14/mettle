// Speedometer for tokens per second. While `live`, the needle follows the
// running rate; afterwards it settles on the measured median. The scale only
// ever grows, so the needle never jumps backwards because the dial rescaled.

import { useState } from 'react'

const NICE = [25, 50, 100, 150, 200, 300, 500, 1000, 2000]
const START = -120
const SWEEP = 240

function niceMax(v: number): number {
  return NICE.find((n) => n >= v * 1.1) ?? NICE[NICE.length - 1]
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(cx, cy, r, from)
  const [x2, y2] = polar(cx, cy, r, to)
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

export function Gauge(props: { value: number; live?: boolean; label: string; floor?: number }) {
  const { value, live, label, floor = 50 } = props
  const needed = niceMax(Math.max(value, floor))
  const [maxSeen, setMaxSeen] = useState(needed)
  // Grow-only scale: adjust state during render (React's pattern for derived state).
  if (needed > maxSeen) setMaxSeen(needed)
  const max = Math.max(maxSeen, needed)
  const frac = Math.min(1, Math.max(0, value / max))
  const angle = START + SWEEP * frac
  const cx = 100
  const cy = 100
  // Round tick values: the smallest step that divides the scale into 3-5 parts.
  const step = [5, 10, 25, 50, 100, 250, 500].find((s) => max % s === 0 && max / s <= 5) ?? max / 4
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => (i * step) / max)

  return (
    <figure className={`gauge${live ? ' is-live' : ''}`} aria-label={`${label}: ${value.toFixed(1)} tokens per second`}>
      <svg viewBox="0 0 200 170" role="img">
        <path d={arc(cx, cy, 80, START, START + SWEEP)} className="gauge-track" />
        {frac > 0.001 && <path d={arc(cx, cy, 80, START, angle)} className="gauge-fill" />}
        {ticks.map((t) => {
          const deg = START + SWEEP * t
          const [x1, y1] = polar(cx, cy, 68, deg)
          const [x2, y2] = polar(cx, cy, 62, deg)
          const [tx, ty] = polar(cx, cy, 50, deg)
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="gauge-tick" />
              <text x={tx} y={ty + 3} className="gauge-tick-label" textAnchor="middle">
                {Math.round(max * t)}
              </text>
            </g>
          )
        })}
        <g className="gauge-needle" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1={cx} y1={cy + 10} x2={cx} y2={cy - 74} />
        </g>
        <circle cx={cx} cy={cy} r={6} className="gauge-hub" />
        <text x={cx} y={cy + 42} textAnchor="middle" className="gauge-value">
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy + 58} textAnchor="middle" className="gauge-unit">
          tokens / s{live ? ' · live' : ''}
        </text>
      </svg>
    </figure>
  )
}
