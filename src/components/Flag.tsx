import { LANGS, t, type Lang } from '../lib/i18n'
import { usePrefs, setPrefs } from '../lib/prefs'

// Flag images for the language picker, drawn as standalone SVG images so the app's
// own svg styles can't touch them. 3:2, rounded by CSS.
function star(cx: number, cy: number, r: number, rot = 0) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.382 : r
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`
  })
  return `<polygon points='${pts.join(' ')}' fill='%23ffde00'/>`
}
const SVG: Record<Lang, string> = {
  en: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><rect width='60' height='40' fill='%23012169'/><path d='M0 0L60 40M60 0L0 40' stroke='%23fff' stroke-width='8'/><path d='M0 0L60 40M60 0L0 40' stroke='%23c8102e' stroke-width='3'/><path d='M30 0V40M0 20H60' stroke='%23fff' stroke-width='12'/><path d='M30 0V40M0 20H60' stroke='%23c8102e' stroke-width='7'/></svg>`,
  th: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><rect width='60' height='40' fill='%23a51931'/><rect y='6.67' width='60' height='26.67' fill='%23f4f5f8'/><rect y='13.33' width='60' height='13.33' fill='%232d2a4a'/></svg>`,
  ja: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><rect width='60' height='40' fill='%23fff'/><circle cx='30' cy='20' r='12' fill='%23bc002d'/></svg>`,
  zh: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><rect width='60' height='40' fill='%23de2910'/>${star(10, 10, 6)}${star(20, 4, 2, 0.9)}${star(24, 8, 2, 0.4)}${star(24, 14, 2, 0)}${star(20, 18, 2, -0.4)}</svg>`,
}

export default function Flag({ lang }: { lang: Lang }) {
  return <img className="flag" src={`data:image/svg+xml;utf8,${SVG[lang]}`} alt="" draggable={false} />
}

// The four flags as a picker; used in gear settings and on the login screen.
export function LangPicker() {
  const prefs = usePrefs()
  return (
    <div className="flags" role="radiogroup" aria-label={t('Language')}>
      {LANGS.map((l) => (
        <button key={l.key} role="radio" aria-checked={prefs.lang === l.key} aria-label={l.name} title={l.name}
          className={prefs.lang === l.key ? 'on' : undefined} onClick={() => setPrefs({ lang: l.key })}>
          <Flag lang={l.key} />
        </button>
      ))}
    </div>
  )
}
