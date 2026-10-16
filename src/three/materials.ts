import {
  AdditiveBlending,
  Color,
  DoubleSide,
  LineBasicMaterial,
  type Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Plane,
  ShaderMaterial,
  Vector3,
} from 'three'
import { CAR_FINISH, PALETTE } from '../content'

/**
 * Shared materials, created once. The car's cut-away uses clipping planes
 * defined in car space and re-projected to world space every frame (the car
 * sits on a turntable).
 */

const local = {
  // Door box (removed where ALL four are negative): x ∈ [-0.95, 0.78], y > 0.30, z < zc
  door: [
    new Plane(new Vector3(-1, 0, 0), -0.95),
    new Plane(new Vector3(1, 0, 0), -0.78),
    new Plane(new Vector3(0, -1, 0), 0.3),
    new Plane(new Vector3(0, 0, 1), 1.2),
  ],
  // Everything above the belt line goes: y > yc
  top: new Plane(new Vector3(0, -1, 0), 1.7),
}

const world = {
  door: local.door.map((p) => p.clone()),
  top: [local.top.clone()],
}

/** Paint that shows the dark interior trim on its back faces (seen through the cut-away). */
function paint(clipping: Plane[], clipIntersection: boolean) {
  const clay = CAR_FINISH === 'clay'
  const m = new MeshPhysicalMaterial({
    color: clay ? PALETTE.clay : PALETTE.red,
    roughness: clay ? 0.8 : 0.35,
    metalness: 0,
    clearcoat: clay ? 0 : 1,
    clearcoatRoughness: 0.15,
    side: DoubleSide,
    clippingPlanes: clipping,
    clipIntersection,
  })
  const interior = new Color(PALETTE.interior)
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uInterior = { value: interior }
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec3 uInterior;\nvoid main() {')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb = uInterior;')
      .replace(
        '#include <lights_physical_fragment>',
        '#include <lights_physical_fragment>\n  if (!gl_FrontFacing) { material.roughness = 0.75; ' +
          (clay ? '' : 'material.clearcoat = 0.0; ') +
          '}',
      )
  }
  m.customProgramCacheKey = () => `paint-${clay}`
  return m
}

let cache: ReturnType<typeof build> | null = null

function build() {
  // standard (not physical) keeps the hero's shader compile light; env reflections still read as glass
  const glass = new MeshStandardMaterial({
    color: '#12171c',
    roughness: 0.04,
    metalness: 0.6,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    clippingPlanes: world.top,
  })
  const trim = new MeshStandardMaterial({ color: PALETTE.interior, roughness: 0.62, metalness: 0 })
  return {
    paintLower: paint(world.door, true),
    paintUpper: paint(world.top, false),
    glass,
    trimUpper: new MeshStandardMaterial({ color: '#1f2226', roughness: 0.5, clippingPlanes: world.top }),
    trimExterior: new MeshStandardMaterial({
      color: '#25282c',
      roughness: 0.55,
      clippingPlanes: world.door,
      clipIntersection: true,
    }),
    trim,
    trimLight: new MeshStandardMaterial({ color: '#3a3e44', roughness: 0.5 }),
    seat: new MeshStandardMaterial({ color: '#23262a', roughness: 0.9 }),
    mat: new MeshStandardMaterial({ color: '#17191c', roughness: 0.95 }),
    black: new MeshStandardMaterial({ color: '#0a0b0c', roughness: 0.7 }),
    tire: new MeshStandardMaterial({ color: '#18191b', roughness: 0.88 }),
    rim: new MeshStandardMaterial({ color: '#a9b0b7', roughness: 0.32, metalness: 0.85 }),
    rimDark: new MeshStandardMaterial({ color: '#2b2f33', roughness: 0.5, metalness: 0.6 }),
    headlight: new MeshStandardMaterial({ color: '#dfe5ea', roughness: 0.1, metalness: 0.3, emissive: '#fff4e0', emissiveIntensity: 0.15 }),
    taillight: new MeshStandardMaterial({ color: '#5e0c10', roughness: 0.15, metalness: 0.2, emissive: '#8c1016', emissiveIntensity: 0.35 }),
    /** Aged grey ASA/ABS: lighter than the dash so the part reads against it. */
    clipPlastic: new MeshStandardMaterial({ color: '#626870', roughness: 0.55, metalness: 0 }),
    crack: new LineBasicMaterial({ color: new Color(3.2, 1.6, 1.1), toneMapped: false, transparent: true }),
    flash: new ShaderMaterial({
      uniforms: { uIntensity: { value: 0 }, uColor: { value: new Color(4, 3.4, 2.8) } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 3.0) * uIntensity;
          float ray = pow(max(0.0, 1.0 - abs(vUv.y - 0.5) * 18.0), 2.0) * max(0.0, 1.0 - d) * uIntensity;
          gl_FragColor = vec4(uColor * (a + ray * 0.6), 1.0);
        }`,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  }
}

export function materials() {
  return (cache ??= build())
}

/**
 * Cut-away amount 0 → 1. Lowers the top clipping plane from above the roof to
 * the belt line and slices the driver's door away from the outside in.
 */
export function setCutaway(amount: number, carMatrix: Matrix4) {
  const yc = 1.7 - (1.7 - 0.975) * amount
  const zc = -1.2 + (1.2 - 0.6) * amount
  local.top.constant = yc
  local.door[3].constant = -zc
  for (let i = 0; i < 4; i++) world.door[i].copy(local.door[i]).applyMatrix4(carMatrix)
  world.top[0].copy(local.top).applyMatrix4(carMatrix)
}
