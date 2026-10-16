import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, fmt, LIBRARY_PARTS, NUMBERS, num, sceneRange } from '../content'
import { getAnchor, libraryHover } from '../lib/anchors'
import { power2InOut, power2Out } from '../lib/easing'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore, storyProgress } from '../store'
import { HandArrow } from '../ui/HandArrow'
import { SceneLayer } from '../ui/SceneLayer'

const B = BEATS.library

/** Simple line icons for the parts we never print. */
const NEVER_ICONS = [
  // brakes: disc
  'M12 3a9 9 0 1 0 0.01 0 M12 9a3 3 0 1 0 0.01 0 M12 5.2v0.1 M18.4 9.6v0.1 M16 17.6v0.1 M8 17.6v0.1 M5.6 9.6v0.1',
  // steering wheel
  'M12 3a9 9 0 1 0 0.01 0 M12 9.6a2.4 2.4 0 1 0 0.01 0 M3.4 11 L9.6 12 M14.4 12 L20.6 11 M12 14.4 V21',
  // suspension: coil spring
  'M6 3 H18 M6 21 H18 M8 5 L16 7 L8 9 L16 11 L8 13 L16 15 L8 17 L16 19',
  // seat belt: buckle
  'M4 9 H14 V15 H4 Z M14 10.5 H20 V13.5 H14 M7 3 L10 9 M7 21 L10 15',
  // airbag
  'M5 14 C 3 9, 8 4, 12 6 C 16 3, 22 8, 19 13 C 21 18, 14 21, 12 18 C 8 21, 3 18, 5 14 Z',
  // fuel system: pump
  'M5 21 V5 C 5 4, 6 3, 7 3 H13 C 14 3, 15 4, 15 5 V21 Z M7 7 H13 V11 H7 Z M15 9 H18 L20 11 V17 C 20 18.5, 18 18.5, 18 17 V13',
]

function PartLabels() {
  const c = useCopy()
  const lang = useStore((s) => s.lang)
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const fitRefs = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    const anchors = LIBRARY_PARTS.map((_, i) => getAnchor(`lib-${i}`))
    const r = sceneRange('library')
    const tick = () => {
      const p = storyProgress()
      const t = remap(p, r.start, r.end)
      const on = p >= r.start && p <= r.end ? power2Out(beat(t, [0.2, 0.32])) : 0
      refs.current.forEach((el, i) => {
        if (!el) return
        const a = anchors[i]
        const show = on > 0.01 && a.visible
        el.style.visibility = show ? 'visible' : 'hidden'
        if (!show) return
        el.style.opacity = on.toFixed(3)
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${(a.y - 18).toFixed(1)}px, 0)`
        const hov = libraryHover.named === i
        el.classList.toggle('is-hover', hov)
        const f = fitRefs.current[i]
        if (f) f.style.display = hov ? 'block' : 'none'
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="part-labels" aria-hidden="true">
      {LIBRARY_PARTS.map((part, i) => (
        <span
          key={part.key}
          className="part-label mono"
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          {part.model} · {c.library.parts[part.key]}
          <span
            className="part-label__fit"
            ref={(el) => {
              fitRefs.current[i] = el
            }}
          >
            {fmt(c.library.fitCount, { n: num(part.fits, lang) })}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function Scene10Library() {
  const c = useCopy()
  const lang = useStore((s) => s.lang)
  const head = useRef<HTMLDivElement>(null)
  const sources = useRef<HTMLDivElement>(null)
  const arrows = useRef<(SVGSVGElement | null)[]>([])
  const never = useRef<HTMLDivElement>(null)
  const strikes = useRef<(SVGPathElement | null)[]>([])
  const counters = useRef<HTMLDivElement>(null)
  const values = useRef<(HTMLSpanElement | null)[]>([])

  useSceneProgress(
    'library',
    (t) => {
      const fade = (el: HTMLElement | null, k: number, dy = 16) => {
        if (!el) return
        el.style.opacity = k.toFixed(3)
        el.style.visibility = k > 0.005 ? 'visible' : 'hidden'
        el.style.transform = `translate3d(0, ${((1 - k) * dy).toFixed(1)}px, 0)`
      }
      fade(head.current, power2Out(beat(t, [0.12, 0.24])))
      fade(sources.current, power2Out(beat(t, [B.sources[0], B.sources[0] + 0.06])) * (1 - beat(t, [B.never[0] - 0.02, B.never[0] + 0.02])))
      arrows.current.forEach((a, i) => a?.style.setProperty('--draw', power2InOut(beat(t, [B.sources[0] + 0.04 + i * 0.04, B.sources[0] + 0.12 + i * 0.04])).toFixed(3)))
      fade(never.current, power2Out(beat(t, [B.never[0], B.never[0] + 0.05])) * (1 - beat(t, [B.counters[0] - 0.02, B.counters[0] + 0.02])))
      strikes.current.forEach((s, i) => s?.style.setProperty('stroke-dashoffset', (1 - power2InOut(beat(t, [B.never[0] + 0.04 + i * 0.015, B.never[0] + 0.08 + i * 0.015]))).toFixed(3)))
      fade(counters.current, power2Out(beat(t, [B.counters[0], B.counters[0] + 0.05])))
      const k = power2InOut(beat(t, [B.counters[0], B.counters[1] - 0.02]))
      const d = NUMBERS.demo
      ;[d.partsInLibrary, d.modelsCovered, d.fitConfirmations].forEach((v, i) => {
        const el = values.current[i]
        if (el) el.textContent = num(Math.round(v * k), lang)
      })
    },
    { still: 0.97 },
    [lang],
  )

  return (
    <SceneLayer id="library">
      <div ref={head} className="copy copy--tl copy--narrow library__head">
        <h2 id="h-library" className="display">
          {c.library.headline}
        </h2>
      </div>
      <PartLabels />

      <div ref={sources} className="sources" id="sources-panel">
        <p className="mono-label">{c.library.sourcesTitle}</p>
        <ol className="sources__list">
          {c.library.sources.map((s, i) => (
            <li key={s.title} className="source-card">
              <span className="source-card__n mono">0{i + 1}</span>
              <p className="source-card__title">{s.title}</p>
              <p className="source-card__body">{s.body}</p>
              <HandArrow
                name="curveLeft"
                className="source-card__arrow"
                ref={(el) => {
                  arrows.current[i] = el
                }}
              />
            </li>
          ))}
        </ol>
      </div>

      <div ref={never} className="never">
        <p className="never__title">{c.library.neverTitle}</p>
        <ul className="never__list">
          {c.library.never.map((label, i) => (
            <li key={label}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={NEVER_ICONS[i]} />
                <path
                  className="never__strike"
                  d="M3 21 L21 3"
                  pathLength={1}
                  ref={(el) => {
                    strikes.current[i] = el
                  }}
                />
              </svg>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <p className="never__caption">{c.library.neverCaption}</p>
      </div>

      <div ref={counters} className="counters">
        {c.library.counters.map((label, i) => (
          <p key={label} className="counter">
            <span
              className="counter__value mono"
              ref={(el) => {
                values.current[i] = el
              }}
            >
              0
            </span>
            <span className="mono-label">{label}</span>
          </p>
        ))}
        <span className="demo-tag mono">{c.ui.demo}</span>
      </div>
    </SceneLayer>
  )
}
