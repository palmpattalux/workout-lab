import { noise, tone } from '../lib/sound'

// Sakura theme: a koto-like pluck in the Japanese in-scale (D E F A Bb), stepping up the
// scale with each set, a faint water drop after it, and now and then a breeze with chimes.
const IN_SCALE = [293.66, 329.63, 349.23, 440, 466.16, 587.33, 659.25, 698.46]
const later = (ms: number, f: () => void) => setTimeout(f, ms)

function pluck(f: number, gain: number) {
  // body of the string, a quiet octave for the bright attack, and the tiny bend of a koto
  tone(f * 1.006, f, 1.4, gain, 'triangle')
  tone(f * 2, f * 1.995, 0.5, gain * 0.32, 'sine')
  noise(0.03, gain * 0.25, 'bandpass', 3200, 2400, 0, 2)
}

export const sakuraSound = {
  set(step: number) {
    const i = step % IN_SCALE.length
    pluck(IN_SCALE[i], 0.13)
    later(150, () => pluck(IN_SCALE[(i + 2) % IN_SCALE.length], 0.06))
    // a single drop landing on still water
    later(520, () => tone(1250, 2300, 0.07, 0.05, 'sine'))
  },
  ambient() {
    noise(2.6, 0.035, 'bandpass', 500, 1100, 0, 0.5)
    const notes = [1174.66, 1396.91, 1760, 1864.66]
    const n = 2 + Math.floor(Math.random() * 2)
    for (let k = 0; k < n; k++) {
      const f = notes[Math.floor(Math.random() * notes.length)]
      later(500 + k * (260 + Math.random() * 220), () => tone(f, f * 0.998, 1.8, 0.04, 'sine'))
    }
  },
}
