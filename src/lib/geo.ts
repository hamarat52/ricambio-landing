import { CITIES, NUMBERS, WANTING_CITIES } from '../content'
import { hash01 } from './remap'

/**
 * Low-resolution land mask for Europe and Turkey (hand-simplified coast
 * polygons, [lon, lat]) and the projection onto the paper: Istanbul sits at
 * the origin under the car, north is +Z and east is −X.
 */
type LL = [number, number]

const MAINLAND: LL[] = [
  // Gibraltar, Atlantic coast north
  [-5.6, 36.0], [-6.3, 36.5], [-7.4, 37.2], [-8.9, 37.0], [-8.8, 38.5], [-9.5, 38.8], [-8.9, 40.2], [-8.8, 41.8],
  [-9.3, 42.9], [-8.0, 43.7], [-5.8, 43.6], [-3.8, 43.5], [-1.8, 43.4], [-1.4, 44.6], [-1.2, 46.2], [-2.2, 47.2],
  [-4.7, 47.8], [-4.8, 48.4], [-3.5, 48.8], [-1.6, 48.7], [-1.6, 49.7], [0.1, 49.4], [1.6, 50.2], [1.6, 50.9],
  [3.2, 51.3], [4.0, 51.9], [4.7, 52.9], [6.8, 53.4], [8.6, 53.9], [8.6, 55.0], [8.1, 55.6], [8.2, 56.8],
  [10.6, 57.7], [10.3, 56.5], [9.8, 54.8], [10.9, 54.4], [12.3, 54.2], [14.2, 53.9], [16.5, 54.5], [18.6, 54.6],
  [19.8, 54.4], [21.1, 55.7], [21.0, 56.8], [22.0, 57.6], [24.1, 57.0], [24.4, 58.4], [23.4, 59.0], [24.7, 59.5],
  [28.0, 59.5], [30.3, 59.9],
  // Finland's south and west coast, then the map's north edge
  [27.5, 60.5], [25.0, 60.2], [22.9, 59.8], [21.4, 60.6], [21.3, 61.9], [21.3, 62.0], [45.0, 62.0],
  // East edge down to the Levant
  [45.0, 34.0], [35.9, 34.0], [35.9, 34.5], [35.8, 35.5], [36.2, 36.6], [35.9, 36.8],
  // Turkey: south coast west, Aegean north
  [35.3, 36.6], [34.6, 36.8], [33.6, 36.2], [32.5, 36.1], [31.5, 36.7], [30.7, 36.85], [30.5, 36.3], [29.6, 36.2],
  [29.1, 36.7], [28.2, 36.8], [27.4, 37.0], [27.2, 37.6], [26.4, 38.3], [26.9, 38.5], [26.8, 39.3], [26.2, 39.5],
  [26.2, 39.9],
  // Marmara (Asian side) to the Bosphorus, Black Sea south coast east
  [27.5, 40.4], [29.0, 40.4], [29.9, 40.75], [29.15, 40.95], [29.15, 41.2], [30.4, 41.2], [31.4, 41.3], [32.4, 41.8],
  [33.3, 42.0], [35.1, 42.05], [36.3, 41.4], [37.0, 41.2], [38.4, 40.95], [39.7, 41.0], [41.0, 41.3], [41.6, 41.6],
  [41.7, 42.1], [41.1, 42.8], [39.7, 43.6], [37.8, 44.7], [36.6, 45.3],
  // Crimea and the north-west Black Sea coast
  [35.0, 44.8], [34.2, 44.45], [33.5, 44.5], [33.4, 45.2], [32.5, 45.4], [33.6, 46.1], [31.9, 46.6], [30.7, 46.5],
  [30.0, 45.8], [29.6, 45.2], [28.7, 44.2], [28.0, 43.2], [27.5, 42.5], [28.0, 41.7], [29.0, 41.25],
  // Bosphorus (European side), Marmara north, Thrace, Greece
  [29.0, 41.0], [28.0, 41.0], [27.5, 40.97], [26.6, 40.4], [26.2, 40.3], [26.6, 40.6], [26.0, 40.8], [24.4, 40.9],
  [23.7, 40.2], [22.9, 40.6], [22.6, 40.0], [22.9, 39.4], [23.3, 38.6], [24.0, 38.2], [23.7, 37.9], [23.2, 37.4],
  [22.7, 36.8], [23.1, 36.4], [22.5, 36.4], [22.1, 36.8], [21.7, 36.8], [21.6, 37.6], [21.3, 38.1], [20.7, 38.8],
  // Adriatic
  [20.2, 39.6], [19.4, 40.4], [19.5, 41.3], [19.3, 42.0], [18.6, 42.4], [18.1, 42.6], [16.4, 43.5], [15.2, 44.1],
  [14.4, 45.3], [13.9, 44.8], [13.6, 45.1], [13.7, 45.7], [12.3, 45.4], [12.3, 44.4], [13.5, 43.6], [14.2, 42.5],
  [16.0, 41.9], [16.9, 41.1], [17.9, 40.6], [18.5, 40.1], [17.9, 40.0], [17.2, 40.4], [16.6, 39.6], [17.1, 39.0],
  [16.1, 38.0], [15.7, 37.95],
  // Italy's west coast north, the Riviera, Spain's Mediterranean coast
  [15.6, 38.3], [15.8, 39.6], [15.6, 40.1], [14.9, 40.4], [14.2, 40.8], [13.6, 41.2], [12.2, 41.75], [11.2, 42.4],
  [10.5, 43.0], [10.3, 43.6], [9.9, 44.1], [8.9, 44.4], [8.0, 43.9], [7.4, 43.7], [6.6, 43.2], [5.4, 43.2],
  [4.8, 43.4], [3.5, 43.3], [3.1, 42.5], [3.2, 41.9], [2.2, 41.4], [0.9, 41.0], [0.6, 40.6], [-0.3, 39.5],
  [0.2, 38.8], [-0.5, 38.3], [-0.8, 37.6], [-1.9, 36.9], [-2.9, 36.7], [-4.4, 36.7], [-5.3, 36.1],
]

const SCANDINAVIA: LL[] = [
  [17.5, 62.0], [17.3, 61.0], [17.1, 60.7], [18.9, 59.9], [18.9, 59.4], [16.9, 58.5], [16.6, 57.5], [16.0, 56.2],
  [14.2, 55.4], [12.9, 55.4], [12.7, 56.2], [11.9, 57.7], [11.2, 58.9], [10.7, 59.9], [10.2, 59.0], [8.0, 58.1],
  [5.6, 58.9], [5.0, 60.4], [5.0, 61.9], [5.2, 62.0],
]

const BRITAIN: LL[] = [
  [-5.7, 50.1], [-4.2, 50.4], [-3.0, 50.7], [-1.0, 50.7], [1.4, 51.1], [1.7, 52.7], [0.3, 53.5], [-0.5, 54.5],
  [-1.5, 55.3], [-2.0, 55.8], [-2.6, 56.0], [-2.4, 56.6], [-2.0, 57.1], [-1.8, 57.6], [-4.0, 57.6], [-3.1, 58.6],
  [-5.0, 58.6], [-5.7, 57.6], [-5.6, 56.5], [-5.6, 55.3], [-4.9, 54.8], [-3.0, 54.9], [-3.5, 54.4], [-3.0, 53.8],
  [-3.0, 53.4], [-4.6, 53.3], [-4.1, 52.5], [-5.2, 51.8], [-4.2, 51.6], [-3.0, 51.2], [-4.2, 51.2], [-5.0, 50.6],
]

const IRELAND: LL[] = [
  [-6.0, 52.2], [-6.1, 53.3], [-6.2, 54.0], [-5.6, 54.6], [-6.2, 55.2], [-7.3, 55.3], [-8.3, 55.1], [-8.6, 54.3],
  [-10.0, 54.2], [-9.6, 53.3], [-10.3, 52.0], [-9.6, 51.6], [-8.2, 51.8], [-7.0, 52.1],
]

const NORTH_AFRICA: LL[] = [
  [-6.8, 34.0], [-5.9, 35.8], [-5.3, 35.9], [-3.0, 35.3], [-1.9, 35.1], [-0.6, 35.7], [3.0, 36.8], [5.1, 36.8],
  [7.0, 37.0], [8.6, 36.9], [9.8, 37.3], [10.3, 36.9], [11.0, 37.1], [10.6, 36.4], [11.1, 35.5], [10.7, 34.7],
  [10.6, 34.0],
]

const ISLANDS: LL[][] = [
  // Sicily
  [[12.4, 37.8], [13.3, 38.2], [14.5, 38.05], [15.6, 38.3], [15.3, 37.5], [15.1, 36.7], [14.3, 36.9], [12.6, 37.6]],
  // Sardinia
  [[8.4, 39.0], [9.2, 39.2], [9.6, 39.6], [9.8, 40.5], [9.6, 41.0], [9.2, 41.25], [8.2, 41.0], [8.3, 40.6], [8.4, 39.8]],
  // Corsica
  [[8.6, 41.4], [9.4, 41.6], [9.5, 42.6], [9.4, 43.0], [8.7, 42.6], [8.6, 41.9]],
  // Crete
  [[23.5, 35.3], [24.5, 35.4], [25.6, 35.3], [26.3, 35.2], [26.1, 35.0], [24.8, 34.9], [23.6, 35.2]],
  // Cyprus
  [[32.3, 34.8], [33.0, 34.6], [34.0, 35.0], [34.6, 35.7], [33.5, 35.4], [32.5, 35.1]],
  // Zealand
  [[10.9, 55.0], [12.6, 55.2], [12.6, 56.1], [11.0, 55.9]],
]

const POLYGONS: LL[][] = [MAINLAND, SCANDINAVIA, BRITAIN, IRELAND, NORTH_AFRICA, ...ISLANDS]

function inside(poly: LL[], lon: number, lat: number): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

export function isLand(lon: number, lat: number): boolean {
  for (const p of POLYGONS) if (inside(p, lon, lat)) return true
  return false
}

// ─── Projection onto the paper ──────────────────────────────────────────────

const ORIGIN = CITIES.istanbul
/** World units per degree of latitude; longitude is scaled by cos(45°). */
export const MAP_K = 1.9
const LON_K = MAP_K * Math.cos((45 * Math.PI) / 180)

export function project(lon: number, lat: number): [number, number] {
  return [-(lon - ORIGIN.lon) * LON_K, (lat - ORIGIN.lat) * MAP_K]
}

export function unproject(x: number, z: number): [number, number] {
  return [ORIGIN.lon - x / LON_K, ORIGIN.lat + z / MAP_K]
}

export const MAP_BOUNDS = { lonMin: -11, lonMax: 45, latMin: 34, latMax: 62 }
export const DOT_SPACING = 0.8

let dotsCache: Float32Array | null = null

/** Land dots on a square world-space grid: [x, z, distance-from-Istanbul, …]. */
export function landDots(): Float32Array {
  if (dotsCache) return dotsCache
  const [x0] = project(MAP_BOUNDS.lonMax, 0)
  const [x1] = project(MAP_BOUNDS.lonMin, 0)
  const [, z0] = project(0, MAP_BOUNDS.latMin)
  const [, z1] = project(0, MAP_BOUNDS.latMax)
  const out: number[] = []
  for (let x = Math.ceil(x0 / DOT_SPACING) * DOT_SPACING; x <= x1; x += DOT_SPACING) {
    for (let z = Math.ceil(z0 / DOT_SPACING) * DOT_SPACING; z <= z1; z += DOT_SPACING) {
      const [lon, lat] = unproject(x, z)
      if (isLand(lon, lat)) out.push(x, z, Math.hypot(x, z))
    }
  }
  dotsCache = new Float32Array(out)
  return dotsCache
}

// ─── Owners who want the part (Scene 03) ────────────────────────────────────

export interface Owner {
  x: number
  z: number
  /** Activation time in the request scene's local time. */
  t: number
  /** Named city key, or null for an unlabelled owner. */
  city: string | null
}

let ownersCache: Owner[] | null = null

/**
 * Everyone besides Emre who asks for the clip: the named cities from
 * content.ts plus unlabelled owners on random land dots, so that the total
 * (with Emre) is NUMBERS.ownersWanting.
 */
export function owners(): Owner[] {
  if (ownersCache) return ownersCache
  const extra = Math.max(0, NUMBERS.ownersWanting - 1 - WANTING_CITIES.length)
  const dots = landDots()
  const picks: Owner[] = []
  let seed = 11
  while (picks.length < extra) {
    const i = Math.floor(hash01(seed++) * (dots.length / 3)) * 3
    const x = dots[i]
    const z = dots[i + 1]
    if (Math.hypot(x, z) < 5) continue
    if (picks.some((p) => Math.hypot(p.x - x, p.z - z) < 2.4)) continue
    picks.push({ x, z, t: 0, city: null })
  }
  const named: Owner[] = WANTING_CITIES.map((c) => {
    const [x, z] = project(c.lon, c.lat)
    return { x, z, t: 0, city: c.key }
  })
  // Interleave: a named city roughly every third pop, spread over [0.7, 0.92].
  const all: Owner[] = []
  let n = 0
  let e = 0
  while (n < named.length || e < picks.length) {
    if (n < named.length && (e >= picks.length || all.length % 3 === 0)) all.push(named[n++])
    else all.push(picks[e++])
  }
  all.forEach((o, i) => {
    o.t = 0.7 + (0.22 * i) / Math.max(1, all.length - 1)
  })
  ownersCache = all
  return all
}
