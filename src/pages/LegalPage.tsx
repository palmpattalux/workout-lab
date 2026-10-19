import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../components/icons'
import { lang, t } from '../lib/i18n'
import { LEGAL } from '../legal/info'

// Terms, Privacy and Refunds: one page with three tabs, also reachable at dotset.app/terms,
// /privacy and /refunds (the App Store, Google Play and Omise link there). The texts live in
// src/legal/*.md in English and Thai (Thai readers get Thai; everyone else English) and are
// only downloaded when this page opens. {{name}} in a text is filled from src/legal/info.ts.
export type LegalDoc = 'terms' | 'privacy' | 'refunds'
const DOCS: { key: LegalDoc; label: string }[] = [
  { key: 'terms', label: 'Terms' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'refunds', label: 'Refunds' },
]
const files = import.meta.glob('../legal/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

function fill(text: string) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: keyof typeof LEGAL) => String(LEGAL[k] ?? ''))
}
// **bold**, [text](#link) and bare emails inside a line
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|[\w.+-]+@[\w-]+\.[\w.]+)/g).map((part, i) => {
    if (part.startsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) return <a key={i} href={link[2]}>{link[1]}</a>
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) return <a key={i} href={'mailto:' + part}>{part}</a>
    return <Fragment key={i}>{part}</Fragment>
  })
}
// A small Markdown subset: # title, ## heading, ### subheading, - list items, paragraphs.
function render(md: string) {
  const out: ReactNode[] = []
  let list: string[] = []
  const flush = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = [] } }
  for (const raw of md.split(/\n{2,}|\n(?=[-#])/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('- ')) { list.push(line.slice(2).replace(/\n\s*/g, ' ')); continue }
    flush()
    if (line.startsWith('### ')) out.push(<h3 key={out.length}>{inline(line.slice(4))}</h3>)
    else if (line.startsWith('## ')) out.push(<h2 key={out.length}>{inline(line.slice(3))}</h2>)
    else if (line.startsWith('# ')) out.push(<h1 key={out.length} className="legal-title">{inline(line.slice(2))}</h1>)
    else out.push(<p key={out.length}>{inline(line.replace(/\n\s*/g, ' '))}</p>)
  }
  flush()
  return out
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const [text, setText] = useState<string | null>(null)
  const language = lang() === 'th' ? 'th' : 'en'
  useEffect(() => {
    setText(null)
    const load = files[`../legal/${doc}.${language}.md`] ?? files[`../legal/${doc}.en.md`]
    load().then((s) => setText(fill(s)), () => setText(''))
  }, [doc, language])
  return (
    <main className="page scroll legal" aria-label={t(DOCS.find((d) => d.key === doc)!.label)}>
      <header className="create-head">
        <div className="legal-tabs" role="tablist">
          {DOCS.map((d) => (
            <button key={d.key} role="tab" aria-selected={d.key === doc} className={d.key === doc ? 'on' : undefined} onClick={() => location.replace('#' + d.key)}>{t(d.label)}</button>
          ))}
        </div>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => (history.length > 1 ? history.back() : location.replace('#'))}><Icon name="back" size="22px" /></button>
      </header>
      <article className="legal-text">{text === null ? null : text ? render(text) : <p>{t("Couldn't load this page. Check your connection and try again.")}</p>}</article>
    </main>
  )
}
