/** Easing curves (t in 0–1 → 0–1). power3 / expo for camera, short springs only for UI pops. */
export type Ease = (t: number) => number

export const linear: Ease = (t) => t

export const power2In: Ease = (t) => t * t
export const power2Out: Ease = (t) => 1 - (1 - t) * (1 - t)
export const power2InOut: Ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export const power3In: Ease = (t) => t * t * t
export const power3Out: Ease = (t) => 1 - Math.pow(1 - t, 3)
export const power3InOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const expoOut: Ease = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const expoIn: Ease = (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10))
export const expoInOut: Ease = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2

export const sineInOut: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2

/** Small, damped overshoot for UI pops (chips clicking in, checkmarks). */
export const popOut: Ease = (t) => {
  const c1 = 1.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
