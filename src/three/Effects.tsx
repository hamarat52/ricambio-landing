import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect, ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { useStore } from '../store'

/**
 * Bloom (sparkles, crack, nozzle), Khronos Neutral tone mapping (keeps the
 * paper colour exact), very light grain and a soft vignette. When the
 * performance monitor lowers quality, bloom is the first thing to go.
 */
export function Effects() {
  const quality = useStore((s) => s.quality)
  const bloom = useRef<BloomEffect>(null)

  useFrame(() => {
    if (!bloom.current) return
    // Scene-driven bloom boosts are added by later scenes (sparkle, printer).
    bloom.current.intensity = 0.75
  })

  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.32} darkness={0.36} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 2} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.75} luminanceThreshold={1.0} luminanceSmoothing={0.2} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.12} />
      <Vignette offset={0.32} darkness={0.36} />
    </EffectComposer>
  )
}
