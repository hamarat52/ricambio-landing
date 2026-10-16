import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react'
import { lerp } from '../lib/remap'

export interface CaliperHandle {
  /** Place at screen px, set jaw closure (0 open → 1 closed) and opacity. */
  set(x: number, y: number, close: number, opacity: number): void
}

/** Flat calipers silhouette that closes on a part; the readout is real text. */
export const Caliper = forwardRef<CaliperHandle, { tone?: 'light' | 'dark'; children: ReactNode }>(function Caliper(
  { tone = 'dark', children },
  ref,
) {
  const root = useRef<HTMLDivElement>(null)
  const top = useRef<SVGGElement>(null)
  const bottom = useRef<SVGGElement>(null)
  useImperativeHandle(ref, () => ({
    set(x, y, close, opacity) {
      const el = root.current
      if (!el) return
      el.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
      el.style.opacity = opacity.toFixed(3)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      const gap = lerp(34, 8, close)
      top.current?.setAttribute('transform', `translate(0 ${(-gap).toFixed(1)})`)
      bottom.current?.setAttribute('transform', `translate(0 ${gap.toFixed(1)})`)
    },
  }))
  return (
    <div className={`caliper caliper--${tone}`} ref={root}>
      <svg viewBox="-60 -70 120 140" aria-hidden="true">
        <g ref={top}>
          <path d="M-46 -14 H40 V-4 H-30 V0 H-46 Z" />
        </g>
        <g ref={bottom}>
          <path d="M-46 14 H40 V4 H-30 V0 H-46 Z" />
        </g>
        <rect x="-54" y="-62" width="10" height="124" rx="2" />
      </svg>
      {children}
    </div>
  )
})
