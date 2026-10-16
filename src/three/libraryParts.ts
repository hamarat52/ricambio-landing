import { BufferGeometry, CylinderGeometry, ExtrudeGeometry, LatheGeometry, Path, Shape, TorusGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { clipGeometries } from './clipGeometry'

/**
 * Procedural, low-poly micro-parts for the library constellation, built in
 * millimetres and centred. Generic shapes: none copies a real OEM part.
 */
export type PartKind =
  | 'louvre'
  | 'visorClip'
  | 'switchLug'
  | 'flapGear'
  | 'handleBezel'
  | 'gloveLatch'
  | 'tweeterGrille'
  | 'cableClip'
  | 'knob'
  | 'firTree'
  | 'bracket'
  | 'ventClip'

function extrude(s: Shape, depth: number, bevel = 0.4): BufferGeometry {
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 1, curveSegments: 10 })
  g.translate(0, 0, -depth / 2)
  g.computeBoundingBox()
  const bb = g.boundingBox!
  g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0)
  return g.index ? g.toNonIndexed() : g
}

function poly(points: [number, number][]): Shape {
  const s = new Shape()
  s.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) s.lineTo(x, y)
  s.closePath()
  return s
}

function roundRect(w: number, h: number, r: number, x = -w / 2, y = -h / 2, s: Path = new Shape()): Path {
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function circle(r: number, x = 0, y = 0, cw = false): Path {
  const p = new Path()
  p.absarc(x, y, r, 0, Math.PI * 2, cw)
  return p
}

const build: Record<PartKind, () => BufferGeometry> = {
  // airfoil blade with pivot pins
  louvre: () => {
    const s = new Shape()
    s.moveTo(-5, 0)
    s.quadraticCurveTo(-2, 1.6, 5, 0.3)
    s.lineTo(5, -0.3)
    s.quadraticCurveTo(-2, -0.9, -5, 0)
    const blade = extrude(s, 60, 0.2)
    blade.rotateY(Math.PI / 2)
    const pin = new CylinderGeometry(1.2, 1.2, 70, 10)
    pin.rotateZ(Math.PI / 2)
    return mergeGeometries([blade, pin.toNonIndexed()].map((g) => (g.clearGroups(), g)))!
  },
  visorClip: () => {
    const s = poly([[-6, -8], [6, -8], [6, 4], [2, 8], [-2, 8], [-2, 4], [2, 2], [2, -4], [-6, -4]])
    s.holes.push(circle(1.6, -2, -6, true))
    return extrude(s, 10)
  },
  switchLug: () => {
    const s = roundRect(16, 10, 2) as Shape
    const tab = poly([[-3, 5], [3, 5], [2, 9], [-2, 9]])
    const a = extrude(s, 6)
    const b = extrude(tab, 3)
    b.translate(0, 7, 0)
    return mergeGeometries([a, b].map((g) => (g.clearGroups(), g)))!
  },
  flapGear: () => {
    const teeth = 14
    const s = new Shape()
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2
      const r = i % 2 === 0 ? 10 : 8.6
      const a0 = a - Math.PI / (teeth * 2) * 0.6
      const a1 = a + Math.PI / (teeth * 2) * 0.6
      if (i === 0) s.moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
      else s.lineTo(Math.cos(a0) * r, Math.sin(a0) * r)
      s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r)
    }
    s.holes.push(circle(2.4, 0, 0, true))
    return extrude(s, 4, 0.3)
  },
  handleBezel: () => {
    const s = roundRect(30, 14, 5) as Shape
    s.holes.push(roundRect(22, 7, 3, -11, -3.5, new Path()) as Path)
    return extrude(s, 3)
  },
  gloveLatch: () => {
    const s = poly([[-10, -4], [6, -4], [10, 0], [10, 4], [6, 4], [6, 1], [-6, 1], [-6, 6], [-10, 6]])
    return extrude(s, 6)
  },
  tweeterGrille: () => {
    const s = new Shape()
    s.absarc(0, 0, 12, 0, Math.PI * 2, false)
    for (let ring = 1; ring <= 3; ring++) {
      const n = ring * 6
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        s.holes.push(circle(0.9, Math.cos(a) * ring * 3, Math.sin(a) * ring * 3, true))
      }
    }
    return extrude(s, 1.6, 0.2)
  },
  cableClip: () => {
    const ring = new TorusGeometry(5, 1.2, 8, 20, Math.PI * 1.7).toNonIndexed()
    const tab = extrude(roundRect(8, 10, 1.5) as Shape, 2.4)
    tab.translate(6, -7, 0)
    return mergeGeometries([ring, tab].map((g) => (g.clearGroups(), g)))!
  },
  knob: () => {
    const prof = [
      [0, 0],
      [9, 0],
      [9.4, 1],
      [9.4, 7],
      [8.4, 9],
      [0, 9.4],
    ].map(([x, y]) => new Vector2(x, y))
    const g = new LatheGeometry(prof, 18).toNonIndexed()
    g.translate(0, -4.7, 0)
    g.rotateX(Math.PI / 2)
    return g
  },
  firTree: () => {
    const prof: Vector2[] = [new Vector2(0, 0)]
    for (let i = 0; i < 5; i++) {
      prof.push(new Vector2(2.2, i * 3), new Vector2(4.2, i * 3 + 0.6), new Vector2(2.2, i * 3 + 2.6))
    }
    prof.push(new Vector2(2.2, 16), new Vector2(7, 16), new Vector2(7, 17.5), new Vector2(0, 17.5))
    const g = new LatheGeometry(prof, 12).toNonIndexed()
    g.translate(0, -8.75, 0)
    return g
  },
  bracket: () => {
    const s = poly([[-10, -8], [10, -8], [10, -4], [-6, -4], [-6, 10], [-10, 10]])
    s.holes.push(circle(1.4, 4, -6, true), circle(1.4, -8, 4, true))
    return extrude(s, 8)
  },
  ventClip: () => {
    const g = clipGeometries().intact.clone()
    g.clearGroups()
    return g
  },
}

const cache = new Map<PartKind, BufferGeometry>()

export function partGeometry(kind: PartKind): BufferGeometry {
  let g = cache.get(kind)
  if (!g) {
    g = build[kind]()
    g.computeVertexNormals()
    cache.set(kind, g)
  }
  return g
}

export const PART_KINDS: PartKind[] = [
  'louvre',
  'visorClip',
  'switchLug',
  'flapGear',
  'handleBezel',
  'gloveLatch',
  'tweeterGrille',
  'cableClip',
  'knob',
  'firTree',
  'bracket',
  'ventClip',
]
