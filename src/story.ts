import { BEATS, sceneRange } from './content'
import { power2InOut, power3InOut } from './lib/easing'
import { beat, remap, sceneLocal } from './lib/remap'

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
  /** Scene 08: the new clip's approach 0 → 1 (1 = seated). */
  insert: number
  newClip: boolean
  /** Shockwave ring at the click, 0 → 1. */
  shock: number
  /** Cassette yaw while air flows (radians). */
  sweep: number
  /** Air particles strength 0 → 1. */
  air: number
}

const out: VentState = { crack: 0, broken: false, flash: 0, fall: 0, droop: 0, insert: 0, newClip: false, shock: 0, sweep: 0, air: 0 }

export const clickLocal = (p: number) => sceneLocal(p, 'click')
const CB = BEATS.click
/** Local click-scene time at which the new clip seats ("click"). */
export const CONTACT_T = CB.insert[0] + (CB.insert[1] - CB.insert[0]) * 0.7

/** Global progress of the click (for the one-shot sound). */
export const CLICK_AT = (() => {
  const r = sceneRange('click')
  return r.start + (r.end - r.start) * CONTACT_T
})()

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

  // Scene 08: the new clip is guided in, clicks, the louvres spring back and sweep once.
  const ct = clickLocal(p)
  out.newClip = ct > CB.descend[1] * 0.6
  out.insert = beat(ct, [CB.insert[0], CONTACT_T], power2InOut)
  out.shock = beat(ct, [CONTACT_T, CONTACT_T + 0.07])
  const springBack = settle(beat(ct, [CONTACT_T, CONTACT_T + 0.09]))
  out.droop = settle(beat(t, b.droop)) * (1 - springBack)
  const sw = beat(ct, CB.airflow)
  out.sweep = Math.sin(sw * Math.PI * 2) * 0.32 * (sw > 0 && sw < 1 ? 1 : 0)
  out.air = Math.min(beat(ct, [CB.airflow[0], CB.airflow[0] + 0.04]), 1 - beat(ct, [0.96, 1]))
  return out
}

// ─── Ship (Scene 07) ────────────────────────────────────────────────────────

export const shipLocal = (p: number) => sceneLocal(p, 'ship')

/** Packing 0 → 1: clips drop in, QR card, lid, tape, label. */
export function packT(p: number): number {
  return beat(shipLocal(p), BEATS.ship.pack)
}

/** The box's trip Torino → Istanbul along the map arc, 0 → 1. */
export function travelT(p: number): number {
  return beat(shipLocal(p), BEATS.ship.travel, power2InOut)
}

// ─── Map (Scenes 02–07) ─────────────────────────────────────────────────────

/** Radius (world units) of the dot map's reveal around Istanbul. */
export function mapReveal(p: number): number {
  return power2InOut(remap(p, 0.2, 0.258)) * 95
}

/** Overall map opacity: in as the camera rises, out before the library pull-back. */
export function mapOpacity(p: number): number {
  return Math.min(remap(p, 0.198, 0.215), 1 - remap(p, 0.86, 0.885))
}

/** The request scene's local time, used by the beacon and the owner pops. */
export const requestLocal = (p: number) => sceneLocal(p, 'request')

/** Beacon flight 0 → 1 (leaves the phone, lands on Istanbul). */
export function beaconFlight(p: number): number {
  return beat(requestLocal(p), BEATS.request.beacon)
}

/** Istanbul keeps pulsing from the beacon landing until the part arrives in Scene 05. */
export function istanbulPulse(p: number): number {
  const landed = requestLocal(p) >= BEATS.request.beacon[1] ? 1 : 0
  return landed * (1 - remap(p, 0.505, 0.52))
}

// ─── Split screens (Scenes 04 and 09) ───────────────────────────────────────

/**
 * Seam position: 1 = closed, 0.5 = half (desktop), 0 = full screen. On mobile
 * the split becomes sequential: the seam sweeps all the way across.
 */
function seamWindow(p: number, a: number, b: number, c: number, d: number, mobile: boolean): number {
  const k = window4(p, a, b, c, d)
  const target = mobile ? 0 : 0.5
  return 1 - (1 - target) * k
}

export const scanLocal = (p: number) => sceneLocal(p, 'scan')

export function scanSeam(p: number, mobile: boolean): number {
  const r = sceneRange('scan')
  const len = r.end - r.start
  const open = r.start + len * BEATS.scan.seam[1]
  const sp = sceneRange('sparkle')
  const close = sp.start + (sp.end - sp.start) * BEATS.sparkle.seamClose[1]
  return seamWindow(p, r.start, open, sp.start, close, mobile)
}

export const homeLocal = (p: number) => sceneLocal(p, 'home')

export function homeSeam(p: number, mobile: boolean): number {
  const r = sceneRange('home')
  const len = r.end - r.start
  return seamWindow(p, r.start, r.start + len * BEATS.home.seam[1], r.end - len * 0.12, r.end, mobile)
}

// ─── Sparkle (Scene 05) ─────────────────────────────────────────────────────

export const sparkleLocal = (p: number) => sceneLocal(p, 'sparkle')

/** Head of the particle stream along the Torino → Istanbul arc (0 → 1). */
export function arcHead(p: number): number {
  return beat(sparkleLocal(p), BEATS.sparkle.arc, power2InOut)
}

/** The burst at the phone: 0 → 1 over the burst beat. */
export function burstT(p: number): number {
  return beat(sparkleLocal(p), BEATS.sparkle.burst)
}

/** Bloom envelope of the brightest moment on the page (fast attack, slow decay). */
export function sparkleGlow(p: number): number {
  const b = burstT(p)
  if (b <= 0 || b >= 1) return 0
  return Math.min(1, b * 8) * Math.pow(1 - b, 1.4)
}

/** Global progress of the burst (for the one-shot chime). */
export const BURST_AT = (() => {
  const r = sceneRange('sparkle')
  return r.start + (r.end - r.start) * BEATS.sparkle.burst[0]
})()

// ─── Checks + print (Scene 06) ──────────────────────────────────────────────

export const printLocal = (p: number) => sceneLocal(p, 'print')

/** Print progress 0 → 1 (layer by layer). */
export function printProgress(p: number): number {
  return beat(printLocal(p), BEATS.print.layers)
}

/** Finish beat: door opens, supports snap away, calipers measure. */
export function printFinish(p: number): number {
  return beat(printLocal(p), BEATS.print.finish)
}

/** The printer and its parts stay on the paper from the glide until the box leaves. */
export function printerVisible(p: number): boolean {
  return p > 0.54 && p < 0.72
}

// ─── Phone (DOM) ────────────────────────────────────────────────────────────

/** Emre's phone on screen: 0 = hidden below/right, 1 = in place. */
export function phoneIn(p: number): number {
  const windows: [number, number, number, number][] = [
    [0.146, 0.162, 0.266, 0.278], // search → request (leaves once the beacon is away)
    [0.462, 0.474, 0.5195, 0.526], // the part page, until "Order a print" is tapped
    [0.783, 0.79, 0.811, 0.817], // the QR scan and fit-check form
  ]
  let v = 0
  for (const [a, b, c, d] of windows) v = Math.max(v, window4(p, a, b, c, d))
  return v
}

/** Global progress of the snap moment (for the one-shot sound). */
export const SNAP_AT = (() => {
  const r = sceneRange('snap')
  return r.start + (r.end - r.start) * BEATS.snap.snap[0]
})()
