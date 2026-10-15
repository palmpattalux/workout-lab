import SakuraScene from './SakuraScene'
import NightCityScene from './NightCityScene'

// The home-page backdrop for each theme, by key.
export default function ThemeScene({ skin }: { skin: string | null }) {
  if (skin === 'sakura') return <SakuraScene />
  if (skin === 'nightcity') return <NightCityScene />
  return null
}
