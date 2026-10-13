import { getPrefs } from './prefs'

// Small synthesized sounds, so there are no audio files to load.
// tap: any button press. pop: a hold picker or ring opens. tick: each step while dragging.
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!getPrefs().sound) return null
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx ??= new AC()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}

function tone(from: number, to: number, dur: number, gain: number, type: OscillatorType) {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(from, t)
  o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function buzz(ms: number) {
  try { navigator.vibrate?.(ms) } catch { /* not supported */ }
}

export const sound = {
  tap() { tone(560, 340, 0.06, 0.07, 'sine') },
  pop() { tone(320, 760, 0.09, 0.07, 'sine'); buzz(10) },
  tick() { tone(1900, 1500, 0.016, 0.045, 'triangle'); buzz(4) },
}
