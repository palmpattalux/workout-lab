import { tone, noise, buzz } from '../lib/sound'

// Night City: a muted upright bass walking down a minor line, a far bell now and then,
// and the city itself breathing in the distance (a low hum, a siren many blocks away).
const WALK = [98, 116.5, 130.8, 146.8, 130.8, 116.5, 87.3, 98] // G2 Bb2 C3 D3 C3 Bb2 F2 G2

export const nightcitySound = {
  // a plucked, muted double bass note: warm body, a quiet overtone, the soft thud of the finger
  set(step: number) {
    const f = WALK[step % WALK.length]
    tone(f * 1.03, f, 0.6, 0.17, 'triangle')
    tone(f * 2.01, f * 1.99, 0.22, 0.035, 'sine')
    noise(0.06, 0.05, 'lowpass', 520, 180)
    buzz(8)
    // every fourth step, a soft bell rings far across the rooftops
    if (step > 0 && step % 4 === 0) setTimeout(() => { tone(659, 657, 1.8, 0.035, 'sine'); tone(988, 985, 1.2, 0.015, 'sine') }, 260)
  },
  // very quiet city ambience
  ambient() {
    if (Math.random() < 0.5) {
      // a distant low hum swelling up and away (traffic, a train under the street)
      noise(4.5, 0.09, 'lowpass', 150, 80, 0, 0.7)
      tone(55, 53, 3.2, 0.025, 'sine')
    } else {
      // a siren far off, one slow rise and fall heard through the rain
      noise(2.6, 0.12, 'bandpass', 620, 760, 0, 22)
      noise(2.6, 0.08, 'bandpass', 760, 600, 2.2, 22)
    }
  },
}
