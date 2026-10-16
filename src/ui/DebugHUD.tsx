import { useEffect, useRef } from 'react'
import { SCENES } from '../content'
import { remap } from '../lib/remap'
import { scrollToProgress } from '../lib/scroll'
import { useStore } from '../store'

/** `?debug` overlay: progress %, scene name, local t, FPS and scene boundary markers. */
export function DebugHUD() {
  const textRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let fps = 0
    let raf = 0
    const loop = (now: number) => {
      frames++
      if (now - last >= 500) {
        fps = (frames * 1000) / (now - last)
        frames = 0
        last = now
      }
      const s = useStore.getState()
      const scene = SCENES[s.sceneIndex]
      const t = remap(s.progress, scene.start, scene.end)
      if (textRef.current) {
        textRef.current.textContent =
          `progress  ${(s.progress * 100).toFixed(2)} %\n` +
          `scene     ${scene.name}\n` +
          `local t   ${t.toFixed(3)}\n` +
          `fps       ${fps.toFixed(0)}\n` +
          `mode      ${s.mobile ? 'mobile' : 'desktop'}${s.reducedMotion ? ' · reduced' : ''} · ${s.lang}`
      }
      if (fillRef.current) fillRef.current.style.height = `${s.progress * 100}%`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div className="debug-hud" ref={textRef} aria-hidden="true" />
      <nav className="debug-rail" aria-label="Debug scene markers">
        <div className="debug-rail__track">
          <div className="debug-rail__fill" ref={fillRef} />
        </div>
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="debug-rail__tick"
            style={{ top: `${s.start * 100}%` }}
            onClick={() => scrollToProgress(s.start + 0.0005, true)}
            title={s.name}
          >
            <span>{s.name}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
