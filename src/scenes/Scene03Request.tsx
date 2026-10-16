import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene03Request() {
  const c = useCopy()
  return (
    <SceneLayer id="request">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-request" className="display">
          {c.request.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
