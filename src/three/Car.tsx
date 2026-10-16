import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { type Group, Mesh, type Material, type PointLight } from 'three'
import { power3InOut } from '../lib/easing'
import { useStore } from '../store'
import { CAR, carGeometries } from './carGeometry'
import { materials, setCutaway } from './materials'
import { carPose, cutaway, turntableWeight } from './story'
import { Vent } from './Vent'

declare const __CAR_GLB__: boolean
const GLB_URL = 'models/car.glb'
const OMEGA = (Math.PI * 2) / 40 // one turn per ~40 s

function Wheel({ x, side }: { x: number; side: 1 | -1 }) {
  const g = carGeometries()
  const m = materials()
  return (
    <group position={[x, CAR.wheelR, side * CAR.wheelZ]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
      <mesh geometry={g.tire} material={m.tire} />
      <mesh geometry={g.rimBarrel} material={m.rimDark} />
      <mesh geometry={g.wheelFace} material={m.rim} position={[0, 0, 0.055]} />
      <mesh geometry={g.hub} material={m.rimDark} position={[0, 0, 0.08]} />
    </group>
  )
}

/** The procedural exterior: body, greenhouse, roof, pillars, lights, trim, wheels. */
function Exterior() {
  const g = carGeometries()
  const m = materials()
  return (
    <group>
      <mesh geometry={g.lowerBody} material={m.paintLower} />
      <mesh geometry={g.greenhouse} material={m.glass} renderOrder={2} />
      <mesh geometry={g.roof} material={m.paintUpper} />
      <mesh geometry={g.aPillarL} material={m.paintUpper} />
      <mesh geometry={g.aPillarR} material={m.paintUpper} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={g.cPillar} material={m.paintUpper} position={[0, 0, s * 0.709]} />
          <mesh geometry={g.bPillar} material={m.trimUpper} position={[-0.62, 1.08, s * 0.704]} />
          <mesh geometry={g.headlight} material={m.headlight} position={[2.04, 0.648, s * 0.56]} rotation={[0, s * -0.2, 0]} />
          <mesh geometry={g.taillight} material={m.taillight} position={[-2.13, 0.87, s * 0.56]} rotation={[0, s * 0.08, 0]} />
          <mesh geometry={g.sideStrip} material={m.trimExterior} position={[0.05, 0.42, s * 0.858]} />
          <mesh geometry={g.mirror} material={m.paintLower} position={[0.74, 1.0, s * 0.875]} />
          <mesh geometry={g.handle} material={m.trimExterior} position={[-0.42, 0.86, s * 0.853]} />
        </group>
      ))}
      <mesh geometry={g.noseSlot} material={m.black} position={[2.128, 0.585, 0]} />
      <mesh geometry={g.intake} material={m.black} position={[2.12, 0.37, 0]} />
      <mesh geometry={g.bumperStrip} material={m.trimExterior} position={[2.135, 0.285, 0]} />
      <mesh geometry={g.bumperStrip} material={m.trimExterior} position={[-2.135, 0.31, 0]} />
      <mesh geometry={g.archLiner} material={m.black} position={[CAR.frontAxle, 0.3, 0]} />
      <mesh geometry={g.archLiner} material={m.black} position={[CAR.rearAxle, 0.3, 0]} />
      <Wheel x={CAR.frontAxle} side={1} />
      <Wheel x={CAR.frontAxle} side={-1} />
      <Wheel x={CAR.rearAxle} side={1} />
      <Wheel x={CAR.rearAxle} side={-1} />
    </group>
  )
}

/** Cabin: dashboard (with the vent), seats, steering wheel, console, floor mats. */
function Interior() {
  const g = carGeometries()
  const m = materials()
  return (
    <group>
      <mesh geometry={g.dashboard} material={m.trim} />
      <mesh geometry={g.binnacle} material={m.trim} position={[0.43, 0.985, -0.36]} />
      <mesh geometry={g.console} material={m.trim} position={[0.18, 0.37, 0]} />
      <mesh geometry={g.gearStick} material={m.trimLight} position={[0.12, 0.56, 0]} />
      <mesh geometry={g.gearKnob} material={m.black} position={[0.12, 0.645, 0]} />
      <group position={[0.06, 0.9, -0.36]} rotation={[0, -Math.PI / 2, 0]}>
        <group rotation={[-0.42, 0, 0]}>
          <mesh geometry={g.steeringWheel} material={m.black} />
          <mesh geometry={g.column} material={m.trim} position={[0, 0, -0.17]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 0.36]}>
          <mesh geometry={g.cushion} material={m.seat} position={[-0.3, 0.42, 0]} />
          <mesh geometry={g.back} material={m.seat} position={[-0.66, 0.79, 0]} rotation={[0, 0, 0.24]} />
          <mesh geometry={g.headrest} material={m.seat} position={[-0.77, 1.17, 0]} rotation={[0, 0, 0.24]} />
          <mesh geometry={g.rail} material={m.black} position={[-0.3, 0.335, 0.16]} />
          <mesh geometry={g.rail} material={m.black} position={[-0.3, 0.335, -0.16]} />
          <mesh geometry={g.mat} material={m.mat} position={[0.25, 0.236, s * -0.03]} />
        </group>
      ))}
      <mesh geometry={g.rearBench} material={m.seat} position={[-1.22, 0.43, 0]} />
      <mesh geometry={g.rearBack} material={m.seat} position={[-1.48, 0.76, 0]} rotation={[0, 0, 0.2]} />
      <Vent />
    </group>
  )
}

/** Optional drop-in: public/models/car.glb (1 unit = 1 m, front +X, wheels on y = 0). */
function GlbExterior() {
  const { scene } = useGLTF(GLB_URL)
  const m = materials()
  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return
      const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material]
      // Only the roof cut-away applies to a custom model (it has no separate door).
      for (const mat of mats) mat.clippingPlanes = m.paintUpper.clippingPlanes
    })
  }, [scene, m])
  return <primitive object={scene} />
}

interface TurntableState {
  angle: number
  lastW: number
  captured: boolean
  from: number
  to: number
  wAtCapture: number
}

/**
 * The car on its turntable. Spins freely in the hero (independent of scroll),
 * eases to a stop at the front-3/4 angle as the hero exits, and resumes in the
 * finale. Scrolling back up resumes the spin from wherever it stopped.
 */
export function Car({ children }: { children?: ReactNode }) {
  const turn = useRef<Group>(null)
  const cabinLight = useRef<PointLight>(null)
  const st = useMemo<TurntableState>(() => ({ angle: 0, lastW: 1, captured: false, from: 0, to: 0, wAtCapture: 1 }), [])
  const reduced = useStore((s) => s.reducedMotion)

  useFrame((_, dt) => {
    const group = turn.current
    if (!group) return
    const p = useStore.getState().progress
    const w = reduced ? 0 : turntableWeight(p)
    const step = Math.min(dt, 0.1)

    if (w >= 0.999) {
      st.angle += OMEGA * step
      st.captured = false
    } else if (w < st.lastW - 1e-5) {
      // Slowing down: glide to the nearest rest angle (a multiple of 2π).
      if (!st.captured) {
        st.captured = true
        st.from = st.angle
        st.to = Math.round(st.angle / (Math.PI * 2)) * Math.PI * 2
        st.wAtCapture = Math.max(st.lastW, 1e-3)
      }
      st.angle = st.to + (st.from - st.to) * power3InOut(Math.min(1, w / st.wAtCapture))
    } else if (w > 0) {
      // Holding or speeding up: spin proportionally to the weight.
      st.angle += OMEGA * step * w
      st.captured = false
    } else if (st.captured) {
      st.angle = st.to
    }
    st.lastW = w

    group.rotation.y = st.angle
    carPose.angle = st.angle
    group.updateMatrixWorld()
    const cut = cutaway(p)
    setCutaway(cut, group.matrixWorld)
    // soft fill over the open cabin, only while the roof is cut away
    if (cabinLight.current) cabinLight.current.intensity = cut * 2.2
  }, -2)

  return (
    <group ref={turn}>
      {__CAR_GLB__ ? (
        <Suspense fallback={<Exterior />}>
          <GlbExterior />
        </Suspense>
      ) : (
        <Exterior />
      )}
      <Interior />
      <pointLight ref={cabinLight} position={[-0.4, 1.9, -0.5]} intensity={0} distance={3.2} decay={1.6} color="#fff3e6" />
      {children}
    </group>
  )
}
