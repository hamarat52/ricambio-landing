import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three'
import { LIBRARY_PARTS, sceneRange } from '../content'
import { getAnchor, libraryHover } from '../lib/anchors'
import { power2InOut, power3InOut } from '../lib/easing'
import { beat, hash01, lerp, remap } from '../lib/remap'
import { useStore } from '../store'
import { PART_KINDS, partGeometry, type PartKind } from './libraryParts'

/** Named parts (labelled in the DOM) map to these procedural kinds. */
const NAMED: Record<string, PartKind> = {
  louvre: 'louvre',
  visorClip: 'visorClip',
  switchLug: 'switchLug',
  flapGear: 'flapGear',
  handleBezel: 'handleBezel',
  gloveLatch: 'gloveLatch',
  tweeterGrille: 'tweeterGrille',
  cableClip: 'cableClip',
}

interface Slot {
  kind: PartKind
  ring: number
  angle: number
  y: number
  spin: Vector3
  named: number // index into LIBRARY_PARTS or -1
}

const RINGS = [3.3, 4.5, 5.7]
const PER_RING = [12, 16, 20]
const TARGET_R = 0.3 // display radius of each part (m)

/** The library: dozens of micro-parts in an orderly exploded-view constellation around the car. */
export function PartsLibrary() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const lib = sceneRange('library')
  const cta = sceneRange('cta')

  const slots = useMemo(() => {
    const out: Slot[] = []
    let named = 0
    RINGS.forEach((_, ring) => {
      for (let i = 0; i < PER_RING[ring]; i++) {
        const k = out.length
        const isNamed = ring === 1 && i % 2 === 0 && named < LIBRARY_PARTS.length
        const kind = isNamed ? NAMED[LIBRARY_PARTS[named].key] : PART_KINDS[(k * 7 + ring * 3) % PART_KINDS.length]
        out.push({
          kind,
          ring,
          angle: (i / PER_RING[ring]) * Math.PI * 2 + ring * 0.37,
          y: 0.7 + ring * 0.55 + (hash01(k * 1.9) - 0.5) * 0.5,
          spin: new Vector3(hash01(k) - 0.5, hash01(k + 9) - 0.5, hash01(k + 17) - 0.5).normalize(),
          named: isNamed ? named++ : -1,
        })
      }
    })
    return out
  }, [])

  const byKind = useMemo(() => {
    const m = new Map<PartKind, number[]>()
    slots.forEach((s, i) => m.set(s.kind, [...(m.get(s.kind) ?? []), i]))
    return m
  }, [slots])

  const scales = useMemo(() => {
    const out = new Map<PartKind, number>()
    for (const kind of PART_KINDS) {
      const g = partGeometry(kind)
      g.computeBoundingSphere()
      out.set(kind, TARGET_R / (g.boundingSphere?.radius ?? 10))
    }
    return out
  }, [])

  const mats = useMemo(
    () => [
      new MeshStandardMaterial({ color: '#d4d9de', roughness: 0.5 }),
      new MeshStandardMaterial({ color: '#4c5259', roughness: 0.6 }),
      new MeshStandardMaterial({ color: '#aeb5bc', roughness: 0.45, metalness: 0.1 }),
    ],
    [],
  )

  const meshes = useRef<Partial<Record<PartKind, InstancedMesh | null>>>({})
  const tmp = useMemo(() => ({ o: new Object3D(), m: new Matrix4(), q: new Quaternion(), v: new Vector3(), w: new Vector3(), car: new Vector3(0, 0.75, 0) }), [])
  const labelAnchors = useMemo(() => LIBRARY_PARTS.map((_, i) => getAnchor(`lib-${i}`)), [])
  const hoverLift = useRef<number[]>(slots.map(() => 0))

  useFrame(({ clock }, dt) => {
    const { progress: p, reducedMotion } = useStore.getState()
    const show = remap(p, lib.start, lib.start + (lib.end - lib.start) * 0.3)
    const flyBack = beat(remap(p, cta.start, cta.end), [0, 0.5], power3InOut)
    const visible = show > 0 && flyBack < 1
    PART_KINDS.forEach((k) => {
      const m = meshes.current[k]
      if (m) m.visible = visible
    })
    if (!visible) {
      labelAnchors.forEach((a) => (a.visible = false))
      return
    }
    const t = reducedMotion ? 0 : clock.elapsedTime
    const appear = power2InOut(show)

    slots.forEach((s, i) => {
      const lift = (hoverLift.current[i] += ((libraryHover.index === i ? 1 : 0) - hoverLift.current[i]) * Math.min(1, dt * 10))
      const orbit = s.angle + t * (0.03 + s.ring * 0.008) * (s.ring % 2 ? -1 : 1)
      const r = RINGS[s.ring] * lerp(0.4, 1, appear)
      tmp.v.set(Math.cos(orbit) * r, s.y + Math.sin(t * 0.6 + i) * 0.04 + lift * 0.28, Math.sin(orbit) * r)
      // fly back into the car for the finale
      tmp.w.copy(tmp.car).addScaledVector(s.spin, 0.25)
      tmp.v.lerp(tmp.w, flyBack)
      tmp.o.position.copy(tmp.v)
      tmp.o.quaternion.setFromAxisAngle(s.spin, t * 0.25 + i)
      const sc = (scales.get(s.kind) ?? 0.01) * appear * (1 - flyBack * 0.92) * (1 + lift * 0.18)
      tmp.o.scale.setScalar(sc)
      tmp.o.updateMatrix()
      const list = byKind.get(s.kind)!
      meshes.current[s.kind]?.setMatrixAt(list.indexOf(i), tmp.o.matrix)

      if (s.named >= 0) {
        const a = labelAnchors[s.named]
        tmp.w.copy(tmp.v).project(camera)
        a.x = (tmp.w.x * 0.5 + 0.5) * size.width
        a.y = (-tmp.w.y * 0.5 + 0.5) * size.height
        a.visible = tmp.w.z < 1 && flyBack < 0.05 && show > 0.6
      }
    })
    PART_KINDS.forEach((k) => {
      const m = meshes.current[k]
      if (m) m.instanceMatrix.needsUpdate = true
    })
  })

  const onMove = (kind: PartKind) => (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) return
    const p = useStore.getState().progress
    if (p < lib.start || p > lib.end) return
    e.stopPropagation()
    libraryHover.index = byKind.get(kind)![e.instanceId]
    libraryHover.named = slots[libraryHover.index].named
    document.body.style.cursor = 'default'
  }
  const onOut = () => {
    libraryHover.index = -1
    libraryHover.named = -1
  }

  return (
    <group>
      {PART_KINDS.map((kind, ki) => {
        const n = byKind.get(kind)?.length ?? 0
        if (!n) return null
        return (
          <instancedMesh
            key={kind}
            ref={(el) => {
              meshes.current[kind] = el
            }}
            args={[partGeometry(kind), mats[ki % mats.length], n]}
            frustumCulled={false}
            visible={false}
            onPointerMove={onMove(kind)}
            onPointerOut={onOut}
          />
        )
      })}
    </group>
  )
}
