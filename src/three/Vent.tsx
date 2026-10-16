import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  BufferGeometry,
  ExtrudeGeometry,
  Group,
  Line,
  Mesh,
  PlaneGeometry,
  Quaternion,
  Shape,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { power2Out } from '../lib/easing'
import { clamp01, lerp } from '../lib/remap'
import { playCrack } from '../lib/sound'
import { useStore } from '../store'
import { clipGeometries } from './clipGeometry'
import { materials } from './materials'
import { ScreenAnchor } from './ScreenAnchor'
import { SNAP_AT, ventState } from '../story'

/**
 * The central dashboard vent and its mounting clip — the part that snaps in
 * Scene 01 and is replaced in Scene 08. Vent space: +Z points out of the dash
 * into the cabin (world −X), +X runs toward the passenger side (world +Z).
 */
export const VENT_ORIGIN = new Vector3(0.338, 0.88, 0)
/** mm → metres at "hero scale" (the clip is drawn 4× so it reads on screen). */
export const CLIP_SCALE = 0.004
export const CLIP_POS: [number, number, number] = [-0.095, -0.062, 0.018]

const FRAME = { w: 0.25, h: 0.095, iw: 0.214, ih: 0.07 }

function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape()
  const x = -w / 2
  const y = -h / 2
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

let geoCache: ReturnType<typeof buildGeo> | null = null
function buildGeo() {
  const frame = roundedRect(FRAME.w, FRAME.h, 0.016)
  frame.holes.push(roundedRect(FRAME.iw, FRAME.ih, 0.01))
  const bezel = new ExtrudeGeometry(frame, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 8,
  })
  const opening = new PlaneGeometry(FRAME.iw, FRAME.ih)
  const louvre = new RoundedBoxGeometry(0.205, 0.006, 0.026, 2, 0.0025)
  const knob = new RoundedBoxGeometry(0.022, 0.014, 0.016, 2, 0.004)
  const slot = new RoundedBoxGeometry(0.066, 0.034, 0.006, 2, 0.003)
  const flash = new PlaneGeometry(0.16, 0.16)
  return { bezel, opening, louvre, knob, slot, flash }
}
const ventGeometries = () => (geoCache ??= buildGeo())

type V3 = [number, number, number]
/** Car space → vent space. */
const toVent = ([x, y, z]: V3): V3 => [z, y - VENT_ORIGIN.y, VENT_ORIGIN.x - x]

interface Trajectory {
  start: V3
  pts: V3[] // land 1, land 2, land 3, rest (vent space)
  hops: number[] // arc height of each flight
  axis: Vector3
  spin: number
}

// Time split of the fall: flight, bounce, small bounce, roll under the seat.
const SEG = [0, 0.285, 0.471, 0.564, 1]

function trajectoryPoint(tr: Trajectory, tau: number, out: Vector3): Vector3 {
  const t = clamp01(tau)
  let i = 0
  while (i < 3 && t > SEG[i + 1]) i++
  const s = (t - SEG[i]) / (SEG[i + 1] - SEG[i])
  const a = i === 0 ? tr.start : tr.pts[i - 1]
  const b = tr.pts[i]
  if (i < 3) {
    out.set(lerp(a[0], b[0], s), lerp(a[1], b[1], s) + 4 * tr.hops[i] * s * (1 - s), lerp(a[2], b[2], s))
  } else {
    const e = power2Out(s)
    out.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e))
  }
  return out
}

export function Vent() {
  const g = ventGeometries()
  const clip = clipGeometries()
  const m = materials()

  const cassette = useRef<Group>(null)
  const louvres = useRef<(Mesh | null)[]>([])
  const intact = useRef<Group>(null)
  const pieceA = useRef<Mesh>(null)
  const pieceB = useRef<Mesh>(null)
  const crackLine = useRef<Line>(null)
  const flash = useRef<Mesh>(null)
  const ventGroup = useRef<Group>(null)
  const lastP = useRef(0)

  const crackObj = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', clip.crack)
    const line = new Line(geo, m.crack)
    line.visible = false
    return line
  }, [clip, m])
  crackLine.current = crackObj

  const trajectories = useMemo(() => {
    const yA = 0.258
    const yB = 0.25
    const startA: V3 = [CLIP_POS[0] + clip.centreA[0] * CLIP_SCALE, CLIP_POS[1] + clip.centreA[1] * CLIP_SCALE, CLIP_POS[2]]
    const startB: V3 = [CLIP_POS[0] + clip.centreB[0] * CLIP_SCALE, CLIP_POS[1] + clip.centreB[1] * CLIP_SCALE, CLIP_POS[2]]
    const a: Trajectory = {
      start: startA,
      pts: (
        [
          [0.22, yA, -0.24],
          [0.12, yA, -0.29],
          [0.065, yA, -0.31],
          [-0.13, 0.245, -0.335],
        ] as V3[]
      ).map(toVent),
      hops: [0.05, 0.075, 0.018],
      axis: new Vector3(0.4, 0.8, 0.45).normalize(),
      spin: 7.5,
    }
    const b: Trajectory = {
      start: startB,
      pts: (
        [
          [0.27, yB, -0.15],
          [0.18, yB, -0.205],
          [0.13, yB, -0.23],
          [-0.07, 0.24, -0.25],
        ] as V3[]
      ).map(toVent),
      hops: [0.07, 0.06, 0.014],
      axis: new Vector3(-0.7, 0.3, 0.65).normalize(),
      spin: 11,
    }
    return { a, b, startA, startB }
  }, [clip])

  const tmp = useMemo(() => ({ v: new Vector3(), q: new Quaternion(), qp: new Quaternion() }), [])

  useFrame(({ camera }) => {
    const { progress: p, sound } = useStore.getState()
    const s = ventState(p)

    // One-shot crack sound when scrolling forward through the snap.
    if (sound && lastP.current < SNAP_AT && p >= SNAP_AT && p - lastP.current < 0.03) playCrack()
    lastP.current = p

    // Crack: hairline that grows across the top wall.
    if (crackLine.current) {
      const n = clip.crack.count
      const k = s.crack * (n - 1)
      crackLine.current.geometry.setDrawRange(0, s.crack > 0 ? Math.min(n, Math.floor(k) + 2) : 0)
      crackLine.current.visible = s.crack > 0 && !s.broken
    }

    if (intact.current) intact.current.visible = !s.broken
    const pieces: [Mesh | null, Trajectory][] = [
      [pieceA.current, trajectories.a],
      [pieceB.current, trajectories.b],
    ]
    for (const [mesh, tr] of pieces) {
      if (!mesh) continue
      mesh.visible = s.broken
      if (!s.broken) continue
      trajectoryPoint(tr, s.fall, tmp.v)
      mesh.position.copy(tmp.v)
      mesh.quaternion.setFromAxisAngle(tr.axis, tr.spin * power2Out(s.fall))
    }

    // Snap flash: a billboard at the crack.
    if (flash.current && ventGroup.current) {
      const f = flash.current
      ;(f.material as typeof m.flash).uniforms.uIntensity.value = s.flash
      f.visible = s.flash > 0.001
      if (f.visible) {
        ventGroup.current.getWorldQuaternion(tmp.qp).invert()
        f.quaternion.copy(tmp.qp).multiply(camera.quaternion)
        f.scale.setScalar(0.35 + s.flash * 0.4)
      }
    }

    // Louvres droop once the clip is gone.
    if (cassette.current) cassette.current.rotation.z = 0.16 * s.droop
    louvres.current.forEach((l, i) => {
      if (l) l.rotation.x = 0.55 * s.droop * (1 + i * 0.12)
    })
  })

  const crackPos = useMemo<V3>(() => [CLIP_POS[0] + 2.6 * CLIP_SCALE, CLIP_POS[1] + 4 * CLIP_SCALE, CLIP_POS[2] + 0.02], [])

  return (
    <group ref={ventGroup} position={VENT_ORIGIN} rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={g.bezel} material={m.trimLight} />
      <mesh geometry={g.opening} material={m.black} position={[0, 0, 0.002]} />
      <group ref={cassette} position={[0.1, 0, 0]}>
        {[-0.024, -0.008, 0.008, 0.024].map((y, i) => (
          <mesh
            key={y}
            ref={(el) => {
              louvres.current[i] = el
            }}
            geometry={g.louvre}
            material={m.trim}
            position={[-0.1, y, 0.012]}
          >
            {i === 2 && <mesh geometry={g.knob} material={m.trimLight} position={[0.0, 0, 0.008]} />}
          </mesh>
        ))}
      </group>

      {/* Empty socket, visible once the clip has gone */}
      <mesh geometry={g.slot} material={m.black} position={[CLIP_POS[0], CLIP_POS[1], 0.004]} />
      <ScreenAnchor name="vent-slot" position={[CLIP_POS[0], CLIP_POS[1], 0.01]} />

      {/* The original clip, with its growing crack */}
      <group ref={intact} position={CLIP_POS} scale={CLIP_SCALE}>
        <mesh geometry={clip.intact} material={m.clipPlastic} />
        <primitive object={crackObj} />
      </group>

      {/* The two halves */}
      <group position={[0, 0, 0]}>
        <mesh ref={pieceA} geometry={clip.pieceA} material={m.clipPlastic} scale={CLIP_SCALE} visible={false} />
        <mesh ref={pieceB} geometry={clip.pieceB} material={m.clipPlastic} scale={CLIP_SCALE} visible={false} />
      </group>

      <mesh ref={flash} geometry={g.flash} material={m.flash} position={crackPos} visible={false} renderOrder={10} />
    </group>
  )
}
