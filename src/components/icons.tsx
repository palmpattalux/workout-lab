import { useId, type ReactNode } from 'react'

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
  swipe: <><path d="M14 7l5 5-5 5" /><path d="M5 12h14" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 1.9-.9 1.6-2-.4-1.4.4-2.6 1.9-2.6h1.8c2 0 3.2-1.3 3.2-3.4 0-5-3.8-9-8.5-9Z" /><circle cx="7.6" cy="11.5" r="1.1" /><circle cx="10" cy="7.6" r="1.1" /><circle cx="14.6" cy="7.8" r="1.1" /></>,
  sparkle: <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5ZM18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" />,
  speaker: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  stopwatch: <><circle cx="12" cy="13.5" r="7" /><path d="M12 13.5V9.5M10 3h4M12 3v3.5M18 6.5l1.5-1.5" /></>,
  share: <><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" /><path d="M5.5 11.5v7a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-7" /></>,
  save: <><path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>,
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
// Glass style (2026-10-25): `fill` is the frosted shape under the fine line (see WorkoutIcon).
// Body parts redrawn the same day for proportions: a longer leg, a V-tapered torso, an arm with a fist.
const ARM = 'M2.5 13.5C5 9.5 10 9 12.5 12l.9.8c.8-1.8 1.2-3.2 1.4-4.2L14.2 8.2 14 4.6C14 3 15.2 2.4 17 2.4h2.2c1.4.2 2 1.4 1.8 3l-.4 2.8-.3.8c1.2 3 1.3 6.5.1 9-.8 1.8-2.4 2.8-4.6 2.8H6c-2 0-3.5-1.2-3.5-3.3Z'
const LEG = 'M14.6 1.5c1.4 3 1.3 6.5-.2 9.1l-.4 1 .2 8.6 5.4 1c.6.1.9.6.9 1.3H11.4l-.5-1.6.4-1.3c-1.7-2-2.1-5.4-1.1-8.2C8.6 8.6 7.9 5.4 8 1.5Z'
const TORSO = 'M9.2 2.8c.6 1 5 1 5.6 0l3.8 1.3c1.9.6 3.2 2.4 3 4.4-.1 1.3-.9 2.3-2.2 2.6l-2.4 9.1c-.2.8-.7 1.3-1.6 1.3H8.6c-.9 0-1.4-.5-1.6-1.3L4.6 11.1c-1.3-.3-2.1-1.3-2.2-2.6-.2-2 1.1-3.8 3-4.4Z'
export const WORKOUT_ICONS: { key: string; name: string; svg: ReactNode; fill?: ReactNode }[] = [
  { key: 'arm', name: 'Arm', fill: <path d={ARM} />, svg: <><path d={ARM} /><path d="M16.8 2.5v2.4M19 2.5v2.2M14.1 6c1.5-.1 2.6.4 3.2 1.4M7 14.8c1.6-1 3.4-1 4.8.2" /></> },
  { key: 'leg', name: 'Leg', fill: <path d={LEG} />, svg: <><path d={LEG} /><path d="M14.1 11.2c-1.2.4-2.6.4-3.9 0M12.6 3.5c.6 2 .6 4.2-.1 6" /></> },
  { key: 'torso', name: 'Torso front', fill: <path d={TORSO} />, svg: <><path d={TORSO} /><path d="M6.8 9.2c1.8 1.4 3.6 1.7 5.2.6 1.6 1.1 3.4.8 5.2-.6M12 9.8v11.4M9.4 13.6h5.2M9.7 16.9h4.6" /></> },
  { key: 'back', name: 'Torso back', fill: <path d={TORSO} />, svg: <><path d={TORSO} /><path d="M12 3.6v17.9M7 6.2c1.2 2.8 2.9 4.6 5 5.2 2.1-.6 3.8-2.4 5-5.2M9 17.6l3-1.8 3 1.8" /></> },
  { key: 'dumbbell', name: 'Dumbbell', fill: <><rect x="5.4" y="6.5" width="2.4" height="11" rx="1" /><rect x="16.2" y="6.5" width="2.4" height="11" rx="1" /><rect x="2.6" y="9.2" width="1.8" height="5.6" rx=".9" /><rect x="19.6" y="9.2" width="1.8" height="5.6" rx=".9" /></>,
    svg: <><rect x="5.4" y="6.5" width="2.4" height="11" rx="1" /><rect x="16.2" y="6.5" width="2.4" height="11" rx="1" /><rect x="2.6" y="9.2" width="1.8" height="5.6" rx=".9" /><rect x="19.6" y="9.2" width="1.8" height="5.6" rx=".9" /><path d="M7.8 12h8.4M4.4 12h1M18.6 12h1" /></> },
  { key: 'barbell', name: 'Barbell', fill: <><rect x="4.2" y="8" width="1.8" height="8" rx=".9" /><rect x="6.9" y="6.2" width="2.4" height="11.6" rx="1" /><rect x="14.7" y="6.2" width="2.4" height="11.6" rx="1" /><rect x="18" y="8" width="1.8" height="8" rx=".9" /></>,
    svg: <><path d="M1.8 12h2.4M9.3 12h5.4M19.8 12h2.4" /><rect x="4.2" y="8" width="1.8" height="8" rx=".9" /><rect x="6.9" y="6.2" width="2.4" height="11.6" rx="1" /><rect x="14.7" y="6.2" width="2.4" height="11.6" rx="1" /><rect x="18" y="8" width="1.8" height="8" rx=".9" /></> },
  { key: 'pullbar', name: 'Pull-up bar', fill: <rect x="2.5" y="4" width="19" height="2.2" rx="1.1" />, svg: <><rect x="2.5" y="4" width="19" height="2.2" rx="1.1" /><path d="M5 6.2V20M19 6.2V20M3 20h4M17 20h4" /></> },
  { key: 'dipbar', name: 'Dip bar', fill: <><rect x="5" y="7.9" width="5.8" height="2.2" rx="1.1" /><rect x="13.2" y="7.9" width="5.8" height="2.2" rx="1.1" /></>,
    svg: <><rect x="5" y="7.9" width="5.8" height="2.2" rx="1.1" /><rect x="13.2" y="7.9" width="5.8" height="2.2" rx="1.1" /><path d="M5 21V5.5M19 21V5.5M3 21h4M17 21h4" /></> },
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

// Letters A–Z offered on the second drag (just labels, not body parts).
export const BODY_LETTERS: { key: string; name: string }[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((k) => ({ key: k, name: k }))

// The Tokyo pack (gear > Icon): ten Japanese icons and ten katakana in place of the above.
const petal = 'M12 12c-1.9-2.2-2.2-5-1.2-7.4l1.2 1.1 1.2-1.1c1 2.4.7 5.2-1.2 7.4Z'
export const TOKYO_ICONS: { key: string; name: string; svg: ReactNode }[] = [
  { key: 'katana', name: 'Katana', svg: <path d="M21 3c-4.8 2.6-9 6.2-12.4 10.1l2.3 2.3C14.4 12 18 7.8 21 3ZM6.6 11.8l5.6 5.6M8.3 15.7 3.5 20.5" /> },
  { key: 'torii', name: 'Torii', svg: <path d="M2.5 5c3 .9 6.2 1.3 9.5 1.3s6.5-.4 9.5-1.3M4.5 10h15M6.5 6.6V21M17.5 6.6V21M12 6.4V10" /> },
  { key: 'fuji', name: 'Mt Fuji', svg: <path d="M2 19.5 9.2 8.4c.6-.9 1.4-1.3 2.8-1.3s2.2.4 2.8 1.3L22 19.5ZM7.6 10.9l2 1.4 2.4-1.7 2.4 1.7 2-1.4" /> },
  { key: 'sakura', name: 'Sakura', svg: <>{[0, 72, 144, 216, 288].map((a) => <path key={a} d={petal} transform={`rotate(${a} 12 12)`} />)}<circle cx="12" cy="12" r=".6" /></> },
  { key: 'lantern', name: 'Lantern', svg: <><path d="M12 2.5V5M9 5h6M9 19h6M12 19v2.5M6.4 9.5c3.7 1 7.5 1 11.2 0M6.4 14.5c3.7-1 7.5-1 11.2 0" /><ellipse cx="12" cy="12" rx="6" ry="7" /></> },
  { key: 'koi', name: 'Koi', svg: <><path d="M20 12c-2-3.6-5.4-5.4-8.8-4.9C8.7 7.5 6.8 9.4 5.5 12c1.3 2.6 3.2 4.5 5.7 4.9 3.4.5 6.8-1.3 8.8-4.9ZM5.5 12 2.5 8.5c.8 1.6.8 5.4 0 7Z" /><path d="M10 9.4c1.2.9 1.5 2.4.9 3.8" /><circle cx="16.6" cy="11" r=".5" /></> },
  { key: 'fan', name: 'Fan', svg: <><path d="M12 20 3.2 10.9a12.6 12.6 0 0 1 17.6 0Z" /><path d="M12 20 7.6 7.9M12 20V7.3M12 20l4.4-12.1M7.6 15.4a6.5 6.5 0 0 1 8.8 0" /></> },
  { key: 'onigiri', name: 'Onigiri', svg: <path d="M12 4c1.2 0 2 .7 2.6 1.7l5.6 9.8c1.2 2.2-.2 4.5-2.7 4.5h-11c-2.5 0-3.9-2.3-2.7-4.5l5.6-9.8C10 4.7 10.8 4 12 4ZM9.2 20v-5.2h5.6V20" /> },
  { key: 'ramen', name: 'Ramen', svg: <path d="M3 12h18c0 4.4-3.6 7.5-8 7.5h-2c-4.4 0-8-3.1-8-7.5ZM9 19.5V21h6v-1.5M9.5 12 19.5 4.5M12.5 12 21 7M5.5 9.5c0-1.5 1.5-1.5 1.5-3M8.5 9.5c0-1.5 1.5-1.5 1.5-3" /> },
  { key: 'daruma', name: 'Daruma', svg: <><path d="M12 3c4.4 0 7.5 3.8 7.5 9 0 5-3.2 9-7.5 9s-7.5-4-7.5-9c0-5.2 3.1-9 7.5-9Z" /><ellipse cx="12" cy="10.5" rx="4" ry="3.4" /><circle cx="10.4" cy="9.9" r=".5" /><path d="M13 9.9h1.4M10.2 12.4c.6-.4 1.2-.4 1.8 0 .6-.4 1.2-.4 1.8 0" /></> },
]
export const TOKYO_LETTERS: { key: string; name: string }[] = [
  ['ア', 'a'], ['カ', 'ka'], ['サ', 'sa'], ['シ', 'shi'], ['ツ', 'tsu'], ['ミ', 'mi'], ['ヤ', 'ya'], ['ル', 'ru'], ['ワ', 'wa'], ['ン', 'n'],
].map(([k, r]) => ({ key: k, name: `${k} ${r}` }))

export type IconPack = 'default' | 'tokyo'
export const packIcons = (p: IconPack) => p === 'tokyo' ? TOKYO_ICONS : WORKOUT_ICONS
export const packLetters = (p: IconPack) => p === 'tokyo' ? TOKYO_LETTERS : BODY_LETTERS

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

// Exercise icons, Glass style (picked 2026-10-25): a fine line over a soft frosted fill that fades
// from top to bottom, in the icon's own colour. Icons without a `fill` (Tokyo, old ones) are line only.
const FINE = 1.3
export function WorkoutIcon({ k, size = '42%', strokeWidth = FINE }: { k: string; size?: string; strokeWidth?: number }) {
  const found: { svg: ReactNode; fill?: ReactNode } | undefined = WORKOUT_ICONS.find((i) => i.key === k) ?? TOKYO_ICONS.find((i) => i.key === k) ?? OLD_ICONS.find((i) => i.key === k)
  const id = 'gl' + useId().replace(/:/g, '')
  return (
    <Svg size={size} strokeWidth={strokeWidth}>
      {found?.fill && (
        <>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".5" /><stop offset="1" stopColor="currentColor" stopOpacity=".08" /></linearGradient></defs>
          <g fill={`url(#${id})`} stroke="none">{found.fill}</g>
        </>
      )}
      {found?.svg}
    </Svg>
  )
}

// Icon + letter, used as the workout's title everywhere.
export function WorkoutMark({ icon, letter, size = '1em' }: { icon: string; letter: string; size?: string }) {
  return (
    <span className="mark">
      <WorkoutIcon k={icon} size={size} />
      <span className="mark-letter">{letter}</span>
    </span>
  )
}
