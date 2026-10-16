import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene01Snap() {
  const c = useCopy()
  return (
    <SceneLayer id="snap">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-snap" className="display">
          {c.snap.headline}
        </h2>
        <p className="sub">{c.snap.sub}</p>
      </div>
    </SceneLayer>
  )
}
