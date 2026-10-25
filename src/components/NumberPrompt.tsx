import { useState } from 'react'
import { t } from '../lib/i18n'

// Type a number instead of dragging for it (a weight, or seconds held).
export default function NumberPrompt({ title, unit, value, decimal, max = 9999, onSave, onClose }: {
  title: string
  unit: string
  value: number | null
  decimal?: boolean
  max?: number
  onSave: (n: number) => void
  onClose: () => void
}) {
  const [text, setText] = useState(value ? String(value) : '')
  const n = Number(text.replace(',', '.'))
  const ok = text.trim() !== '' && Number.isFinite(n) && n > 0 && n <= max
  function save() {
    if (!ok) return
    onSave(decimal ? Math.round(n * 100) / 100 : Math.round(n))
    onClose()
  }
  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="confirm number-prompt" role="dialog" aria-label={title} onSubmit={(e) => { e.preventDefault(); save() }}>
        <p>{title}</p>
        <label className="np-field">
          <input autoFocus inputMode={decimal ? 'decimal' : 'numeric'} pattern={decimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
            value={text} onChange={(e) => setText(e.target.value)} aria-label={title} />
          <span>{unit}</span>
        </label>
        <div>
          <button type="button" onClick={onClose}>{t('Cancel')}</button>
          <button type="submit" className="yes" disabled={!ok}>{t('Save')}</button>
        </div>
      </form>
    </div>
  )
}
