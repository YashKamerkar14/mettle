// Dumbbell chart: accuracy per category, full precision vs 4-bit (one hue,
// two shades, validated for both themes). Each row is a hover/focus target
// with a tooltip; a legend and a table view carry the same values, so nothing
// depends on color or on hovering.

import { useState } from 'react'

export interface DumbbellRow {
  label: string
  full: number
  quant: number
  /** Accuracy a random guess would get, shown as a hairline tick. */
  chance?: number
  note?: string
}

const TICKS = [0, 25, 50, 75, 100]

export function DumbbellChart({ rows, caption }: { rows: DumbbellRow[]; caption: string }) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <figure className="dumbbell">
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="legend" aria-hidden="true">
        <span>
          <i className="swatch full" /> Full precision
        </span>
        <span>
          <i className="swatch quant" /> 4-bit
        </span>
        <span>
          <i className="swatch chance" /> Chance level
        </span>
      </div>

      <div className="db-rows" onPointerLeave={() => setActive(null)}>
        {rows.map((r, i) => {
          const diff = r.quant - r.full
          const lo = Math.min(r.full, r.quant)
          const hi = Math.max(r.full, r.quant)
          const text = `${r.label}: full precision ${r.full}%, 4-bit ${r.quant}%, ${signed(diff)} points`
          return (
            <div
              key={r.label}
              className={`db-row${active === i ? ' active' : ''}`}
              tabIndex={0}
              aria-label={text}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <span className="db-label">{r.label}</span>
              <span className="db-track">
                {TICKS.map((t) => (
                  <i key={t} className="db-grid" style={{ left: `${t}%` }} />
                ))}
                {r.chance !== undefined && <i className="db-chance" style={{ left: `${r.chance}%` }} />}
                <i className="db-bar" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                <i className="db-dot full" style={{ left: `${r.full}%` }} />
                <i className="db-dot quant" style={{ left: `${r.quant}%` }} />
                {i === 0 && (
                  <>
                    <span className="db-direct" style={{ left: `${r.full}%` }}>
                      full
                    </span>
                    <span className="db-direct" style={{ left: `${r.quant}%` }}>
                      4-bit
                    </span>
                  </>
                )}
                {active === i && (
                  <span className="db-tip" role="tooltip" style={{ left: `${(r.full + r.quant) / 2}%` }}>
                    <strong>{signed(diff)} pts</strong> with 4-bit
                    <span>
                      <i className="key quant" /> 4-bit <b>{r.quant}%</b>
                    </span>
                    <span>
                      <i className="key full" /> Full precision <b>{r.full}%</b>
                    </span>
                    {r.note && <em>{r.note}</em>}
                  </span>
                )}
              </span>
              <span className={`db-diff ${diff < 0 ? 'down' : 'up'}`}>{signed(diff)}</span>
            </div>
          )
        })}
        <div className="db-axis" aria-hidden="true">
          <span />
          <span className="db-axis-track">
            {TICKS.map((t) => (
              <span key={t} style={{ left: `${t}%` }}>
                {t}%
              </span>
            ))}
          </span>
          <span />
        </div>
      </div>

      <details className="db-table">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Full precision</th>
              <th>4-bit</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.full}%</td>
                <td>{r.quant}%</td>
                <td>{signed(r.quant - r.full)} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}
