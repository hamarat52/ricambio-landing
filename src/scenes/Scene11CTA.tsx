import { LINKS, sceneRange } from '../content'
import { scrollToProgress } from '../lib/scroll'
import { useCopy, useStore } from '../store'
import { SceneLayer } from '../ui/SceneLayer'

/** Keyboard users can tab straight to the CTAs: focusing one jumps to the end of the story. */
function revealOnFocus() {
  if (useStore.getState().progress < sceneRange('cta').start + 0.02) scrollToProgress(1, true)
}

export default function Scene11CTA() {
  const c = useCopy()
  return (
    <SceneLayer id="cta">
      <div className="copy copy--tl">
        <h2 id="h-cta" className="display display--hero">
          {c.cta.headline}
        </h2>
        <div className="cta-row">
          <a className="btn btn--primary" href={LINKS.findPart} onFocus={revealOnFocus}>
            {c.cta.primary}
          </a>
          <a className="btn btn--outline" href={LINKS.uploadPart} onFocus={revealOnFocus}>
            {c.cta.secondary}
          </a>
          <a className="text-link" href={LINKS.joinMaker} onFocus={revealOnFocus}>
            {c.cta.tertiary}
          </a>
        </div>
      </div>
    </SceneLayer>
  )
}
