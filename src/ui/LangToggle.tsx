import type { Lang } from '../content'
import { useCopy, useStore } from '../store'

const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'tr', label: 'TR', name: 'Türkçe' },
]

export function LangToggle() {
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const c = useCopy()
  return (
    <div className="toggle-group" role="group" aria-label={c.ui.langLabel}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-label={l.name}
          aria-pressed={lang === l.id}
          onClick={() => setLang(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
