import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene05Sparkle() {
  const c = useCopy()
  return (
    <SceneLayer id="sparkle">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-sparkle" className="display">
          {c.sparkle.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
