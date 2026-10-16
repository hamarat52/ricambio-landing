/// <reference lib="webworker" />
import {
  Color,
  DataUtils,
  DoubleSide,
  FloatType,
  Mesh,
  MeshBasicMaterial,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  PMREMGenerator,
  RGBAFormat,
  RingGeometry,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { ENV_BACKGROUND, ENV_FORMERS, ENV_SIZE } from './envFormers'

/**
 * Bakes the studio environment (light formers → PMREM) on an OffscreenCanvas
 * in a worker, then hands the cube-UV texels back as half floats. All shader
 * compiling for the PMREM blur happens here, off the main thread.
 */
self.onmessage = () => {
  try {
    const canvas = new OffscreenCanvas(8, 8)
    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false })
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
    const pmrem = new PMREMGenerator(renderer)
    const rt = pmrem.fromScene(env, 0.02, 0.1, 100, { size: ENV_SIZE })
    const w = rt.width
    const h = rt.height

    // Copy into a float target and read it back (float readback is always allowed).
    const copyTarget = new WebGLRenderTarget(w, h, { type: FloatType, format: RGBAFormat, depthBuffer: false })
    const quad = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        uniforms: { tMap: { value: rt.texture } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: 'uniform sampler2D tMap; varying vec2 vUv; void main() { gl_FragColor = texture2D(tMap, vUv); }',
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      }),
    )
    const copyScene = new Scene()
    copyScene.add(quad)
    renderer.setRenderTarget(copyTarget)
    renderer.render(copyScene, new OrthographicCamera(-1, 1, 1, -1, 0, 1))
    const floats = new Float32Array(w * h * 4)
    renderer.readRenderTargetPixels(copyTarget, 0, 0, w, h, floats)
    renderer.setRenderTarget(null)

    const halves = new Uint16Array(floats.length)
    for (let i = 0; i < floats.length; i++) halves[i] = DataUtils.toHalfFloat(floats[i])
    ;(self as unknown as Worker).postMessage({ ok: true, w, h, data: halves }, [halves.buffer])
    pmrem.dispose()
    renderer.dispose()
  } catch (err) {
    ;(self as unknown as Worker).postMessage({ ok: false, error: String(err) })
  }
}
