import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { hash01 } from '../lib/remap'
import { CLIP_MM, clipGeometries } from './clipGeometry'

/**
 * Helpers around the hero part (millimetre space): surface-sampled point
 * cloud for the scan, a faceted "raw scan" mesh, and dimension lines.
 */
export { CLIP_MM, clipGeometries }

const pointCache = new Map<number, BufferGeometry>()

/** `count` points on the clip's surface (MeshSurfaceSampler), with a random per point. */
export function clipPointCloud(count: number): BufferGeometry {
  const hit = pointCache.get(count)
  if (hit) return hit
  const mesh = new Mesh(clipGeometries().intact, new MeshBasicMaterial())
  const sampler = new MeshSurfaceSampler(mesh)
  // deterministic cloud (same points on every load); the typings lack this method
  ;(sampler as unknown as { setRandomGenerator(f: () => number): void }).setRandomGenerator(seeded(7))
  sampler.build()
  const pos = new Float32Array(count * 3)
  const rnd = new Float32Array(count)
  const p = new Vector3()
  for (let i = 0; i < count; i++) {
    sampler.sample(p)
    pos.set([p.x, p.y, p.z], i * 3)
    rnd[i] = hash01(i * 3.7 + 1.3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aRand', new Float32BufferAttribute(rnd, 1))
  pointCache.set(count, g)
  return g
}

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

let facetCache: BufferGeometry | null = null

/** The raw scan: vertices jittered by ~0.15 mm and flat-shaded, so it reads as a faceted mesh. */
export function clipFaceted(): BufferGeometry {
  if (facetCache) return facetCache
  const src = clipGeometries().intact.clone()
  src.deleteAttribute('normal')
  src.deleteAttribute('uv')
  const merged = mergeVertices(src, 1e-3)
  const pos = merged.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const h = hash01(x * 12.9898 + y * 78.233 + z * 37.719)
    const k = 0.18 * (h - 0.5)
    pos.setXYZ(i, x + k, y - k * 0.7, z + k * 0.5)
  }
  const flat = merged.toNonIndexed()
  flat.computeVertexNormals()
  facetCache = flat
  return flat
}

export interface Dimension {
  key: 'width' | 'pin' | 'tab'
  /** Line segments (pairs of points), mm. */
  segments: number[]
  /** Where the label sits, mm. */
  label: [number, number, number]
}

/** Dimension lines on the front face (z = +depth/2): 14.8 width, Ø 6.2 pin, 2.0 tab. */
export function clipDimensions(): Dimension[] {
  const z = CLIP_MM.depth / 2 + 0.05
  const a = 0.7 // arrowhead size
  const arrowsH = (x0: number, x1: number, y: number) => [
    x0, y, z, x0 + a, y + a * 0.5, z,
    x0, y, z, x0 + a, y - a * 0.5, z,
    x1, y, z, x1 - a, y + a * 0.5, z,
    x1, y, z, x1 - a, y - a * 0.5, z,
  ]
  const arrowsV = (x: number, y0: number, y1: number) => [
    x, y0, z, x + a * 0.5, y0 - a, z,
    x, y0, z, x - a * 0.5, y0 - a, z,
    x, y1, z, x + a * 0.5, y1 + a, z,
    x, y1, z, x - a * 0.5, y1 + a, z,
  ]
  const w = CLIP_MM.width / 2
  const yW = -CLIP_MM.height / 2 - 2.2
  const pinR = CLIP_MM.pinD / 2
  const yP = CLIP_MM.height / 2 + CLIP_MM.pinH + 1.6
  const xT = -11.4 - 1.6
  return [
    {
      key: 'width',
      segments: [
        -w, -CLIP_MM.height / 2 - 0.4, z, -w, yW - 0.8, z,
        w, -CLIP_MM.height / 2 - 0.4, z, w, yW - 0.8, z,
        -w, yW, z, w, yW, z,
        ...arrowsH(-w, w, yW),
      ],
      label: [0, yW - 1.8, z],
    },
    {
      key: 'pin',
      segments: [
        CLIP_MM.pinX - pinR, CLIP_MM.height / 2 + CLIP_MM.pinH + 0.3, z, CLIP_MM.pinX - pinR, yP + 0.8, z,
        CLIP_MM.pinX + pinR, CLIP_MM.height / 2 + CLIP_MM.pinH + 0.3, z, CLIP_MM.pinX + pinR, yP + 0.8, z,
        CLIP_MM.pinX - pinR, yP, z, CLIP_MM.pinX + pinR, yP, z,
        ...arrowsH(CLIP_MM.pinX - pinR, CLIP_MM.pinX + pinR, yP),
      ],
      label: [CLIP_MM.pinX, yP + 1.6, z],
    },
    {
      key: 'tab',
      segments: [
        -11.0, 1, z, xT - 0.9, 1, z,
        -11.0, -1, z, xT - 0.9, -1, z,
        xT, -1, z, xT, 1, z,
        ...arrowsV(xT, 1, -1),
      ],
      label: [xT - 2.4, 0, z],
    },
  ]
}
