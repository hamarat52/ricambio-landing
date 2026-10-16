import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene06Print() {
  const c = useCopy()
  return (
    <SceneLayer id="print">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-print" className="display">
          {c.print.headline}
        </h2>
      </div>
    </SceneLayer>
  )
}
