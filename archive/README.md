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
| `dotset-orange-o.html` | Orange dot breathes, a ring settles into the "o", the letters are revealed (2026-10-17). |
| `dotset-loading-screens-preview.html` | Previews of the "t." logo opening screens with tabs: 1 Tick, 2 Whirlpool, 3 Whirlpool + font, 4 Dark centred, 5 Thin text (4 and 5 load the two files below). |
| `dotset-opening-v4-dark-centred.html` | The app's opening screen on the dark glass page, centred on the page box so the dot lands on the middle exercise (2026-11-01). |
| `dotset-opening-v5-thin-text.html` | Same, with the ring letters back near the Tick ring's size while the dot stays exercise-sized (2026-11-01). |

The same opening screens are also on the git branches `splash-sidekick`, `splash-tick`, `splash-jarvis`, `splash-right-now` and `splash-lipstick`.

## Page B (`page-b/`)

- `SessionTray.tsx` + `session-tray.css`: the first session switcher, a small stacked button. Replaced by the icon bar (`src/components/SessionBar.tsx`).

## Screenshots (`screenshots/`)

Old screenshots that used to sit in the repo root.

## Hologram guides (`holograms/`)

| File | What it was |
| --- | --- |
| `HoloThumb.tsx` | The first-run "right thumb" blueprint that slid up from "+" and the page B buttons, used with a pointing-hand icon. Replaced by the Glass style (frosted pills, sweeping ring, glassy touch circle) on 2026-10-25. Its styles (`.holo-thumb`, `.holo-hand`, `.holo-arrow`) are in `src/styles.css` before that change, in git commit `f91bca2`. |

## Exercise icons (`icons/`)

Each folder is a full copy of `src/components/icons.tsx` from when that icon set was live, plus a `preview.png`.

| Folder | What it was |
| --- | --- |
| `glass-2026-10-25/` | Glass icons (fine line over a frosted fill): Arm, Leg, Torso front/back, Dumbbell, Barbell, Pull-up bar, Dip bar, and the Tokyo pack. |

To restore: copy `icons.tsx` back over `src/components/icons.tsx`.

Also here: `sets-2026-11-01.html` (the mock-up page of the 7 icon sets as first drawn) and `dotset-icons-all.svg` (every icon of every set in one vector file, on coloured tiles) and `dotset-icons-all-transparent.svg` (the same with no background, cut-outs see-through). The live sets are in `src/components/iconSets.ts`. The first Standard set (thin line) was replaced by filled Standard the same day; it is `LINE_SET` in `iconSets.ts`, not shown anywhere. Tokyo is hidden from gear > Icons but still in `icons.tsx` so old workouts draw.
