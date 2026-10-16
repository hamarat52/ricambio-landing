import { useRef } from 'react'
import { BEATS } from '../content'
import { power3In } from '../lib/easing'
import { beat } from '../lib/remap'
import { useSceneProgress } from '../lib/useProgress'
import { useCopy } from '../store'
import { HandArrow } from '../ui/HandArrow'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene00Hero() {
  const c = useCopy()
  const copy = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLParagraphElement>(null)
  const cue = useRef<HTMLDivElement>(null)

  // Exit: the headline slides up as the turntable comes to rest.
  useSceneProgress(
    'hero',
    (t) => {
      const e = power3In(beat(t, BEATS.hero.exit))
      if (copy.current) {
        copy.current.style.transform = `translate3d(0, ${(-e * 38).toFixed(2)}vh, 0)`
        copy.current.style.opacity = (1 - e * 1.1).toFixed(3)
      }
      if (label.current) label.current.style.opacity = (1 - e).toFixed(3)
      if (cue.current) cue.current.style.opacity = (1 - beat(t, [0.05, 0.4])).toFixed(3)
    },
    { still: 0 },
  )

  return (
    <SceneLayer id="hero">
      <p ref={label} className="mono-label hero__label">
        {c.hero.label}
      </p>
      <div ref={copy} className="copy copy--bl hero__copy">
        <h1 id="h-hero" className="display display--hero">
          {c.hero.headline.map((line, i) => (
            <span className="line reveal" key={line} style={{ animationDelay: `${0.08 + i * 0.12}s` }}>
              {line}
            </span>
          ))}
        </h1>
        <p className="sub reveal" style={{ animationDelay: '0.36s' }}>
          {c.hero.sub}
        </p>
      </div>
      <div ref={cue} className="scroll-cue">
        <HandArrow name="down" loop />
        <span className="mono-label">{c.hero.scrollCue}</span>
      </div>
    </SceneLayer>
  )
}
