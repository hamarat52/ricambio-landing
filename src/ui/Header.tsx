import { BRAND } from '../content'
import { useCopy, useStore } from '../store'
import { LangToggle } from './LangToggle'

export function Header() {
  const c = useCopy()
  const sound = useStore((s) => s.sound)
  const toggleSound = useStore((s) => s.toggleSound)
  return (
    <header className="site-header">
      <a className="wordmark" href="#top">
        {BRAND.name}
      </a>
      <div className="header-controls">
        <LangToggle />
        <button type="button" className="chip-btn" aria-pressed={sound} title={c.ui.soundHint} onClick={toggleSound}>
          <span className="dot" aria-hidden="true" />
          {c.ui.soundLabel}: {sound ? c.ui.soundOn : c.ui.soundOff}
        </button>
      </div>
    </header>
  )
}
