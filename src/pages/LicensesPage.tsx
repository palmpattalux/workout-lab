import { useEffect, useState } from 'react'
import { Icon } from '../components/icons'
import { t } from '../lib/i18n'

// Gear > Open-source licences: the credits and licence texts in licenses.txt
// (made by `npm run licenses`).
export default function LicensesPage() {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    fetch('licenses.txt').then((r) => (r.ok ? r.text() : Promise.reject())).then(setText, () => setText(''))
  }, [])
  return (
    <main className="page scroll licenses" aria-label={t('Open-source licences')}>
      <header className="create-head">
        <h1>{t('Licences')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>
      {text === null ? null : text ? <pre className="licence-text">{text}</pre> : <p className="empty-note">{t("Couldn't load the licences. Check your connection and try again.")}</p>}
    </main>
  )
}
