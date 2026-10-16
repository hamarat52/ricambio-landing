import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, sceneRange } from '../content'
import { getAnchor } from '../lib/anchors'
import { popOut, power2InOut, power2Out } from '../lib/easing'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore, storyProgress } from '../store'
import { HandArrow } from '../ui/HandArrow'
import { SceneLayer } from '../ui/SceneLayer'
import { setPoses, Silhouette } from '../ui/Silhouette'

const B = BEATS.sparkle

export default function Scene05Sparkle() {
  const c = useCopy()
  const word = useRef<HTMLDivElement>(null)
  const aside = useRef<HTMLDivElement>(null)
  const emre = useRef<SVGSVGElement>(null)
  const arrow = useRef<SVGSVGElement>(null)

  useSceneProgress(
    'sparkle',
    (t) => {
      const w = beat(t, [B.burst[0], B.burst[0] + 0.08])
      if (word.current) {
        word.current.style.opacity = w.toFixed(3)
        word.current.style.transform = `scale(${(0.7 + 0.3 * popOut(w)).toFixed(3)})`
      }
      const a = power2Out(beat(t, [0.12, 0.25]))
      if (aside.current) aside.current.style.opacity = a.toFixed(3)
      const up = beat(t, [B.burst[0], B.burst[0] + 0.04])
      setPoses(emre.current, { slumped: 1 - up, armsUp: up })
      arrow.current?.style.setProperty('--draw', power2InOut(beat(t, [B.tap[0], B.tap[0] + 0.08])).toFixed(3))
    },
    { still: 0.9 },
  )

  // The arrow's tip follows the "Order a print" button on the phone.
  useEffect(() => {
    const target = getAnchor('order-btn')
    const r = sceneRange('sparkle')
    const tick = () => {
      const el = arrow.current
      if (!el) return
      const p = storyProgress()
      const t = remap(p, r.start, r.end)
      const show = target.visible && p >= r.start && p <= r.end && (t >= B.tap[0] || useStore.getState().reducedMotion)
      el.style.visibility = show ? 'visible' : 'hidden'
      if (!show) return
      const w = el.clientWidth
      // tip of the "curveDown" arrow sits at (117, 128) in its 160 × 140 viewBox
      const x = target.x - w * (117 / 160) - 6
      const y = target.y - w * (128 / 160)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <SceneLayer id="sparkle">
      <div ref={word} className="copy copy--bl caption-card sparkle__card">
        <h2 id="h-sparkle" className="display display--word">
          {c.sparkle.headline}
        </h2>
      </div>
      <div ref={aside} className="phone-aside">
        <div className="person">
          <Silhouette who="emre" ref={emre} />
          <span className="mono-label">{c.people.emre}</span>
        </div>
      </div>
      <HandArrow name="curveDown" ref={arrow} className="order-arrow" />
    </SceneLayer>
  )
}
