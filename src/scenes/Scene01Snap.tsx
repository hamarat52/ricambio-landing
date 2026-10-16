import { useCallback, useRef } from 'react'
import { BEATS, sceneRange } from '../content'
import { popOut, power2Out } from '../lib/easing'
import { beat, remap } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy, useStore } from '../store'
import { Annotation } from '../ui/Annotation'
import { SceneLayer } from '../ui/SceneLayer'

const LABEL_OFFSET: [number, number] = [-300, -150]
const LABEL_OFFSET_MOBILE: [number, number] = [-60, -130]

export default function Scene01Snap() {
  const c = useCopy()
  const word = useRef<HTMLHeadingElement>(null)
  const sub = useRef<HTMLParagraphElement>(null)
  const card = useRef<HTMLDivElement>(null)

  useSceneProgress(
    'snap',
    (t) => {
      const b = BEATS.snap
      // "Snap." lands with the break; the sub-line follows once the halves fall.
      const w = beat(t, [b.snap[0], b.snap[0] + 0.05])
      const s = power2Out(beat(t, [b.fall[0] + 0.04, b.fall[0] + 0.14]))
      if (card.current) card.current.style.opacity = w > 0 ? '1' : '0'
      if (word.current) {
        word.current.style.transform = `scale(${(0.6 + 0.4 * popOut(w)).toFixed(3)})`
        word.current.style.opacity = w.toFixed(3)
      }
      if (sub.current) {
        sub.current.style.opacity = s.toFixed(3)
        sub.current.style.transform = `translate3d(0, ${((1 - s) * 14).toFixed(1)}px, 0)`
      }
    },
    { still: 1 },
  )

  const r = sceneRange('snap')
  const getDraw = useCallback(() => {
    const p = useStore.getState().progress
    if (p < r.start || p > r.end + 0.004) return 0
    const t = remap(p, r.start, r.end)
    return useStore.getState().reducedMotion ? 1 : beat(t, BEATS.snap.annotate)
  }, [r])

  return (
    <SceneLayer id="snap">
      <div ref={card} className="copy copy--bl copy--narrow caption-card snap__card">
        <h2 id="h-snap" ref={word} className="display display--word">
          {c.snap.headline}
        </h2>
        <p ref={sub} className="sub">
          {c.snap.sub}
        </p>
      </div>
      <Annotation anchor="vent-slot" getDraw={getDraw} offset={LABEL_OFFSET} offsetMobile={LABEL_OFFSET_MOBILE}>
        {c.snap.annotation}
      </Annotation>
    </SceneLayer>
  )
}
