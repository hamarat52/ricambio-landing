import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PALETTE } from '../content'
import { useStore } from '../store'
import { homeSeam, printerVisible, printFinish, printProgress, scanSeam } from '../story'
import { Atmosphere } from './Atmosphere'
import { Beacon } from './Beacon'
import { CameraRig } from './CameraRig'
import { Car } from './Car'
import { HOME_KEYS, SCAN_KEYS } from './cameraPath'
import { Effects } from './Effects'
import { HOME_BG, HomeStation } from './HomeStation'
import { MapDots } from './MapDots'
import { PaperFloor, paperColor } from './PaperFloor'
import { PartsLibrary } from './PartsLibrary'
import { Printer } from './Printer'
import { ScanStation } from './ScanStation'
import { ShipBox } from './ShipBox'
import { Sparkle, TORINO } from './Sparkle'
import { SplitView } from './SplitView'
import { StudioEnvironment } from './StudioEnvironment'
import { compileForComposer } from './compile'

/** Studio lighting: baked light-former reflections plus the key light — nothing is downloaded. */
function Lights({ onEnv }: { onEnv: () => void }) {
  return (
    <>
      <StudioEnvironment intensity={0.85} onReady={onEnv} />
      {/* key light from the top-left of the hero framing, warming at the finale */}
      <Atmosphere />
    </>
  )
}

/**
 * Contact shadows re-render the scene from below, so they only update while
 * the car moves on its turntable (hero, finale); elsewhere they hold.
 */
function Shadows() {
  const live = useStore((s) => s.progress < 0.06 || s.progress > 0.95)
  return <ContactShadows position={[0, 0.002, 0]} scale={9} resolution={512} blur={2.6} far={1.1} opacity={0.5} color="#111111" frames={live ? Infinity : 1} />
}

/**
 * Compile the hero's shaders before the first frame (the render loop stays
 * off until then, so nothing compiles synchronously mid-frame), then tell
 * the DOM the 3D scene is ready.
 */
function ReadySignal({ onCompiled }: { onCompiled: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let alive = true
    let fired = false
    // Not tied to requestAnimationFrame: a background tab never fires it.
    const done = () => {
      if (!alive || fired) return
      fired = true
      onCompiled()
      setTimeout(() => useStore.getState().setReady3D(true), 60)
    }
    compileForComposer(gl, scene, camera).then(done, done)
    // never keep the canvas hidden for long, even if parallel compile is slow
    const fallback = setTimeout(done, 2500)
    return () => {
      alive = false
      clearTimeout(fallback)
    }
  }, [gl, scene, camera, onCompiled])
  return null
}

/** Pre-compiles whatever a newly mounted stage added (off the main thread where supported). */
function StageCompiler() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    compileForComposer(gl, scene, camera).catch(() => {})
  }, [gl, scene, camera])
  return null
}

/** In reduced-motion mode the canvas only re-renders when the progress changes. */
function DemandInvalidator({ stage }: { stage: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useStore.subscribe((s) => s.progress, () => invalidate()), [invalidate])
  // first still, and again whenever a stage mounts or the language changes a texture
  useEffect(() => {
    invalidate()
    const t = setTimeout(() => invalidate(), 300)
    return () => clearTimeout(t)
  }, [invalidate, stage])
  return null
}

/**
 * Staged mounting keeps the first load light: the hero mounts at once; the
 * map, the scan, the print shop and the library mount one per idle period
 * once the visitor starts scrolling (or after a while), and all at once if
 * the page opens deep in the story.
 */
const STAGES = 4
function useStages(): number {
  const [stage, setStage] = useState(() => (useStore.getState().progress > 0.03 ? STAGES : 0))
  const started = useRef(stage > 0)

  useEffect(() => {
    if (stage >= STAGES) return
    let idle = 0
    let timer = 0
    const next = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120))
      idle = ric(() => setStage((s) => Math.min(STAGES, s + 1)), { timeout: 1200 }) as number
    }
    const start = () => {
      if (started.current) return
      started.current = true
      next()
    }
    if (started.current) next()
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    events.forEach((e) => window.addEventListener(e, start, { passive: true, once: true }))
    timer = window.setTimeout(start, 7000)
    const unsub = useStore.subscribe(
      (s) => s.progress,
      (p) => {
        if (p > 0.12) setStage(STAGES)
        else if (p > 0.004) start()
      },
    )
    return () => {
      events.forEach((e) => window.removeEventListener(e, start))
      window.clearTimeout(timer)
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle)
      unsub()
    }
  }, [stage])
  return stage
}

// dev-only bisecting aid: ?skip=env,car,fx,shadows
const SKIP = new Set(import.meta.env.DEV ? (new URLSearchParams(window.location.search).get("skip") ?? "").split(",") : [])

export default function Experience() {
  const reduced = useStore((s) => s.reducedMotion)
  const setQuality = useStore((s) => s.setQuality)
  const [dpr, setDpr] = useState(Math.min(1.75, window.devicePixelRatio || 1))
  const [compiled, setCompiled] = useState(false)
  const onCompiled = useCallback(() => setCompiled(true), [])
  // Materials compile only once the environment exists (or after a safety timeout).
  const [envReady, setEnvReady] = useState(false)
  const onEnv = useCallback(() => setEnvReady(true), [])
  useEffect(() => {
    const t = setTimeout(() => setEnvReady(true), 4000)
    return () => clearTimeout(t)
  }, [])
  const stage = useStages()

  return (
    <Canvas
      dpr={dpr}
      flat
      frameloop={!compiled ? 'never' : reduced ? 'demand' : 'always'}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 30, near: 0.02, far: 400, position: [5.4, 1.55, -4.6] }}
      onCreated={({ gl, scene }) => {
        gl.localClippingEnabled = true
        // In production, never block the main thread on a shader link-status
        // query: the GPU process compiles asynchronously (errors still show in dev).
        gl.debug.checkShaderErrors = import.meta.env.DEV
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
      {!SKIP.has("env") && <Lights onEnv={onEnv} />}
      <CameraRig />
      <PaperFloor />
      {!SKIP.has("car") && <Car />}
      {!SKIP.has("shadows") && <Shadows />}
      {!SKIP.has("fx") && <Effects bloom={stage >= 1} />}
      {(envReady || SKIP.has("env")) && <ReadySignal onCompiled={onCompiled} />}
      {stage >= 1 && (
        <>
          <MapDots />
          <Beacon />
          <StageCompiler />
        </>
      )}
      {stage >= 2 && (
        <>
          <Sparkle />
          <SplitView seam={(p) => scanSeam(p, useStore.getState().mobile)} keys={SCAN_KEYS} background={PALETTE.inkDeep} environmentIntensity={0.18}>
            <ScanStation />
          </SplitView>
          <StageCompiler />
        </>
      )}
      {stage >= 3 && (
        <>
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
          <StageCompiler />
        </>
      )}
      {stage >= 4 && (
        <>
          <SplitView seam={(p) => homeSeam(p, useStore.getState().mobile)} keys={HOME_KEYS} background={HOME_BG} environmentIntensity={0.6}>
            <HomeStation />
          </SplitView>
          <PartsLibrary />
          <StageCompiler />
        </>
      )}
      {reduced && compiled && <DemandInvalidator stage={stage} />}
    </Canvas>
  )
}
