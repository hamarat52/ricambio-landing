import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from 'three'
import { expoInOut, linear, power2InOut, power3InOut, power3Out, type Ease } from '../lib/easing'
import { clamp01, lerp } from '../lib/remap'

type V3 = [number, number, number]

export interface CamKey {
  /** Global progress at which the camera arrives at this key. */
  p: number
  pos: V3
  target: V3
  fov: number
  /** Lens shift as a fraction of the viewport: +x moves the subject right, +y moves it up. */
  shift?: [number, number]
  /** Stay on this key for `hold` progress after arriving. */
  hold?: number
  /** Pass through without stopping: the move from the previous stop to the next one is eased as one. */
  via?: boolean
  /** Easing of the move that ENDS at this key (ignored on via keys). */
  ease?: 'inOut' | 'expo' | 'soft' | 'out' | 'linear'
  /** How much this framing backs off on narrow viewports (0 = never, 1 = fully). */
  fit?: number
}

const EASES: Record<NonNullable<CamKey['ease']>, Ease> = {
  inOut: power3InOut,
  expo: expoInOut,
  soft: power2InOut,
  out: power3Out,
  linear,
}

// Vent and clip positions in car space (see Vent.tsx): the "rhyme" framings.
const VENT: V3 = [0.36, 0.86, -0.02]
const CLIP: V3 = [0.343, 0.82, -0.095]
const R = { pos: [-0.78, 1.62, -0.24] as V3, target: VENT, fov: 36, shift: [0.12, 0] as [number, number], fit: 0.35 }
const CLOSE = { pos: [-0.12, 1.05, -0.1] as V3, target: CLIP, fov: 32, shift: [0.1, 0] as [number, number], fit: 0.15 }

/**
 * Desktop camera path. World units are metres; the car sits at the origin
 * facing +X with the driver's side at −Z. The dot map lies on the paper with
 * Istanbul under the car (north = +Z, east = −X); Torino is near (28.6, 0, 7.7).
 */
export const DESKTOP_KEYS: CamKey[] = [
  // 00 Hero — front 3/4, turntable
  { p: 0.0, pos: [5.4, 1.55, -4.6], target: [0, 0.62, 0], fov: 30, shift: [0.12, 0.08], fit: 1 },
  { p: 0.045, pos: [5.0, 1.45, -4.3], target: [0, 0.6, 0], fov: 30, shift: [0.1, 0.06], fit: 1, ease: 'soft' },
  // 01 Snap — over the A-pillar, through the (dissolving) windscreen, into the cabin
  { p: 0.06, pos: [2.4, 2.1, -2.6], target: [0.3, 0.85, -0.1], fov: 32, shift: [0.05, 0.02], fit: 0.8, via: true },
  { p: 0.068, pos: [0.6, 2.05, -1.55], target: [0.3, 0.85, 0], fov: 34, shift: [0.02, 0], fit: 0.5, via: true },
  { p: 0.077, ...R, hold: 0.008 },
  { p: 0.088, ...CLOSE, hold: 0.0115 }, // crack + snap in close-up
  { p: 0.11, pos: [-0.15, 1.25, 0.05], target: [0.1, 0.25, -0.26], fov: 38, shift: [0.2, 0.12], fit: 0.3, hold: 0.012 }, // follow the fall
  { p: 0.128, ...R, hold: 0.014 }, // drooping louvres + annotation
  // 02 Search — out of the car, drift to the side; the phone takes the right half
  { p: 0.17, pos: [1.6, 2.7, -5.0], target: [0.3, 0.8, 0], fov: 34, shift: [-0.2, 0.02], fit: 1, hold: 0.02 },
  // 03 Request — rise until the paper becomes the map
  { p: 0.215, pos: [4, 12, -16], target: [2, 0, 1], fov: 34, shift: [-0.16, 0], fit: 1, via: true },
  { p: 0.258, pos: [6, 30, -28], target: [8, 0, 4], fov: 35, shift: [-0.15, 0], fit: 1, hold: 0.008 },
  { p: 0.29, pos: [15, 62, -36], target: [15, 0, 12], fov: 35, shift: [-0.12, 0], fit: 1, hold: 0.01 },
  // 04 Scan — split screen; the main camera drifts gently over Istanbul
  { p: 0.45, pos: [11, 56, -34], target: [12, 0, 10], fov: 35, shift: [-0.1, 0], fit: 1, ease: 'soft' },
  // 05 Sparkle — follow the arc to Istanbul
  { p: 0.485, pos: [14, 48, -30], target: [14, 0, 6], fov: 35, shift: [-0.1, 0], fit: 1, via: true },
  { p: 0.515, pos: [2, 18, -16], target: [0, 0, 0], fov: 35, shift: [-0.15, 0], fit: 1, hold: 0.007 },
  // 06 Checks + print — glide west over the map, descend to the printer in Torino
  { p: 0.56, pos: [20, 30, -18], target: [24, 0, 6], fov: 35, shift: [0.1, 0], fit: 1, via: true, ease: 'expo' },
  { p: 0.585, pos: [28.4, 4, 3.5], target: [28.6, 0.4, 7.7], fov: 34, fit: 0.8, via: true },
  { p: 0.6, pos: [28.6, 0.55, 6.8], target: [28.6, 0.32, 7.7], fov: 32, fit: 0.5 },
  { p: 0.63, pos: [28.6, 0.42, 7.25], target: [28.6, 0.24, 7.7], fov: 30, fit: 0.3 },
  { p: 0.655, pos: [28.75, 0.36, 7.45], target: [28.6, 0.2, 7.7], fov: 30, fit: 0.3 },
  // 07 Ship
  { p: 0.675, pos: [29.0, 0.7, 6.8], target: [29.3, 0.1, 7.4], fov: 34, fit: 0.5 },
  { p: 0.705, pos: [16, 40, -24], target: [14, 0, 4], fov: 35, fit: 1, ease: 'expo' },
  // 08 Click — back into the cabin: the same framings as the snap
  { p: 0.738, pos: [2.4, 4.5, -6], target: [0.3, 0.8, 0], fov: 34, fit: 0.8, via: true },
  { p: 0.752, ...R, hold: 0.006 },
  { p: 0.768, ...CLOSE, hold: 0.014 },
  { p: 0.795, ...R, hold: 0.08 }, // also the left half during the Ankara split
  // 10 Library — pull far back
  { p: 0.905, pos: [9.5, 4.8, -11.5], target: [0, 1.0, 0], fov: 38, shift: [0.18, 0.04], fit: 1 },
  { p: 0.95, pos: [11, 5.5, -9], target: [0, 1.1, 0], fov: 38, shift: [0.18, 0.04], fit: 1, ease: 'soft' },
  // 11 CTA — parked, golden hour
  { p: 1.0, pos: [6.0, 1.35, -5.2], target: [0, 0.6, 0], fov: 30, shift: [0.14, -0.1], fit: 1 },
]

/**
 * Mobile variant: same stops, wider lens, subject lifted into the upper part
 * of a portrait screen (the phone UI and copy sit below it).
 */
export const MOBILE_KEYS: CamKey[] = DESKTOP_KEYS.map((k) => ({
  ...k,
  fov: k.fov + 10,
  shift: [0, 0.16],
  fit: Math.max(k.fit ?? 1, 0.6),
}))

export interface CamSample {
  pos: Vector3
  quat: Quaternion
  fov: number
  shiftX: number
  shiftY: number
  /** Distance from the camera to what it is framing. */
  dist: number
  fit: number
}

export function createSample(): CamSample {
  return { pos: new Vector3(), quat: new Quaternion(), fov: 35, shiftX: 0, shiftY: 0, dist: 5, fit: 1 }
}

/**
 * Keyframed camera: CatmullRom (centripetal) through the positions, slerp
 * between the look-at orientations. A "move" runs from one stop key to the
 * next and is eased as a whole, passing smoothly through any via keys.
 */
export class CameraPath {
  private readonly keys: CamKey[]
  private readonly curve: CatmullRomCurve3
  private readonly quats: Quaternion[]
  private readonly dists: number[]
  private readonly stops: number[]

  constructor(keys: CamKey[]) {
    this.keys = keys
    const pts = keys.map((k) => new Vector3(...k.pos))
    this.curve = new CatmullRomCurve3(pts, false, 'centripetal')
    const m = new Matrix4()
    const up = new Vector3(0, 1, 0)
    this.quats = keys.map((k, i) => new Quaternion().setFromRotationMatrix(m.lookAt(pts[i], new Vector3(...k.target), up)))
    this.dists = keys.map((k, i) => pts[i].distanceTo(new Vector3(...k.target)))
    this.stops = keys.map((k, i) => (k.via ? -1 : i)).filter((i) => i >= 0)
  }

  sample(p: number, out: CamSample): CamSample {
    const keys = this.keys
    const n = keys.length
    // Before the first or after the last key
    if (p <= keys[0].p) return this.at(0, 0, out)
    if (p >= keys[n - 1].p) return this.at(n - 1, 0, out)

    // Find the move [stopA → stopB] that contains p
    let a = this.stops[0]
    let b = this.stops[this.stops.length - 1]
    for (let s = 0; s < this.stops.length - 1; s++) {
      const i = this.stops[s]
      const j = this.stops[s + 1]
      if (p >= keys[i].p && p < keys[j].p) {
        a = i
        b = j
        break
      }
    }
    const start = keys[a].p + (keys[a].hold ?? 0)
    if (p <= start) return this.at(a, 0, out)

    const ease = EASES[keys[b].ease ?? 'inOut']
    const s = ease(clamp01((p - start) / (keys[b].p - start)))

    // Virtual progress along the move, then the sub-segment (via keys) it falls in
    const pv = lerp(start, keys[b].p, s)
    let k = a
    while (k < b - 1 && pv >= keys[k + 1].p) k++
    const segStart = k === a ? start : keys[k].p
    const local = clamp01((pv - segStart) / (keys[k + 1].p - segStart))
    return this.at(k, local, out)
  }

  /** Pose between key i and key i+1 at fraction f. */
  private at(i: number, f: number, out: CamSample): CamSample {
    const n = this.keys.length
    const j = Math.min(i + 1, n - 1)
    const ki = this.keys[i]
    const kj = this.keys[j]
    this.curve.getPoint((i + f) / (n - 1), out.pos)
    out.quat.slerpQuaternions(this.quats[i], this.quats[j], f)
    out.fov = lerp(ki.fov, kj.fov, f)
    out.shiftX = lerp(ki.shift?.[0] ?? 0, kj.shift?.[0] ?? 0, f)
    out.shiftY = lerp(ki.shift?.[1] ?? 0, kj.shift?.[1] ?? 0, f)
    out.dist = lerp(this.dists[i], this.dists[j], f)
    out.fit = lerp(ki.fit ?? 1, kj.fit ?? 1, f)
    return out
  }
}
