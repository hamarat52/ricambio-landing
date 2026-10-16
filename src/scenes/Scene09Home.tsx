import { useRef } from 'react'
import { BEATS, fmt, NUMBERS, sceneRange } from '../content'
import { power2Out, power3Out } from '../lib/easing'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { homeSeam } from '../story'
import { SceneLayer } from '../ui/SceneLayer'
import { setPoses, Silhouette } from '../ui/Silhouette'

const B = BEATS.home

function homeT(p: number) {
  const r = sceneRange('home')
  if (useStore.getState().reducedMotion && p >= r.start && p <= r.end) return 0.95
  return remap(p, r.start, r.end)
}

/** Mini diagram: the clip printed upright, supports under the tab. */
function OrientationDiagram() {
  return (
    <svg className="orient" viewBox="0 0 120 56" aria-hidden="true">
      <path className="orient__bed" d="M4 50 H116" />
      <path className="orient__part" d="M40 50 V20 H70 V27 H66 L64 25 H46 V43 H64 L66 41 H70 V50 Z M46 20 V14 H58 V20" />
      <path className="orient__tab" d="M40 33 H30 V37 H40" />
      <path className="orient__support" d="M31 38 V50 M34 38 V50 M37 38 V50 M48 43 V27 M52 43 V27 M56 43 V27 M60 43 V27" />
      <path className="orient__arrow" d="M92 44 V14 M86 20 L92 12 L98 20" />
    </svg>
  )
}

export default function Scene09Home() {
  const c = useCopy()
  const right = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const laptop = useRef<HTMLDivElement>(null)
  const dl = useRef<HTMLDivElement>(null)
  const settings = useRef<HTMLDivElement>(null)
  const selin = useRef<HTMLDivElement>(null)
  const selinSvg = useRef<SVGSVGElement>(null)
  const fits = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLSpanElement>(null)

  useSceneProgress(
    'home',
    (_t, p) => {
      const t = homeT(p)
      const seam = homeSeam(p, useStore.getState().mobile)
      if (right.current) right.current.style.left = `${(seam * 100).toFixed(2)}%`
      const fade = (el: HTMLElement | null, k: number, dy = 14) => {
        if (!el) return
        el.style.opacity = k.toFixed(3)
        el.style.visibility = k > 0.005 ? 'visible' : 'hidden'
        el.style.transform = `translate3d(0, ${((1 - k) * dy).toFixed(1)}px, 0)`
      }
      fade(head.current, power2Out(beat(t, [0.1, 0.2])))
      fade(laptop.current, power3Out(beat(t, [B.download[0] - 0.04, B.download[0] + 0.04])) * (1 - beat(t, [B.print[0], B.print[0] + 0.06])))
      dl.current?.classList.toggle('is-done', t >= B.download[0] + 0.1)
      fade(settings.current, power3Out(beat(t, [B.download[0] + 0.14, B.download[0] + 0.2])) * (1 - beat(t, [B.fits[0], B.fits[0] + 0.05])), 22)
      fade(selin.current, power2Out(beat(t, [B.seam[1], B.seam[1] + 0.06])))
      const cheer = beat(t, [B.fits[0] + 0.04, B.fits[0] + 0.08])
      setPoses(selinSvg.current, { laptop: 1 - cheer, cheer })
      fade(fits.current, power3Out(beat(t, [B.fits[0], B.fits[0] + 0.06])))
      const n = t >= B.fits[0] + 0.06 ? NUMBERS.fitConfirmed.afterSelin : NUMBERS.fitConfirmed.afterEmre
      if (badge.current) badge.current.textContent = fmt(c.click.badgeMany, { n })
    },
    { still: 0.95 },
    [c],
  )

  return (
    <SceneLayer id="home">
      <div ref={head} className="copy copy--bl copy--narrow caption-card home__head">
        <h2 id="h-home" className="display">
          {c.home.headline}
        </h2>
      </div>
      <div ref={right} className="split-right split-right--light">
        <p className="mono-label split-right__caption">{c.home.caption}</p>

        <div ref={laptop} className="laptop" aria-hidden="true">
          <div className="laptop__screen">
            <p className="laptop__title">{c.scan.file.title}</p>
            <p className="mono laptop__meta">{c.scan.file.meta}</p>
            <div className="laptop__dl" ref={dl}>
              <span className="laptop__dl-label">{c.sparkle.download}</span>
              <span className="laptop__dl-done mono">
                ✓ {c.home.downloaded} · {c.home.fileName}
              </span>
            </div>
          </div>
          <div className="laptop__base" />
        </div>

        <div ref={settings} className="settings-card">
          <p className="mono-label">{c.home.settingsTitle}</p>
          <dl>
            {c.home.settings.map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd className="mono">{v}</dd>
              </div>
            ))}
          </dl>
          <OrientationDiagram />
          <p className="mono settings-card__orient">{c.home.orientation}</p>
        </div>

        <div ref={selin} className="person person--selin">
          <Silhouette who="selin" ref={selinSvg} />
          <span className="mono-label">{c.people.selin}</span>
        </div>

        <div ref={fits} className="home-fits">
          <span className="fit-chip">✓ {c.click.options[0]}</span>
          <span className="badge-pill" ref={badge}>
            {fmt(c.click.badgeMany, { n: NUMBERS.fitConfirmed.afterSelin })}
          </span>
        </div>
      </div>
    </SceneLayer>
  )
}
