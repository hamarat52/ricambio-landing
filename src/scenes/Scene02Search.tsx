import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene02Search() {
  const c = useCopy()
  return (
    <SceneLayer id="search">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-search" className="display">
          {c.search.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
