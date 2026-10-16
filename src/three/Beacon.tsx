import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Group, type Mesh, MeshBasicMaterial, QuadraticBezierCurve3, SphereGeometry, Vector3 } from 'three'
import { PALETTE } from '../content'
import { getAnchor } from '../lib/anchors'
import { useStore } from '../store'
import { beaconFlight } from '../story'

const TRAIL = 7
const LAND = new Vector3(0, 1.6, 0)

/**
 * The request leaves Emre's phone as a small teal beacon, arcs up and lands
 * on Istanbul. It starts from wherever the DOM phone's button is on screen.
 */
export function Beacon() {
  const group = useRef<Group>(null)
  const parts = useRef<(Mesh | null)[]>([])
  const geo = useMemo(() => new SphereGeometry(1, 20, 14), [])
  const mats = useMemo(
    () =>
      Array.from({ length: TRAIL + 1 }, (_, i) => {
        const c = new Color(PALETTE.teal).multiplyScalar(i === 0 ? 4 : 2.2)
        return new MeshBasicMaterial({
          color: c,
          transparent: true,
          opacity: i === 0 ? 1 : 0.5 * (1 - i / (TRAIL + 1)),
          blending: i === 0 ? undefined : AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
      }),
    [],
  )
  const tmp = useMemo(
    () => ({
      start: new Vector3(),
      ctrl: new Vector3(),
      dir: new Vector3(),
      p: new Vector3(),
      curve: new QuadraticBezierCurve3(new Vector3(), new Vector3(), LAND.clone()),
    }),
    [],
  )
  const anchor = getAnchor('phone-beacon')

  useFrame(({ camera, size }) => {
    const g = group.current
    if (!g) return
    const s = beaconFlight(useStore.getState().progress)
    g.visible = s > 0 && s < 1
    if (!g.visible) return

    // Start: a point on the ray through the phone's button, a third of the way to Istanbul.
    const nx = anchor.visible || anchor.x ? (anchor.x / size.width) * 2 - 1 : 0.5
    const ny = anchor.visible || anchor.y ? -(anchor.y / size.height) * 2 + 1 : -0.2
    tmp.dir.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize()
    const dist = camera.position.distanceTo(LAND)
    tmp.start.copy(camera.position).addScaledVector(tmp.dir, dist * 0.3)
    tmp.ctrl.copy(tmp.start).lerp(LAND, 0.5)
    tmp.ctrl.y += dist * 0.28
    tmp.curve.v0.copy(tmp.start)
    tmp.curve.v1.copy(tmp.ctrl)

    const r = dist * 0.006
    parts.current.forEach((m, i) => {
      if (!m) return
      const si = s - i * 0.022
      m.visible = si > 0
      if (!m.visible) return
      tmp.curve.getPoint(Math.min(1, si), tmp.p)
      m.position.copy(tmp.p)
      m.scale.setScalar(r * (i === 0 ? 1 : 1 - i / (TRAIL + 2)) * (i === 0 ? 1 + 0.4 * Math.sin(s * 30) : 1))
    })
  })

  return (
    <group ref={group} visible={false}>
      {mats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            parts.current[i] = el
          }}
          geometry={geo}
          material={m}
          renderOrder={20}
        />
      ))}
    </group>
  )
}
