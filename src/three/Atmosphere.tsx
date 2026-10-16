import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type DirectionalLight, type HemisphereLight } from 'three'
import { PALETTE, sceneRange } from '../content'
import { neutralPreimage } from '../lib/color'
import { power2InOut } from '../lib/easing'
import { remap } from '../lib/remap'
import { useStore } from '../store'
import { paperColor } from './PaperFloor'

const CTA = sceneRange('cta')

/**
 * Key light and the paper colour, with the golden-hour shift at the finale:
 * a warmer, lower key light and a faintly warm paper (the floor shares the
 * same Color object as the background, so there is still no horizon).
 */
export function Atmosphere() {
  const key = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const c = useMemo(
    () => ({
      paper: neutralPreimage(PALETTE.paper),
      warm: neutralPreimage('#d6cfc5'),
      keyDay: new Color('#fff4e8'),
      keyGold: new Color('#ffbf7a'),
    }),
    [],
  )

  useFrame(() => {
    const p = useStore.getState().progress
    const g = power2InOut(remap(p, CTA.start + (CTA.end - CTA.start) * 0.4, CTA.end))
    paperColor.copy(c.paper).lerp(c.warm, g)
    if (key.current) {
      key.current.color.copy(c.keyDay).lerp(c.keyGold, g)
      key.current.intensity = 1.5 + 0.9 * g
      key.current.position.set(5 - 2 * g, 7 - 4.6 * g, 2.5 - 4.5 * g)
    }
    if (hemi.current) hemi.current.intensity = 0.55 - 0.15 * g
  })

  return (
    <>
      <directionalLight ref={key} position={[5, 7, 2.5]} intensity={1.5} color="#fff4e8" />
      <hemisphereLight ref={hemi} args={['#ffffff', '#b9c1ca', 0.55]} />
    </>
  )
}
