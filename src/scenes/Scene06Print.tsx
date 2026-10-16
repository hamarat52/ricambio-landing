import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, fmt, NUMBERS, sceneRange } from '../content'
import { getAnchor } from '../lib/anchors'
import { popOut, power2InOut, power2Out } from '../lib/easing'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { printProgress } from '../story'
import { Caliper, type CaliperHandle } from '../ui/Caliper'
import { SceneLayer } from '../ui/SceneLayer'

const B = BEATS.print

function printT(p: number) {
  const r = sceneRange('print')
  if (useStore.getState().reducedMotion && p >= r.start && p <= r.end) return 0.97
  return remap(p, r.start, r.end)
}

export default function Scene06Print() {
  const c = useCopy()
  const checks = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLLIElement | null)[]>([])
  const ticks = useRef<(SVGPathElement | null)[]>([])
  const foot = useRef<HTMLParagraphElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const steps = useRef<(HTMLLIElement | null)[]>([])
  const timer = useRef<HTMLSpanElement>(null)
  const caliper = useRef<CaliperHandle>(null)
  const tol = useRef<HTMLSpanElement>(null)

  useSceneProgress(
    'print',
    (_t, p) => {
      const t = printT(p)
      const checksOut = beat(t, [0.3, 0.35])
      if (checks.current) {
        checks.current.style.opacity = (1 - checksOut).toFixed(3)
        checks.current.style.visibility = checksOut < 1 ? 'visible' : 'hidden'
      }
      cards.current.forEach((el, i) => {
        if (!el) return
        const a = popOut(beat(t, [0.02 + i * 0.07, 0.06 + i * 0.07]))
        el.style.opacity = Math.min(1, a).toFixed(3)
        el.style.transform = `translate3d(${((1 - a) * -24).toFixed(1)}px, 0, 0)`
        const tk = power2InOut(beat(t, [0.05 + i * 0.07, 0.09 + i * 0.07]))
        ticks.current[i]?.style.setProperty('stroke-dashoffset', (1 - tk).toFixed(3))
        el.classList.toggle('is-ok', tk >= 1)
      })
      if (foot.current) foot.current.style.opacity = power2Out(beat(t, [0.22, 0.26])).toFixed(3)

      const h = power2Out(beat(t, [0.34, 0.42]))
      if (head.current) {
        head.current.style.opacity = h.toFixed(3)
        head.current.style.transform = `translate3d(0, ${((1 - h) * 18).toFixed(1)}px, 0)`
      }

      // Queue → Slice → Print → Finish → Check
      const s = power2Out(beat(t, [0.24, 0.3]))
      if (strip.current) {
        strip.current.style.opacity = s.toFixed(3)
        strip.current.style.visibility = s > 0 ? 'visible' : 'hidden'
      }
      const bounds = [0.24, 0.3, B.layers[0], B.layers[1], B.finish[0] + 0.1, 1.01]
      steps.current.forEach((el, i) => {
        if (!el) return
        el.classList.toggle('is-active', t >= bounds[i] && t < bounds[i + 1])
        el.classList.toggle('is-done', t >= bounds[i + 1])
      })
      const left = Math.round(NUMBERS.printMinutes * (1 - printProgress(p)))
      if (timer.current) {
        timer.current.textContent = `${fmt(c.print.set, { n: NUMBERS.printSet })} · ${Math.floor(left / 60)}${c.print.hours} ${String(left % 60).padStart(2, '0')}${c.print.minutes}`
      }
    },
    { still: 0.97 },
    [c],
  )

  // Calipers on the first printed clip's tab, then the tolerance label.
  useEffect(() => {
    const tab = getAnchor('shop-tab')
    const r = sceneRange('print')
    const tick = () => {
      const p = useStore.getState().progress
      const live = p >= r.start && p <= r.end
      const fin = beat(printT(p), B.finish)
      const on = live && tab.visible ? beat(fin, [0.5, 0.6]) : 0
      const close = power2InOut(beat(fin, [0.58, 0.78]))
      caliper.current?.set(tab.x, tab.y, close, on)
      tol.current?.classList.toggle('is-on', close >= 1)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <SceneLayer id="print">
      <div ref={checks} className="checks">
        <p className="mono-label">{c.print.checksTitle}</p>
        <ol className="checks__list">
          {c.print.checks.map((ck, i) => (
            <li
              key={ck.title}
              className="check-card"
              ref={(el) => {
                cards.current[i] = el
              }}
            >
              <svg className="check-card__tick" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="11" />
                <path
                  ref={(el) => {
                    ticks.current[i] = el
                  }}
                  d="M6.5 12.5 L10.5 16.2 L17.8 8.2"
                  pathLength={1}
                />
              </svg>
              <div>
                <p className="check-card__title">{ck.title}</p>
                <p className="check-card__body">{ck.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p ref={foot} className="checks__foot">
          {c.print.footnote}
        </p>
      </div>

      <div ref={strip} className="pipeline mono">
        <ol>
          {c.print.pipeline.map((s, i) => (
            <li
              key={s}
              ref={(el) => {
                steps.current[i] = el
              }}
            >
              {s}
            </li>
          ))}
        </ol>
        <span ref={timer} className="pipeline__timer" />
      </div>

      <div ref={head} className="copy copy--bl copy--narrow caption-card print__head">
        <h2 id="h-print" className="display">
          {c.print.headline}
        </h2>
      </div>

      <div className="measure" aria-hidden="true">
        <Caliper ref={caliper} tone="dark">
          <span className="tolerance mono" ref={tol}>
            {c.print.tolerance}
          </span>
        </Caliper>
      </div>
    </SceneLayer>
  )
}
