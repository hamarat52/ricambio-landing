import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene00Hero() {
  const c = useCopy()
  return (
    <SceneLayer id="hero">
      <p className="mono-label hero__label">{c.hero.label}</p>
      <div className="copy copy--bl">
        <h1 id="h-hero" className="display display--hero">
          {c.hero.headline.map((line) => (
            <span className="line" key={line}>
              {line}
            </span>
          ))}
        </h1>
        <p className="sub">{c.hero.sub}</p>
      </div>
    </SceneLayer>
  )
}
