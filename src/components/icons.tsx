import type { ReactNode } from 'react'

// Line icons drawn to match the sketch style. Stroke color comes from the parent.
const ui = {
  home: <><path d="M3.5 11 12 4l8.5 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  book: <><path d="M12 6.5C10.2 5 7.5 4.5 4 4.8v13.5c3.5-.3 6.2.2 8 1.7 1.8-1.5 4.5-2 8-1.7V4.8c-3.5-.3-6.2.2-8 1.7z" /><path d="M12 6.5V20" /></>,
  weights: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M8.5 5.5v13l10-6.5z" />,
  ungroup: <><circle cx="6.5" cy="12" r="3.5" /><circle cx="17.5" cy="12" r="3.5" /><path d="M12 5v3M12 16v3" /></>,
  fingerprint: <path d="M12 11.5v3.5M8.6 9.4A4 4 0 0 1 16 11.5v2.2M6.2 12.2a6 6 0 0 1 10.9-4.6M9.3 17c.4-1.3.6-3 .6-5a2.1 2.1 0 0 1 4.2 0c0 2.4-.3 4.6-1 6.5M18 13.6c0 2-.4 3.9-1 5.6M4.6 14.6a8 8 0 0 1 12-9.7M6.8 18.4c.5-.9.9-2 1.1-3.2" />,
  gear: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  swap: <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />,
  stairs: <path d="M3 20h5v-5h5v-5h5V5h3" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  preset: <path d="M4 6.5h1.5M4 12h1.5M4 17.5h1.5M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />,
  star: <path d="M12 3.8l2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.6l-5.01 2.64.96-5.6L3.9 9.7l5.6-.8z" />,
  note: <><path d="M6 3.5h8.5L19 8v12.5H6z" /><path d="M14 3.5V8.5h5M9 12.5h6M9 16h4" /></>,
  hand: <><path d="M10 9.5V4a2 2 0 0 0-4 0v10" /><path d="M14 10V9a2 2 0 0 0-4 0v1" /><path d="M18 11v-1a2 2 0 0 0-4 0" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.4A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.1-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  weight: <><path d="M9.5 7.5a2.5 2.5 0 1 1 5 0" /><path d="M7.2 9h9.6l2 10.5H5.2z" /></>,
  numbers: <path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16" />,
  write: <><path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" /><path d="M13.5 6.5l4 4" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M6.5 15h3" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.5v2.5M20 14v6h-3.5M14 18v2" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="7.5" width="16" height="12" rx="2.5" /><path d="M16 13.5h1.5" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
}

// The 8 workout icons offered when dragging up from "+" on page A: body parts, then equipment.
export const WORKOUT_ICONS: { key: string; name: string; svg: ReactNode }[] = [
  { key: 'arm', name: 'Arm', svg: <path d="M3 12.5c2.5-3.5 7-4.5 10-1.5.5-1.5.7-3 .7-4.6M13.7 6.4c-.2-1.9 1-3.2 2.7-3.2 1.8 0 3 1.3 2.8 3.2l-.3 2.3c.4 3.4.2 6-.9 7.6-1.1 1.6-3 2.2-5.4 2.2H3M9 13.2c1.3.4 2.5 1.2 3.4 2.3" /> },
  { key: 'leg', name: 'Leg', svg: <path d="M9 2.5c.5 3 2 5.5 4 8 .8 1 .9 2 .6 3.2L12.5 19l6 1.2c.7.2 1 .7 1 1.3H9.5c-.6 0-1-.5-.9-1.1l.3-2.2c-1.6-1.6-2.1-3.8-1.2-6-.6-1.2-1.2-2.5-1.6-3.6C5.5 7 5.2 4.8 5.2 2.5" /> },
  { key: 'torso', name: 'Torso front', svg: <><path d="M2.5 8c0-2.5 1.8-4.5 4.5-4.5h10c2.7 0 4.5 2 4.5 4.5v3.5L19 13v8H5v-8l-2.5-1.5z" /><path d="M12 4v7M6.5 9c2 1.8 3.8 2.2 5.5 1 1.7 1.2 3.5.8 5.5-1M9 14.5h6M9 18h6M12 12.5V21" /></> },
  { key: 'back', name: 'Torso back', svg: <><path d="M2.5 8c0-2.5 1.8-4.5 4.5-4.5h10c2.7 0 4.5 2 4.5 4.5v3.5L19 13v8H5v-8l-2.5-1.5z" /><path d="M12 4v17M6.5 6.5c1 3 3 4.8 5.5 5.3 2.5-.5 4.5-2.3 5.5-5.3M8 17.5l4-2.5 4 2.5" /></> },
  { key: 'dumbbell', name: 'Dumbbell', svg: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /> },
  { key: 'barbell', name: 'Barbell', svg: <path d="M2 12h20M5 8v8M7.5 6.5v11M16.5 6.5v11M19 8v8" /> },
  { key: 'pullbar', name: 'Pull-up bar', svg: <path d="M2.5 5h19M5 5v15M19 5v15M3 20h4M17 20h4" /> },
  { key: 'dipbar', name: 'Dip bar', svg: <path d="M5 21V5.5M19 21V5.5M5 9h5.5M19 9h-5.5M3 21h4M17 21h4" /> },
]

// Icons from the first version, kept so workouts made with them still draw.
const OLD_ICONS: { key: string; svg: ReactNode }[] = [
  { key: 'kettlebell', svg: <><path d="M9.5 7.5a2.5 2.5 0 1 1 5 0" /><path d="M7.2 9h9.6l2 10.5H5.2z" /></> },
  { key: 'bench', svg: <path d="M2 7h20M5 4v6M19 4v6M4 15h12M6 15v5M14 15v5M18 13v7" /> },
  { key: 'cable', svg: <><path d="M3 21h18M6 21V3h8M18 6.5v8.5M15.5 15.5h5M8.5 13h3v8h-3z" /><circle cx="16" cy="5" r="2" /></> },
  { key: 'pullup', svg: <><path d="M3 4h18M8 4v3l4 3 4-3V4M12 13v4M12 17l-2.5 4M12 17l2.5 4" /><circle cx="12" cy="11.5" r="1.6" /></> },
  { key: 'dips', svg: <><path d="M2.5 11h6M15.5 11h6M4.5 11v10M19.5 11v10M8.5 11l3.5 3 3.5-3M12 14v3.5M12 17.5l-2 3.5M12 17.5l2 3.5" /><circle cx="12" cy="7.5" r="1.8" /></> },
  { key: 'rings', svg: <><path d="M7 2v8.5M17 2v8.5M3 2h18" /><circle cx="7" cy="14" r="3.2" /><circle cx="17" cy="14" r="3.2" /></> },
  { key: 'pushup', svg: <><path d="M17 11.5 4 17.5M15 12.5v6M2 20h20" /><circle cx="19.2" cy="10" r="1.8" /></> },
  { key: 'handstand', svg: <><path d="M12 15.5V9M12 9l-2.5-6M12 9l2.5-6M8.5 21l3.5-5.5 3.5 5.5M6 21h12" /><circle cx="12" cy="17.6" r="1.7" /></> },
  { key: 'run', svg: <><circle cx="15.5" cy="4.5" r="1.8" /><path d="M7 21l3.5-5 3 2v4M10.5 16l2-6.5 4 2.5 3-1M12.5 9.5 9 10.5l-2 3" /></> },
  { key: 'cycle', svg: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-7h5l3 7M10 9l2 7h-6M14 6h2.5" /></> },
  { key: 'swim', svg: <><circle cx="17" cy="7" r="1.8" /><path d="M4 12.5l5-4 4 3 3-1.5M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" /></> },
  { key: 'rope', svg: <path d="M5 3v5M19 3v5M5 8c0 9 3 13 7 13s7-4 7-13" /> },
  { key: 'row', svg: <path d="M4 20 17.5 6.5M15.5 4.5l3-1.5 2.5 2.5-1.5 3zM2 16c1.5 0 2.5-1 4-1M12 21c1.5 0 2.5-1 4-1s2.5 1 4 1" /> },
  { key: 'ball', svg: <><circle cx="12" cy="12" r="8" /><path d="M4.5 9.5c5 2 10 2 15 0M4.5 14.5c5-2 10-2 15 0" /></> },
  { key: 'band', svg: <path d="M4 8c0-2 3.5-3 8-3s8 1 8 3-3.5 3-8 3-8-1-8-3zM4 8v8c0 2 3.5 3 8 3s8-1 8-3V8" /> },
  { key: 'stretch', svg: <><circle cx="12" cy="4" r="1.8" /><path d="M12 7.5v6.5M4.5 9.5l7.5-2 7.5 2M12 14l-5 6.5M12 14l5 6.5" /></> },
  { key: 'boxing', svg: <path d="M7 10V7a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9M7 10a2 2 0 0 0 0 4h2M8 17v4h7v-4M11 10h4" /> },
  { key: 'timer', svg: <><circle cx="12" cy="13.5" r="7" /><path d="M12 13.5V9.5M10 3h4M12 3v3.5M18 6.5l1.5-1.5" /></> },
]

// Letters A–H offered on the second drag (just labels, not body parts).
export const BODY_LETTERS: { key: string; name: string }[] = 'ABCDEFGH'.split('').map((k) => ({ key: k, name: k }))

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
  const found = WORKOUT_ICONS.find((i) => i.key === k) ?? OLD_ICONS.find((i) => i.key === k)
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
