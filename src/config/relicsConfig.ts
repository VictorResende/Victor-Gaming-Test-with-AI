import { RelicId } from '../core/Constants';
import type { I18nKey } from '../i18n/locales';
import { t } from '../i18n/locales';

export { RelicId as RelicType };

export interface RelicConfig {
  id: RelicId;
  nameKey: I18nKey;
  descKey: I18nKey;
  icon: string;
  costStars: number;
  colorHex: string;
  unlockLevelId?: number;
}

export function relicName(relic: RelicConfig): string {
  return t(relic.nameKey);
}

export function relicDesc(relic: RelicConfig): string {
  return t(relic.descKey);
}

export const RELICS_CONFIG: Record<RelicId, RelicConfig> = {
  [RelicId.KINGS_CROWN]: {
    id: RelicId.KINGS_CROWN,
    nameKey: 'relicKingsCrownName',
    descKey: 'relicKingsCrownDesc',
    icon: '👑',
    costStars: 4,
    colorHex: '#facc15'
  },
  [RelicId.HOLY_GRAIL]: {
    id: RelicId.HOLY_GRAIL,
    nameKey: 'relicHolyGrailName',
    descKey: 'relicHolyGrailDesc',
    icon: '🏆',
    costStars: 2,
    colorHex: '#ec4899',
    unlockLevelId: 1
  },
  [RelicId.ELVEN_BROOCH]: {
    id: RelicId.ELVEN_BROOCH,
    nameKey: 'relicElvenBroochName',
    descKey: 'relicElvenBroochDesc',
    icon: '🧝‍♀️',
    costStars: 3,
    colorHex: '#10b981',
    unlockLevelId: 2
  },
  [RelicId.DRAGONFIRE_FLASK]: {
    id: RelicId.DRAGONFIRE_FLASK,
    nameKey: 'relicDragonfireName',
    descKey: 'relicDragonfireDesc',
    icon: '🧪',
    costStars: 3,
    colorHex: '#ef4444',
    unlockLevelId: 3
  },
  [RelicId.ARCANE_HOURGLASS]: {
    id: RelicId.ARCANE_HOURGLASS,
    nameKey: 'relicHourglassName',
    descKey: 'relicHourglassDesc',
    icon: '⏳',
    costStars: 4,
    colorHex: '#a855f7',
    unlockLevelId: 4
  }
};
