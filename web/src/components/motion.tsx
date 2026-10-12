// Small motion helpers: numbers that count up, and sections that fade in when
// scrolled into view. Both do nothing for visitors who prefer reduced motion.

import { useEffect, useRef, useState, type ReactNode } from 'react'

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const [reduced] = useState(reducedMotion)
  const [animated, setShown] = useState(0)
  const from = useRef(0)
  const shown = reduced ? value : animated

  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      const v = a + (value - a) * eased
      setShown(v)
      from.current = v
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])

  const text = shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <>{text.replace('-', '−')}</>
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(() => reducedMotion() || typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (shown || !ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [shown])

  return (
    <div ref={ref} className={`reveal${shown ? ' in' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
