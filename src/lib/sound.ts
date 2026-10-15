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

// Phones only let a page start sound from a finished tap (touchend / click), not from the
// press itself, so the audio is unlocked there once; after that every press can play.
function unlock() {
  const c = audio()
  if (!c) return
  if (c.state !== 'running') c.resume().catch(() => {})
  const b = c.createBufferSource()
  b.buffer = c.createBuffer(1, 1, 22050)
  b.connect(c.destination)
  b.start(0)
  if (c.state === 'running') ['touchend', 'click', 'keydown'].forEach((t) => document.removeEventListener(t, unlock, true))
}
;['touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, unlock, true))
// Mix with any music playing instead of pausing it (Safari).
try { (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = 'ambient' } catch { /* not supported */ }

function tone(from: number, to: number, dur: number, gain: number, type: OscillatorType) {
  const c = audio()
  if (!c || c.state !== 'running') return
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
  tap() { tone(1000, 620, 0.05, 0.16, 'sine') },
  pop() { tone(600, 1300, 0.08, 0.16, 'sine'); buzz(10) },
  tick() { tone(2200, 1700, 0.018, 0.1, 'triangle'); buzz(4) },
}
