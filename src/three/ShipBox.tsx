import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  CanvasTexture,
  type Group,
  type Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  Euler,
  Vector3,
} from 'three'
import { BRAND, COPY, type Lang } from '../content'
import { power2InOut, power2Out, power3Out } from '../lib/easing'
import { beat, hash01, lerp } from '../lib/remap'
import { useStore, storyProgress } from '../store'
import { packT, travelT } from '../story'
import { CLIP_MM, clipGeometries } from './clipGeometry'
import { TORINO } from './Sparkle'

const S = 0.004
export const BOX_POS = new Vector3(29.25, 0, 7.45)
const BOX = { w: 0.24, h: 0.1, d: 0.17, t: 0.005 }
const ISTANBUL = new Vector3(0.6, 1.2, -0.8)

function drawQr(lang: Lang): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 340
  const g = c.getContext('2d')!
  g.fillStyle = '#f3f5f7'
  g.fillRect(0, 0, c.width, c.height)
  const N = 21
  const m = 9
  const x0 = 28
  const y0 = 70
  g.fillStyle = '#111111'
  const finder = (fx: number, fy: number) => {
    g.fillRect(x0 + fx * m, y0 + fy * m, 7 * m, 7 * m)
    g.fillStyle = '#f3f5f7'
    g.fillRect(x0 + (fx + 1) * m, y0 + (fy + 1) * m, 5 * m, 5 * m)
    g.fillStyle = '#111111'
    g.fillRect(x0 + (fx + 2) * m, y0 + (fy + 2) * m, 3 * m, 3 * m)
  }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)
      if (!inFinder && hash01(x * 31 + y * 7 + 3) > 0.52) g.fillRect(x0 + x * m, y0 + y * m, m, m)
    }
  finder(0, 0)
  finder(14, 0)
  finder(0, 14)
  g.fillStyle = '#111111'
  g.font = '800 34px Archivo, Arial, sans-serif'
  const [a, b] = COPY[lang].ship.qr.split('? ')
  g.fillText(b ? `${a}?` : a, 240, 140)
  if (b) g.fillText(b, 240, 184)
  g.font = '500 20px "JetBrains Mono", monospace'
  g.fillText(`${BRAND.name} · QR`, 240, 236)
  return c
}

function drawLabel(lang: Lang): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 320
  const g = c.getContext('2d')!
  g.fillStyle = '#f7f7f4'
  g.fillRect(0, 0, c.width, c.height)
  g.strokeStyle = '#111111'
  g.lineWidth = 4
  g.strokeRect(10, 10, c.width - 20, c.height - 20)
  g.fillStyle = '#111111'
  g.font = '700 22px "JetBrains Mono", monospace'
  g.fillText(BRAND.name, 34, 56)
  g.font = '800 46px "JetBrains Mono", monospace'
  g.fillText(COPY[lang].ship.label, 34, 132)
  for (let i = 0; i < 64; i++) {
    const w = hash01(i * 13.1) > 0.5 ? 6 : 3
    if (hash01(i * 3.7 + 1) > 0.35) g.fillRect(34 + i * 7, 176, w, 96)
  }
  return c
}

/**
 * Scene 07: three clips drop into a kraft box, the QR fit-check card slides
 * in, the lid folds shut, tape runs across and the label prints; then the
 * box rides the map arc back to Istanbul (scaled up so it reads from above).
 */
export function ShipBox() {
  const lang = useStore((s) => s.lang)
  const clip = clipGeometries()
  const group = useRef<Group>(null)
  const clips = useRef<(Group | null)[]>([])
  const card = useRef<Mesh>(null)
  const lid = useRef<Group>(null)
  const tape = useRef<Mesh>(null)
  const label = useRef<Mesh>(null)

  const tex = useMemo(() => {
    const qr = new CanvasTexture(drawQr(lang))
    const lb = new CanvasTexture(drawLabel(lang))
    qr.colorSpace = SRGBColorSpace
    lb.colorSpace = SRGBColorSpace
    qr.anisotropy = 4
    lb.anisotropy = 4
    return { qr, lb }
  }, [lang])

  // Redraw once the web fonts are in (canvas text falls back until then).
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => {
      if (!alive) return
      tex.qr.image = drawQr(lang)
      tex.lb.image = drawLabel(lang)
      tex.qr.needsUpdate = true
      tex.lb.needsUpdate = true
    })
    return () => {
      alive = false
    }
  }, [tex, lang])

  const geo = useMemo(
    () => ({
      bottom: new BoxGeometry(BOX.w, BOX.t, BOX.d),
      long: new BoxGeometry(BOX.w, BOX.h, BOX.t),
      short: new BoxGeometry(BOX.t, BOX.h, BOX.d),
      lid: new BoxGeometry(BOX.w + 0.006, BOX.t, BOX.d + 0.004),
      card: new PlaneGeometry(0.2, 0.133),
      tape: new BoxGeometry(BOX.w + 0.012, 0.0015, 0.045),
      label: new PlaneGeometry(0.12, 0.075),
    }),
    [],
  )
  const mats = useMemo(
    () => ({
      kraft: new MeshStandardMaterial({ color: '#b98d5f', roughness: 0.92 }),
      kraftIn: new MeshStandardMaterial({ color: '#9c7349', roughness: 0.95 }),
      part: new MeshStandardMaterial({ color: '#4c5259', roughness: 0.6 }),
      tape: new MeshStandardMaterial({ color: '#d9c49b', roughness: 0.4, transparent: true, opacity: 0.85 }),
    }),
    [],
  )
  const paper = useMemo(() => ({ qr: new MeshStandardMaterial({ map: tex.qr, roughness: 0.8 }), lb: new MeshStandardMaterial({ map: tex.lb, roughness: 0.7 }) }), [tex])

  // Where the printed clips sit on the bed (world), and where they land in the box (box space).
  const motion = useMemo(() => {
    const qFrom = new Quaternion().setFromEuler(new Euler(0, Math.PI, 0))
    const qTo = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0.12))
    const from = [-0.105, 0, 0.105].map((x) => new Vector3(TORINO.x + x - BOX_POS.x, 0.166, TORINO.z - BOX_POS.z))
    const to = [-0.07, 0, 0.07].map((x, i) => new Vector3(x, BOX.t + (CLIP_MM.depth / 2) * S + i * 0.002, -0.01))
    return { qFrom, qTo, from, to, q: new Quaternion(), v: new Vector3() }
  }, [])

  const arc = useMemo(() => {
    const a = BOX_POS.clone().setY(0.05)
    const mid = a.clone().lerp(ISTANBUL, 0.5)
    mid.y += a.distanceTo(ISTANBUL) * 0.3
    return { curve: new QuadraticBezierCurve3(a, mid, ISTANBUL.clone()), p: new Vector3() }
  }, [])

  useFrame(() => {
    const p = storyProgress()
    const g = group.current
    if (!g) return
    g.visible = p > 0.659 && p < 0.726
    if (!g.visible) return
    const k = packT(p)

    clips.current.forEach((c, i) => {
      if (!c) return
      const m = power2InOut(beat(k, [0.02 + i * 0.07, 0.22 + i * 0.07]))
      motion.v.copy(motion.from[i]).lerp(motion.to[i], m)
      motion.v.y += Math.sin(Math.PI * m) * 0.16
      c.position.copy(motion.v)
      c.quaternion.slerpQuaternions(motion.qFrom, motion.qTo, m)
    })

    const cd = power3Out(beat(k, [0.32, 0.46]))
    if (card.current) {
      card.current.visible = cd > 0
      card.current.position.set(0, lerp(0.32, BOX.t + 0.03, cd), lerp(-0.12, 0, cd))
    }
    if (lid.current) lid.current.rotation.x = -1.95 * (1 - power2InOut(beat(k, [0.5, 0.72])))
    const tp = power2Out(beat(k, [0.74, 0.86]))
    if (tape.current) {
      tape.current.visible = tp > 0
      tape.current.scale.x = Math.max(0.001, tp)
      tape.current.position.x = (-(1 - tp) * (BOX.w + 0.012)) / 2
    }
    const lb = power2Out(beat(k, [0.86, 1]))
    if (label.current) {
      label.current.visible = lb > 0
      label.current.scale.set(1, Math.max(0.001, lb), 1)
    }

    // Travel back along the map arc
    const tr = travelT(p)
    if (tr > 0) {
      arc.curve.getPoint(tr, arc.p)
      g.position.copy(arc.p)
      g.scale.setScalar(1 + 15 * Math.sqrt(Math.sin(Math.PI * Math.min(1, tr))))
      g.rotation.y = tr * 0.6
    } else {
      g.position.copy(BOX_POS)
      g.scale.setScalar(1)
      g.rotation.y = 0
    }
  })

  return (
    <group ref={group} position={BOX_POS} visible={false}>
      <mesh geometry={geo.bottom} material={mats.kraftIn} position={[0, BOX.t / 2, 0]} />
      <mesh geometry={geo.long} material={mats.kraft} position={[0, BOX.h / 2, -BOX.d / 2]} />
      <mesh geometry={geo.long} material={mats.kraft} position={[0, BOX.h / 2, BOX.d / 2]} />
      <mesh geometry={geo.short} material={mats.kraft} position={[-BOX.w / 2, BOX.h / 2, 0]} />
      <mesh geometry={geo.short} material={mats.kraft} position={[BOX.w / 2, BOX.h / 2, 0]} />

      {[0, 1, 2].map((i) => (
        <group
          key={i}
          ref={(el) => {
            clips.current[i] = el
          }}
        >
          <mesh geometry={clip.intact} material={mats.part} scale={S} />
        </group>
      ))}

      <mesh ref={card} geometry={geo.card} material={paper.qr} rotation={[-Math.PI / 2, 0, Math.PI]} visible={false} />

      {/* lid hinged along the back edge */}
      <group ref={lid} position={[0, BOX.h, BOX.d / 2]}>
        <group position={[0, BOX.t / 2, -BOX.d / 2]}>
          <mesh geometry={geo.lid} material={mats.kraft} />
          <mesh ref={tape} geometry={geo.tape} material={mats.tape} position={[0, BOX.t / 2 + 0.001, 0]} visible={false} />
          <mesh
            ref={label}
            geometry={geo.label}
            material={paper.lb}
            position={[0.04, BOX.t / 2 + 0.0025, 0.035]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            visible={false}
          />
        </group>
      </group>
    </group>
  )
}
