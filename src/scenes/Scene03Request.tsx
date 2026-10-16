import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, fmt, NUMBERS, sceneRange, WANTING_CITIES } from '../content'
import { getAnchor } from '../lib/anchors'
import { power2Out } from '../lib/easing'
import { owners } from '../lib/geo'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

/** "+1" labels that follow named cities on the 3D map. */
function CityLabels() {
  const c = useCopy()
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    const list = owners()
    const times = WANTING_CITIES.map((city) => list.find((o) => o.city === city.key)?.t ?? 1)
    const anchors = WANTING_CITIES.map((city) => getAnchor(`city-${city.key}`))
    const r = sceneRange('request')
    const tick = () => {
      const { progress: p, reducedMotion } = useStore.getState()
      const live = p >= r.start && p <= r.end + 0.004
      const t = reducedMotion && live ? 1 : remap(p, r.start, r.end)
      refs.current.forEach((el, i) => {
        if (!el) return
        const a = anchors[i]
        const k = live ? beat(t, [times[i], times[i] + 0.03]) : 0
        if (k <= 0 || !a.visible) {
          el.style.visibility = 'hidden'
          return
        }
        el.style.visibility = 'visible'
        el.style.opacity = power2Out(k).toFixed(3)
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${(a.y - 8 - 10 * power2Out(k)).toFixed(1)}px, 0)`
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <div className="city-labels" aria-hidden="true">
      {WANTING_CITIES.map((city, i) => (
        <span
          key={city.key}
          className="city-label mono"
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <b>+1</b> {c.cities[city.key]}
        </span>
      ))}
    </div>
  )
}

export default function Scene03Request() {
  const c = useCopy()
  const head = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLParagraphElement>(null)
  const countValue = useRef<HTMLSpanElement>(null)

  useSceneProgress(
    'request',
    (t) => {
      // Owners counter: Emre once the beacon lands, then one per pop.
      const landed = t >= BEATS.request.beacon[1]
      const n = landed ? 1 + owners().filter((o) => o.t <= t).length : 0
      const shown = Math.min(NUMBERS.ownersWanting, n)
      if (countValue.current) countValue.current.textContent = fmt(c.request.wantCounter, { n: shown })
      const a = power2Out(beat(t, [BEATS.request.beacon[1] - 0.02, BEATS.request.beacon[1] + 0.06]))
      if (count.current) {
        count.current.style.opacity = a.toFixed(3)
        count.current.style.transform = `translate3d(0, ${((1 - a) * 16).toFixed(1)}px, 0)`
      }
      const h = power2Out(beat(t, [0.6, 0.72]))
      if (head.current) {
        head.current.style.opacity = h.toFixed(3)
        head.current.style.transform = `translate3d(0, ${((1 - h) * 18).toFixed(1)}px, 0)`
      }
    },
    { still: 0.97 },
    [c],
  )

  return (
    <SceneLayer id="request">
      <div ref={head} className="copy copy--bl copy--narrow">
        <h2 id="h-request" className="display">
          {c.request.headline}
        </h2>
      </div>
      <p ref={count} className="owners-count" aria-live="off">
        <span className="owners-count__value mono" ref={countValue}>
          {fmt(c.request.wantCounter, { n: NUMBERS.ownersWanting })}
        </span>
      </p>
      <CityLabels />
    </SceneLayer>
  )
}
