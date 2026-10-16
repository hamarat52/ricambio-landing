import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { Color, PlaneGeometry, ShaderMaterial } from 'three'
import { PALETTE } from '../content'
import { neutralPreimage } from '../lib/color'
import { remap } from '../lib/remap'
import { useStore } from '../store'
import { carPose } from '../story'

/**
 * The paper the car sits on: an unlit plane in exactly the background colour
 * (so there is no horizon), with an engineering grid (10 cm / 50 cm) that
 * fades with distance, and the turntable's degree ring.
 */
export const paperColor = neutralPreimage(PALETTE.paper)

export function PaperFloor() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uPaper: { value: paperColor },
          uInk: { value: new Color(PALETTE.ink) },
          uGrid: { value: 1 },
          uRing: { value: 1 },
          uRingAngle: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uPaper;
          uniform vec3 uInk;
          uniform float uGrid;
          uniform float uRing;
          uniform float uRingAngle;
          varying vec3 vWorld;

          float gridLine(vec2 p, float spacing, float width) {
            vec2 c = p / spacing;
            vec2 fw = fwidth(c);
            vec2 g = abs(fract(c - 0.5) - 0.5) / max(fw, 1e-4);
            float l = 1.0 - min(min(g.x, g.y) / width, 1.0);
            // fade lines that get denser than a pixel (no moiré)
            return l * (1.0 - smoothstep(0.25, 0.6, max(fw.x, fw.y)));
          }

          void main() {
            float h = max(cameraPosition.y, 0.2);
            float d = length(vWorld.xz - cameraPosition.xz);
            float fade = 1.0 - smoothstep(h * 1.6, h * 4.5, d);

            float minor = gridLine(vWorld.xz, 0.1, 0.9) * 0.45;
            float major = gridLine(vWorld.xz, 0.5, 1.1);
            float grid = max(minor, major) * fade * uGrid;

            // Turntable ring: outline + 5° ticks (longer every 30°), rotating with the car.
            float r = length(vWorld.xz);
            float R = 2.85;
            float ring = 1.0 - smoothstep(0.0, fwidth(r) * 1.5, abs(r - R));
            float ang = atan(vWorld.z, vWorld.x) + uRingAngle;
            float step5 = 6.2831853 / 72.0;
            float a5 = abs(fract(ang / step5 + 0.5) - 0.5) * step5 * r;
            float a30 = abs(fract(ang / (step5 * 6.0) + 0.5) - 0.5) * step5 * 6.0 * r;
            float tickW = fwidth(a5) * 1.2 + 0.002;
            float t5 = (1.0 - smoothstep(0.0, tickW, a5)) * step(R, r) * step(r, R + 0.07);
            float t30 = (1.0 - smoothstep(0.0, tickW, a30)) * step(R, r) * step(r, R + 0.16);
            float ringAll = max(ring, max(t5, t30)) * uRing;

            float ink = max(grid * 0.09, ringAll * 0.35);
            gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
          }`,
      }),
    [],
  )
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(400, 400)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  useFrame(() => {
    const p = useStore.getState().progress
    // The ring belongs to the turntable: visible in the hero and the finale.
    material.uniforms.uRing.value = Math.max(1 - remap(p, 0.04, 0.06), remap(p, 0.965, 0.99))
    material.uniforms.uRingAngle.value = carPose.angle
  })

  return <mesh geometry={geometry} material={material} renderOrder={-1} />
}
