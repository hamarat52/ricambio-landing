import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  type Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  type Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  type PerspectiveCamera,
} from 'three'
import { BEATS, NUMBERS, PALETTE } from '../content'
import { power2InOut, power3Out } from '../lib/easing'
import { beat, lerp } from '../lib/remap'
import { useStore, storyProgress } from '../store'
import { scanLocal } from '../story'
import { clipDimensions, clipFaceted, clipGeometries, clipPointCloud } from './Clip'
import { CLIP_MM } from './clipGeometry'
import { ScreenAnchor } from './ScreenAnchor'
import { addSweepBand, createScanPointsMaterial } from './shaders/scanSweep'

/** mm → m at hero scale, same as the clip in the car. */
const S = 0.004
/** The part stands on the turntable with the C-face toward the camera. */
const PART_Y = 0.01 + (CLIP_MM.height / 2) * S

/**
 * Meanwhile in Torino (night, ink background): Luca's intact clip on a small
 * turntable. Light sweep → point cloud → faceted mesh → clean CAD with
 * dimension lines, then the mirror trick.
 */
export function ScanStation() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)
  const mobile = useStore((s) => s.mobile)
  const quality = useStore((s) => s.quality)
  const clip = clipGeometries()

  const count = (mobile ? NUMBERS.scanPoints.mobile : NUMBERS.scanPoints.desktop) / (quality === 'low' ? 2 : 1)
  const cloud = useMemo(() => clipPointCloud(count), [count])
  const faceted = useMemo(() => clipFaceted(), [])
  const edges = useMemo(() => new EdgesGeometry(clip.intact, 28), [clip])
  const dims = useMemo(() => clipDimensions(), [])

  const teal = useMemo(() => new Color(PALETTE.teal), [])
  const mats = useMemo(() => {
    const physical = new MeshStandardMaterial({ color: '#5b6068', roughness: 0.6, transparent: true })
    const band = addSweepBand(physical, new Color(PALETTE.teal).multiplyScalar(3.2))
    return {
      physical,
      band,
      points: createScanPointsMaterial(new Color(0.75, 1.6, 1.8)),
      facet: new MeshStandardMaterial({ color: '#7f99a1', roughness: 0.7, flatShading: true, transparent: true }),
      wire: new MeshBasicMaterial({ color: teal.clone().multiplyScalar(1.6), wireframe: true, transparent: true, toneMapped: false }),
      cad: new MeshStandardMaterial({ color: '#d3d8dd', roughness: 0.42, metalness: 0.05, transparent: true }),
      edge: new LineBasicMaterial({ color: '#20262c', transparent: true }),
      // drawn over the turntable like an overlay on a technical drawing
      dim: new LineBasicMaterial({ color: new Color(1.4, 1.5, 1.55), transparent: true, toneMapped: false, depthTest: false }),
      ghost: new MeshBasicMaterial({ color: teal.clone().multiplyScalar(1.3), wireframe: true, transparent: true, toneMapped: false }),
      axis: new LineDashedMaterial({ color: '#d1d7de', dashSize: 0.004, gapSize: 0.003, transparent: true }),
      sweep: new MeshBasicMaterial({ color: teal.clone().multiplyScalar(5), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      glow: new MeshBasicMaterial({ color: teal.clone().multiplyScalar(0.9), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      table: new MeshStandardMaterial({ color: '#23272c', roughness: 0.85 }),
      tick: new LineBasicMaterial({ color: '#59626c' }),
    }
  }, [teal])

  const dimLines = useMemo(
    () =>
      dims.map((d) => {
        const g = new BufferGeometry()
        g.setAttribute('position', new Float32BufferAttribute(d.segments, 3))
        const line = new LineSegments(g, mats.dim)
        return { d, line, n: d.segments.length / 3 }
      }),
    [dims, mats],
  )

  const turntable = useMemo(() => {
    const disc = new CylinderGeometry(0.075, 0.078, 0.01, 64)
    const pos: number[] = []
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      const r0 = 0.066
      const r1 = i % 6 === 0 ? 0.058 : 0.062
      pos.push(Math.cos(a) * r0, 0.0052, Math.sin(a) * r0, Math.cos(a) * r1, 0.0052, Math.sin(a) * r1)
    }
    const tg = new BufferGeometry()
    tg.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return { disc, ticks: new LineSegments(tg, mats.tick) }
  }, [mats])

  const axis = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([0.0425, 0.004, 0, 0.0425, 0.085, 0], 3))
    const l = new LineSegments(g, mats.axis)
    l.computeLineDistances()
    return l
  }, [mats])

  const sweepGeo = useMemo(() => new PlaneGeometry(0.35, 24), [])
  const glowGeo = useMemo(() => new PlaneGeometry(5, 24), [])
  const edgeLines = useMemo(() => new LineSegments(edges, mats.edge), [edges, mats])

  const refs = {
    physical: useRef<Mesh>(null),
    points: useRef<Group>(null),
    facet: useRef<Mesh>(null),
    wire: useRef<Mesh>(null),
    cad: useRef<Group>(null),
    ghost: useRef<Group>(null),
    sweep: useRef<Group>(null),
  }

  useFrame(({ clock }) => {
    const p = storyProgress()
    const t = scanLocal(p)
    const b = BEATS.scan
    const sweepK = beat(t, b.sweep, power2InOut)
    const sweepX = lerp(-13.5, 9.5, sweepK)

    // Sweep line
    const sweepOn = t > b.sweep[0] && t < b.sweep[1]
    if (refs.sweep.current) {
      refs.sweep.current.visible = sweepOn
      refs.sweep.current.position.x = sweepX
    }
    mats.band.uSweep.value = sweepX
    mats.band.uBand.value = sweepOn ? 1 : 0

    // Physical part: there until the digital twin takes over
    const physFade = 1 - beat(t, [b.mesh[0], b.mesh[0] + 0.05])
    mats.physical.opacity = physFade
    if (refs.physical.current) refs.physical.current.visible = physFade > 0.01

    // Point cloud
    const pts = mats.points.uniforms
    pts.uSweep.value = sweepX
    pts.uTime.value = clock.elapsedTime
    pts.uScale.value = (size.height * viewport.dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360))
    pts.uFade.value = t >= b.sweep[0] ? 1 - beat(t, [b.mesh[0] + 0.03, b.mesh[0] + 0.1]) : 0
    if (refs.points.current) refs.points.current.visible = pts.uFade.value > 0.01

    // Faceted mesh: wireframe first, then solid; gives way to the clean CAD
    const wireIn = beat(t, [b.mesh[0], b.mesh[0] + 0.04])
    const solidIn = beat(t, [b.mesh[0] + 0.05, b.mesh[0] + 0.11])
    const cadIn = power3Out(beat(t, [b.cad[0], b.cad[0] + 0.06]))
    mats.wire.opacity = wireIn * (1 - solidIn * 0.75) * (1 - cadIn)
    mats.facet.opacity = solidIn * (1 - cadIn)
    if (refs.wire.current) refs.wire.current.visible = mats.wire.opacity > 0.01
    if (refs.facet.current) refs.facet.current.visible = mats.facet.opacity > 0.01

    mats.cad.opacity = cadIn
    mats.edge.opacity = cadIn
    if (refs.cad.current) refs.cad.current.visible = cadIn > 0.01

    // Dimension lines draw themselves, one after another
    dimLines.forEach(({ line, n }, i) => {
      const k = beat(t, [b.cad[0] + 0.05 + i * 0.03, b.cad[0] + 0.1 + i * 0.03])
      const segs = Math.floor((k * n) / 2) * 2
      line.geometry.setDrawRange(0, segs)
      line.visible = segs > 0
    })
    mats.dim.opacity = 1 - beat(t, [b.mirror[0], b.mirror[0] + 0.04]) * 0.6

    // Mirror trick: a ghost twin, flipped across a dashed axis
    const ghost = power2InOut(beat(t, b.mirror))
    mats.ghost.opacity = ghost * 0.85
    mats.axis.opacity = ghost
    if (refs.ghost.current) {
      refs.ghost.current.visible = ghost > 0.01
      refs.ghost.current.scale.set(-S * lerp(0.2, 1, ghost), S, S)
    }
    axis.visible = ghost > 0.01
  })

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[0.3, 0.6, 0.5]} intensity={1.5} color="#f2efe9" />
      <directionalLight position={[-0.5, 0.3, -0.4]} intensity={0.9} color="#9fb8c2" />

      {/* turntable */}
      <mesh geometry={turntable.disc} material={mats.table} position={[0, 0.005, 0]} />
      <primitive object={turntable.ticks} position={[0, 0.005, 0]} />

      <group position={[0, PART_Y, 0]} scale={S}>
        <mesh ref={refs.physical} geometry={clip.intact} material={mats.physical} />
        <group ref={refs.points}>
          <points geometry={cloud} material={mats.points} frustumCulled={false} />
        </group>
        <mesh ref={refs.wire} geometry={faceted} material={mats.wire} visible={false} />
        <mesh ref={refs.facet} geometry={faceted} material={mats.facet} visible={false} />
        <group ref={refs.cad} visible={false}>
          <mesh geometry={clip.intact} material={mats.cad} />
          <primitive object={edgeLines} />
        </group>
        {dimLines.map(({ d, line }) => (
          <group key={d.key}>
            <primitive object={line} />
            <ScreenAnchor name={`scan-dim-${d.key}`} position={d.label} />
          </group>
        ))}
        <ScreenAnchor name="scan-tab" position={[-9.6, 0, CLIP_MM.depth / 2]} />
        <group ref={refs.sweep} visible={false}>
          <mesh geometry={sweepGeo} material={mats.sweep} position={[0, 1.5, CLIP_MM.depth / 2 + 1.5]} />
          <mesh geometry={glowGeo} material={mats.glow} position={[0, 1.5, CLIP_MM.depth / 2 + 1.4]} />
        </group>
      </group>

      {/* the mirror twin */}
      <group ref={refs.ghost} position={[0.085, PART_Y, 0]} visible={false}>
        <mesh geometry={clip.intact} material={mats.ghost} />
      </group>
      <primitive object={axis} />
    </>
  )
}
