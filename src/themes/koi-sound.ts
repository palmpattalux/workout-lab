import { noise, tone } from '../lib/sound'

// Koi Pond theme: a soft water plop for each set (a quick rising bloop over a low body,
// then a smaller drop just after), and now and then a very quiet trickle of water.
const later = (ms: number, f: () => void) => setTimeout(f, ms)
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const koiSound = {
  set() {
    tone(150, 90, 0.16, 0.06, 'sine')
    tone(520, 1350, 0.09, 0.11, 'sine')
    noise(0.07, 0.025, 'bandpass', 1600, 900, 0, 1.2)
    later(210, () => tone(900, 1900, 0.06, 0.045, 'sine'))
  },
  ambient() {
    noise(1.8, 0.018, 'bandpass', 1500, 2300, 0, 0.6)
    const n = 4 + Math.floor(Math.random() * 4)
    let at = 120
    for (let k = 0; k < n; k++) {
      const f = rand(1100, 2200)
      later(at, () => tone(f, f * rand(1.3, 1.7), rand(0.035, 0.06), rand(0.018, 0.032), 'sine'))
      at += rand(70, 190)
    }
  },
}
