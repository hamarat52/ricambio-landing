import { useRef, type ReactNode } from 'react'
import { useProgressEffect } from '../lib/useProgress'
import { phoneIn } from '../story'
import { useCopy } from '../store'

/**
 * Thumb pose, written by the active screen (in px from the phone's top-left)
 * and applied by <Phone>. Screens run their progress callbacks first.
 */
export const thumb = { x: 0, y: 0, press: 0, on: 0 }

/** Offset of `el` relative to `root`, from layout (ignores transforms). */
export function offsetIn(el: HTMLElement, root: HTMLElement): { x: number; y: number; w: number; h: number } {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/** Emre's thumb: a flat ink silhouette that scrolls and taps. */
function Thumb({ innerRef }: { innerRef: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={innerRef} className="thumb" viewBox="0 0 120 300" aria-hidden="true">
      <path d="M60 4 C 86 4, 100 24, 100 56 L 106 300 L 14 300 L 20 56 C 20 24, 34 4, 60 4 Z" fill="currentColor" />
      <path d="M44 22 C 50 14, 70 14, 76 22 L 74 52 C 66 56, 54 56, 46 52 Z" fill="none" stroke="#d1d7de" strokeOpacity="0.35" strokeWidth="3" />
    </svg>
  )
}

/**
 * Emre's phone: one persistent CSS phone above the canvas. It rises for the
 * search, the request, the part page and the fit-check form; each screen
 * animates from its own scene's progress.
 */
export function Phone({ children }: { children: ReactNode }) {
  const c = useCopy()
  const root = useRef<HTMLDivElement>(null)
  const thumbEl = useRef<SVGSVGElement>(null)

  useProgressEffect((p) => {
    const el = root.current
    if (!el) return
    const v = phoneIn(p)
    el.style.visibility = v > 0.001 ? 'visible' : 'hidden'
    el.style.transform = `translate3d(${((1 - v) * 18).toFixed(2)}%, ${((1 - v) * 105).toFixed(2)}vh, 0) rotate(${((1 - v) * 6).toFixed(2)}deg)`
    const t = thumbEl.current
    if (t) {
      t.style.opacity = (thumb.on * v).toFixed(3)
      const s = 1 - 0.05 * thumb.press
      const half = t.clientWidth / 2
      t.style.transform = `translate3d(${(thumb.x - half).toFixed(1)}px, ${(thumb.y - half * 0.07).toFixed(1)}px, 0) rotate(-16deg) scale(${s.toFixed(3)})`
    }
  })

  return (
    <div className="phone-layer">
      <figure className="phone" ref={root} aria-label={c.people.emre}>
        <div className="phone__body">
          <div className="phone__screen">
            <div className="phone__island" aria-hidden="true" />
            {children}
          </div>
        </div>
        <Thumb innerRef={thumbEl} />
      </figure>
    </div>
  )
}

export function StatusBar() {
  return (
    <div className="statusbar" aria-hidden="true">
      <span>09:41</span>
      <span className="statusbar__icons">
        <i />
        <i />
        <b />
      </span>
    </div>
  )
}
