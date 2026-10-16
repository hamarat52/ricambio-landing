import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect, ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { sceneRange } from '../content'
import { useStore, storyProgress } from '../store'
import { sparkleGlow } from '../story'

const SPARKLE = sceneRange('sparkle')

/**
 * Bloom (sparkles, crack, nozzle), Khronos Neutral tone mapping (keeps the
 * paper colour exact), very light grain and a soft vignette. When quality
 * drops, bloom goes first — except during the sparkle, which needs it.
 */
export function Effects({ bloom: bloomAllowed = true }: { bloom?: boolean }) {
  const quality = useStore((s) => s.quality)
  const inSparkle = useStore((s) => s.progress > SPARKLE.start && s.progress < SPARKLE.end)
  const bloom = useRef<BloomEffect>(null)

  useFrame(() => {
    if (!bloom.current) return
    const p = storyProgress()
    // the sparkle is the brightest moment on the page
    bloom.current.intensity = 0.75 + 2.6 * sparkleGlow(p)
  })

  // Bloom joins once the visitor starts scrolling (keeps the first load light).
  const withBloom = bloomAllowed && (quality !== 'low' || inSparkle)
  if (!withBloom) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.32} darkness={0.36} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : quality === 'medium' ? 2 : 0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.75} luminanceThreshold={1.0} luminanceSmoothing={0.2} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.12} />
      <Vignette offset={0.32} darkness={0.36} />
    </EffectComposer>
  )
}
