import { useRef } from 'react'
import { BEATS, NUMBERS } from '../content'
import { power2Out } from '../lib/easing'
import { beat, lerp } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'
import { setPoses, Silhouette } from '../ui/Silhouette'

export default function Scene02Search() {
  const c = useCopy()
  const head = useRef<HTMLDivElement>(null)
  const aside = useRef<HTMLDivElement>(null)
  const days = useRef<HTMLSpanElement>(null)
  const emre = useRef<SVGSVGElement>(null)

  useSceneProgress(
    'search',
    (t) => {
      const b = BEATS.search.cards
      const span = (b[1] - b[0]) / 3
      // Days searching: 1 … 6 … 23, ticking with each failed result.
      const [d1, d2, d3] = NUMBERS.daysSearching
      let n: number = d1
      if (t >= b[0] + span) n = Math.round(lerp(d1, d2, beat(t, [b[0] + span, b[0] + span * 1.4])))
      if (t >= b[0] + span * 2) n = Math.round(lerp(d2, d3, beat(t, [b[0] + span * 2, b[0] + span * 2.8])))
      if (days.current) days.current.textContent = String(n)

      const a = power2Out(beat(t, [0.16, 0.3]))
      if (aside.current) {
        aside.current.style.opacity = a.toFixed(3)
        aside.current.style.transform = `translate3d(0, ${((1 - a) * 20).toFixed(1)}px, 0)`
      }
      // Emre slumps a little more with every dead end.
      // (a quick switch, not a long cross-fade, so the poses never ghost)
      const slump = beat(t, [b[0] + span * 1.85, b[0] + span * 2.0])
      setPoses(emre.current, { upright: 1 - slump, slumped: slump })

      const h = power2Out(beat(t, [0.78, 0.9]))
      if (head.current) {
        head.current.style.opacity = h.toFixed(3)
        head.current.style.transform = `translate3d(0, ${((1 - h) * 18).toFixed(1)}px, 0)`
      }
    },
    { still: 0.92 },
  )

  return (
    <SceneLayer id="search">
      <div ref={head} className="copy copy--tl copy--narrow search__head">
        <h2 id="h-search" className="display">
          {c.search.headline}
        </h2>
      </div>
      <div ref={aside} className="phone-aside">
        <p className="counter">
          <span className="mono-label">{c.search.daysLabel}</span>
          <span className="counter__value mono" ref={days}>
            1
          </span>
        </p>
        <div className="person">
          <Silhouette who="emre" ref={emre} />
          <span className="mono-label">{c.people.emre}</span>
        </div>
      </div>
    </SceneLayer>
  )
}
