import { getPrefs } from './prefs'

// Small synthesized sounds, so there are no audio files to load.
// tap: any button press. pop: a hold picker or ring opens. tick: each step while dragging.
let ctx: AudioContext | null = null
const UNLOCK_ON = ['touchend', 'click', 'keydown']

function audio(): AudioContext | null {
  if (!getPrefs().sound) return null
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctx || ctx.state === 'closed') {
      ctx = new AC()
      // the phone can pause the audio at any time (screen lock, a call, another app's sound):
      // listen for the next tap again so it comes back
      ctx.onstatechange = () => { if (ctx && ctx.state !== 'running') arm() }
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    return ctx
  } catch { return null }
}

// Phones only let a page start sound from a finished tap (touchend / click), not from the
// press itself, so the audio is unlocked there; after that every press can play.
function unlock() {
  const c = audio()
  if (!c) return
  if (c.state !== 'running') c.resume().catch(() => {})
  const b = c.createBufferSource()
  b.buffer = c.createBuffer(1, 1, 22050)
  b.connect(c.destination)
  b.start(0)
  if (c.state === 'running') UNLOCK_ON.forEach((t) => document.removeEventListener(t, unlock, true))
}
function arm() { UNLOCK_ON.forEach((t) => document.addEventListener(t, unlock, true)) }
arm()
// back from another app or the lock screen: wake the audio up again
const wake = () => { if (!document.hidden && ctx && ctx.state !== 'running') { ctx.resume().catch(() => {}); arm() } }
document.addEventListener('visibilitychange', wake)
window.addEventListener('pageshow', wake)
// Mix with any music playing instead of pausing it (Safari).
try { (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = 'ambient' } catch { /* not supported */ }

// tone / noise / buzz are shared with the theme sound files (src/themes/*-sound.ts).
export function tone(from: number, to: number, dur: number, gain: number, type: OscillatorType) {
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

export function buzz(ms: number) {
  try { navigator.vibrate?.(ms) } catch { /* not supported */ }
}

// A short burst of filtered noise: paper, swords, impacts (Manga theme).
let noiseBuf: AudioBuffer | null = null
export function noise(dur: number, gain: number, type: BiquadFilterType, from: number, to: number, at = 0, q = 0.9) {
  const c = audio()
  if (!c || c.state !== 'running') return
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const t = c.currentTime + at
  const src = c.createBufferSource()
  const f = c.createBiquadFilter()
  const g = c.createGain()
  src.buffer = noiseBuf
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.25)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(c.destination)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.02)
}

// Sounds only for the theme in use on the page, never from the little previews in the gallery.
export const livePage = (el: Element | null) => !!el && !el.closest('.theme-art')

// A theme in use on page B can answer each step of a reps or load drag in its own way
// (Pulsar spins and ticks). The hook returns true when it played its own sound.
let pickHook: ((dir: number) => boolean) | null = null
export function onPick(fn: (dir: number) => boolean) {
  pickHook = fn
  return () => { if (pickHook === fn) pickHook = null }
}

export const sound = {
  tap() { tone(1000, 620, 0.05, 0.16, 'sine') },
  pop() { tone(600, 1300, 0.08, 0.16, 'sine'); buzz(10) },
  tick() { tone(2200, 1700, 0.018, 0.1, 'triangle'); buzz(4) },
  // a step while dragging a reps or load picker
  pick(dir: number) { if (pickHook?.(dir)) buzz(4); else sound.tick() },
  // Manga theme
  flip() { noise(0.16, 0.22, 'bandpass', 900, 3600); noise(0.1, 0.12, 'bandpass', 2400, 1200, 0.12) },
  // a blade cutting the air (a fast swish rising in pitch), then the bite of the cut
  slash() { noise(0.2, 0.26, 'bandpass', 420, 3800, 0, 0.6); noise(0.06, 0.2, 'highpass', 5200, 2600, 0.16, 0.7); noise(0.12, 0.08, 'bandpass', 1800, 900, 0.18, 1.5) },
  bubble() { tone(420, 880, 0.09, 0.08, 'sine') },
  // To the Top theme: a boulder rolling over stone, and a soft bell at the summit
  roll() { noise(0.9, 0.14, 'lowpass', 380, 120, 0, 0.7); tone(70, 52, 0.5, 0.12, 'sine'); buzz(12) },
  summit() { tone(392, 390, 1.6, 0.09, 'sine'); tone(588, 586, 1.3, 0.05, 'sine') },
  impact() { tone(140, 42, 0.32, 0.3, 'sine'); noise(0.18, 0.16, 'lowpass', 1400, 200); buzz(18) },
}
