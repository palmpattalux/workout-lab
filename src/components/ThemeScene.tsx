import type { ComponentType } from 'react'
import SakuraScene, { SakuraSession } from './SakuraScene'
import NightCityScene, { NightCitySession } from './NightCityScene'
import NeonScene, { NeonSession } from './NeonScene'
import MangaScene from './MangaScene'
import SummitScene from './SummitScene'
import DesertScene, { DesertSession } from './DesertScene'
import OceanScene from './OceanScene'
import ForestScene from './ForestScene'
import SnowScene from './SnowScene'
import AutumnScene from './AutumnScene'
import ZenScene from './ZenScene'
import LanternScene, { LanternSession } from './LanternScene'
import OrbitScene, { OrbitSession } from './OrbitScene'
import RainScene from './RainScene'
import KoiScene, { KoiSession } from './KoiScene'

// The home-page backdrop for each theme, by key.
export default function ThemeScene({ skin }: { skin: string | null }) {
  if (skin === 'sakura') return <SakuraScene />
  if (skin === 'nightcity') return <NightCityScene />
  if (skin === 'neon') return <NeonScene />
  if (skin === 'manga') return <MangaScene />
  if (skin === 'summit') return <SummitScene />
  if (skin === 'desert') return <DesertScene />
  if (skin === 'ocean') return <OceanScene />
  if (skin === 'forest') return <ForestScene />
  if (skin === 'snow') return <SnowScene />
  if (skin === 'autumn') return <AutumnScene />
  if (skin === 'zen') return <ZenScene />
  if (skin === 'lantern') return <LanternScene />
  if (skin === 'orbit') return <OrbitScene />
  if (skin === 'rain') return <RainScene />
  if (skin === 'koi') return <KoiScene />
  return null
}

// Page B during a session (or while trying a theme on): the themes with their own sounds or
// reactions listen to `steps`, the number of sets moved on so far, and answer each new one.
const SESSION: Record<string, ComponentType<{ steps: number }>> = {
  sakura: SakuraSession,
  nightcity: NightCitySession,
  neon: NeonSession,
  desert: DesertSession,
  lantern: LanternSession,
  orbit: OrbitSession,
  koi: KoiSession,
}
export function ThemeSession({ skin, steps }: { skin: string | null; steps: number }) {
  const C = skin ? SESSION[skin] : undefined
  return C ? <C steps={steps} /> : null
}
