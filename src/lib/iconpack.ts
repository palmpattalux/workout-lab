import { usePrefs } from './prefs'
import { usePlan } from './plan'
import { useOwnedThemes, canUseTheme } from './theme'
import type { IconPack } from '../components/icons'

// Icon sets other than the default are sold like a theme: bought once, or free with their plan.
export const PACK_ITEM: Record<Exclude<IconPack, 'default'>, string> = { tokyo: 'tokyo-icons' }
export function useCanUsePack() {
  const plan = usePlan()
  useOwnedThemes()
  return (p: IconPack) => p === 'default' || canUseTheme(PACK_ITEM[p], plan)
}
// the set actually in use: a chosen set the account no longer has falls back to the default
export function useIconPack(): IconPack {
  const { pack } = usePrefs()
  return useCanUsePack()(pack) ? pack : 'default'
}
