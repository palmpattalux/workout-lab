import { noise, tone } from '../lib/sound'

// Desert theme: a soft sand-wind whoosh with each set (a gust swelling and settling, a hiss of
// grains riding it, a muffled step into sand), and now and then a far breeze or a distant chime.
const later = (ms: number, f: () => void) => setTimeout(f, ms)

export const desertSound = {
  step() {
    noise(1.3, 0.09, 'bandpass', 380, 1300, 0, 0.6)
    noise(0.9, 0.035, 'bandpass', 3200, 1800, 0.2, 1.2)
    later(60, () => noise(0.09, 0.05, 'lowpass', 900, 300, 0, 0.7))
  },
  // a tiny puff of sand where the page is touched
  puff() { noise(0.32, 0.04, 'bandpass', 1400, 2600, 0, 0.9) },
  breeze() { noise(2.8, 0.04, 'bandpass', 260, 620, 0, 0.5) },
  chime() {
    const f = [987.77, 1174.66, 1318.51][Math.floor(Math.random() * 3)]
    tone(f, f * 0.998, 2.2, 0.035, 'sine')
    tone(f * 2.01, f * 2, 1.1, 0.01, 'sine')
    later(420, () => tone(f * 1.5, f * 1.498, 1.8, 0.02, 'sine'))
  },
}
