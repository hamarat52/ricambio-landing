import { Color, DoubleSide, MeshStandardMaterial } from 'three'

export interface LayerPrintUniforms {
  /** World-space Y of the current print height. */
  uHeight: { value: number }
  /** Layer height in world units (exaggerated so the lines read). */
  uLayerH: { value: number }
  /** Glow of the layer being printed (0 when done). */
  uHot: { value: number }
  uHotColor: { value: Color }
  uCapColor: { value: Color }
}

/**
 * FDM print in progress, via onBeforeCompile on a standard material:
 * fragments above uHeight are discarded, layer lines darken every
 * uLayerH, the current layer glows, and back faces seen through the open
 * top render as a lit top skin with a diagonal infill pattern.
 */
export function createLayerPrintMaterial(color: string, uniforms?: LayerPrintUniforms) {
  const u: LayerPrintUniforms = uniforms ?? {
    uHeight: { value: 0 },
    uLayerH: { value: 0.0016 },
    uHot: { value: 1 },
    uHotColor: { value: new Color(3.2, 1.9, 0.9) },
    uCapColor: { value: new Color(color).multiplyScalar(1.25) },
  }
  const m = new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, side: DoubleSide })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u)
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying vec3 vLpWorld;\nvoid main() {')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vLpWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        [
          'varying vec3 vLpWorld;',
          'uniform float uHeight;',
          'uniform float uLayerH;',
          'uniform float uHot;',
          'uniform vec3 uHotColor;',
          'uniform vec3 uCapColor;',
          'void main() {',
          '  if (vLpWorld.y > uHeight) discard;',
        ].join('\n'),
      )
      .replace(
        '#include <color_fragment>',
        [
          '#include <color_fragment>',
          '  float layer = step(fract(vLpWorld.y / uLayerH), 0.12);',
          '  diffuseColor.rgb *= 1.0 - 0.28 * layer;',
          '  if (!gl_FrontFacing) {',
          '    float infill = step(0.62, fract((vLpWorld.x + vLpWorld.z) / (uLayerH * 2.2)));',
          '    diffuseColor.rgb = uCapColor * (0.82 + 0.18 * infill);',
          '  }',
        ].join('\n'),
      )
      .replace(
        '#include <normal_fragment_begin>',
        ['#include <normal_fragment_begin>', '  if (!gl_FrontFacing) normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);'].join('\n'),
      )
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          '  float hot = 1.0 - smoothstep(0.0, uLayerH * 1.6, uHeight - vLpWorld.y);',
          '  totalEmissiveRadiance += uHotColor * hot * uHot;',
        ].join('\n'),
      )
  }
  m.customProgramCacheKey = () => 'layer-print'
  return { material: m, uniforms: u }
}
