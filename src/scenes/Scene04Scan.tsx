import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { BEATS, BRAND, fmt, NUMBERS, num, sceneRange } from '../content'
import { getAnchor } from '../lib/anchors'
import { power2InOut, power2Out, power3Out } from '../lib/easing'
import { beat, lerp, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { scanSeam } from '../story'
import { SceneLayer } from '../ui/SceneLayer'
import { setPoses, Silhouette } from '../ui/Silhouette'

const B = BEATS.scan

/** Local scan time, holding a late still in reduced-motion mode. */
function scanT(p: number): number {
  const r = sceneRange('scan')
  if (useStore.getState().reducedMotion && p >= r.start && p <= r.end) return 0.97
  return remap(p, r.start, r.end)
}

/** Dimension labels and the calipers, pinned to the 3D part (portal camera). */
function Measurements() {
  const lang = useStore((s) => s.lang)
  const c = useCopy()
  const labels = useRef<Record<string, HTMLSpanElement | null>>({})
  const caliper = useRef<HTMLDivElement>(null)
  const jawTop = useRef<SVGGElement>(null)
  const jawBottom = useRef<SVGGElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const readoutNote = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const keys = ['width', 'pin', 'tab'] as const
    const anchors = Object.fromEntries(keys.map((k) => [k, getAnchor(`scan-dim-${k}`)]))
    const tab = getAnchor('scan-tab')
    const r = sceneRange('scan')
    const tick = () => {
      const p = useStore.getState().progress
      const live = p >= r.start && p <= r.end
      const t = scanT(p)
      keys.forEach((k, i) => {
        const el = labels.current[k]
        if (!el) return
        const a = anchors[k]
        const show = live ? beat(t, [B.cad[0] + 0.08 + i * 0.03, B.cad[0] + 0.12 + i * 0.03]) * (1 - beat(t, [B.mirror[0], B.mirror[0] + 0.04])) : 0
        el.style.visibility = show > 0.01 && a.visible ? 'visible' : 'hidden'
        el.style.opacity = show.toFixed(3)
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`
      })
      // Calipers close on the tab; the measured value overrides the scanned one.
      const cal = caliper.current
      if (cal) {
        const on = live ? beat(t, [B.cad[0] + 0.14, B.cad[0] + 0.18]) * (1 - beat(t, [B.mirror[0], B.mirror[0] + 0.04])) : 0
        cal.style.visibility = on > 0.01 && tab.visible ? 'visible' : 'hidden'
        cal.style.opacity = on.toFixed(3)
        cal.style.transform = `translate3d(${tab.x.toFixed(1)}px, ${tab.y.toFixed(1)}px, 0)`
        const close = power2InOut(beat(t, [B.cad[0] + 0.18, B.cad[0] + 0.26]))
        const gap = lerp(34, 8, close)
        jawTop.current?.setAttribute('transform', `translate(0 ${(-gap).toFixed(1)})`)
        jawBottom.current?.setAttribute('transform', `translate(0 ${gap.toFixed(1)})`)
        const measured = close >= 1
        const v = measured ? NUMBERS.caliper.measured : NUMBERS.caliper.scanned
        if (readout.current) readout.current.textContent = `${num(v, lang, 2)} mm`
        if (readoutNote.current) readoutNote.current.textContent = measured ? c.scan.measured : c.scan.scanned
        cal.classList.toggle('is-measured', measured)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [lang, c])

  const d = NUMBERS.dimensions
  return (
    <div className="measure" aria-hidden="true">
      <span className="dim-label mono" ref={(el) => void (labels.current.width = el)}>
        {num(d.width, lang, 1)}
      </span>
      <span className="dim-label mono" ref={(el) => void (labels.current.pin = el)}>
        Ø {num(d.pin, lang, 1)}
      </span>
      <span className="dim-label dim-label--left mono" ref={(el) => void (labels.current.tab = el)}>
        {num(d.tab, lang, 1)}
      </span>
      <div className="caliper" ref={caliper}>
        <svg viewBox="-60 -70 120 140" aria-hidden="true">
          <g ref={jawTop}>
            <path d="M-46 -14 H40 V-4 H-30 V0 H-46 Z" />
          </g>
          <g ref={jawBottom}>
            <path d="M-46 14 H40 V4 H-30 V0 H-46 Z" />
          </g>
          <rect x="-54" y="-62" width="10" height="124" rx="2" />
        </svg>
        <span className="caliper__readout mono">
          <span ref={readout}>2.07 mm</span>
          <small ref={readoutNote}>scan</small>
        </span>
      </div>
    </div>
  )
}

export default function Scene04Scan() {
  const c = useCopy()
  const lang = useStore((s) => s.lang)
  const right = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const notify = useRef<HTMLDivElement>(null)
  const luca = useRef<HTMLDivElement>(null)
  const lucaSvg = useRef<SVGSVGElement>(null)
  const steps = useRef<(HTMLLIElement | null)[]>([])
  const pts = useRef<HTMLSpanElement>(null)
  const insight = useRef<HTMLDivElement>(null)
  const mirror = useRef<HTMLParagraphElement>(null)
  const upload = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const file = useRef<HTMLDivElement>(null)

  useSceneProgress(
    'scan',
    (_t, p) => {
      const t = scanT(p)
      const mobile = useStore.getState().mobile
      // The right-hand panel follows the seam.
      const seam = scanSeam(p, mobile)
      if (right.current) right.current.style.left = `${(seam * 100).toFixed(2)}%`

      const fade = (el: HTMLElement | null, k: number, dy = 14) => {
        if (!el) return
        el.style.opacity = k.toFixed(3)
        el.style.visibility = k > 0.005 ? 'visible' : 'hidden'
        el.style.transform = `translate3d(0, ${((1 - k) * dy).toFixed(1)}px, 0)`
      }
      fade(head.current, power2Out(beat(t, [0.1, 0.18])))
      fade(notify.current, power3Out(beat(t, B.notify)) * (1 - beat(t, [B.sweep[0] + 0.03, B.sweep[0] + 0.07])), -18)
      fade(luca.current, power2Out(beat(t, B.notify)) * (1 - beat(t, [B.cad[0], B.cad[0] + 0.05])))
      const scanning = beat(t, [B.notify[1] - 0.01, B.sweep[0] + 0.01])
      setPoses(lucaSvg.current, { phone: 1 - scanning, scan: scanning })

      // Which step of the scan we are in
      const ranges = [B.sweep, [B.sweep[0] + 0.07, B.mesh[0]], B.mesh, [B.cad[0], B.mirror[0]]] as const
      steps.current.forEach((el, i) => {
        if (!el) return
        const k = beat(t, [ranges[i][0], ranges[i][0] + 0.03]) * (1 - beat(t, [B.upload[0], B.upload[0] + 0.04]))
        el.style.opacity = (k * (t < ranges[i][1] ? 1 : 0.45)).toFixed(3)
        el.classList.toggle('is-current', t >= ranges[i][0] && t < ranges[i][1])
      })
      const nPts = Math.round(NUMBERS.scanPoints[mobile ? 'mobile' : 'desktop'] * power2Out(beat(t, B.sweep)))
      if (pts.current) pts.current.textContent = `${num(nPts, lang)} ${c.scan.pointsUnit}`

      fade(insight.current, power2Out(beat(t, [B.cad[0] + 0.1, B.cad[0] + 0.16])) * (1 - beat(t, [B.mirror[0] + 0.02, B.mirror[0] + 0.06])))
      fade(mirror.current, power2Out(beat(t, [B.mirror[0] + 0.02, B.mirror[0] + 0.06])) * (1 - beat(t, [B.upload[0], B.upload[0] + 0.04])))

      const up = beat(t, [B.upload[0], B.upload[0] + 0.1])
      fade(upload.current, power2Out(beat(t, [B.upload[0], B.upload[0] + 0.03])) * (1 - beat(t, [B.upload[0] + 0.1, B.upload[0] + 0.13])))
      if (bar.current) bar.current.style.transform = `scaleX(${up.toFixed(3)})`
      if (pct.current) pct.current.textContent = `${Math.round(up * 100)}%`
      fade(file.current, power3Out(beat(t, [B.upload[0] + 0.1, B.upload[0] + 0.15])), 24)
    },
    { still: 0.97 },
    [lang, c],
  )

  return (
    <SceneLayer id="scan" className="layer--scan">
      <div ref={head} className="copy copy--bl copy--narrow scan__head">
        <h2 id="h-scan" className="display">
          {c.scan.headline}
        </h2>
      </div>

      <div ref={right} className="split-right">
        <p className="mono-label split-right__caption">{c.scan.caption}</p>

        <div ref={notify} className="notify">
          <span className="notify__app">{BRAND.name}</span>
          <span className="notify__text">{fmt(c.scan.notification, { n: NUMBERS.ownersWanting })}</span>
        </div>

        <ol className="scan-steps mono">
          {c.scan.steps.map((s, i) => (
            <li
              key={s}
              ref={(el) => {
                steps.current[i] = el
              }}
            >
              <b>{String(i + 1).padStart(2, '0')}</b> {s}
              {i === 1 && (
                <>
                  {' · '}
                  <span ref={pts} />
                </>
              )}
            </li>
          ))}
        </ol>

        <div ref={luca} className="person person--luca">
          <Silhouette who="luca" ref={lucaSvg} />
          <span className="mono-label">{c.people.luca}</span>
        </div>

        <div ref={insight} className="insight caption-card">
          <p>{c.scan.insight}</p>
        </div>

        <p ref={mirror} className="mirror-note mono">
          {c.scan.mirror}
        </p>

        <div ref={upload} className="upload mono">
          <span>
            {c.scan.uploading} <span ref={pct}>0%</span>
          </span>
          <span className="upload__track">
            <span className="upload__bar" ref={bar} />
          </span>
        </div>

        <div ref={file} className="file-card">
          <svg viewBox="0 0 24 28" aria-hidden="true">
            <path d="M3 2 H15 L21 8 V26 H3 Z M15 2 V8 H21" />
          </svg>
          <div>
            <p className="file-card__title">{c.scan.file.title}</p>
            <p className="mono">{c.scan.file.meta}</p>
            <p className="mono">{c.scan.file.material}</p>
            <p className="mono file-card__by">{c.scan.file.contributor}</p>
          </div>
        </div>
      </div>
      <Measurements />
    </SceneLayer>
  )
}
