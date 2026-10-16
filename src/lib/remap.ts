import { sceneRange, type SceneId } from '../content'
import type { Ease } from './easing'

export const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x)
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map `p` from [start, end] to 0–1, clamped. */
export function remap(p: number, start: number, end: number): number {
  return clamp01((p - start) / (end - start))
}

/** `remap` followed by an easing curve. */
export function remapEase(p: number, start: number, end: number, ease: Ease): number {
  return ease(remap(p, start, end))
}

/** A scene's local progress (0–1) from the global progress. */
export function sceneLocal(progress: number, id: SceneId): number {
  const r = sceneRange(id)
  return remap(progress, r.start, r.end)
}

/** Local progress inside a beat tuple from content.ts BEATS. */
export function beat(t: number, range: readonly [number, number], ease?: Ease): number {
  const v = remap(t, range[0], range[1])
  return ease ? ease(v) : v
}

/**
 * Trapezoid window: 0 before `a`, ramps to 1 over `fadeIn`, holds, ramps back
 * to 0 over `fadeOut` ending at `b`. Used for fades that must reverse cleanly.
 */
export function windowed(p: number, a: number, b: number, fadeIn: number, fadeOut = fadeIn): number {
  if (p <= a || p >= b) return 0
  const up = fadeIn > 0 ? clamp01((p - a) / fadeIn) : 1
  const down = fadeOut > 0 ? clamp01((b - p) / fadeOut) : 1
  return Math.min(up, down)
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

/** Deterministic pseudo-random in [0,1) from an integer seed (stable across reloads). */
export function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return s - Math.floor(s)
}
