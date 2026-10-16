import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene10Library() {
  const c = useCopy()
  return (
    <SceneLayer id="library">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-library" className="display">
          {c.library.headline}
        </h2>
        <p className="sub">{c.library.neverCaption}</p>
      </div>
    </SceneLayer>
  )
}
