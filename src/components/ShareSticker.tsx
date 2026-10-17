import { useEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import { drawSticker, drawProgress, drawCard, type StickerStats, type StickerProgress, type StickerCard } from '../lib/sticker'
import { t } from '../lib/i18n'

// Share sheet after a session: swipe between images (two see-through stickers and the
// full summary card). Share opens the phone's own share menu (Instagram, LINE…); Save keeps a PNG.
type Slide = { key: string; tag: string; hint: string; clear: boolean; make: () => Promise<Blob> }
type Made = { file: File; url: string }

export default function ShareSticker({ stats, progress, card, onClose }: { stats: StickerStats; progress: StickerProgress; card: StickerCard; onClose: () => void }) {
  const slides: Slide[] = [
    { key: 'stats', tag: t('Transparent'), hint: t('See-through, so it sits on top of your own photo.'), clear: true, make: () => drawSticker(stats) },
    { key: 'progress', tag: t('Progress'), hint: progress.first ? t('Your first session. Next time this shows how far you came.') : t('How much you improved since last session.'), clear: true, make: () => drawProgress(progress) },
    { key: 'card', tag: t('Summary card'), hint: t('The whole session, in your theme.'), clear: false, make: () => drawCard(card) },
  ]
  const [made, setMade] = useState<(Made | null)[]>(() => slides.map(() => null))
  const [index, setIndex] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const urls: string[] = []
    slides.forEach((s, i) => s.make().then((b) => {
      const url = URL.createObjectURL(b); urls.push(url)
      setMade((m) => m.map((x, j) => (j === i ? { file: new File([b], `dotset-${s.key}.png`, { type: 'image/png' }), url } : x)))
    }))
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onScroll() {
    const el = track.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) { setIndex(i); setNote(null) }
    if (i > 0) setSwiped(true)
  }
  const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' })

  const cur = made[index]
  const canShare = !!cur && !!navigator.canShare?.({ files: [cur.file] })
  async function share() {
    if (!cur) return
    try { await navigator.share({ files: [cur.file] }) } catch (e) { if ((e as Error).name !== 'AbortError') setNote(t("Couldn't open sharing here. Save it instead.")) }
  }
  function save() {
    if (!cur) return
    const a = document.createElement('a')
    a.href = cur.url; a.download = cur.file.name
    document.body.appendChild(a); a.click(); a.remove()
    setNote(slides[index].clear ? t('Saved. Add it to your story as a sticker.') : t('Saved to your downloads.'))
  }

  return (
    <div className="share-sheet" role="dialog" aria-label={t('Share your session')}>
      <div className="share-top">
        <h2>{t('Share your session')}</h2>
        <button className="icon-btn" aria-label={t('Close')} onClick={onClose}><Icon name="close" size="22px" /></button>
      </div>
      <p className="share-tag">{slides[index].tag}</p>
      <div className="share-track" ref={track} onScroll={onScroll}>
        {slides.map((s, i) => (
          <div key={s.key} className="share-slide">
            <div className={`share-preview${s.clear ? '' : ' solid'}`}>{made[i] ? <img src={made[i]!.url} alt={s.tag} /> : <i className="co-dot" />}</div>
          </div>
        ))}
      </div>
      <div className="share-nav">
        <div className="share-dots" role="tablist">
          {slides.map((s, i) => <button key={s.key} role="tab" aria-selected={i === index} aria-label={s.tag} className={i === index ? 'on' : undefined} onClick={() => go(i)} />)}
        </div>
        {!swiped && <button className="share-swipe" onClick={() => go(1)}>{t('Swipe for more')}<Icon name="swipe" size="18px" /></button>}
      </div>
      <p className="share-hint">{note ?? slides[index].hint}</p>
      <div className="share-actions">
        {canShare && <button className="primary" onClick={share}><Icon name="share" size="20px" />{t('Share')}</button>}
        <button className={canShare ? 'share-save' : 'primary'} onClick={save} disabled={!cur}><Icon name="save" size="20px" />{t('Save')}</button>
      </div>
    </div>
  )
}
