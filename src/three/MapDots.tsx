import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Mesh,
  MeshBasicMaterial,
  type PerspectiveCamera,
  RingGeometry,
  ShaderMaterial,
} from 'three'
import { PALETTE, WANTING_CITIES } from '../content'
import { landDots, owners, project } from '../lib/geo'
import { useStore } from '../store'
import { istanbulPulse, mapOpacity, mapReveal, requestLocal } from '../story'
import { ScreenAnchor } from './ScreenAnchor'

/**
 * The paper becomes a dot-matrix map of Europe and Turkey (no tiles): ink
 * dots on a square grid, revealed outward from Istanbul (under the car).
 * Owners who want the clip pop in teal; Istanbul pulses after the request.
 */

const pointVert = /* glsl */ `
  attribute float aDist;
  uniform float uReveal;
  uniform float uScale;
  uniform float uSize;
  uniform float uMaxPx;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // pull the sprite toward the camera so the floor does not cut its lower half
    mv.xyz += normalize(-mv.xyz) * uSize * 0.9;
    gl_Position = projectionMatrix * mv;
    // crisp dot-matrix: never larger than a few pixels, however close the camera
    gl_PointSize = min(uSize * uScale / -mv.z, uMaxPx);
    vA = 1.0 - smoothstep(uReveal - 7.0, uReveal, aDist);
  }`

const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.36, 0.5, d)) * vA * uOpacity * smoothstep(2.5, 7.0, cameraPosition.y);
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }`

const ownerVert = /* glsl */ `
  attribute float aT;
  uniform float uT;
  uniform float uScale;
  uniform float uDpr;
  varying float vPop;
  varying float vOn;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    mv.xyz += normalize(-mv.xyz) * 1.4;
    gl_Position = projectionMatrix * mv;
    float on = step(aT, uT);
    float pop = on * exp(-(uT - aT) * 55.0);
    vOn = on;
    vPop = pop;
    gl_PointSize = min(0.62 * uScale / -mv.z, 11.0 * uDpr) * (1.0 + 1.6 * pop) * on;
  }`

const ownerFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vPop;
  varying float vOn;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.3, 0.5, d);
    float a = core * vOn * uOpacity * smoothstep(2.5, 7.0, cameraPosition.y);
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor * (1.0 + 3.5 * vPop), a);
  }`

export function MapDots() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)

  const land = useMemo(() => {
    const d = landDots()
    const n = d.length / 3
    const pos = new Float32Array(n * 3)
    const dist = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = d[i * 3]
      pos[i * 3 + 1] = 0.012
      pos[i * 3 + 2] = d[i * 3 + 1]
      dist[i] = d[i * 3 + 2]
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aDist', new Float32BufferAttribute(dist, 1))
    const m = new ShaderMaterial({
      uniforms: {
        uReveal: { value: 0 },
        uScale: { value: 800 },
        uSize: { value: 0.34 },
        uMaxPx: { value: 7 },
        uColor: { value: new Color(PALETTE.ink) },
        uOpacity: { value: 0 },
      },
      vertexShader: pointVert,
      fragmentShader: pointFrag,
      transparent: true,
      depthWrite: false,
    })
    return { g, m }
  }, [])

  const own = useMemo(() => {
    const list = owners()
    const pos = new Float32Array(list.length * 3)
    const t = new Float32Array(list.length)
    list.forEach((o, i) => {
      pos[i * 3] = o.x
      pos[i * 3 + 1] = 0.03
      pos[i * 3 + 2] = o.z
      t[i] = o.t
    })
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aT', new Float32BufferAttribute(t, 1))
    const m = new ShaderMaterial({
      uniforms: {
        uT: { value: 0 },
        uScale: { value: 800 },
        uDpr: { value: 1 },
        uColor: { value: new Color(PALETTE.teal) },
        uOpacity: { value: 0 },
      },
      vertexShader: ownerVert,
      fragmentShader: ownerFrag,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    return { g, m }
  }, [])

  const cityAnchors = useMemo(
    () =>
      WANTING_CITIES.map((c) => {
        const [x, z] = project(c.lon, c.lat)
        return { key: c.key, pos: [x, 0.05, z] as [number, number, number] }
      }),
    [],
  )

  // Istanbul: three expanding rings around the car.
  const ringGeo = useMemo(() => {
    const g = new RingGeometry(0.94, 1, 72)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const ringMats = useMemo(() => {
    const m = new MeshBasicMaterial({
      color: new Color(PALETTE.teal).multiplyScalar(1.6),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    })
    return [m, m.clone(), m.clone()]
  }, [])
  const rings = useRef<(Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const p = useStore.getState().progress
    const scale = (size.height * viewport.dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360))
    const o = mapOpacity(p)
    land.m.uniforms.uScale.value = scale
    land.m.uniforms.uMaxPx.value = 5.5 * viewport.dpr
    land.m.uniforms.uReveal.value = mapReveal(p)
    land.m.uniforms.uOpacity.value = 0.34 * o
    own.m.uniforms.uScale.value = scale
    own.m.uniforms.uDpr.value = viewport.dpr
    own.m.uniforms.uT.value = requestLocal(p)
    own.m.uniforms.uOpacity.value = o

    const pulse = istanbulPulse(p) * o
    const reduced = useStore.getState().reducedMotion
    rings.current.forEach((r, i) => {
      if (!r) return
      const ph = reduced ? 0.35 + i * 0.2 : (clock.elapsedTime / 2.2 + i / 3) % 1
      r.visible = pulse > 0.01
      r.scale.setScalar(2.4 + ph * 9)
      ;(r.material as MeshBasicMaterial).opacity = (1 - ph) * (1 - ph) * pulse
    })
  })

  return (
    <group>
      <points geometry={land.g} material={land.m} frustumCulled={false} renderOrder={1} />
      <points geometry={own.g} material={own.m} frustumCulled={false} renderOrder={2} />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el
          }}
          geometry={ringGeo}
          material={ringMats[i]}
          position={[0, 0.02, 0]}
          visible={false}
          renderOrder={3}
        />
      ))}
      {cityAnchors.map((c) => (
        <ScreenAnchor key={c.key} name={`city-${c.key}`} position={c.pos} />
      ))}
      <ScreenAnchor name="city-istanbul" position={[0, 1.6, 0]} />
    </group>
  )
}
