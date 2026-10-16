import { useCopy } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

export default function Scene08Click() {
  const c = useCopy()
  return (
    <SceneLayer id="click">
      <div className="copy copy--bl copy--narrow">
        <h2 id="h-click" className="display">
          {c.click.headline}
        </h2>
        <p className="sub">{c.click.formNote}</p>
      </div>
    </SceneLayer>
  )
}
