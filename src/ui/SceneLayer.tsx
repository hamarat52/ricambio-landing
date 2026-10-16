import { useRef, type ReactNode } from 'react'
import { sceneRange, type SceneId } from '../content'
import { windowed } from '../lib/remap'
import { useProgressEffect } from '../lib/useProgress'

/** Global-progress width of the cross-fade at each scene boundary. */
const FADE = 0.01

interface Props {
  id: SceneId
  tone?: 'light' | 'dark'
  className?: string
  children: ReactNode
}

/**
 * One fixed, full-viewport DOM layer per scene. It cross-fades in and out
 * around the scene's range; everything inside animates from the scene's
 * local progress. The text stays in the DOM for search engines and screen
 * readers even while the layer is transparent.
 */
export function SceneLayer({ id, tone = 'light', className = '', children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const r = sceneRange(id)

  useProgressEffect((p) => {
    const el = ref.current
    if (!el) return
    const a = r.start === 0 ? -1 : r.start - FADE / 2
    const b = r.end === 1 ? 2 : r.end + FADE / 2
    const o = windowed(p, a, b, FADE, FADE)
    el.style.opacity = o.toFixed(3)
    el.dataset.active = o > 0.5 ? 'true' : 'false'
  })

  return (
    <section
      ref={ref}
      className={`layer layer--${tone} layer--${id} ${className}`}
      aria-labelledby={`h-${id}`}
      data-scene={id}
    >
      {children}
    </section>
  )
}
