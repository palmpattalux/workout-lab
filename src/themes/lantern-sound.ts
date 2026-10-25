import { noise, tone, buzz } from '../lib/sound'

// Lanterns theme, page B. Soft and warm: paper and air, a small far-off bell.
export const lanternSound = {
  // a lantern let go: a warm low "whoomp" of air as it lifts, then a faint bell
  set() {
    noise(0.42, 0.11, 'lowpass', 160, 620, 0, 0.7)
    tone(92, 150, 0.34, 0.1, 'sine')
    setTimeout(() => {
      tone(1318, 1312, 1.4, 0.05, 'sine')
      tone(2636, 2630, 0.8, 0.016, 'sine')
    }, 170)
    buzz(8)
  },
  // now and then: a breath of evening air over the water, sometimes a distant bell
  ambient() {
    noise(2.6, 0.026, 'lowpass', 260, 180, 0, 0.5)
    if (Math.random() < 0.45) setTimeout(() => tone(1760, 1754, 1.8, 0.018, 'sine'), 900)
  },
}
