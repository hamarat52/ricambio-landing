import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene07Ship() {
  const c = useCopy()
  return (
    <SceneLayer id="ship">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-ship" className="display">
          {c.ship.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
