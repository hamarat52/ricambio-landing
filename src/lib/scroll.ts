import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from '../store'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

let lenis: Lenis | null = null
let master: ScrollTrigger | null = null

/**
 * Lenis smooth scrolling, synced with ScrollTrigger, plus the one master
 * trigger that turns the scroll track into the global `progress` (0 → 1).
 * Returns a cleanup function.
 */
export function initScroll(track: HTMLElement, opts: { smooth: boolean }): () => void {
  let raf: ((time: number) => void) | null = null

  if (opts.smooth) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    })
    lenis.on('scroll', ScrollTrigger.update)
    raf = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }

  const set = useStore.getState().setProgress
  master = ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => set(self.progress),
    onRefresh: (self) => set(self.progress),
  })

  return () => {
    master?.kill()
    master = null
    if (raf) gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

/** Scroll so the global progress becomes `p`. */
export function scrollToProgress(p: number, immediate = false): void {
  if (!master) return
  const y = master.start + (master.end - master.start) * p
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.8, force: true })
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

export function refreshScroll(): void {
  ScrollTrigger.refresh()
}
