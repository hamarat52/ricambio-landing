import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { COPY, SCENES, STILLS, type Lang, type SceneId } from './content'

function sceneIndexAt(progress: number): number {
  for (let i = SCENES.length - 1; i >= 0; i--) if (progress >= SCENES[i].start) return i
  return 0
}

function readParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name)
  } catch {
    return null
  }
}

function initialLang(): Lang {
  const fromUrl = readParam('lang')
  if (fromUrl === 'en' || fromUrl === 'tr') return fromUrl
  try {
    const stored = localStorage.getItem('ricambio.lang')
    if (stored === 'en' || stored === 'tr') return stored
  } catch {
    /* storage unavailable: fall back to the default */
  }
  return 'en'
}

const media = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches

export interface AppState {
  /** Global scroll progress, 0 → 1. Read it in rAF/useFrame via getState(), not as a React prop. */
  progress: number
  sceneIndex: number
  scene: SceneId
  lang: Lang
  sound: boolean
  debug: boolean
  reducedMotion: boolean
  mobile: boolean
  /** True once the 3D scene has compiled and drawn its first frame. */
  ready3D: boolean
  /** Lowered by the performance monitor: bloom off first, then fewer points. */
  quality: 'high' | 'medium' | 'low'
  setProgress: (p: number) => void
  setQuality: (q: AppState['quality']) => void
  setLang: (lang: Lang) => void
  toggleSound: () => void
  setReady3D: (v: boolean) => void
  setMobile: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    progress: 0,
    sceneIndex: 0,
    scene: SCENES[0].id,
    lang: initialLang(),
    sound: false,
    debug: readParam('debug') !== null,
    reducedMotion: media('(prefers-reduced-motion: reduce)') || readParam('reduced') !== null,
    mobile: media('(max-width: 767px)'),
    ready3D: false,
    quality: 'high',
    setQuality: (quality) => set({ quality }),
    setProgress: (p) => {
      const idx = sceneIndexAt(p)
      if (idx !== get().sceneIndex) set({ progress: p, sceneIndex: idx, scene: SCENES[idx].id })
      else set({ progress: p })
    },
    setLang: (lang) => {
      try {
        localStorage.setItem('ricambio.lang', lang)
      } catch {
        /* ignore */
      }
      set({ lang })
    },
    toggleSound: () => set({ sound: !get().sound }),
    setReady3D: (v) => set({ ready3D: v }),
    setMobile: (v) => set({ mobile: v }),
    setReducedMotion: (v) => set({ reducedMotion: v }),
  })),
)

/**
 * The progress the 3D scene and the DOM animations use. With reduced motion
 * it snaps to the current scene's still (no scrubbing); otherwise it is the
 * scroll progress itself.
 */
export function storyProgress(s: AppState = useStore.getState()): number {
  if (!s.reducedMotion) return s.progress
  const sc = SCENES[s.sceneIndex]
  return sc.start + (sc.end - sc.start) * STILLS[sc.id]
}

/** Current language's copy. Re-renders only when the language changes. */
export const useCopy = () => COPY[useStore((s) => s.lang)]
