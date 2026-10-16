import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { BEATS, SCENES, sceneRange } from './content'
import { initScroll, scrollToProgress } from './lib/scroll'
import Scene00Hero from './scenes/Scene00Hero'
import Scene01Snap from './scenes/Scene01Snap'
import Scene02Search from './scenes/Scene02Search'
import Scene03Request from './scenes/Scene03Request'
import Scene04Scan from './scenes/Scene04Scan'
import Scene05Sparkle from './scenes/Scene05Sparkle'
import Scene06Print from './scenes/Scene06Print'
import Scene07Ship from './scenes/Scene07Ship'
import Scene08Click from './scenes/Scene08Click'
import Scene09Home from './scenes/Scene09Home'
import Scene10Library from './scenes/Scene10Library'
import Scene11CTA from './scenes/Scene11CTA'
import { useCopy, useStore } from './store'
import { DebugHUD } from './ui/DebugHUD'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { Footer } from './ui/Footer'
import { Header } from './ui/Header'
import { Loader } from './ui/Loader'
import { Phone } from './ui/Phone'
import { AppScreen, PartScreen, SearchScreen } from './ui/PhoneScreen'

// three.js and the whole 3D scene load after the hero text has painted.
const Experience = lazy(() => import('./three/Experience'))

function useDeferredMount(): boolean {
  const [mount, setMount] = useState(false)
  useEffect(() => {
    const go = () => setMount(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 400 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(go, 50)
    return () => clearTimeout(id)
  }, [])
  return mount
}

/** In-page anchors (footer links) mapped to a global progress value. */
function anchorAt(id: 'library', beat: readonly [number, number]): number {
  const r = sceneRange(id)
  return r.start + (r.end - r.start) * (beat[0] + 0.5 * (beat[1] - beat[0]))
}
const ANCHORS: { id: string; p: number }[] = [
  { id: 'top', p: 0 },
  { id: 'sources', p: anchorAt('library', BEATS.library.sources) },
  { id: 'never-print', p: anchorAt('library', BEATS.library.never) },
]

function useDocumentLanguage() {
  const lang = useStore((s) => s.lang)
  const c = useCopy()
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = c.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.meta.description)
  }, [lang, c])
}

function useMediaQueries() {
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const forceReduced = new URLSearchParams(window.location.search).has('reduced')
    const onMobile = () => useStore.getState().setMobile(mobile.matches)
    const onReduced = () => useStore.getState().setReducedMotion(reduced.matches || forceReduced)
    mobile.addEventListener('change', onMobile)
    reduced.addEventListener('change', onReduced)
    return () => {
      mobile.removeEventListener('change', onMobile)
      reduced.removeEventListener('change', onReduced)
    }
  }, [])
}

export default function App() {
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useStore((s) => s.reducedMotion)
  const debug = useStore((s) => s.debug)
  const ready3D = useStore((s) => s.ready3D)
  const c = useCopy()
  const mount3D = useDeferredMount()

  useDocumentLanguage()
  useMediaQueries()

  useEffect(() => {
    document.documentElement.classList.toggle('reduced', reduced)
  }, [reduced])

  useEffect(() => {
    if (!trackRef.current) return
    return initScroll(trackRef.current, { smooth: !reduced })
  }, [reduced])

  useEffect(() => {
    document.documentElement.classList.toggle('debug', debug)
    // ?debug only: jump to a progress value from the console, e.g. __ricambio.go(0.1)
    if (debug) (window as unknown as Record<string, unknown>).__ricambio = { go: (p: number) => scrollToProgress(p, true) }
  }, [debug])

  return (
    <>
      <a
        className="skip-link"
        href="#h-cta"
        onClick={(e) => {
          e.preventDefault()
          scrollToProgress(1, true)
          document.querySelector<HTMLAnchorElement>('.layer--cta .btn')?.focus({ preventScroll: true })
        }}
      >
        {c.ui.skipToEnd}
      </a>
      <Header />

      {/* one persistent, fixed, full-viewport canvas behind the DOM story */}
      <div className={`canvas-root ${ready3D ? 'is-ready' : ''}`} aria-hidden="true">
        {mount3D && (
          <ErrorBoundary onError={() => useStore.getState().setReady3D(true)}>
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      <Loader />

      <main>
        <div className="stage">
          <Scene00Hero />
          <Scene01Snap />
          <Scene02Search />
          <Scene03Request />
          <Scene04Scan />
          <Scene05Sparkle />
          <Scene06Print />
          <Scene07Ship />
          <Scene08Click />
          <Scene09Home />
          <Scene10Library />
          <Scene11CTA />
          <Phone>
            <SearchScreen />
            <AppScreen />
            <PartScreen />
          </Phone>
        </div>

        <div ref={trackRef} className="track" aria-hidden="true">
          {SCENES.map((s) => (
            <span
              key={s.id}
              id={`scene-${s.id}`}
              className="track__mark track__mark--scene"
              data-name={`${s.name} · ${s.start.toFixed(3)}`}
              style={{ '--p': s.start } as CSSProperties}
            />
          ))}
          {ANCHORS.map((a) => (
            <span key={a.id} id={a.id} className="track__mark" style={{ '--p': a.p } as CSSProperties} />
          ))}
        </div>
      </main>

      <Footer />
      {debug && <DebugHUD />}
    </>
  )
}
