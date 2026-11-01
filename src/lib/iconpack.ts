import { usePrefs } from './prefs'
import { usePlan } from './plan'
import { useOwnedThemes, canUseTheme } from './theme'
import { ICON_SETS, DEFAULT_SET, type IconSetKey } from '../components/iconSets'

// Icon sets other than Standard are sold like a theme: bought once, or free with their plan.
export const PACK_ITEM: Record<Exclude<IconSetKey, 'standard'>, string> = {
  electric: 'icons-electric', sparks: 'icons-sparks', rock: 'icons-rock', brush: 'icons-brush', bubbly: 'icons-bubbly', solid: 'icons-solid',
}
export const packOfItem = (item: string): IconSetKey | null =>
  (Object.entries(PACK_ITEM).find(([, v]) => v === item)?.[0] as IconSetKey | undefined) ?? null
const isSet = (p: string): p is IconSetKey => ICON_SETS.some((s) => s.key === p)

export function useCanUsePack() {
  const plan = usePlan()
  useOwnedThemes()
  return (p: IconSetKey) => p === DEFAULT_SET || canUseTheme(PACK_ITEM[p as Exclude<IconSetKey, 'standard'>], plan)
}
// the set actually in use: an old choice ('default', 'tokyo') or a set the account no longer has
// falls back to Standard
export function useIconPack(): IconSetKey {
  const { pack } = usePrefs()
  const canUse = useCanUsePack()
  return isSet(pack) && canUse(pack) ? pack : DEFAULT_SET
}
