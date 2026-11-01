import { useEffect, useState } from 'react'

// Long waits (account data arriving, a payment going through) on the desktop site show the ticking
// DOTSET ring (components/TickLoader.tsx). The very first load when someone opens the site never
// shows it: that time counts as settled only once the sign-in check is done and nothing is pending.
let pending = 0
let settled = false
let userKnown = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())

function settle() {
  if (!settled && userKnown && pending === 0) settled = true
}

/** Call when something slow starts; call the returned function when it ends. */
export function beginLoading(): () => void {
  const first = !settled
  pending++
  emit()
  let done = false
  return () => {
    if (done) return
    done = true
    pending--
    if (first) settle()
    emit()
  }
}

/** The app calls this once it knows whether someone is signed in. */
export function markUserKnown() {
  userKnown = true
  settle()
}

/** True while a load that started after the first one has been running for longer than `delay` ms. */
export function useLongLoading(delay = 450): boolean {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let timer = 0
    const check = () => {
      const on = settled && pending > 0
      if (!on) { window.clearTimeout(timer); timer = 0; setBusy(false); return }
      if (!timer) timer = window.setTimeout(() => setBusy(settled && pending > 0), delay)
    }
    listeners.add(check)
    check()
    return () => { listeners.delete(check); window.clearTimeout(timer) }
  }, [delay])
  return busy
}
