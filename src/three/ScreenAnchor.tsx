import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, Vector3 } from 'three'
import { getAnchor } from '../lib/anchors'

/** Projects its world position to screen pixels every frame (read by DOM annotations). */
export function ScreenAnchor({ name, position = [0, 0, 0] }: { name: string; position?: [number, number, number] }) {
  const ref = useRef<Object3D>(null)
  const v = useMemo(() => new Vector3(), [])
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const a = getAnchor(name)

  useFrame(() => {
    const o = ref.current
    if (!o) return
    o.getWorldPosition(v)
    v.project(camera)
    a.x = (v.x * 0.5 + 0.5) * size.width
    a.y = (-v.y * 0.5 + 0.5) * size.height
    a.visible = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2
  })

  return <object3D ref={ref} position={position} />
}
