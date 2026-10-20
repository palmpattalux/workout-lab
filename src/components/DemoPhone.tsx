import { useEffect, useState } from 'react'
import { t } from '../lib/i18n'

// Desktop "How it works": real screens of the app played like a short film, with a finger
// showing which button is used and how (a tap, or a press and slide). Screens are captured from
// the app (public/landing/demo/<frame>-<light|dark>.webp). x / y: where the finger is, in % of the screen.
type Frame = { shot: string; x?: number; y?: number; press?: boolean; ms: number; say?: string }
export type Demo = { title: string; text: string; frames: Frame[] }

export const DEMOS: Demo[] = [
  {
    title: 'Add an exercise',
    text: 'Press + and slide up to pick an icon, then a letter. Name it and it becomes a dot on your home screen.',
    frames: [
      { shot: 'home', x: 20, y: 87, ms: 1100, say: 'Press +' },
      { shot: 'add-icon', x: 20, y: 66, press: true, ms: 1500, say: 'Slide up to pick an icon' },
      { shot: 'add-letter', x: 20, y: 76, press: true, ms: 1500, say: 'Slide again for a letter' },
      { shot: 'create', x: 39, y: 16, ms: 1300, say: 'Give it a name' },
      { shot: 'create', x: 85, y: 91, press: true, ms: 900, say: 'Save' },
      { shot: 'home-new', ms: 1700, say: 'Your new dot' },
    ],
  },
  {
    title: 'Tap a dot, log your sets',
    text: 'Hold and slide for weight and reps, right under your thumb. The arrow takes you to the next set.',
    frames: [
      { shot: 'home', x: 58, y: 57, ms: 1000, say: 'Tap a dot' },
      { shot: 'armed', x: 58, y: 57, press: true, ms: 1100, say: 'Tap again to start' },
      { shot: 'log1', x: 35, y: 64, ms: 1100, say: 'Your set' },
      { shot: 'weight', x: 35, y: 22, press: true, ms: 1700, say: 'Hold and slide for weight' },
      { shot: 'log-w', x: 69, y: 64, ms: 900 },
      { shot: 'reps', x: 69, y: 34, press: true, ms: 1600, say: 'Slide for reps' },
      { shot: 'log-wr', x: 85, y: 43, ms: 900 },
      { shot: 'log-next', x: 85, y: 43, press: true, ms: 1500, say: 'Next set' },
    ],
  },
  {
    title: 'Look back anytime',
    text: 'Every set is filed for you by exercise and date. Open the book to see what you lifted last time.',
    frames: [
      { shot: 'home', x: 35, y: 20, ms: 1100, say: 'Open the book' },
      { shot: 'book', x: 35, y: 20, press: true, ms: 500 },
      { shot: 'book', ms: 2600, say: 'Every session, sorted' },
    ],
  },
]
const SHOTS = [...new Set(DEMOS.flatMap((d) => d.frames.map((f) => f.shot)))]

// The phone plays one demo; when it ends, onEnd moves on to the next.
export default function DemoPhone({ demo, dark, onEnd }: { demo: number; dark: boolean; onEnd: () => void }) {
  const frames = DEMOS[demo].frames
  const [at, setAt] = useState(0)
  useEffect(() => { setAt(0) }, [demo])
  useEffect(() => {
    const tm = window.setTimeout(() => (at + 1 < frames.length ? setAt(at + 1) : onEnd()), frames[at]?.ms ?? 1000)
    return () => clearTimeout(tm)
  }, [at, demo, frames, onEnd])
  const f = frames[Math.min(at, frames.length - 1)]
  const mode = dark ? 'dark' : 'light'
  // the last place the finger was, so it stays put while hidden
  const seen = frames.slice(0, at + 1).reverse()
  const last = seen.find((x) => x.x !== undefined)
  const say = seen.find((x) => x.say)?.say

  return (
    <div className="dm">
      <div className="dm-phone">
        <div className="dm-screen">
          {SHOTS.map((s) => <img key={s} src={`landing/demo/${s}-${mode}.webp`} alt="" className={s === f.shot ? 'on' : undefined} width="585" height="1266" />)}
          <span className={`dm-finger${f.x === undefined ? ' off' : ''}${f.press ? ' press' : ''}`} style={{ left: `${last?.x ?? 50}%`, top: `${last?.y ?? 50}%` }} aria-hidden="true"><i /></span>
        </div>
      </div>
      <p className="dm-say" aria-live="polite">{say ? t(say) : ' '}</p>
    </div>
  )
}
