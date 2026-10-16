import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  type Group,
  Line,
  LineBasicMaterial,
  type Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type PointLight,
  SphereGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { power2In, power2InOut } from '../lib/easing'
import { beat, clamp01, lerp } from '../lib/remap'
import { useStore } from '../store'
import { CLIP_MM, clipGeometries } from './clipGeometry'
import { ScreenAnchor } from './ScreenAnchor'
import { createLayerPrintMaterial } from './shaders/layerPrint'

const S = 0.004
const PRINT_H = (CLIP_MM.height + CLIP_MM.pinH) * S
const PATH_SAMPLES = 18

/** Support slabs (mm, clip space): inside the C under the top wall, and under the tab. */
function supportGeometry() {
  const slabs: BufferGeometry[] = []
  const d = CLIP_MM.depth - 1.2
  for (let x = -4.8; x <= 5.2; x += 1.6) {
    const g = new BoxGeometry(0.45, 5.6, d)
    g.translate(x, 0, 0)
    slabs.push(g)
  }
  for (let x = -11.0; x <= -7.9; x += 1.0) {
    const g = new BoxGeometry(0.45, 3.8, d)
    g.translate(x, -3.0, 0)
    slabs.push(g)
  }
  const top = new BoxGeometry(10.4, 0.4, d)
  top.translate(0.2, 2.7, 0)
  slabs.push(top)
  return mergeGeometries(slabs)!
}

interface Props {
  variant: 'shop' | 'home'
  count: 1 | 3
  position: [number, number, number]
  /** Print progress 0 → 1. */
  progress: (p: number) => number
  /** Finish 0 → 1 (door, supports, measuring). */
  finish?: (p: number) => number
  visible: (p: number) => boolean
  anchor: string
}

/**
 * A stylised, unbranded FDM printer. 'shop' is enclosed (glass door, warm
 * interior light); 'home' is an open frame. The parts grow layer by layer
 * (layer-print shader) under a nozzle with a glowing hot end.
 */
export function Printer({ variant, count, position, progress, finish, visible, anchor }: Props) {
  const shop = variant === 'shop'
  const W = shop ? 0.5 : 0.46
  const H = shop ? 0.56 : 0.5
  const D = shop ? 0.48 : 0.42
  const bedY = shop ? 0.14 : 0.1
  const clip = clipGeometries()

  const geo = useMemo(() => {
    const panel = (w: number, h: number, d: number) => new RoundedBoxGeometry(w, h, d, 2, 0.008)
    return {
      back: panel(W, H, 0.02),
      side: panel(0.02, H, D),
      top: panel(W, 0.03, D),
      base: panel(W + 0.02, 0.06, D + 0.02),
      glass: new BoxGeometry(W - 0.04, H - 0.1, 0.006),
      frameV: new BoxGeometry(0.018, H - 0.08, 0.012),
      frameH: new BoxGeometry(W - 0.03, 0.018, 0.012),
      bed: new RoundedBoxGeometry(0.34, 0.012, 0.3, 2, 0.004),
      rod: new CylinderGeometry(0.006, 0.006, H - 0.08, 10),
      bar: new BoxGeometry(W - 0.06, 0.018, 0.022),
      carriage: new RoundedBoxGeometry(0.05, 0.06, 0.05, 2, 0.008),
      nozzle: new CylinderGeometry(0.0025, 0.007, 0.014, 12),
      tip: new SphereGeometry(0.004, 12, 8),
      upright: new BoxGeometry(0.03, H, 0.03),
      screen: new BoxGeometry(0.09, 0.05, 0.004),
      spool: new CylinderGeometry(0.07, 0.07, 0.05, 32),
      supports: supportGeometry(),
    }
  }, [W, H, D])

  const mats = useMemo(() => {
    const part = createLayerPrintMaterial('#4c5259')
    const support = createLayerPrintMaterial('#8a9098', part.uniforms)
    return {
      part,
      support,
      shell: new MeshStandardMaterial({ color: shop ? '#2a2d31' : '#c9ced4', roughness: 0.55, metalness: shop ? 0.05 : 0.4 }),
      inner: new MeshStandardMaterial({ color: '#3a3f45', roughness: 0.7 }),
      trim: new MeshStandardMaterial({ color: '#1b1d20', roughness: 0.5 }),
      bed: new MeshStandardMaterial({ color: shop ? '#3b3f45' : '#2f3a33', roughness: 0.45, metalness: 0.2 }),
      rod: new MeshStandardMaterial({ color: '#b9c0c7', roughness: 0.25, metalness: 0.9 }),
      glass: new MeshPhysicalMaterial({ color: '#d7e3ea', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.16, depthWrite: false }),
      tip: new MeshBasicMaterial({ color: new Color(6, 3.4, 1.4), toneMapped: false }),
      screen: new MeshBasicMaterial({ color: new Color(0.55, 0.85, 0.92), toneMapped: false }),
      path: new LineBasicMaterial({ color: new Color(4.5, 2.6, 1.2), toneMapped: false, transparent: true }),
      spool: new MeshStandardMaterial({ color: '#3d4148', roughness: 0.6 }),
    }
  }, [shop])

  const xs = count === 3 ? [-0.105, 0, 0.105] : [0]
  const xmin = xs[0] - 0.045
  const xmax = xs[xs.length - 1] + 0.035

  const group = useRef<Group>(null)
  const gantry = useRef<Group>(null)
  const head = useRef<Group>(null)
  const door = useRef<Group>(null)
  const nozzleLight = useRef<PointLight>(null)
  const interior = useRef<PointLight>(null)
  const supports = useRef<(Mesh | null)[]>([])

  const pathLine = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(PATH_SAMPLES * 3), 3))
    return new Line(g, mats.path)
  }, [mats])

  useFrame(() => {
    const p = useStore.getState().progress
    const g = group.current
    if (!g) return
    g.visible = visible(p)
    if (!g.visible) return

    const k = progress(p)
    const f = finish ? finish(p) : 0
    const h = PRINT_H * k
    const u = mats.part.uniforms
    u.uHeight.value = bedY + 0.006 + h + (k >= 1 ? 1 : 0)
    u.uHot.value = k > 0 && k < 1 ? 1 : 0

    // Nozzle path: zig-zag across the parts, one pass per layer
    const layers = h / u.uLayerH.value
    const pathAt = (s: number, out: number[]) => {
      const L = Math.max(0, Math.floor(s))
      const fr = s - L
      const x = lerp(xmin, xmax, L % 2 === 0 ? fr : 1 - fr)
      const z = 0.012 * Math.sin(fr * Math.PI * 7)
      const y = bedY + 0.006 + Math.max(0, s) * u.uLayerH.value
      out[0] = x
      out[1] = y
      out[2] = z
    }
    const pt = [0, 0, 0]
    pathAt(layers, pt)
    const printing = k > 0 && k < 1
    const parkX = 0.15
    const nx = printing ? pt[0] : lerp(pt[0], parkX, clamp01(f * 4))
    const ny = printing ? pt[1] : bedY + 0.006 + PRINT_H + 0.05
    if (gantry.current) gantry.current.position.y = ny + 0.03
    if (head.current) head.current.position.set(nx, ny, printing ? pt[2] : 0)
    mats.tip.color.setRGB(6, 3.4, 1.4).multiplyScalar(printing ? 1 : 0.15)
    if (nozzleLight.current) nozzleLight.current.intensity = printing ? 0.5 : 0

    const pos = pathLine.geometry.getAttribute('position') as BufferAttribute
    for (let i = 0; i < PATH_SAMPLES; i++) {
      pathAt(Math.max(0, layers - i * 0.012), pt)
      pos.setXYZ(i, pt[0], pt[1] + 0.0006, pt[2])
    }
    pos.needsUpdate = true
    pathLine.visible = printing

    if (interior.current) interior.current.intensity = shop ? 1.3 : 0

    // Finish: door swings open, supports snap away and drop
    if (door.current) door.current.rotation.y = -power2InOut(beat(f, [0, 0.3])) * 1.9
    supports.current.forEach((m, i) => {
      if (!m) return
      const s = beat(f, [0.3 + i * 0.06, 0.55 + i * 0.06])
      m.visible = s < 1
      m.position.set(0, -power2In(s) * 30, s * 14)
      m.rotation.set(s * 1.6, 0, s * (i % 2 ? -0.8 : 0.8))
    })
  })

  const clipY = bedY + 0.006 + (CLIP_MM.height / 2) * S

  return (
    <group ref={group} position={position} visible={false}>
      {shop ? (
        <>
          <mesh geometry={geo.base} material={mats.trim} position={[0, 0.03, 0]} />
          <mesh geometry={geo.back} material={mats.inner} position={[0, H / 2 + 0.06, D / 2 - 0.01]} />
          <mesh geometry={geo.side} material={mats.shell} position={[-W / 2 + 0.01, H / 2 + 0.06, 0]} />
          <mesh geometry={geo.side} material={mats.shell} position={[W / 2 - 0.01, H / 2 + 0.06, 0]} />
          <mesh geometry={geo.top} material={mats.shell} position={[0, H + 0.075, 0]} />
          <mesh geometry={geo.screen} material={mats.screen} position={[W / 2 - 0.08, 0.035, -D / 2 - 0.012]} />
          {/* glass door, hinged on the left */}
          <group ref={door} position={[-W / 2 + 0.02, 0, -D / 2 - 0.008]}>
            <group position={[W / 2 - 0.02, H / 2 + 0.06, 0]}>
              <mesh geometry={geo.glass} material={mats.glass} renderOrder={5} />
              <mesh geometry={geo.frameV} material={mats.trim} position={[-W / 2 + 0.02, 0, 0]} />
              <mesh geometry={geo.frameV} material={mats.trim} position={[W / 2 - 0.02, 0, 0]} />
              <mesh geometry={geo.frameH} material={mats.trim} position={[0, H / 2 - 0.045, 0]} />
              <mesh geometry={geo.frameH} material={mats.trim} position={[0, -H / 2 + 0.045, 0]} />
            </group>
          </group>
          <pointLight ref={interior} position={[0, H - 0.02, -D / 4]} intensity={1.3} distance={0.9} decay={1.5} color="#ffc489" />
        </>
      ) : (
        <>
          <mesh geometry={geo.base} material={mats.shell} position={[0, 0.03, 0]} />
          <mesh geometry={geo.upright} material={mats.shell} position={[-W / 2 + 0.02, H / 2 + 0.03, 0.05]} />
          <mesh geometry={geo.upright} material={mats.shell} position={[W / 2 - 0.02, H / 2 + 0.03, 0.05]} />
          <mesh geometry={geo.top} material={mats.shell} position={[0, H + 0.03, 0.05]} scale={[1, 1, 0.12]} />
          <mesh geometry={geo.spool} material={mats.spool} position={[W / 2 + 0.06, H * 0.7, 0.05]} rotation={[0, 0, Math.PI / 2]} />
        </>
      )}
      <mesh geometry={geo.rod} material={mats.rod} position={[-W / 2 + 0.05, H / 2 + 0.06, D / 2 - 0.05]} />
      <mesh geometry={geo.rod} material={mats.rod} position={[W / 2 - 0.05, H / 2 + 0.06, D / 2 - 0.05]} />
      <mesh geometry={geo.bed} material={mats.bed} position={[0, bedY, 0]} />

      {/* gantry + hot end */}
      <group ref={gantry}>
        <mesh geometry={geo.bar} material={mats.rod} position={[0, 0, 0.04]} />
      </group>
      <group ref={head}>
        <mesh geometry={geo.carriage} material={mats.trim} position={[0, 0.045, 0]} />
        <mesh geometry={geo.nozzle} material={mats.rod} position={[0, 0.009, 0]} />
        <mesh geometry={geo.tip} material={mats.tip} position={[0, 0.002, 0]} />
        <pointLight ref={nozzleLight} position={[0, 0.01, -0.02]} intensity={0.5} distance={0.25} decay={2} color="#ffb36a" />
      </group>
      <primitive object={pathLine} />

      {/* the parts, upright with the C-face toward the door */}
      {xs.map((x, i) => (
        <group key={x} position={[x, clipY, 0]} rotation={[0, Math.PI, 0]} scale={S}>
          <mesh geometry={clip.intact} material={mats.part.material} />
          <mesh
            ref={(el) => {
              supports.current[i] = el
            }}
            geometry={geo.supports}
            material={mats.support.material}
          />
          {i === 0 && <ScreenAnchor name={`${anchor}-tab`} position={[-9.4, 0, CLIP_MM.depth / 2]} />}
        </group>
      ))}
    </group>
  )
}
