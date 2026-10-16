import { useRef } from 'react'
import { BEATS, BRAND, sceneRange } from '../content'
import { getAnchor } from '../lib/anchors'
import { popOut, power2InOut, power2Out, power3Out } from '../lib/easing'
import { beat, clamp01, lerp, remap } from '../lib/remap'
import { useProgressEffect } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { offsetIn, StatusBar, thumb } from './Phone'
import { Strike } from './Strike'

/** Screen visibility from global progress: fades in at a, out at b. */
function screenOn(p: number, a: number, b: number, fade = 0.004): number {
  return Math.min(remap(p, a, a + fade), 1 - remap(p, b - fade, b))
}

function local(p: number, id: 'search' | 'request') {
  const r = sceneRange(id)
  const t = remap(p, r.start, r.end)
  if (useStore.getState().reducedMotion && p >= r.start && p <= r.end) return id === 'search' ? 0.9 : 0.97
  return t
}

const ICONS = [
  // dealer: a building
  'M4 20 V9 L12 4 L20 9 V20 Z M9 20 V14 H15 V20',
  // online shop: a cart
  'M3 5 H6 L8 15 H18 L20 8 H7 M9 19 a1.4 1.4 0 1 0 0.01 0 M17 19 a1.4 1.4 0 1 0 0.01 0',
  // marketplace: a tag
  'M4 12 L12 4 H20 V12 L12 20 Z M16 8 a1.2 1.2 0 1 0 0.01 0',
]

/** Scene 02: three results, each struck through with a red marker. */
export function SearchScreen() {
  const c = useCopy()
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLLIElement | null)[]>([])
  const strikes = useRef<(SVGSVGElement | null)[]>([])

  useProgressEffect((p) => {
    const el = root.current
    if (!el) return
    const on = screenOn(p, sceneRange('search').start, sceneRange('request').start + 0.004)
    el.style.opacity = on.toFixed(3)
    el.style.visibility = on > 0 ? 'visible' : 'hidden'
    if (on <= 0) return
    const t = local(p, 'search')
    const b = BEATS.search.cards
    const span = (b[1] - b[0]) / 3
    cards.current.forEach((card, i) => {
      if (!card) return
      const a = power3Out(beat(t, [b[0] + i * span, b[0] + i * span + span * 0.35]))
      card.style.opacity = a.toFixed(3)
      card.style.transform = `translate3d(0, ${((1 - a) * 40).toFixed(1)}%, 0)`
      const s = strikes.current[i]
      const draw = power2InOut(beat(t, [b[0] + i * span + span * 0.45, b[0] + i * span + span * 0.85]))
      if (s) s.style.setProperty('--draw', draw.toFixed(3))
      card.classList.toggle('is-struck', draw > 0.98)
    })

    // Thumb: rests low on the screen and flicks up as each result loads.
    const phone = el.closest<HTMLElement>('.phone')
    if (phone && useStore.getState().scene === 'search') {
      const w = phone.offsetWidth
      const h = phone.offsetHeight
      let flick = 0
      for (let i = 0; i < 3; i++) {
        const k = beat(t, [b[0] + i * span - 0.05, b[0] + i * span + 0.06])
        flick += Math.sin(Math.PI * k) * (k > 0 && k < 1 ? 1 : 0)
      }
      thumb.on = beat(t, [0.12, 0.22])
      thumb.x = w * 0.7
      thumb.y = h * (0.8 - 0.12 * flick)
      thumb.press = flick > 0.5 ? 1 : 0
    }
  })

  return (
    <div className="screen screen--search" ref={root}>
      <StatusBar />
      <div className="searchbar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 L21 21" />
        </svg>
        <span>{c.search.query}</span>
      </div>
      <ul className="results">
        {c.search.results.map((r, i) => (
          <li
            key={r.where}
            className="result"
            ref={(el) => {
              cards.current[i] = el
            }}
          >
            <svg className="result__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={ICONS[i]} />
            </svg>
            <div className="result__text">
              <p className="result__where">{r.where}</p>
              <p className="result__finding mono">{r.finding}</p>
              <Strike
                variant={i as 0 | 1 | 2}
                ref={(el) => {
                  strikes.current[i] = el
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The part outline (C-profile with tab and pin), for the part page. */
function ClipIllustration() {
  return (
    <svg className="part-hero__clip" viewBox="-13 -10 23 20" aria-hidden="true">
      <path d="M-7.4 5 L-7.4 1 L-11.4 1 L-11.4 -1 L-7.4 -1 L-7.4 -5 L7.4 -5 L7.4 -1.75 L6.6 -1.75 L6 -3 L-5.4 -3 L-5.4 3 L6 3 L6.6 1.75 L7.4 1.75 L7.4 5 Z" />
      <path d="M-5.1 5 L-5.1 8.2 L1.1 8.2 L1.1 5" />
    </svg>
  )
}

/** Scene 05: lock screen → "✨ Your part exists now." → the part page → Order a print. */
export function PartScreen() {
  const c = useCopy()
  const root = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const note = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const pla = useRef<SVGSVGElement>(null)
  const order = useRef<HTMLDivElement>(null)
  const ripple = useRef<HTMLSpanElement>(null)
  const orderAnchor = getAnchor('order-btn')

  useProgressEffect((p) => {
    const el = root.current
    if (!el) return
    const r = sceneRange('sparkle')
    const on = screenOn(p, r.start, r.end + 0.006)
    el.style.opacity = on.toFixed(3)
    el.style.visibility = on > 0 ? 'visible' : 'hidden'
    if (on <= 0) return
    const reduced = useStore.getState().reducedMotion
    const t = reduced && p >= r.start && p <= r.end ? 0.9 : remap(p, r.start, r.end)
    const b = BEATS.sparkle

    // White flash on the screen at the burst (with the 3D bloom around the phone)
    const burst = beat(t, b.burst)
    const glow = burst > 0 && burst < 1 ? Math.min(1, burst * 8) * Math.pow(1 - burst, 1.4) : 0
    if (flash.current) flash.current.style.opacity = glow.toFixed(3)
    const phone = el.closest<HTMLElement>('.phone')
    if (phone) phone.style.setProperty('--glow', glow.toFixed(3))

    const n = power3Out(beat(t, [b.burst[0] + 0.02, b.burst[0] + 0.08]))
    const nOut = beat(t, [b.page[0], b.page[0] + 0.06])
    if (note.current) {
      note.current.style.opacity = (n * (1 - nOut)).toFixed(3)
      note.current.style.transform = `translate3d(0, ${((1 - n) * -120 - nOut * 40).toFixed(1)}%, 0)`
    }
    const pg = power3Out(beat(t, [b.page[0], b.page[0] + 0.1]))
    if (page.current) page.current.style.transform = `translate3d(0, ${((1 - pg) * 102).toFixed(2)}%, 0)`
    if (pla.current) pla.current.style.setProperty('--draw', power2InOut(beat(t, [b.page[0] + 0.1, b.page[0] + 0.18])).toFixed(3))

    // Tap on "Order a print"
    const tapAt = b.tap[0] + 0.1
    const rip = beat(t, [tapAt, tapAt + 0.05])
    if (ripple.current) {
      ripple.current.style.opacity = rip > 0 && rip < 1 ? (1 - rip).toFixed(3) : '0'
      ripple.current.style.transform = `translate(-50%, -50%) scale(${(0.2 + rip * 3).toFixed(3)})`
    }
    if (order.current) {
      const rect = order.current.getBoundingClientRect()
      orderAnchor.x = rect.left + rect.width * 0.3
      orderAnchor.y = rect.top - 2
      orderAnchor.visible = pg > 0.9
      order.current.classList.toggle('is-pressed', t >= tapAt && t < tapAt + 0.04)
    }
    if (phone && order.current && useStore.getState().scene === 'sparkle') {
      const o = offsetIn(order.current, phone)
      thumb.x = o.x + o.w * 0.62
      thumb.y = o.y + o.h * 0.5 + (1 - power2InOut(beat(t, [b.tap[0], tapAt]))) * phone.offsetHeight * 0.18
      thumb.press = Math.abs(t - tapAt) < 0.02 ? 1 : 0
      thumb.on = beat(t, [b.tap[0], b.tap[0] + 0.04]) * (1 - beat(t, [tapAt + 0.04, tapAt + 0.08]))
    }
  })

  return (
    <div className="screen screen--part" ref={root}>
      <div className="lock" aria-hidden="true">
        <span className="lock__time">09:41</span>
      </div>
      <div className="notification" ref={note}>
        <span className="notification__app mono">{BRAND.name}</span>
        <span className="notification__text">{c.sparkle.notification}</span>
      </div>
      <div className="part-page" ref={page}>
        <StatusBar />
        <div className="part-hero">
          <ClipIllustration />
          <span className="mono">v1 · 3MF + STEP</span>
        </div>
        <p className="part-title">{c.scan.file.title}</p>
        <span className="badge badge--teal">{c.sparkle.badge}</span>
        <p className="part-material">
          {c.sparkle.materialOk}{' '}
          <span className="struck">
            {c.sparkle.materialBad}
            <Strike ref={pla} variant={1} className="strike--word" />
          </span>{' '}
          {c.sparkle.materialBadReason}
        </p>
        <p className="part-note mono">{c.sparkle.aftermarket}</p>
        <div className="part-actions">
          <div className="pbtn pbtn--outline">{c.sparkle.download}</div>
          <div className="pbtn pbtn--order" ref={order}>
            {c.sparkle.order}
            <span className="req-btn__ripple" ref={ripple} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="screen-flash" ref={flash} aria-hidden="true" />
    </div>
  )
}

/** Scene 03: selector chips click in, empty state, "Request this part". */
export function AppScreen() {
  const c = useCopy()
  const root = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const empty = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLDivElement>(null)
  const ripple = useRef<HTMLSpanElement>(null)
  const beaconAnchor = getAnchor('phone-beacon')

  useProgressEffect((p) => {
    const el = root.current
    if (!el) return
    const r = sceneRange('request')
    const on = screenOn(p, r.start, r.end)
    el.style.opacity = on.toFixed(3)
    el.style.visibility = on > 0 ? 'visible' : 'hidden'
    if (on <= 0) return
    const t = local(p, 'request')
    const open = power3Out(beat(t, [0, 0.04]))
    el.style.transform = `scale(${lerp(0.94, 1, open).toFixed(3)})`

    // Chips click in one after another.
    const chipAt = (i: number) => 0.04 + i * 0.058
    rows.current.forEach((row, i) => {
      if (!row) return
      const k = beat(t, [chipAt(i), chipAt(i) + 0.035])
      row.style.setProperty('--pop', popOut(k).toFixed(3))
      row.classList.toggle('is-set', k >= 1)
    })

    const b = BEATS.request.button
    const e = power2Out(beat(t, [b[0], b[0] + 0.04]))
    if (empty.current) {
      empty.current.style.opacity = e.toFixed(3)
      empty.current.style.transform = `translate3d(0, ${((1 - e) * 12).toFixed(1)}px, 0)`
    }
    const tapAt = b[0] + 0.12
    const rip = beat(t, [tapAt, tapAt + 0.05])
    const done = t >= tapAt + 0.03
    if (btn.current) {
      btn.current.style.opacity = power2Out(beat(t, [b[0] + 0.02, b[0] + 0.06])).toFixed(3)
      btn.current.classList.toggle('is-done', done)
    }
    if (ripple.current) {
      ripple.current.style.opacity = rip > 0 && rip < 1 ? (1 - rip).toFixed(3) : '0'
      ripple.current.style.transform = `translate(-50%, -50%) scale(${(0.2 + rip * 3).toFixed(3)})`
    }

    // Where the beacon leaves from (screen px), for the 3D scene.
    if (btn.current) {
      const rect = btn.current.getBoundingClientRect()
      beaconAnchor.x = rect.left + rect.width / 2
      beaconAnchor.y = rect.top + rect.height / 2
      beaconAnchor.visible = true
    }

    // Thumb: tap each chip, then the button.
    const phone = el.closest<HTMLElement>('.phone')
    if (phone && useStore.getState().scene === 'request') {
      const targets = [...rows.current.map((row) => row?.querySelector<HTMLElement>('.chip') ?? null), btn.current]
      const times = [...rows.current.map((_, i) => chipAt(i) + 0.012), tapAt]
      let k = 0
      while (k < times.length - 1 && t > times[k] + 0.02) k++
      const prev = targets[Math.max(0, k - 1)]
      const next = targets[k]
      if (next && prev) {
        const a = offsetIn(prev, phone)
        const n = offsetIn(next, phone)
        const from = k === 0 ? 0 : times[k - 1] + 0.02
        const m = power2InOut(clamp01((t - from) / Math.max(0.001, times[k] - from)))
        thumb.x = lerp(a.x + a.w * 0.6, n.x + n.w * 0.6, m)
        thumb.y = lerp(a.y + a.h * 0.5, n.y + n.h * 0.5, m)
      }
      thumb.press = Math.abs(t - times[k]) < 0.012 ? 1 : 0
      thumb.on = Math.min(beat(t, [0.0, 0.04]), 1 - beat(t, [tapAt + 0.04, tapAt + 0.1]))
    }
  })

  return (
    <div className="screen screen--app" ref={root}>
      <StatusBar />
      <div className="app-head">
        <span className="app-wordmark">{BRAND.name}</span>
        <span className="app-head__dot" aria-hidden="true" />
      </div>
      <p className="app-title">{c.request.appTitle}</p>
      <ul className="selector">
        {c.request.chips.map((chip, i) => (
          <li
            key={c.request.chipLabels[i]}
            className="selector__row"
            ref={(el) => {
              rows.current[i] = el
            }}
          >
            <span className="mono selector__label">{c.request.chipLabels[i]}</span>
            <span className="chip">
              {chip}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8.5 L6.5 12 L13 4.5" />
              </svg>
            </span>
          </li>
        ))}
      </ul>
      <div className="empty" ref={empty}>
        <svg viewBox="0 0 48 32" aria-hidden="true">
          <path d="M8 4 H40 V12 H34 L32 9 H14 V23 H32 L34 20 H40 V28 H8 V19 H2 V13 H8 Z" />
        </svg>
        <p>{c.request.empty}</p>
      </div>
      <div className="req-btn" ref={btn}>
        <span className="req-btn__label">{c.request.request}</span>
        <span className="req-btn__done">{c.request.requested}</span>
        <span className="req-btn__ripple" ref={ripple} aria-hidden="true" />
      </div>
    </div>
  )
}
