// Small summary statistics for benchmark samples. Quantiles use linear
// interpolation between order statistics (the same as numpy's default).

export interface Summary {
  n: number
  median: number
  min: number
  max: number
  q1: number
  q3: number
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) throw new Error('quantile of empty sample')
  if (q < 0 || q > 1) throw new Error(`quantile out of range: ${q}`)
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function median(values: number[]): number {
  return quantile(values, 0.5)
}

export function summarize(values: number[]): Summary {
  return {
    n: values.length,
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
  }
}

/** Spread as a fraction of the median: (max - min) / median. */
export function relativeSpread(s: Summary): number {
  return s.median === 0 ? 0 : (s.max - s.min) / s.median
}
