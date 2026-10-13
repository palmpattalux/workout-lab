import type { ReactNode } from 'react'

// Line icons drawn to match the sketch style. Stroke color comes from the parent.
const ui = {
  home: <><path d="M3.5 11 12 4l8.5 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  book: <><path d="M12 6.5C10.2 5 7.5 4.5 4 4.8v13.5c3.5-.3 6.2.2 8 1.7 1.8-1.5 4.5-2 8-1.7V4.8c-3.5-.3-6.2.2-8 1.7z" /><path d="M12 6.5V20" /></>,
  weights: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  fingerprint: <path d="M12 11.5v3.5M8.6 9.4A4 4 0 0 1 16 11.5v2.2M6.2 12.2a6 6 0 0 1 10.9-4.6M9.3 17c.4-1.3.6-3 .6-5a2.1 2.1 0 0 1 4.2 0c0 2.4-.3 4.6-1 6.5M18 13.6c0 2-.4 3.9-1 5.6M4.6 14.6a8 8 0 0 1 12-9.7M6.8 18.4c.5-.9.9-2 1.1-3.2" />,
  gear: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  swap: <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />,
  stairs: <path d="M3 20h5v-5h5v-5h5V5h3" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  weight: <><path d="M9.5 7.5a2.5 2.5 0 1 1 5 0" /><path d="M7.2 9h9.6l2 10.5H5.2z" /></>,
  numbers: <path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16" />,
  write: <><path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" /><path d="M13.5 6.5l4 4" /></>,
}

// The 15 workout icons offered when holding "+" on page A.
export const WORKOUT_ICONS: { key: string; name: string; svg: ReactNode }[] = [
  { key: 'dumbbell', name: 'Dumbbell', svg: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /> },
  { key: 'barbell', name: 'Barbell', svg: <path d="M2 12h20M5 8v8M7.5 6.5v11M16.5 6.5v11M19 8v8" /> },
  { key: 'kettlebell', name: 'Kettlebell', svg: <><path d="M9.5 7.5a2.5 2.5 0 1 1 5 0" /><path d="M7.2 9h9.6l2 10.5H5.2z" /></> },
  { key: 'bench', name: 'Bench', svg: <path d="M2 8h20M5 5v6M19 5v6M4 15h12M6 15v5M14 15v5M18 13v7" /> },
  { key: 'pullup', name: 'Pull-up', svg: <><path d="M3 4h18M8 4v3l4 3 4-3V4M12 13v4M12 17l-2.5 4M12 17l2.5 4" /><circle cx="12" cy="11.5" r="1.6" /></> },
  { key: 'run', name: 'Run', svg: <><circle cx="15.5" cy="4.5" r="1.8" /><path d="M7 21l3.5-5 3 2v4M10.5 16l2-6.5 4 2.5 3-1M12.5 9.5 9 10.5l-2 3" /></> },
  { key: 'cycle', name: 'Cycle', svg: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-7h5l3 7M10 9l2 7h-6M14 6h2.5" /></> },
  { key: 'swim', name: 'Swim', svg: <><circle cx="17" cy="7" r="1.8" /><path d="M4 12.5l5-4 4 3 3-1.5M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" /></> },
  { key: 'rope', name: 'Jump rope', svg: <path d="M5 3v5M19 3v5M5 8c0 9 3 13 7 13s7-4 7-13" /> },
  { key: 'row', name: 'Row', svg: <path d="M4 20 17.5 6.5M15.5 4.5l3-1.5 2.5 2.5-1.5 3zM2 16c1.5 0 2.5-1 4-1M12 21c1.5 0 2.5-1 4-1s2.5 1 4 1" /> },
  { key: 'ball', name: 'Med ball', svg: <><circle cx="12" cy="12" r="8" /><path d="M4.5 9.5c5 2 10 2 15 0M4.5 14.5c5-2 10-2 15 0" /></> },
  { key: 'band', name: 'Band', svg: <path d="M4 8c0-2 3.5-3 8-3s8 1 8 3-3.5 3-8 3-8-1-8-3zM4 8v8c0 2 3.5 3 8 3s8-1 8-3V8" /> },
  { key: 'stretch', name: 'Stretch', svg: <><circle cx="12" cy="4" r="1.8" /><path d="M12 7.5v6.5M4.5 9.5l7.5-2 7.5 2M12 14l-5 6.5M12 14l5 6.5" /></> },
  { key: 'boxing', name: 'Boxing', svg: <path d="M7 10V7a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9M7 10a2 2 0 0 0 0 4h2M8 17v4h7v-4M11 10h4" /> },
  { key: 'timer', name: 'Hold / time', svg: <><circle cx="12" cy="13.5" r="7" /><path d="M12 13.5V9.5M10 3h4M12 3v3.5M18 6.5l1.5-1.5" /></> },
]

// Body-part letters offered on the second hold.
export const BODY_LETTERS: { key: string; name: string }[] = [
  { key: 'C', name: 'Chest' },
  { key: 'B', name: 'Back' },
  { key: 'S', name: 'Shoulders' },
  { key: 'A', name: 'Arms' },
  { key: 'Ab', name: 'Core' },
  { key: 'G', name: 'Glutes' },
  { key: 'L', name: 'Legs' },
  { key: 'F', name: 'Full body' },
]

export type IconName = keyof typeof ui

function Svg({ children, size, strokeWidth }: { children: ReactNode; size: string; strokeWidth: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, strokeWidth }} aria-hidden="true">
      {children}
    </svg>
  )
}

export function Icon({ name, size = '42%', strokeWidth = 1.8 }: { name: IconName; size?: string; strokeWidth?: number }) {
  return <Svg size={size} strokeWidth={strokeWidth}>{ui[name]}</Svg>
}

export function WorkoutIcon({ k, size = '42%', strokeWidth = 1.8 }: { k: string; size?: string; strokeWidth?: number }) {
  const found = WORKOUT_ICONS.find((i) => i.key === k)
  return <Svg size={size} strokeWidth={strokeWidth}>{found?.svg}</Svg>
}

// Icon + letter, used as the workout's title everywhere.
export function WorkoutMark({ icon, letter, size = '1em' }: { icon: string; letter: string; size?: string }) {
  return (
    <span className="mark">
      <WorkoutIcon k={icon} size={size} strokeWidth={2} />
      <span className="mark-letter">{letter}</span>
    </span>
  )
}
