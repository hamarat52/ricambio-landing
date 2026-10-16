import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Shape, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The hero part: an AC vent mounting clip, modelled in millimetres.
 * C-shaped profile with snap barbs, a 2.0 mm tab (the calipers measure it)
 * and a Ø 6.2 locating pin, extruded 8 mm with small fillets and a 1.5° draft.
 * The broken version splits along a jagged crack across the top wall.
 */
export const CLIP_MM = {
  width: 14.8,
  height: 10,
  wall: 2.0,
  depth: 8,
  pinD: 6.2,
  pinH: 3.2,
  pinX: -2,
  tab: 2.0,
} as const

type XY = [number, number]

const CRACK: XY[] = [
  [2.3, 3.0],
  [2.85, 3.45],
  [2.4, 3.95],
  [3.05, 4.45],
  [2.7, 5.0],
]

// Outline traced counter-clockwise from the bottom-left outer corner.
const BOTTOM_AND_LEFT: XY[] = [
  [-7.4, -5],
  [7.4, -5],
  [7.4, -1.75],
  [6.6, -1.75],
  [6.0, -3],
  [-5.4, -3],
  [-5.4, 3],
]
const TOP_RIGHT_BARB: XY[] = [
  [6.0, 3],
  [6.6, 1.75],
  [7.4, 1.75],
  [7.4, 5],
]
const TOP_AND_TAB: XY[] = [
  [-7.4, 5],
  [-7.4, 1.0],
  [-11.4, 1.0],
  [-11.4, -1.0],
  [-7.4, -1.0],
]

function shape(points: XY[]): Shape {
  const s = new Shape()
  s.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) s.lineTo(x, y)
  s.closePath()
  return s
}

const BEVEL = { t: 0.5, s: 0.4 }

function extrudeMM(s: Shape): BufferGeometry {
  const depth = CLIP_MM.depth - 2 * BEVEL.t
  const g = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: BEVEL.t,
    bevelSize: BEVEL.s,
    bevelSegments: 2,
    curveSegments: 8,
  })
  g.translate(0, 0, -depth / 2)
  applyDraft(g)
  return g
}

/** Injection-moulding draft: the part narrows by ~1.5° toward the back face. */
function applyDraft(g: BufferGeometry) {
  const pos = g.getAttribute('position')
  const half = CLIP_MM.depth / 2
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    const k = 1 - 0.026 * ((half - z) / CLIP_MM.depth)
    pos.setXY(i, pos.getX(i) * k, pos.getY(i) * k)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
}

/** Locating pin: lathe with a base fillet and a chamfered tip, standing on the top wall. */
function pinGeometry(): BufferGeometry {
  const r = CLIP_MM.pinD / 2
  const h = CLIP_MM.pinH
  const prof = [
    [0, 0],
    [r + 0.6, 0],
    [r + 0.15, 0.25],
    [r, 0.6],
    [r - 0.08, h - 0.5],
    [r - 0.5, h],
    [0, h],
  ].map(([x, y]) => new Vector2(x, y))
  const g = new LatheGeometry(prof, 32)
  g.translate(CLIP_MM.pinX, CLIP_MM.height / 2 - 0.1, 0)
  return g
}

function withPin(body: BufferGeometry): BufferGeometry {
  const a = body.index ? body.toNonIndexed() : body
  const b = pinGeometry().toNonIndexed()
  // ExtrudeGeometry has a `uv` attribute and groups; drop groups so merge works with one material.
  a.clearGroups()
  b.clearGroups()
  return mergeGeometries([a, b])!
}

export interface ClipGeometries {
  /** Intact clip (body + pin), millimetres, centred on the C. */
  intact: BufferGeometry
  /** Broken: the large piece (with tab and pin) and the small barb piece. */
  pieceA: BufferGeometry
  pieceB: BufferGeometry
  /** Crack polyline on the front face, as a flat xyz array (mm). */
  crack: Float32BufferAttribute
  /** Centre of each broken piece (mm), used as its pivot. */
  centreA: XY
  centreB: XY
}

let cache: ClipGeometries | null = null

export function clipGeometries(): ClipGeometries {
  if (cache) return cache
  // Intact outline: bottom, left inner wall, top inner surface to the barb, top edge, tab.
  const intactOutline: XY[] = [...BOTTOM_AND_LEFT, ...TOP_RIGHT_BARB, ...TOP_AND_TAB]
  const aOutline: XY[] = [...BOTTOM_AND_LEFT, ...CRACK, ...TOP_AND_TAB]
  const bOutline: XY[] = [...TOP_RIGHT_BARB, ...[...CRACK].reverse()]

  const centreA: XY = [-1.5, 0]
  const centreB: XY = [5.0, 3.6]

  const pieceA = withPin(extrudeMM(shape(aOutline)))
  pieceA.translate(-centreA[0], -centreA[1], 0)
  const pieceB = extrudeMM(shape(bOutline))
  pieceB.clearGroups()
  pieceB.translate(-centreB[0], -centreB[1], 0)

  const zFront = CLIP_MM.depth / 2 + 0.02
  const crack = new Float32BufferAttribute(CRACK.flatMap(([x, y]) => [x, y, zFront]), 3)

  cache = {
    intact: withPin(extrudeMM(shape(intactOutline))),
    pieceA,
    pieceB,
    crack,
    centreA,
    centreB,
  }
  return cache
}
