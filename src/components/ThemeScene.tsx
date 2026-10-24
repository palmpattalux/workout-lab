import SakuraScene from './SakuraScene'
import NightCityScene from './NightCityScene'
import NeonScene from './NeonScene'
import MangaScene from './MangaScene'
import SummitScene from './SummitScene'
import DesertScene from './DesertScene'
import OceanScene from './OceanScene'
import ForestScene from './ForestScene'
import SnowScene from './SnowScene'
import AutumnScene from './AutumnScene'
import ZenScene from './ZenScene'
import LanternScene from './LanternScene'
import OrbitScene from './OrbitScene'
import RainScene from './RainScene'
import KoiScene from './KoiScene'
import BauhausScene from './BauhausScene'

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
  if (skin === 'bauhaus') return <BauhausScene />
  return null
}
