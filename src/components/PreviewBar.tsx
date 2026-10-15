import { useEffect, useState } from 'react'
import { THEMES, usePreview, setPreview, onBlockedTap } from '../lib/theme'

// While a theme is being tried on: a bar across the top says so, and any tap that
// would use the app (rather than move between pages) gives the bar a nudge.
export default function PreviewBar() {
  const preview = usePreview()
  const [nudged, setNudged] = useState(0)
  useEffect(() => onBlockedTap(() => setNudged((n) => n + 1)), [])
  useEffect(() => {
    if (!nudged) return
    const t = setTimeout(() => setNudged(0), 1800)
    return () => clearTimeout(t)
  }, [nudged])
  if (!preview) return null
  const name = THEMES.find((t) => t?.key === preview)?.name ?? preview
  return (
    <div className={`preview-bar${nudged ? ' nudge' : ''}`} key={nudged} role="status">
      <span className="pv-eye" aria-hidden="true" />
      <span className="pv-text">{nudged ? 'Preview only, exit to use the app' : <>Trying <b>{name}</b></>}</span>
      <span className="pv-tag">Not owned</span>
      <button className="pv-exit" onClick={() => setPreview(null)}>Exit</button>
    </div>
  )
}
