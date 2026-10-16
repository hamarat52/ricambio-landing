import { useLayoutEffect, useRef } from 'react'
import { sceneRange, type SceneId } from '../content'
import { storyProgress, useStore } from '../store'
import { remap } from './remap'

/**
 * Calls `cb(progress)` immediately and on every progress change, without
 * re-rendering React. Use it to write styles straight onto refs. Because the
 * callback is a pure function of progress, scrolling backwards just works.
 */
export function useProgressEffect(cb: (progress: number) => void, deps: readonly unknown[] = []): void {
  const ref = useRef(cb)
  ref.current = cb
  useLayoutEffect(() => {
    const run = () => ref.current(storyProgress())
    run()
    const unsubP = useStore.subscribe((s) => s.progress, run)
    const unsubL = useStore.subscribe((s) => s.lang, () => requestAnimationFrame(run))
    return () => {
      unsubP()
      unsubL()
    }
  }, deps)
}

/**
 * Like useProgressEffect but hands over the scene's local time `t` (0–1).
 * With reduced motion the scene holds one still (`still`) while it is on
 * screen instead of scrubbing.
 */
export function useSceneProgress(
  id: SceneId,
  cb: (t: number, progress: number) => void,
  opts: { still?: number } = {},
  deps: readonly unknown[] = [],
): void {
  const r = sceneRange(id)
  const still = opts.still ?? 0.9
  useProgressEffect((p) => {
    let t = remap(p, r.start, r.end)
    if (useStore.getState().reducedMotion && p >= r.start && p <= r.end) t = still
    cb(t, p)
  }, deps)
}
