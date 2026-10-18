import type { setLines } from '../lib/format'
import { t } from '../lib/i18n'

// A session's sets for one exercise, in the book. A set done one side at a time shows
// as two rows, Left and Right, under one set number.
export default function SetList({ lines }: { lines: ReturnType<typeof setLines> }) {
  return (
    <ul>
      {lines.map((l, i) => (
        <li key={l.key} className={l.side ? 'sided' : undefined}>
          <span>{lines[i - 1]?.set === l.set && l.side ? '' : t('Set {n}', { n: l.set })}</span>
          {l.side && <b className="side-tag">{l.side === 'L' ? t('L') : t('R')}</b>}
          {l.text}
        </li>
      ))}
    </ul>
  )
}
