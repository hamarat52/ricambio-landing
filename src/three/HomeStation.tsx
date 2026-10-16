import { ContactShadows } from '@react-three/drei'
import { useMemo } from 'react'
import { Color, MeshBasicMaterial, PlaneGeometry } from 'three'
import { BEATS } from '../content'
import { neutralPreimage } from '../lib/color'
import { beat } from '../lib/remap'
import { homeLocal } from '../story'
import { Printer } from './Printer'

export const HOME_BG = '#dce1e6'

/**
 * Meanwhile in Ankara (lighter tone): Selin's own open-frame printer prints
 * the same clip, faster thanks to scroll compression.
 */
export function HomeStation() {
  const floor = useMemo(() => {
    const g = new PlaneGeometry(20, 20)
    g.rotateX(-Math.PI / 2)
    return { g, m: new MeshBasicMaterial({ color: neutralPreimage(HOME_BG, new Color()) }) }
  }, [])
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[1.5, 3, -2]} intensity={1.6} color="#fff6ec" />
      <directionalLight position={[-2, 1.5, 1]} intensity={0.5} color="#dfe9f0" />
      <mesh geometry={floor.g} material={floor.m} position={[0, -0.001, 0]} />
      <ContactShadows position={[0, 0.001, 0]} scale={2} resolution={256} blur={2.2} far={0.6} opacity={0.45} frames={Infinity} />
      <Printer
        variant="home"
        count={1}
        position={[0, 0, 0]}
        progress={(p) => beat(homeLocal(p), BEATS.home.print)}
        visible={() => true}
        anchor="home"
      />
    </>
  )
}
