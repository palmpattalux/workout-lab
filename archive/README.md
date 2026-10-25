# Archive

Features and designs that were tried and taken out. Nothing here is built or shipped.
To bring one back, ask Claude, or copy the files into `src/` as described below.

## Themes (`themes/`)

Each folder has the scene component, the styles that went with it, and the line it had in `src/lib/theme.ts`.

| Folder | What it was |
| --- | --- |
| `golden-hour/` | Golden Hour: sunset over a wheat field, leaves and birds. |
| `redemption/` | Redemption: hazy golden afternoon, tree edge, leaves on the wind. |
| `castle/` | Castle: stone castle above pines, morning in light mode, torch-lit night in dark. |

To restore: copy the `.tsx` into `src/components/`, paste `styles.css` into `src/styles.css`, add the theme line back to `THEMES` in `src/lib/theme.ts`, and add it to `src/components/ThemeScene.tsx`.

## Opening screens (`splash/`)

Each file is the whole `index.html` from when that opening screen was live. The splash is the `#splash` block and its `<style>`.

| File | What it was |
| --- | --- |
| `sidekick.html` | Sidekick name, counting to 100 then glowing orange. |
| `tick.html` | Tick: a meter needle does one tick. |
| `jarvis.html` | Jarvis name. |
| `right-now.html` | Right Now name. |
| `lipstick.html` | Lipstick with a blooming flower. |
| `dotset-three-taps.html` | First Dotset splash: a dot taps three sets, then opens into the "o". |
| `dotset-letters-drift.html` | Dotset with letters drifting in from different angles. |

The same opening screens are also on the git branches `splash-sidekick`, `splash-tick`, `splash-jarvis`, `splash-right-now` and `splash-lipstick`.

## Page B (`page-b/`)

- `SessionTray.tsx` + `session-tray.css`: the first session switcher, a small stacked button. Replaced by the icon bar (`src/components/SessionBar.tsx`).

## Screenshots (`screenshots/`)

Old screenshots that used to sit in the repo root.

## Hologram guides (`holograms/`)

| File | What it was |
| --- | --- |
| `HoloThumb.tsx` | The first-run "right thumb" blueprint that slid up from "+" and the page B buttons, used with a pointing-hand icon. Replaced by the Spotlight style (touch dot, ring, solid card) on 2026-10-25. Its styles (`.holo-thumb`, `.holo-hand`, `.holo-arrow`) are in `src/styles.css` before that change, in git commit `f91bca2`. |
