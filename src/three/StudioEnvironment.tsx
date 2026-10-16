import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import {
  Color,
  CubeUVReflectionMapping,
  DataTexture,
  DoubleSide,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  RGBAFormat,
  RingGeometry,
  Scene,
  type Texture,
  Vector3,
  type WebGLRenderer,
} from 'three'
import { ENV_BACKGROUND, ENV_FORMERS, ENV_SIZE } from './envFormers'

/** Main-thread fallback (browsers without WebGL2 in workers). */
function bakeOnMainThread(gl: WebGLRenderer): Texture {
  const env = new Scene()
  env.background = new Color(ENV_BACKGROUND)
  const target = new Vector3(0, 0.5, 0)
  const plane = new PlaneGeometry(1, 1)
  const ring = new RingGeometry(0.5, 1, 48)
  for (const f of ENV_FORMERS) {
    const m = new Mesh(f.ring ? ring : plane, new MeshBasicMaterial({ color: new Color(1, 1, 1).multiplyScalar(f.intensity), side: DoubleSide }))
    m.position.set(...f.pos)
    m.scale.set(f.scale[0], f.scale[1], 1)
    if (f.up) m.rotation.x = Math.PI / 2
    else m.lookAt(target)
    env.add(m)
  }
  const pmrem = new PMREMGenerator(gl)
  const rt = pmrem.fromScene(env, 0.02, 0.1, 100, { size: ENV_SIZE })
  pmrem.dispose()
  return rt.texture
}

/** Half-float cube-UV texels from the worker → an environment texture three uses directly. */
function fromTexels(w: number, h: number, data: Uint16Array): Texture {
  const t = new DataTexture(data, w, h, RGBAFormat, HalfFloatType)
  t.mapping = CubeUVReflectionMapping
  t.colorSpace = LinearSRGBColorSpace
  t.minFilter = LinearFilter
  t.magFilter = LinearFilter
  t.generateMipmaps = false
  t.flipY = false
  t.needsUpdate = true
  return t
}

/**
 * Studio reflections from a few emissive "light formers", baked into a PMREM
 * environment map in a worker (so no PMREM shader ever compiles on the main
 * thread). Calls `onReady` once scene.environment is set; materials compile
 * after that, with the environment they will render with.
 */
export function StudioEnvironment({ intensity = 0.85, onReady }: { intensity?: number; onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    let alive = true
    let texture: Texture | null = null
    const apply = (t: Texture) => {
      if (!alive) return
      texture = t
      scene.environment = t
      scene.environmentIntensity = intensity
      onReady()
    }
    let worker: Worker | null = null
    const fallback = () => apply(bakeOnMainThread(gl))
    try {
      if (typeof OffscreenCanvas === 'undefined') throw new Error('no OffscreenCanvas')
      worker = new Worker(new URL('./envWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<{ ok: boolean; w: number; h: number; data: Uint16Array }>) => {
        if (e.data.ok) apply(fromTexels(e.data.w, e.data.h, e.data.data))
        else fallback()
        worker?.terminate()
      }
      worker.onerror = () => {
        fallback()
        worker?.terminate()
      }
      worker.postMessage('bake')
    } catch {
      fallback()
    }
    return () => {
      alive = false
      worker?.terminate()
      if (texture && scene.environment === texture) scene.environment = null
      texture?.dispose()
    }
  }, [gl, scene, intensity, onReady])

  return null
}
