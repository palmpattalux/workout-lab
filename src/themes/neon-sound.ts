import { tone, noise, buzz } from '../lib/sound'

// Neon theme sounds: soft synth, a little electric hum, nothing loud.
const later = (ms: number, f: () => void) => setTimeout(f, ms)

export const neonSound = {
  // a two-note rising synth blip (E5 -> B5) over a faint mains hum
  set() {
    tone(659, 661, 0.11, 0.09, 'triangle')
    tone(1318, 1320, 0.08, 0.025, 'sine')
    later(85, () => { tone(988, 990, 0.22, 0.08, 'triangle'); tone(1976, 1978, 0.14, 0.02, 'sine') })
    tone(120, 118, 0.42, 0.035, 'sawtooth')
    buzz(8)
  },
  // a faint neon sign buzzing and flickering for a moment
  ambient() {
    [0, 110, 170, 330].forEach((ms, i) => later(ms, () => {
      tone(120, 120, i === 3 ? 0.16 : 0.05, 0.04, 'sawtooth')
      noise(0.04, 0.03, 'highpass', 5200, 3800)
    }))
  },
}
