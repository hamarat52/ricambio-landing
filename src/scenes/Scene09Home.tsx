import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene09Home() {
  const c = useCopy()
  return (
    <SceneLayer id="home">
      <div className="copy copy--bl copy--narrow">
        <p className="mono-label">{c.home.caption}</p>
        <h2 id="h-home" className="display">
          {c.home.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
