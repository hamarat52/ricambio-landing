import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../content'
import { useCopy, useStore } from '../store'

const LAYERS = 24

/**
 * "Layer-by-layer" loader: the wordmark prints itself one layer at a time
 * while the 3D scene initialises. It sits where the car will appear, so the
 * hero headline is visible (and readable) from the first paint.
 */
export function Loader() {
  const c = useCopy()
  const ready = useStore((s) => s.ready3D)
  const [layer, setLayer] = useState(0)
  const [gone, setGone] = useState(false)
  const readyRef = useRef(ready)
  readyRef.current = ready

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    let finishedAt = 0
    const loop = (now: number) => {
      const t = (now - t0) / 1000
      // ease toward ~85 % while waiting, then finish quickly once the scene is ready
      let p = 0.85 * (1 - Math.exp(-t * 1.4))
      if (readyRef.current) {
        if (!finishedAt) finishedAt = now
        p = Math.min(1, p + (now - finishedAt) / 450)
      }
      setLayer(Math.round(p * LAYERS))
      if (p >= 1) {
        setTimeout(() => setGone(true), 500)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (gone) return null
  const h = 120
  const printed = (layer / LAYERS) * h
  return (
    <div className={`loader ${layer >= LAYERS ? 'loader--done' : ''}`} role="status">
      <svg viewBox="0 0 640 150" className="loader__svg" aria-hidden="true">
        <defs>
          <clipPath id="loader-clip">
            <rect x="0" y={130 - printed} width="640" height={printed + 4} />
          </clipPath>
          <pattern id="loader-layers" width="8" height={h / LAYERS} patternUnits="userSpaceOnUse">
            <rect width="8" height="1" y={h / LAYERS - 1} fill="#d1d7de" opacity="0.55" />
          </pattern>
        </defs>
        <text x="8" y="126" className="loader__ghost">
          {BRAND.name}
        </text>
        <g clipPath="url(#loader-clip)">
          <text x="8" y="126" className="loader__word">
            {BRAND.name}
          </text>
          <rect x="0" y="0" width="640" height="130" fill="url(#loader-layers)" />
        </g>
        <g className="loader__nozzle" transform={`translate(0 ${126 - printed})`}>
          <line x1="0" x2="640" y1="0" y2="0" />
        </g>
      </svg>
      <p className="mono loader__caption" aria-hidden="true">
        {c.ui.loading} {String(layer).padStart(2, '0')}/{LAYERS}
      </p>
      <span className="visually-hidden">{c.ui.loading}…</span>
    </div>
  )
}
