import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { CameraRig } from './CameraRig'
import { Car } from './Car'
import { Beacon } from './Beacon'
import { Effects } from './Effects'
import { MapDots } from './MapDots'
import { PALETTE } from '../content'
import { scanSeam } from '../story'
import { SCAN_KEYS } from './cameraPath'
import { ScanStation } from './ScanStation'
import { Sparkle, TORINO } from './Sparkle'
import { Printer } from './Printer'
import { ShipBox } from './ShipBox'
import { printerVisible, printFinish, printProgress } from '../story'
import { SplitView } from './SplitView'
import { PaperFloor, paperColor } from './PaperFloor'

/** Studio lighting built from light formers — nothing is downloaded. */
function Lights() {
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={0.85}>
        <color attach="background" args={['#aab3bd']} />
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
        <Lightformer form="rect" intensity={2.0} position={[6, 3.5, 3]} scale={[7, 3, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={0.7} position={[-6, 2, -5]} scale={[7, 2, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[1, 1.2, -8]} scale={[10, 0.6, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="ring" intensity={1.6} position={[-2, 4, 6]} scale={2.5} target={[0, 0, 0]} />
      </Environment>
      {/* key light from the top-left of the hero framing */}
      <directionalLight position={[5, 7, 2.5]} intensity={1.5} color="#fff4e8" />
      <hemisphereLight args={['#ffffff', '#b9c1ca', 0.55]} />
    </>
  )
}

/** Compile shaders up front, then tell the DOM the 3D scene is ready (fades the loader). */
function ReadySignal() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let alive = true
    // Not tied to requestAnimationFrame: a background tab never fires it.
    const done = () => {
      if (alive) setTimeout(() => useStore.getState().setReady3D(true), 60)
    }
    gl.compileAsync(scene, camera).then(done, done)
    // never keep the canvas hidden for long, even if parallel compile is slow
    const fallback = setTimeout(done, 2500)
    return () => {
      alive = false
      clearTimeout(fallback)
    }
  }, [gl, scene, camera])
  return null
}

/** In reduced-motion mode the canvas only re-renders when the progress changes. */
function DemandInvalidator() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useStore.subscribe((s) => s.progress, () => invalidate()), [invalidate])
  return null
}

export default function Experience() {
  const reduced = useStore((s) => s.reducedMotion)
  const setQuality = useStore((s) => s.setQuality)
  const [dpr, setDpr] = useState(Math.min(1.75, window.devicePixelRatio || 1))

  return (
    <Canvas
      dpr={dpr}
      flat
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 30, near: 0.02, far: 400, position: [5.4, 1.55, -4.6] }}
      onCreated={({ gl, scene }) => {
        gl.localClippingEnabled = true
        scene.background = paperColor
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <PerformanceMonitor
        bounds={(refresh) => (refresh > 90 ? [50, 80] : [40, 55])}
        flipflops={4}
        onChange={({ factor }) => setDpr(Math.min(1.75, Math.max(1, 1 + factor * 0.75)))}
        onDecline={() => {
          const q = useStore.getState().quality
          setQuality(q === 'high' ? 'medium' : 'low')
        }}
        onFallback={() => setQuality('low')}
      />
      <Lights />
      <CameraRig />
      <PaperFloor />
      <MapDots />
      <Beacon />
      <Sparkle />
      <Printer
        variant="shop"
        count={3}
        position={[TORINO.x, 0, TORINO.z]}
        progress={printProgress}
        finish={printFinish}
        visible={printerVisible}
        partsUntil={0.6605}
        anchor="shop"
      />
      <ShipBox />
      <Car />
      <SplitView seam={(p) => scanSeam(p, useStore.getState().mobile)} keys={SCAN_KEYS} background={PALETTE.inkDeep} environmentIntensity={0.18}>
        <ScanStation />
      </SplitView>
      <ContactShadows position={[0, 0.002, 0]} scale={9} resolution={512} blur={2.6} far={1.1} opacity={0.5} color="#111111" />
      <Effects />
      <ReadySignal />
      {reduced && <DemandInvalidator />}
    </Canvas>
  )
}
