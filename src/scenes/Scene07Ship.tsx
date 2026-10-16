import { useRef } from 'react'
import { BEATS, NUMBERS } from '../content'
import { power2Out } from '../lib/easing'
import { beat } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene07Ship() {
  const c = useCopy()
  const head = useRef<HTMLDivElement>(null)
  const days = useRef<HTMLParagraphElement>(null)
  const dayValue = useRef<HTMLSpanElement>(null)

  useSceneProgress(
    'ship',
    (t) => {
      const tr = BEATS.ship.travel
      const d = beat(t, [tr[0] + 0.05, tr[1] - 0.08])
      const n = Math.max(1, Math.min(NUMBERS.shipDays, 1 + Math.floor(d * NUMBERS.shipDays)))
      if (dayValue.current) dayValue.current.textContent = String(n)
      const a = power2Out(beat(t, [tr[0], tr[0] + 0.08]))
      if (days.current) {
        days.current.style.opacity = a.toFixed(3)
        days.current.style.transform = `translate3d(0, ${((1 - a) * 16).toFixed(1)}px, 0)`
      }
      const h = power2Out(beat(t, [0.82, 0.92]))
      if (head.current) {
        head.current.style.opacity = h.toFixed(3)
        head.current.style.transform = `translate3d(0, ${((1 - h) * 18).toFixed(1)}px, 0)`
      }
    },
    { still: 0.95 },
  )

  return (
    <SceneLayer id="ship">
      <p ref={days} className="counter ship__days">
        <span className="mono-label">{c.ship.day}</span>
        <span className="counter__value mono" ref={dayValue}>
          1
        </span>
      </p>
      <div ref={head} className="copy copy--bl copy--narrow">
        <h2 id="h-ship" className="display">
          {c.ship.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
