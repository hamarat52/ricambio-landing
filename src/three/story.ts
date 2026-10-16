import { BEATS, sceneRange } from '../content'
import { power2InOut, power3InOut } from '../lib/easing'
import { beat, remap, sceneLocal } from '../lib/remap'

/**
 * Pure functions of the global progress that several scenes share (the car
 * appears in the hero, the snap, the click and the finale). Keeping them here
 * means one writer per property, and scrolling backwards replays them exactly.
 */

/** Live turntable angle, written by <Car> and read by the floor's degree ring. */
export const carPose = { angle: 0 }

/** Window that eases in over [a,b] and out over [c,d]. */
function window4(p: number, a: number, b: number, c: number, d: number): number {
  return Math.min(power3InOut(remap(p, a, b)), 1 - power3InOut(remap(p, c, d)))
}

/** Roof + driver's door cut-away (0 = closed car, 1 = open). */
export function cutaway(p: number): number {
  return Math.max(window4(p, 0.053, 0.072, 0.145, 0.168), window4(p, 0.728, 0.748, 0.877, 0.897))
}

/** Turntable spin weight: 1 = free spin (hero, finale), 0 = parked. */
export function turntableWeight(p: number): number {
  const hero = sceneRange('hero')
  const cta = sceneRange('cta')
  const exitStart = hero.start + (hero.end - hero.start) * BEATS.hero.exit[0]
  const stop = 1 - power3InOut(remap(p, exitStart, hero.end))
  const resume = power2InOut(remap(p, cta.start + (cta.end - cta.start) * 0.5, cta.end))
  return Math.max(stop, resume)
}

export interface VentState {
  /** Crack line growth 0 → 1. */
  crack: number
  /** The original clip has snapped. */
  broken: boolean
  /** Snap flash intensity. */
  flash: number
  /** Fall trajectory time 0 → 1. */
  fall: number
  /** Louvre droop 0 → 1 (with a small damped settle). */
  droop: number
}

const out: VentState = { crack: 0, broken: false, flash: 0, fall: 0, droop: 0 }

/** Damped settle curve: 0 → 1 with one small overshoot (physical, not bouncy). */
export function settle(s: number): number {
  if (s <= 0) return 0
  if (s >= 1) return 1
  return 1 - Math.exp(-5.5 * s) * Math.cos(8 * s) * (1 - s)
}

export function ventState(p: number): VentState {
  const t = sceneLocal(p, 'snap')
  const b = BEATS.snap
  out.crack = beat(t, b.crack, power2InOut)
  out.broken = t >= b.snap[0]
  const f = beat(t, b.snap)
  out.flash = f > 0 && f < 1 ? Math.sin(Math.PI * Math.min(1, f * 1.6)) * (1 - f) * 1.8 : 0
  out.fall = beat(t, b.fall)
  out.droop = settle(beat(t, b.droop))
  // Scene 08 (the new clip) extends this in build step 7.
  return out
}

/** Global progress of the snap moment (for the one-shot sound). */
export const SNAP_AT = (() => {
  const r = sceneRange('snap')
  return r.start + (r.end - r.start) * BEATS.snap.snap[0]
})()
