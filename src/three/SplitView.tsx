import { useFBO } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, HalfFloatType, type Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three'
import { neutralPreimage } from '../lib/color'
import { useStore } from '../store'
import { CameraPath, type CamKey, createSample } from './cameraPath'

/** Layer the split overlay lives on (the contact-shadow camera never sees it). */
export const OVERLAY_LAYER = 1

interface Props {
  /** Seam position from progress: 1 = closed (no split), 0.5 = half, 0 = full screen. */
  seam: (p: number) => number
  keys: CamKey[]
  background: string
  environmentIntensity?: number
  children: ReactNode
}

/**
 * The deliberate split screen. A second scene is rendered into an HDR render
 * target by its own camera and composited over the main view to the right of
 * a vertical seam, so bloom, grain and tone mapping apply to both halves.
 * The left half dims slightly while the seam is open.
 */
export function SplitView({ seam, keys, background, environmentIntensity = 0.3, children }: Props) {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const mainScene = useThree((s) => s.scene)
  const mainCamera = useThree((s) => s.camera)
  const quad = useRef<Mesh>(null)

  const portal = useMemo(() => {
    const s = new Scene()
    s.background = neutralPreimage(background, new Color())
    return s
  }, [background])
  const cam = useMemo(() => new PerspectiveCamera(30, 1, 0.005, 40), [])
  const path = useMemo(() => new CameraPath(keys), [keys])
  const sample = useMemo(createSample, [])
  const fbo = useFBO({ samples: 4, type: HalfFloatType })

  const geometry = useMemo(() => new PlaneGeometry(2, 2), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTex: { value: null },
          uSeam: { value: 1 },
          uDim: { value: 0 },
          uRes: { value: new Vector2(1, 1) },
          uLine: { value: new Color(2.2, 2.3, 2.4) },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTex;
          uniform float uSeam;
          uniform float uDim;
          uniform vec2 uRes;
          uniform vec3 uLine;
          varying vec2 vUv;
          void main() {
            float px = 1.0 / uRes.x;
            float d = vUv.x - uSeam;
            if (d >= 0.0) {
              vec3 c = texture2D(uTex, vUv).rgb;
              float line = 1.0 - smoothstep(0.0, 1.5 * px, d);
              gl_FragColor = vec4(mix(c, uLine, line), 1.0);
            } else {
              float shadow = (1.0 - smoothstep(0.0, 40.0 * px, -d)) * 0.28;
              gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(uDim + shadow * step(uSeam, 0.999), 0.0, 1.0));
            }
          }`,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useLayoutEffect(() => {
    quad.current?.layers.set(OVERLAY_LAYER)
    mainCamera.layers.enable(OVERLAY_LAYER)
  }, [mainCamera])

  // Priority 0.5: after the portal's own useFrame callbacks (0), before the composer (1).
  useFrame(() => {
    const p = useStore.getState().progress
    const s = seam(p)
    const active = s < 0.999
    if (quad.current) quad.current.visible = active
    if (!active) return

    path.sample(p, sample)
    cam.position.copy(sample.pos)
    cam.quaternion.copy(sample.quat)
    cam.fov = sample.fov
    cam.near = Math.max(0.005, sample.dist * 0.03)
    const W = size.width
    const H = size.height
    cam.aspect = W / H
    // Centre the portal's subject in the visible part (right of the seam).
    const shift = s / 2 + sample.shiftX * (1 - s)
    cam.setViewOffset(W, H, -shift * W, sample.shiftY * H, W, H)
    cam.updateProjectionMatrix()

    portal.environment = mainScene.environment
    portal.environmentIntensity = environmentIntensity
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(fbo)
    gl.clear()
    gl.render(portal, cam)
    gl.setRenderTarget(prev)

    material.uniforms.uTex.value = fbo.texture
    material.uniforms.uSeam.value = s
    material.uniforms.uDim.value = 0.32 * Math.min(1, (1 - s) * 4)
    material.uniforms.uRes.value.set(W, H)
  }, 0.5)

  return (
    <>
      {createPortal(children, portal, { camera: cam })}
      <mesh ref={quad} geometry={geometry} material={material} frustumCulled={false} renderOrder={1000} visible={false} />
    </>
  )
}
