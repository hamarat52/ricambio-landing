import { Color } from 'three'

/**
 * The scene is tone-mapped with Khronos PBR Neutral, which leaves mid-tone
 * colours untouched apart from a small fixed offset. This returns the linear
 * colour that comes out of the tone mapper as exactly `hex`, so the WebGL
 * paper matches the CSS paper (#D1D7DE) pixel for pixel.
 * Valid while the colour's brightest channel stays below the 0.76 knee.
 */
export function neutralPreimage(hex: string, out: Color = new Color()): Color {
  out.set(hex) // sRGB hex → linear working space
  const t = Math.min(out.r, out.g, out.b)
  // Neutral: offset = x < 0.08 ? x - 6.25x² : 0.04, applied to all channels
  const offset = t >= 0.04 ? 0.04 : Math.sqrt(t / 6.25) - t
  return out.setRGB(out.r + offset, out.g + offset, out.b + offset)
}

/** Linear colour from an sRGB hex, without tone-mapping compensation. */
export const linear = (hex: string) => new Color(hex)
