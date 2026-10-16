import { gsap } from 'gsap'
import { useEffect, useRef, type ReactNode } from 'react'
import { getAnchor } from '../lib/anchors'
import { useStore } from '../store'

interface Props {
  /** Name of a <ScreenAnchor> in the 3D scene. */
  anchor: string
  /** 0 → 1 draw amount; read every frame. */
  getDraw: () => number
  /** Label offset from the anchor in px (desktop / mobile). */
  offset?: [number, number]
  offsetMobile?: [number, number]
  children: ReactNode
}

/**
 * Technical annotation: a leader line drawn from a point on a 3D object to a
 * mono label, like a callout on an engineering drawing. The label is real
 * text; the line follows the object as the camera moves.
 */
export function Annotation({ anchor, getDraw, offset = [-240, -120], offsetMobile = [-120, -110], children }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const under = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const drawFn = useRef(getDraw)
  drawFn.current = getDraw

  useEffect(() => {
    const a = getAnchor(anchor)
    const tick = () => {
      const el = root.current
      if (!el || !path.current || !under.current || !dot.current || !label.current) return
      const draw = drawFn.current()
      const show = draw > 0.001 && a.visible
      el.style.visibility = show ? 'visible' : 'hidden'
      if (!show) return
      const mobile = useStore.getState().mobile
      const [ox, oy] = mobile ? offsetMobile : offset
      const W = window.innerWidth
      const H = window.innerHeight
      const lw = label.current.offsetWidth
      const lh = label.current.offsetHeight
      // knee of the leader line, kept on screen with a 16 px gutter
      const kx = ox < 0 ? Math.max(16 + lw, Math.min(W - 16, a.x + ox)) : Math.min(W - 16 - lw, Math.max(16, a.x + ox))
      const ky = Math.min(H - 16, Math.max(80 + lh, a.y + oy))
      const ex = ox < 0 ? kx - lw : kx + lw
      const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${kx.toFixed(1)} ${ky.toFixed(1)} L${ex.toFixed(1)} ${ky.toFixed(1)}`
      path.current.setAttribute('d', d)
      under.current.setAttribute('d', d)
      const off = (1 - Math.min(1, draw * 1.6)).toFixed(3)
      path.current.style.strokeDashoffset = off
      under.current.style.strokeDashoffset = off
      dot.current.setAttribute('cx', a.x.toFixed(1))
      dot.current.setAttribute('cy', a.y.toFixed(1))
      dot.current.style.opacity = String(Math.min(1, draw * 4))
      const lt = Math.max(0, Math.min(1, (draw - 0.45) / 0.4))
      label.current.style.transform = `translate(${(ox < 0 ? ex : kx).toFixed(1)}px, ${(ky - lh - 6).toFixed(1)}px)`
      label.current.style.opacity = lt.toFixed(3)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [anchor, offset, offsetMobile])

  return (
    <div className="annotation" ref={root}>
      <svg className="annotation__svg" aria-hidden="true">
        <path ref={under} className="annotation__under" pathLength={1} />
        <path ref={path} className="annotation__line" pathLength={1} />
        <circle ref={dot} className="annotation__dot" r={5} />
      </svg>
      <div className="annotation__label mono" ref={label}>
        {children}
      </div>
    </div>
  )
}
