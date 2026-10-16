/** Studio light formers for the baked environment (shared by the worker and the fallback). */
export type Former = { pos: [number, number, number]; scale: [number, number]; intensity: number; ring?: boolean; up?: boolean }

export const ENV_BACKGROUND = '#aab3bd'
export const ENV_SIZE = 128

export const ENV_FORMERS: Former[] = [
  { pos: [0, 6, 0], scale: [12, 8], intensity: 2.4, up: true },
  { pos: [6, 3.5, 3], scale: [7, 3], intensity: 2.0 },
  { pos: [-6, 2, -5], scale: [7, 2], intensity: 0.7 },
  { pos: [1, 1.2, -8], scale: [10, 0.6], intensity: 1.2 },
  { pos: [-2, 4, 6], scale: [2.5, 2.5], intensity: 1.6, ring: true },
]
