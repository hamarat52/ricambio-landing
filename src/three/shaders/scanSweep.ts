import { Color, type MeshStandardMaterial, ShaderMaterial } from 'three'

/**
 * Point cloud revealed by the scanner sweep. Each point (MeshSurfaceSampler,
 * clip millimetre space) appears once the sweep has passed its X, with a tiny
 * random delay, flickers briefly, then settles.
 */
export function createScanPointsMaterial(color: Color): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSweep: { value: -20 },
      uTime: { value: 0 },
      uFade: { value: 0 },
      uScale: { value: 800 },
      uSize: { value: 0.0016 },
      uColor: { value: color },
    },
    vertexShader: /* glsl */ `
      attribute float aRand;
      uniform float uSweep;
      uniform float uTime;
      uniform float uFade;
      uniform float uScale;
      uniform float uSize;
      varying float vA;
      varying float vFlash;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float age = uSweep - position.x - aRand * 1.4;
        float on = step(0.0, age);
        vFlash = on * exp(-age * 1.2);
        float flicker = 0.55 + 0.45 * sin(uTime * 38.0 + aRand * 71.0);
        vA = on * mix(flicker, 1.0, clamp(age * 0.35, 0.0, 1.0)) * uFade;
        gl_PointSize = max(1.0, uSize * uScale / -mv.z * (1.0 + 1.8 * vFlash));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      varying float vFlash;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = (1.0 - smoothstep(0.3, 0.5, d)) * vA;
        if (a < 0.02) discard;
        gl_FragColor = vec4(uColor * (1.0 + 2.5 * vFlash), a);
      }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
}

/**
 * Adds a glowing teal band where the sweep currently crosses the physical
 * part (object-space X, millimetres).
 */
export function addSweepBand(material: MeshStandardMaterial, color: Color) {
  const uniforms = { uSweep: { value: -20 }, uBand: { value: 0 }, uBandColor: { value: color } }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying float vScanX;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vScanX = position.x;')
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying float vScanX;\nuniform float uSweep;\nuniform float uBand;\nuniform vec3 uBandColor;\nvoid main() {')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uBandColor * exp(-pow((vScanX - uSweep) / 0.55, 2.0)) * uBand;',
      )
  }
  material.customProgramCacheKey = () => 'sweep-band'
  return uniforms
}
