import { useEffect, useState } from 'react'
import { Icon } from './icons'
import { drawSticker, type StickerStats } from '../lib/sticker'
import { t } from '../lib/i18n'

// Sheet with the see-through stats sticker: Share (the phone's own share menu, so
// Instagram, LINE…) or Save as a PNG.
export default function ShareSticker({ stats, onClose }: { stats: StickerStats; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let u: string | null = null
    drawSticker(stats).then((b) => {
      const f = new File([b], 'dotset-session.png', { type: 'image/png' })
      u = URL.createObjectURL(b)
      setFile(f); setUrl(u)
    })
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [stats])

  const canShare = !!file && !!navigator.canShare?.({ files: [file] })

  async function share() {
    if (!file) return
    try { await navigator.share({ files: [file] }) } catch (e) { if ((e as Error).name !== 'AbortError') setNote(t("Couldn't open sharing here. Save it instead.")) }
  }
  function save() {
    if (!url) return
    const a = document.createElement('a')
    a.href = url; a.download = 'dotset-session.png'
    document.body.appendChild(a); a.click(); a.remove()
    setNote(t('Saved. Add it to your story as a sticker.'))
  }

  return (
    <div className="share-sheet" role="dialog" aria-label={t('Share your session')}>
      <div className="share-top">
        <h2>{t('Share your session')}</h2>
        <button className="icon-btn" aria-label={t('Close')} onClick={onClose}><Icon name="close" size="22px" /></button>
      </div>
      <p className="share-tag">{t('Transparent')}</p>
      <div className="share-preview">{url ? <img src={url} alt={t('Session stats sticker')} /> : <i className="co-dot" />}</div>
      <p className="share-hint">{note ?? t('See-through, so it sits on top of your own photo.')}</p>
      <div className="share-actions">
        {canShare && <button className="primary" onClick={share}><Icon name="share" size="20px" />{t('Share')}</button>}
        <button className={canShare ? 'share-save' : 'primary'} onClick={save} disabled={!url}><Icon name="save" size="20px" />{t('Save')}</button>
      </div>
    </div>
  )
}
