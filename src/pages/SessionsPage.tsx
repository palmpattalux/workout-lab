import { useState } from 'react'
import { WorkoutMark } from '../components/icons'
import { useSessions, deleteSession, updateSession, type Workout, type Session, type SetEntry } from '../lib/store'
import { useSession, discardSession } from '../lib/session'
import { day, time, duration, setLines } from '../lib/format'
import { compare } from '../lib/progress'
import { t } from '../lib/i18n'

// A small change chip, the same look as the summary page: ▲ +3 reps, ▼ −2.5 kg, first time.
function Change({ d, unit, label }: { d: number | null; unit?: string; label: string }) {
  if (d === null) return <span className="delta new static">{t('{label}: first time', { label })}</span>
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'same'
  const text = d === 0 ? t('same') : `${d > 0 ? '+' : '−'}${Math.abs(+d.toFixed(1))}${unit ? ' ' + unit : ''}`
  return <span className={`delta ${cls} static`}>{label} {d > 0 && '▲ '}{d < 0 && '▼ '}{text}</span>
}

// Every session as a row, newest at the top. Tap a row to see its exercises and sets.
export default function SessionsList({ workouts, only }: { workouts: Workout[]; only?: string }) {
  const done = useSessions()
  const live = useSession()
  const [open, setOpen] = useState<string | null>(null)
  const [removing, setRemoving] = useState<(Session & { live?: boolean }) | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  // `only`: a preset's id, to list just the sessions done from it
  const rows: (Session & { live?: boolean })[] = [...(live ? [{ ...live, live: true }] : []), ...[...done].reverse()].filter((s) => !only || s.preset === only)

  if (rows.length === 0) {
    return <p className="empty-note">{only ? t('No sessions from this preset yet. Pick it on the first page, then open one of its exercises.') : t('No sessions yet. Open an exercise from the first page to start one.')}</p>
  }

  return (
    <>
    {removing && (
      <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setRemoving(null) }}>
        <div className="confirm" role="alertdialog" aria-label={t('Remove session?')}>
          <p>{t('Remove session?')}</p>
          <div>
            <button onClick={() => setRemoving(null)}>{t('No')}</button>
            <button className="yes danger" onClick={() => {
              if (removing.live) discardSession(); else deleteSession(removing.id)
              setOpen(null); setRemoving(null)
            }}>{t('Yes')}</button>
          </div>
        </div>
      </div>
    )}
    <ol className="sessions">
      {rows.map((s) => {
        const isOpen = open === s.id
        // compare with the sessions before this one (oldest first); a live session comes after all of them
        const at = s.live ? done.length : done.findIndex((x) => x.id === s.id)
        const changes = Object.fromEntries(s.order.map((id) => [id, compare(done, at, s, id)]))
        const gains = s.order.filter((id) => changes[id].up).length
        return (
          <li key={s.id} className={s.live ? 'live' : undefined}>
            <button className="session-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              <span className="when">
                <b>{day(s.startedAt)}</b>
                <small>{s.live ? t('In progress since {time}', { time: time(s.startedAt) }) : `${time(s.startedAt)} · ${duration(s.startedAt, s.endedAt ?? s.startedAt)}`}</small>
              </span>
              {gains > 0 && <span className="gain-badge" aria-label={t('{n} improved', { n: gains })}>▲ {gains}</span>}
              <span className="marks">
                {s.order.map((id) => {
                  const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
                  return info ? <WorkoutMark key={id} icon={info.icon} letter={info.letter} size="1em" /> : null
                })}
              </span>
            </button>
            {isOpen && editing === s.id && !s.live && (
              <SessionEditor s={s} workouts={workouts} onClose={() => setEditing(null)} />
            )}
            {isOpen && editing !== s.id && (
              <div className="session-detail">
                {s.order.map((id) => {
                  const current = workouts.find((w) => w.id === id)
                  const info = s.snap?.[id] ?? current
                  const lines = setLines(s, id, current)
                  return (
                    <div key={id} className="ex">
                      <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || t('Untitled')}</p>
                      {s.snap?.[id]?.move && <p className="muted">{t('Progression: {move}', { move: s.snap[id].move! })}</p>}
                      {changes[id].now && (
                        <div className="changes">
                          <Change d={changes[id].repDelta} label={info?.mode === 'progression' && info?.count === 'sec' ? t('Seconds') : t('Reps')} />
                          {info?.mode !== 'progression' && changes[id].now!.top !== null && changes[id].prev && <Change d={changes[id].topDelta} unit={info?.unit ?? 'kg'} label={t('Top load')} />}
                        </div>
                      )}
                      {lines.length === 0 ? <p className="muted">{t('Nothing recorded')}</p> : (
                        <ul>{lines.map((l) => <li key={l.set}><span>{t('Set {n}', { n: l.set })}</span>{l.text}</li>)}</ul>
                      )}
                    </div>
                  )
                })}
                <div className="detail-actions">
                  {!s.live && <button className="edit-session" onClick={() => setEditing(s.id)}>{t('Edit')}</button>}
                  <button className="remove" onClick={() => setRemoving(s)}>{t('Remove session')}</button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ol>
    </>
  )
}

// Edit an ended session in place: each set's load and reps, and for progressions
// whether the number was reps or seconds.
function SessionEditor({ s, workouts, onClose }: { s: Session; workouts: Workout[]; onClose: () => void }) {
  const [sets, setSets] = useState<Session['sets']>(() => JSON.parse(JSON.stringify(s.sets)))
  const [counts, setCounts] = useState<Record<string, 'reps' | 'sec'>>(() =>
    Object.fromEntries(s.order.map((id) => [id, (s.snap?.[id] ?? workouts.find((w) => w.id === id))?.count ?? 'reps'])))

  function put(id: string, n: string, k: keyof SetEntry, v: string) {
    const num = v.trim() === '' ? null : Math.max(0, Number(v))
    setSets((x) => ({ ...x, [id]: { ...x[id], [n]: { ...(x[id]?.[n] ?? { reps: null, weight: null }), [k]: Number.isFinite(num as number) || num === null ? num : null } } }))
  }
  function save() {
    const snap = { ...(s.snap ?? {}) }
    for (const id of s.order) {
      const w = workouts.find((x) => x.id === id)
      const base = snap[id] ?? (w ? { exercise: w.exercise, icon: w.icon, letter: w.letter, mode: w.mode, unit: w.unit } : undefined)
      if (base) snap[id] = { ...base, count: counts[id] }
    }
    updateSession({ ...s, sets, snap })
    onClose()
  }

  return (
    <div className="session-detail editing">
      {s.order.map((id) => {
        const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
        const progression = info?.mode === 'progression'
        const unit = info?.unit ?? 'kg'
        const count = counts[id]
        const nums = Object.keys(sets[id] ?? {}).sort((a, b) => Number(a) - Number(b))
        return (
          <div key={id} className="ex">
            <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || t('Untitled')}</p>
            {progression && (
              <button className="unit small" onClick={() => setCounts((c) => ({ ...c, [id]: count === 'reps' ? 'sec' : 'reps' }))} aria-label={`Counting ${count}, tap to switch`}>
                <span className={count === 'reps' ? 'on' : ''}>{t('reps')}</span> / <span className={count === 'sec' ? 'on' : ''}>{t('sec')}</span>
              </button>
            )}
            {nums.length === 0 ? <p className="muted">{t('Nothing recorded')}</p> : (
              <ul className="set-edit">
                {nums.map((n) => (
                  <li key={n}>
                    <span>{t('Set {n}', { n })}</span>
                    {!progression && (
                      <label><input inputMode="decimal" type="number" min="0" step="any" value={sets[id][n].weight ?? ''} onChange={(e) => put(id, n, 'weight', e.target.value)} aria-label={`Set ${n} load`} /><small>{unit}</small></label>
                    )}
                    <label><input inputMode="numeric" type="number" min="0" value={sets[id][n].reps ?? ''} onChange={(e) => put(id, n, 'reps', e.target.value)} aria-label={`Set ${n} ${progression && count === 'sec' ? 'seconds' : 'reps'}`} /><small>{progression && count === 'sec' ? t('sec') : t('reps')}</small></label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="detail-actions">
        <button className="edit-session primary" onClick={save}>{t('Save')}</button>
        <button className="edit-session" onClick={onClose}>{t('Cancel')}</button>
      </div>
    </div>
  )
}
