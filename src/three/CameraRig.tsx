import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler, PerspectiveCamera, Quaternion } from 'three'
import { remap } from '../lib/remap'
import { useStore, storyProgress } from '../store'
import { CameraPath, createSample, DESKTOP_KEYS, MOBILE_KEYS } from './cameraPath'

const DEG = Math.PI / 180
/** Aspect ratio the desktop framings were composed for. */
const DESIGN_ASPECT = 1.6

/**
 * Drives the one camera from the global progress: keyframed path, lens shift
 * for composition, back-off on narrow screens, mouse parallax in the hero and
 * a near plane that follows the framing distance (close-ups and map views
 * share one depth buffer).
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const mobile = useStore((s) => s.mobile)
  const path = useMemo(() => new CameraPath(mobile ? MOBILE_KEYS : DESKTOP_KEYS), [mobile])
  const sample = useMemo(createSample, [])
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 })
  const tmp = useMemo(() => ({ q: new Quaternion(), e: new Euler() }), [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, dt) => {
    const { reducedMotion } = useStore.getState()
    const progress = storyProgress()
    path.sample(progress, sample)

    // Narrow viewports: back off along the view axis so wide framings still fit.
    const aspect = size.width / size.height
    const backOff = Math.min(1.6, Math.max(0, DESIGN_ASPECT / aspect - 1)) * 0.85 * sample.fit
    if (backOff > 0) {
      const fwdX = -2 * (sample.quat.x * sample.quat.z + sample.quat.w * sample.quat.y)
      const fwdY = -2 * (sample.quat.y * sample.quat.z - sample.quat.w * sample.quat.x)
      const fwdZ = -(1 - 2 * (sample.quat.x * sample.quat.x + sample.quat.y * sample.quat.y))
      const d = sample.dist * backOff
      sample.pos.x -= fwdX * d
      sample.pos.y -= fwdY * d
      sample.pos.z -= fwdZ * d
    }

    camera.position.copy(sample.pos)
    camera.quaternion.copy(sample.quat)

    // Hero parallax (±2°), smoothed; fades out as the hero exits.
    const ptr = pointer.current
    const k = 1 - Math.exp(-dt * 2.5)
    ptr.sx += (ptr.x - ptr.sx) * k
    ptr.sy += (ptr.y - ptr.sy) * k
    const w = reducedMotion ? 0 : 1 - remap(progress, 0.03, 0.05)
    if (w > 0) {
      tmp.e.set(-ptr.sy * 2 * DEG * w, -ptr.sx * 2 * DEG * w, 0, 'YXZ')
      camera.quaternion.multiply(tmp.q.setFromEuler(tmp.e))
    }

    camera.fov = sample.fov
    camera.near = Math.min(1.5, Math.max(0.01, sample.dist * 0.04))
    camera.far = Math.max(60, sample.dist * 8)
    const W = size.width
    const H = size.height
    // Narrower screens get less sideways lens shift (there is less room beside the copy).
    const sx = sample.shiftX * Math.min(1, Math.max(0.35, aspect / DESIGN_ASPECT))
    camera.setViewOffset(W, H, -sx * W, sample.shiftY * H, W, H)
    camera.updateProjectionMatrix()
  }, -1)

  return null
}
