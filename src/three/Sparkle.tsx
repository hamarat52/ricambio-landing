import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  type PerspectiveCamera,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
} from 'three'
import { CITIES, PALETTE } from '../content'
import { getAnchor } from '../lib/anchors'
import { project } from '../lib/geo'
import { power2Out, power3Out } from '../lib/easing'
import { hash01 } from '../lib/remap'
import { playChime } from '../lib/sound'
import { useStore } from '../store'
import { arcHead, BURST_AT, burstT, mapOpacity, sparkleLocal } from '../story'

const ISTANBUL = new Vector3(0, 1.6, 0)
const TRAIL_SEG = 64
const [tx, tz] = project(CITIES.torino.lon, CITIES.torino.lat)
export const TORINO = new Vector3(tx, 0.4, tz)

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  uniform float uMax;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(aSize * uScale / -mv.z, uMax);
    vAlpha = aAlpha;
  }`
const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = pow(max(0.0, 1.0 - d), 2.2);
    if (core * vAlpha < 0.01) discard;
    gl_FragColor = vec4(uColor * core * vAlpha, 1.0);
  }`

function cloud(n: number, color: Color) {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
  g.setAttribute('aSize', new BufferAttribute(new Float32Array(n), 1))
  g.setAttribute('aAlpha', new BufferAttribute(new Float32Array(n), 1))
  const m = new ShaderMaterial({
    uniforms: { uScale: { value: 800 }, uMax: { value: 64 }, uColor: { value: color } },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  })
  return { g, m, n }
}

/**
 * Scene 05: the file travels as a stream of teal particles from Torino to
 * Emre's phone, then the phone lights up with a bloom burst and a few
 * long-lived glints float up. The brightest moment on the page.
 */
export function Sparkle() {
  const mobile = useStore((s) => s.mobile)
  const stream = useMemo(() => cloud(mobile ? 140 : 280, new Color(PALETTE.teal).multiplyScalar(3.4)), [mobile])
  const burst = useMemo(() => cloud(mobile ? 110 : 200, new Color(5.5, 6.2, 6.4)), [mobile])
  const glints = useMemo(() => cloud(28, new Color(4, 4.6, 4.8)), [])
  const marker = useMemo(() => cloud(1, new Color(PALETTE.teal).multiplyScalar(2.2)), [])
  const trail = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array((TRAIL_SEG + 1) * 3), 3))
    const m = new LineBasicMaterial({
      color: new Color(PALETTE.teal).multiplyScalar(2.4),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    })
    return { g, m, line: new Line(g, m) }
  }, [])
  const lastP = useRef(0)

  const seeds = useMemo(() => {
    const n = Math.max(stream.n, burst.n, glints.n)
    return Array.from({ length: n }, (_, i) => [hash01(i * 1.7 + 0.1), hash01(i * 3.1 + 0.7), hash01(i * 5.3 + 0.4)])
  }, [stream.n, burst.n, glints.n])

  const tmp = useMemo(
    () => ({
      end: new Vector3(),
      dir: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      p: new Vector3(),
      curve: new QuadraticBezierCurve3(TORINO.clone(), new Vector3(), new Vector3()),
    }),
    [],
  )
  const phone = getAnchor('phone-screen')

  useFrame(({ camera, size, viewport, clock }) => {
    const { progress: p, sound } = useStore.getState()
    const cam = camera as PerspectiveCamera
    const scale = (size.height * viewport.dpr) / (2 * Math.tan((cam.fov * Math.PI) / 360))
    for (const c of [stream, burst, glints, marker]) {
      c.m.uniforms.uScale.value = scale
      c.m.uniforms.uMax.value = 40 * viewport.dpr
    }

    if (sound && lastP.current < BURST_AT && p >= BURST_AT && p - lastP.current < 0.03) playChime()
    lastP.current = p

    // Where the phone is (world point on the ray through its screen), or Istanbul.
    const distI = cam.position.distanceTo(ISTANBUL)
    if (phone.visible) {
      const nx = (phone.x / size.width) * 2 - 1
      const ny = -(phone.y / size.height) * 2 + 1
      tmp.dir.set(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize()
      tmp.end.copy(cam.position).addScaledVector(tmp.dir, distI * 0.35)
    } else tmp.end.copy(ISTANBUL)
    tmp.right.set(1, 0, 0).applyQuaternion(cam.quaternion)
    tmp.up.set(0, 1, 0).applyQuaternion(cam.quaternion)

    // Torino marker: the source, from the end of the scan to the shipment.
    const mo = mapOpacity(p) * (p > 0.445 && p < 0.725 ? 1 : 0)
    const mp = marker.g.getAttribute('position') as BufferAttribute
    mp.setXYZ(0, TORINO.x, 0.05, TORINO.z)
    ;(marker.g.getAttribute('aSize') as BufferAttribute).setX(0, 0.9 + 0.15 * Math.sin(clock.elapsedTime * 3))
    ;(marker.g.getAttribute('aAlpha') as BufferAttribute).setX(0, mo)
    mp.needsUpdate = true
    marker.g.attributes.aSize.needsUpdate = true
    marker.g.attributes.aAlpha.needsUpdate = true

    // Stream along the arc
    const head = arcHead(p)
    const t = sparkleLocal(p)
    const streamOn = head > 0 && burstT(p) < 0.15
    tmp.curve.v2.copy(tmp.end)
    tmp.curve.v1.copy(TORINO).lerp(tmp.end, 0.5)
    tmp.curve.v1.y += TORINO.distanceTo(tmp.end) * 0.32
    {
      const pos = stream.g.getAttribute('position') as BufferAttribute
      const sz = stream.g.getAttribute('aSize') as BufferAttribute
      const al = stream.g.getAttribute('aAlpha') as BufferAttribute
      for (let i = 0; i < stream.n; i++) {
        const [a, b, c] = seeds[i]
        const u = head * 1.25 - a * 0.3
        const on = streamOn && u > 0 && u < 1
        if (!on) {
          al.setX(i, 0)
          continue
        }
        tmp.curve.getPoint(u, tmp.p)
        const spread = (0.15 + 0.5 * Math.sin(Math.PI * u)) * distI * 0.012 * (0.3 + a)
        tmp.p.addScaledVector(tmp.right, (b - 0.5) * spread).addScaledVector(tmp.up, (c - 0.5) * spread)
        pos.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
        sz.setX(i, (0.35 + 0.65 * (1 - a)) * (distI * 0.006))
        al.setX(i, (1 - a * 0.85) * Math.min(1, u * 6))
      }
      pos.needsUpdate = true
      sz.needsUpdate = true
      al.needsUpdate = true
    }

    // Soft trail: the arc itself, drawn up to the head of the stream
    {
      const pos = trail.g.getAttribute('position') as BufferAttribute
      for (let i = 0; i <= TRAIL_SEG; i++) {
        tmp.curve.getPoint(i / TRAIL_SEG, tmp.p)
        pos.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
      }
      pos.needsUpdate = true
      const k = Math.min(1, head * 1.25)
      trail.g.setDrawRange(0, streamOn ? Math.max(0, Math.floor(k * TRAIL_SEG) + 1) : 0)
      trail.m.opacity = streamOn ? 0.55 * (1 - burstT(p) * 6) : 0
    }

    // Burst: particles fly out around the phone in the screen plane
    const bt = burstT(p)
    {
      const pos = burst.g.getAttribute('position') as BufferAttribute
      const sz = burst.g.getAttribute('aSize') as BufferAttribute
      const al = burst.g.getAttribute('aAlpha') as BufferAttribute
      const on = bt > 0 && bt < 1
      const R = distI * 0.11
      for (let i = 0; i < burst.n; i++) {
        const [a, b, c] = seeds[i]
        if (!on) {
          al.setX(i, 0)
          continue
        }
        const ang = a * Math.PI * 2
        const r = R * (0.25 + 0.75 * b) * power3Out(Math.min(1, bt * 1.3))
        tmp.p
          .copy(tmp.end)
          .addScaledVector(tmp.right, Math.cos(ang) * r)
          .addScaledVector(tmp.up, Math.sin(ang) * r * 1.25 + bt * R * 0.25)
        pos.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
        sz.setX(i, distI * 0.0045 * (0.4 + c) * (1 - bt * 0.6))
        al.setX(i, Math.pow(1 - bt, 1.5) * Math.min(1, bt * 20))
      }
      pos.needsUpdate = true
      sz.needsUpdate = true
      al.needsUpdate = true
    }

    // Glints: a few long-lived sparks that float up and twinkle
    {
      const pos = glints.g.getAttribute('position') as BufferAttribute
      const sz = glints.g.getAttribute('aSize') as BufferAttribute
      const al = glints.g.getAttribute('aAlpha') as BufferAttribute
      const g = t >= 0.45 ? Math.min(1, (t - 0.45) / 0.45) : 0
      const on = g > 0 && g < 1
      const R = distI * 0.2
      for (let i = 0; i < glints.n; i++) {
        const [a, b, c] = seeds[i]
        if (!on) {
          al.setX(i, 0)
          continue
        }
        const x = (a - 0.5) * R * 1.4
        const y = (b - 0.2) * R * 0.6 + power2Out(g) * R * (0.8 + c)
        tmp.p.copy(tmp.end).addScaledVector(tmp.right, x).addScaledVector(tmp.up, y)
        pos.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
        const tw = 0.55 + 0.45 * Math.sin(clock.elapsedTime * (3 + c * 4) + a * 20)
        sz.setX(i, distI * 0.0035 * (0.6 + c))
        al.setX(i, tw * Math.min(1, g * 8) * (1 - g))
      }
      pos.needsUpdate = true
      sz.needsUpdate = true
      al.needsUpdate = true
    }
  })

  return (
    <group>
      <points geometry={marker.g} material={marker.m} frustumCulled={false} renderOrder={30} />
      <primitive object={trail.line} frustumCulled={false} renderOrder={30} />
      <points geometry={stream.g} material={stream.m} frustumCulled={false} renderOrder={31} />
      <points geometry={burst.g} material={burst.m} frustumCulled={false} renderOrder={32} />
      <points geometry={glints.g} material={glints.m} frustumCulled={false} renderOrder={33} />
    </group>
  )
}
