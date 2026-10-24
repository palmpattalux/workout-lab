import { noise, tone } from '../lib/sound'

// Orbit theme: a soft rising chime as each set adds a moon, and now and then a very quiet
// low hum with a faint shimmer on top, like the room tone of space.
export const orbitSound = {
  set() {
    tone(520, 780, 0.35, 0.05, 'sine')
    setTimeout(() => tone(784, 786, 1.1, 0.06, 'sine'), 90)
    setTimeout(() => tone(1175, 1178, 1.2, 0.035, 'sine'), 190)
    setTimeout(() => tone(1568, 1572, 0.9, 0.015, 'triangle'), 300)
    noise(0.9, 0.018, 'bandpass', 5200, 8200, 0.08, 3)
  },
  ambient() {
    tone(73, 70, 4.2, 0.05, 'sine')
    tone(110, 108, 3.4, 0.025, 'sine')
    noise(2.6, 0.012, 'bandpass', 3400, 6200, 0.4, 5)
  },
}
