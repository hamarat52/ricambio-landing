import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene04Scan() {
  const c = useCopy()
  return (
    <SceneLayer id="scan">
      <div className="copy copy--bl copy--narrow">
        <p className="mono-label">{c.scan.caption}</p>
        <h2 id="h-scan" className="display">
          {c.scan.headline}
        </h2>
        <p className="sub">{c.scan.insight}</p>
      </div>
    </SceneLayer>
  )
}
