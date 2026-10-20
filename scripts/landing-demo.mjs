// Captures the desktop How it works screens (public/landing/demo/<frame>-<light|dark>.png, convert to .webp).
// Run with the dev server on :5173 and playwright installed: node scripts/landing-demo.mjs light|dark
import { chromium } from 'playwright'
const mode = process.argv[2] || 'light'
const out = (n) => `public/landing/demo/${n}-${mode}.png`
const b = await chromium.launch({  })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, colorScheme: mode })
const p = await ctx.newPage()
const day = 86400000, now = Date.now()
const W = [
  { id: 'w1', icon: 'barbell', letter: 'A', exercise: 'Bench press', equipment: '', mode: 'equipment', unit: 'kg', focus: 'Shoulders down, slow on the way down', notes: 'Add 2.5 kg when all sets feel easy.', slot: 0, color: 'sky', createdAt: now - 40 * day },
  { id: 'w2', icon: 'leg', letter: 'B', exercise: 'Squat', equipment: '', mode: 'equipment', unit: 'kg', focus: '', notes: '', slot: 1, color: 'sage', createdAt: now - 39 * day },
  { id: 'w3', icon: 'pullbar', letter: 'C', exercise: 'Pull-up', equipment: '', mode: 'equipment', unit: 'kg', focus: '', notes: '', slot: 5, color: 'sand', createdAt: now - 38 * day },
  { id: 'w4', icon: 'dumbbell', letter: 'D', exercise: 'Curl', equipment: '', mode: 'equipment', unit: 'kg', focus: '', notes: '', slot: 2, color: 'rose', createdAt: now - 37 * day },
]
const S = [9, 6, 3].map((d, i) => ({ id: 's' + i, startedAt: now - d * day, endedAt: now - d * day + 3600e3, current: 'w1', order: ['w1'], setOf: { w1: 3 }, sets: { w1: { 1: { reps: 10, weight: 55 + i * 2.5 }, 2: { reps: 8, weight: 60 + i * 2.5 }, 3: { reps: 7 - (i ? 1 : 0), weight: 65 + i * 2.5 } } } }))
await p.addInitScript(([W, S, mode]) => {
  if (sessionStorage.getItem('seeded')) return
  sessionStorage.setItem('seeded', '1')
  localStorage.clear()
  localStorage.setItem('workout-lab:workouts', JSON.stringify(W))
  localStorage.setItem('workout-lab:sessions', JSON.stringify(S))
  localStorage.setItem('dotset:safety-ok', '1')

  localStorage.setItem('workout-lab:prefs', JSON.stringify({ theme: mode, sound: false, lang: 'en' }))
}, [W, S, mode])
await p.goto('http://localhost:5173/')
await p.waitForTimeout(5500)
await p.screenshot({ path: out('home') })
// + : drag up to pick an icon
const add = p.locator('.dot.add').first()
let bb = await add.boundingBox()
let x = bb.x + bb.width / 2, y = bb.y + bb.height / 2
await p.mouse.move(x, y); await p.mouse.down()
for (let i = 1; i <= 8; i++) { await p.mouse.move(x, y - i * 12); await p.waitForTimeout(40) }
await p.waitForTimeout(250)
await p.screenshot({ path: out('add-icon') })
await p.mouse.up(); await p.waitForTimeout(400)
bb = await p.locator('.dot.add').first().boundingBox(); x = bb.x + bb.width / 2; y = bb.y + bb.height / 2
await p.mouse.move(x, y); await p.mouse.down()
for (let i = 1; i <= 4; i++) { await p.mouse.move(x, y - i * 12); await p.waitForTimeout(40) }
await p.waitForTimeout(250)
await p.screenshot({ path: out('add-letter') })
await p.mouse.up(); await p.waitForTimeout(700)
await p.fill('#exercise', 'Overhead press').catch(() => {})
await p.waitForTimeout(300)
await p.screenshot({ path: out('create') })
await p.click('.save-new'); await p.waitForTimeout(1200)
await p.screenshot({ path: out('home-new') })
// tap a dot once: armed
const dotA = p.locator('.dot.filled').first()
await dotA.click({ force: true }); await p.waitForTimeout(600)
await p.screenshot({ path: out('armed') })
await dotA.click({ force: true }); await p.waitForTimeout(1200)
await p.screenshot({ path: out('log1') })
// weight picker: hold and slide up
const pick = p.locator('.page .holdable').first()
bb = await pick.boundingBox().catch(() => null)
if (bb) {
  x = bb.x + bb.width / 2; y = bb.y + bb.height / 2
  await p.mouse.move(x, y); await p.mouse.down()
  for (let i = 1; i <= 30; i++) { await p.mouse.move(x, y - i * 14); await p.waitForTimeout(30) }
  await p.waitForTimeout(3000)
  await p.mouse.move(x, y - 380); await p.waitForTimeout(400)
  await p.screenshot({ path: out('weight') })
  await p.mouse.up(); await p.waitForTimeout(500)
  await p.screenshot({ path: out('log-w') })
  const r = p.locator('.page .holdable').nth(1)
  bb = await r.boundingBox(); x = bb.x + bb.width / 2; y = bb.y + bb.height / 2
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(400)
  for (let i = 1; i <= 7; i++) { await p.mouse.move(x, y - i * 30); await p.waitForTimeout(40) }
  await p.waitForTimeout(300)
  await p.screenshot({ path: out('reps') })
  await p.mouse.up(); await p.waitForTimeout(500)
  await p.screenshot({ path: out('log-wr') })
}
await p.locator('[aria-label*="Next"], [aria-label*="next"]').first().click().catch(() => console.log('no next'))
await p.waitForTimeout(600)
await p.screenshot({ path: out('log-next') })
await p.goto('http://localhost:5173/#book-w1'); await p.waitForTimeout(1500)
await p.screenshot({ path: out('book') })
await b.close()
