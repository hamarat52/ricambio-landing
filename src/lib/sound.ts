/**
 * Tiny synthesised sound effects (no audio files). Muted by default; only
 * plays after the visitor turns sound on, which also unlocks the AudioContext.
 */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Call from the sound toggle's click handler (a user gesture). */
export function unlockAudio(): void {
  audio()
}

function noiseBurst(a: AudioContext, at: number, dur: number, freq: number, q: number, gain: number) {
  const len = Math.max(1, Math.floor(a.sampleRate * dur))
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = q
  const g = a.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(bp).connect(g).connect(a.destination)
  src.start(at)
}

function tick(a: AudioContext, at: number, freq: number, dur: number, gain: number) {
  const o = a.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(freq, at)
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, at + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(a.destination)
  o.start(at)
  o.stop(at + dur + 0.01)
}

/** A small plastic crack: a sharp transient, then a brittle splinter. */
export function playCrack(): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + 0.005
  noiseBurst(a, t, 0.05, 3200, 1.2, 0.5)
  tick(a, t, 2600, 0.02, 0.08)
  noiseBurst(a, t + 0.035, 0.09, 1800, 2.5, 0.22)
}

/** A clean snap-fit click. */
export function playClick(): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + 0.005
  tick(a, t, 3400, 0.012, 0.1)
  noiseBurst(a, t, 0.025, 4200, 3, 0.35)
  tick(a, t + 0.05, 2200, 0.01, 0.05)
}

/** A soft rising chime for the sparkle moment. */
export function playChime(): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + 0.01
  ;[880, 1320, 1760].forEach((f, i) => {
    const o = a.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = a.createGain()
    g.gain.setValueAtTime(0.0001, t + i * 0.06)
    g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.06 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.9)
    o.connect(g).connect(a.destination)
    o.start(t + i * 0.06)
    o.stop(t + i * 0.06 + 1)
  })
}
