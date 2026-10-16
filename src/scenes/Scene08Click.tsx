import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, fmt, NUMBERS, sceneRange } from '../content'
import { getAnchor } from '../lib/anchors'
import { power2InOut, power2Out } from '../lib/easing'
import { beat, lerp, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { storyProgress, useCopy } from '../store'
import { CONTACT_T } from '../story'
import { SceneLayer } from '../ui/SceneLayer'

const B = BEATS.click
/** Demo fit counts for the other two files in the ranking. */
const OTHERS = [9, 4]

/** Emre's hand (flat silhouette) guiding the new clip into the slot. */
function Hand() {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const a = getAnchor('vent-newclip')
    const r = sceneRange('click')
    const tick = () => {
      const h = el.current
      if (!h) return
      const p = storyProgress()
      const t = remap(p, r.start, r.end)
      const live = p >= r.start && p <= r.end
      const on = live ? Math.min(beat(t, [B.descend[1], B.insert[0] + 0.02]), 1 - beat(t, [CONTACT_T + 0.02, CONTACT_T + 0.07])) : 0
      h.style.visibility = on > 0.01 && a.visible ? 'visible' : 'hidden'
      h.style.opacity = on.toFixed(3)
      const back = beat(t, [CONTACT_T + 0.02, CONTACT_T + 0.07]) * 60
      h.style.transform = `translate3d(${a.x.toFixed(1)}px, ${(a.y + back).toFixed(1)}px, 0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="hand" ref={el} aria-hidden="true">
      <svg viewBox="0 0 220 200">
        {/* thumb and index pinching from below-right */}
        <path d="M30 40 C 44 30, 70 34, 84 52 L 120 96 C 132 112, 150 122, 176 126 L 220 132 L 220 200 L 120 200 C 96 186, 80 160, 70 136 L 40 82 C 30 66, 22 50, 30 40 Z" />
        <path d="M62 96 C 74 92, 92 100, 100 112 L 126 148 C 132 158, 124 168, 112 164 L 66 132 C 54 124, 50 102, 62 96 Z" />
      </svg>
    </div>
  )
}

export default function Scene08Click() {
  const c = useCopy()
  const head = useRef<HTMLDivElement>(null)
  const rank = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const counts = useRef<(HTMLSpanElement | null)[]>([])
  const badge = useRef<HTMLSpanElement>(null)

  useSceneProgress(
    'click',
    (t) => {
      const net = beat(t, B.network)
      const a = power2Out(beat(t, [B.network[0] - 0.04, B.network[0] + 0.03]))
      if (rank.current) {
        rank.current.style.opacity = a.toFixed(3)
        rank.current.style.transform = `translate3d(0, ${((1 - a) * 18).toFixed(1)}px, 0)`
      }
      // Fit confirmed by 1 → 14 owners; the file climbs from #3 to #1.
      const fc = NUMBERS.fitConfirmed
      const n = Math.round(lerp(fc.first, fc.afterEmre, power2InOut(beat(net, [0.05, 0.75]))))
      if (badge.current) badge.current.textContent = fmt(n === 1 ? c.click.badgeOne : c.click.badgeMany, { n })
      if (counts.current[0]) counts.current[0].textContent = String(n)
      const climb = power2InOut(beat(net, [0.3, 0.8]))
      // our row: index 0 in the DOM, slides from slot 2 to slot 0
      const slot = (i: number) => {
        if (i === 0) return lerp(2, 0, climb)
        if (i === 1) return lerp(0, 1, beat(climb, [0.0, 0.6]))
        return lerp(1, 2, beat(climb, [0.4, 1.0]))
      }
      rows.current.forEach((row, i) => {
        if (!row) return
        row.style.transform = `translateY(${(slot(i) * 100).toFixed(1)}%)`
        const rankEl = row.querySelector<HTMLElement>('.rank__n')
        if (rankEl) rankEl.textContent = `#${Math.round(slot(i)) + 1}`
      })
      const h = power2Out(beat(t, [B.network[0] + 0.02, B.network[0] + 0.1]))
      if (head.current) {
        head.current.style.opacity = h.toFixed(3)
        head.current.style.transform = `translate3d(0, ${((1 - h) * 18).toFixed(1)}px, 0)`
      }
    },
    { still: 1 },
    [c],
  )

  return (
    <SceneLayer id="click">
      <Hand />
      <div ref={head} className="copy copy--bl copy--narrow caption-card click__head">
        <h2 id="h-click" className="display">
          {c.click.headline}
        </h2>
      </div>
      <div ref={rank} className="phone-aside rank-card">
        <span className="badge badge--teal" ref={badge}>
          {fmt(c.click.badgeOne, { n: 1 })}
        </span>
        <div className="rank">
          <p className="mono-label">{c.click.rankingTitle}</p>
          <ol className="rank__list">
            {c.click.ranking.map((name, i) => (
              <li
                key={name}
                className={`rank__row ${i === 0 ? 'rank__row--ours' : ''}`}
                ref={(el) => {
                  rows.current[i] = el
                }}
              >
                <span className="rank__n mono">#{i + 1}</span>
                <span className="rank__name">{name}</span>
                <span
                  className="rank__count mono"
                  ref={(el) => {
                    counts.current[i] = el
                  }}
                >
                  {i === 0 ? 1 : OTHERS[i - 1]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SceneLayer>
  )
}
