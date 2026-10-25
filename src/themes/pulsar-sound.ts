import { noise, tone } from '../lib/sound'

// Pulsar theme: the sound radio telescopes hear from a spinning neutron star, a dry "tok" in
// a wash of static. One tick per step while dragging reps or load, a short burst of ticks for
// each set, and now and then a faint pulse train under the hiss.
export const pulsarSound = {
  tick() {
    noise(0.035, 0.16, 'bandpass', 2600, 900, 0, 1.2)
    tone(190, 70, 0.05, 0.11, 'sine')
    noise(0.07, 0.018, 'highpass', 6500, 4200, 0, 0.7)
  },
  set() {
    ;[0, 120, 230, 330, 420].forEach((ms, i) => setTimeout(() => {
      noise(0.04, 0.15 - i * 0.022, 'bandpass', 2400, 800, 0, 1.2)
      tone(170, 64, 0.06, 0.1 - i * 0.014, 'sine')
    }, ms))
    tone(880, 1320, 0.5, 0.03, 'sine')
    noise(0.8, 0.02, 'highpass', 7000, 4000, 0.05, 0.6)
  },
  ambient() {
    noise(3.2, 0.012, 'highpass', 6800, 5200, 0, 0.5)
    for (let i = 0; i < 6; i++) setTimeout(() => noise(0.03, 0.035, 'bandpass', 2200, 900, 0, 1.2), 300 + i * 520)
  },
}
