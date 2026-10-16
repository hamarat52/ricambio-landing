import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Path,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  CatmullRomCurve3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * Procedural, badge-free compact hatchback (c. 2000). Not a replica of any
 * real model: generic wedge profile, horizontal-slot nose, generic 5-spoke
 * wheels. Metres; front at +X, driver's side (LHD) at −Z, wheels on y = 0.
 */
export const CAR = {
  width: 1.7,
  frontAxle: 1.32,
  rearAxle: -1.22,
  wheelR: 0.3,
  wheelZ: 0.725,
  archR: 0.44, // inset radius; final arch ≈ 0.37
  belt: 0.95,
} as const

type XY = [number, number]

function extrude(shape: Shape, width: number, thickness: number, size: number, segments = 4, curveSegments = 24, steps = 1) {
  const depth = Math.max(0.001, width - 2 * thickness)
  const g = new ExtrudeGeometry(shape, {
    depth,
    steps,
    bevelEnabled: thickness > 0,
    bevelThickness: thickness,
    bevelSize: size,
    bevelSegments: segments,
    curveSegments,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

type TriTest = (cx: number, cy: number, cz: number, ny: number) => boolean

/**
 * Drop triangles (by centroid and face normal) from a non-indexed geometry.
 * Used to open the body into a tub so the cabin can be seen when the roof is
 * cut away.
 */
function removeTriangles(g: BufferGeometry, drop: TriTest): BufferGeometry {
  const src = g.index ? g.toNonIndexed() : g
  const names = Object.keys(src.attributes)
  const pos = src.getAttribute('position')
  const keep: number[] = []
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t)
    b.fromBufferAttribute(pos, t + 1)
    c.fromBufferAttribute(pos, t + 2)
    const cx = (a.x + b.x + c.x) / 3
    const cy = (a.y + b.y + c.y) / 3
    const cz = (a.z + b.z + c.z) / 3
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize()
    if (!drop(cx, cy, cz, n.y)) keep.push(t)
  }
  const out = new BufferGeometry()
  for (const name of names) {
    const attr = src.getAttribute(name)
    const size = attr.itemSize
    const arr = new Float32Array(keep.length * 3 * size)
    keep.forEach((t, i) => {
      for (let v = 0; v < 3; v++) for (let k = 0; k < size; k++) arr[(i * 3 + v) * size + k] = attr.array[(t + v) * size + k]
    })
    out.setAttribute(name, new Float32BufferAttribute(arr, size))
  }
  return out
}

/** Lower body as an open tub: the belt-line "lid" over the cabin is removed. */
function lowerBodyGeometry() {
  const g = extrude(lowerBodyShape(), CAR.width, 0.1, 0.07, 6, 24, 28)
  return removeTriangles(g, (cx, cy, cz, ny) => ny > 0.6 && cx > -1.88 && cx < 0.78 && Math.abs(cz) < 0.67 && cy > 0.84)
}

/** Greenhouse without its floor (open-bottom glass shell). */
function greenhouseGeometry() {
  const g = extrude(greenhouseShape(), 1.4, 0.08, 0.06, 5)
  return removeTriangles(g, (_cx, cy, _cz, ny) => ny < -0.9 && cy < 0.86)
}

function shapeFrom(points: XY[], smooth = false): Shape {
  const s = new Shape()
  s.moveTo(points[0][0], points[0][1])
  if (smooth) s.splineThru(points.slice(1).map(([x, y]) => new Vector2(x, y)))
  else for (const [x, y] of points.slice(1)) s.lineTo(x, y)
  return s
}

// ─── Body ───────────────────────────────────────────────────────────────────

/** Lower body side profile (inset by the 0.07 bevel), with both wheel arches. */
function lowerBodyShape(): Shape {
  const yb = 0.29
  const R = CAR.archR
  const s = new Shape()
  s.moveTo(-2.03, yb)
  s.lineTo(CAR.rearAxle - R, yb)
  s.absarc(CAR.rearAxle, 0.3, R, Math.PI, 0, true)
  s.lineTo(CAR.frontAxle - R, yb)
  s.absarc(CAR.frontAxle, 0.3, R, Math.PI, 0, true)
  s.lineTo(1.99, yb)
  s.quadraticCurveTo(2.07, yb, 2.07, 0.4)
  s.lineTo(2.07, 0.55)
  s.quadraticCurveTo(2.065, 0.655, 1.93, 0.685) // bonnet leading edge
  s.quadraticCurveTo(1.38, 0.8, 0.8, 0.865) // bonnet
  s.lineTo(-1.86, 0.925) // rising wedge beltline
  s.quadraticCurveTo(-2.05, 0.93, -2.07, 0.8)
  s.lineTo(-2.07, 0.42)
  s.quadraticCurveTo(-2.07, yb, -2.03, yb)
  return s
}

/** Greenhouse top line (inset by its 0.06 bevel): windscreen → roof → hatch glass. */
const GH_TOP: XY[] = [
  [0.8, 0.92],
  [0.6, 1.02],
  [0.4, 1.115],
  [0.2, 1.2],
  [0.03, 1.272],
  [-0.12, 1.318],
  [-0.32, 1.346],
  [-0.6, 1.355],
  [-0.9, 1.35],
  [-1.15, 1.334],
  [-1.35, 1.298],
  [-1.5, 1.245],
  [-1.66, 1.16],
  [-1.8, 1.07],
  [-1.93, 0.97],
]

function greenhouseShape(): Shape {
  return shapeFrom([[0.78, 0.86], ...GH_TOP, [-1.93, 0.86]], false)
}

/** Body-coloured roof cap that sits 12 mm proud of the glass. */
function roofShape(): Shape {
  const top = GH_TOP.filter(([x]) => x <= 0.05 && x >= -1.4).map(([x, y]) => [x, y + 0.012] as XY)
  const pts: XY[] = [[top[0][0] + 0.02, 1.2], ...top, [-1.42, 1.2]]
  return shapeFrom(pts)
}

/** Hatchback C-pillar panel (final coordinates), applied on the side glass. */
function cPillarShape(): Shape {
  return shapeFrom([
    [-1.2, 0.965],
    [-1.98, 0.99],
    [-1.86, 1.1],
    [-1.7, 1.21],
    [-1.52, 1.3],
    [-1.36, 1.345],
    [-1.3, 1.345],
  ])
}

// ─── Wheels ─────────────────────────────────────────────────────────────────

function tireGeometry() {
  const prof = [
    [0.205, -0.088],
    [0.25, -0.097],
    [0.288, -0.094],
    [0.3, -0.07],
    [0.303, 0],
    [0.3, 0.07],
    [0.288, 0.094],
    [0.25, 0.097],
    [0.205, 0.088],
  ].map(([r, y]) => new Vector2(r, y))
  const g = new LatheGeometry(prof, 48)
  g.rotateX(Math.PI / 2) // axis → Z
  return g
}

/** Generic straight 5-spoke face. */
function wheelFaceGeometry() {
  const outer = 0.205
  const s = new Shape()
  s.absarc(0, 0, outer, 0, Math.PI * 2, false)
  const spokeHalf = 0.028
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2 + Math.PI / 2
    const a1 = a0 + (Math.PI * 2) / 5
    const rIn = 0.07
    const rOut = 0.178
    const h = new Path()
    const da0 = spokeHalf / rOut
    const da1 = spokeHalf / rIn
    h.absarc(0, 0, rOut, a0 + da0, a1 - da0, false)
    h.absarc(0, 0, rIn, a1 - da1, a0 + da1, true)
    h.closePath()
    s.holes.push(h)
  }
  const g = new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2, curveSegments: 40 })
  return g
}

function rimBarrelGeometry() {
  const g = new CylinderGeometry(0.2, 0.2, 0.17, 40, 1, true)
  g.rotateX(Math.PI / 2)
  return g
}

function hubGeometry() {
  const g = new CylinderGeometry(0.05, 0.058, 0.03, 24)
  g.rotateX(Math.PI / 2)
  return g
}

// ─── Interior ───────────────────────────────────────────────────────────────

function dashboardGeometry() {
  const s = shapeFrom([
    [0.86, 0.86],
    [0.62, 0.95],
    [0.4, 0.965],
    [0.365, 0.95],
    [0.355, 0.82],
    [0.4, 0.66],
    [0.62, 0.56],
    [0.86, 0.58],
  ])
  return extrude(s, 1.46, 0.02, 0.015, 2)
}

function seatGeometries() {
  const cushion = new RoundedBoxGeometry(0.5, 0.12, 0.46, 3, 0.04)
  const back = new RoundedBoxGeometry(0.12, 0.64, 0.46, 3, 0.045)
  const headrest = new RoundedBoxGeometry(0.08, 0.15, 0.25, 3, 0.035)
  const rail = new BoxGeometry(0.46, 0.05, 0.04)
  return { cushion, back, headrest, rail }
}

function steeringWheelGeometry() {
  const rim = new TorusGeometry(0.185, 0.017, 12, 48)
  const hub = new CylinderGeometry(0.055, 0.06, 0.05, 24)
  hub.rotateX(Math.PI / 2)
  const spokeL = new BoxGeometry(0.16, 0.03, 0.012)
  spokeL.translate(-0.1, -0.02, 0)
  const spokeR = spokeL.clone()
  spokeR.translate(0.2, 0, 0)
  const spokeB = new BoxGeometry(0.03, 0.14, 0.012)
  spokeB.translate(0, -0.1, 0)
  const merged = mergeGeometries([rim, hub, spokeL, spokeR, spokeB].map((g) => g.toNonIndexed()))!
  return merged
}

// ─── Exterior details ──────────────────────────────────────────────────────

/** A-pillar along the rounded corner between windscreen and side glass. */
function aPillarGeometry(side: 1 | -1) {
  const z = side * 0.665
  const curve = new CatmullRomCurve3([
    new Vector3(0.83, 0.955, z),
    new Vector3(0.43, 1.145, z * 0.997),
    new Vector3(0.06, 1.315, z * 0.99),
  ])
  return new TubeGeometry(curve, 24, 0.042, 10, false)
}

function archLinerGeometry() {
  const g = new CylinderGeometry(0.43, 0.43, 1.6, 28, 1, true, Math.PI / 2, Math.PI)
  g.rotateX(Math.PI / 2)
  return g
}

let cache: ReturnType<typeof build> | null = null

function build() {
  const seats = seatGeometries()
  return {
    lowerBody: lowerBodyGeometry(),
    greenhouse: greenhouseGeometry(),
    roof: extrude(roofShape(), 1.42, 0.07, 0.06, 5),
    cPillar: extrude(cPillarShape(), 0.016, 0, 0, 0),
    aPillarL: aPillarGeometry(-1),
    aPillarR: aPillarGeometry(1),
    bPillar: new BoxGeometry(0.075, 0.23, 0.014),
    tire: tireGeometry(),
    wheelFace: wheelFaceGeometry(),
    rimBarrel: rimBarrelGeometry(),
    hub: hubGeometry(),
    archLiner: archLinerGeometry(),
    noseSlot: new RoundedBoxGeometry(0.03, 0.055, 0.98, 2, 0.012),
    intake: new RoundedBoxGeometry(0.03, 0.085, 1.12, 2, 0.02),
    headlight: new RoundedBoxGeometry(0.16, 0.07, 0.4, 3, 0.025),
    taillight: new RoundedBoxGeometry(0.05, 0.075, 0.42, 3, 0.02),
    sideStrip: new RoundedBoxGeometry(1.62, 0.07, 0.03, 2, 0.012),
    bumperStrip: new RoundedBoxGeometry(0.035, 0.07, 1.5, 2, 0.012),
    mirror: new RoundedBoxGeometry(0.13, 0.09, 0.15, 3, 0.03),
    handle: new RoundedBoxGeometry(0.13, 0.026, 0.012, 2, 0.006),
    dashboard: dashboardGeometry(),
    binnacle: new RoundedBoxGeometry(0.17, 0.07, 0.42, 3, 0.03),
    console: new RoundedBoxGeometry(0.62, 0.26, 0.2, 3, 0.03),
    gearStick: new CylinderGeometry(0.008, 0.01, 0.16, 10),
    gearKnob: new RoundedBoxGeometry(0.045, 0.05, 0.045, 3, 0.018),
    steeringWheel: steeringWheelGeometry(),
    column: new CylinderGeometry(0.03, 0.035, 0.32, 12),
    mat: new RoundedBoxGeometry(0.6, 0.012, 0.42, 2, 0.005),
    rearBench: new RoundedBoxGeometry(0.5, 0.14, 1.2, 3, 0.05),
    rearBack: new RoundedBoxGeometry(0.12, 0.5, 1.2, 3, 0.05),
    ...seats,
  }
}

/** All car geometries, built once and shared. */
export function carGeometries() {
  return (cache ??= build())
}

export type CarGeometries = ReturnType<typeof build>
export type { BufferGeometry }
