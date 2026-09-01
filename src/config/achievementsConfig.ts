import type { I18nKey } from '../i18n/locales';
import { t } from '../i18n/locales';

export interface AchievementDef {
  id: string;
  nameKey: I18nKey;
  descKey: I18nKey;
  icon: string;
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  { id: 'first_kill', nameKey: 'achFirstKillName', descKey: 'achFirstKillDesc', icon: '🎯' },
  { id: 'kills_50', nameKey: 'achKills50Name', descKey: 'achKills50Desc', icon: '⚔️' },
  { id: 'kills_200', nameKey: 'achKills200Name', descKey: 'achKills200Desc', icon: '💀' },
  { id: 'boss_slayer', nameKey: 'achBossSlayerName', descKey: 'achBossSlayerDesc', icon: '👑' },
  { id: 'max_tower', nameKey: 'achMaxTowerName', descKey: 'achMaxTowerDesc', icon: '⭐' },
  { id: 'full_towers', nameKey: 'achFullTowersName', descKey: 'achFullTowersDesc', icon: '🏰' },
  { id: 'perfect_defense', nameKey: 'achPerfectName', descKey: 'achPerfectDesc', icon: '🛡️' },
  { id: 'spell_caster', nameKey: 'achSpellCasterName', descKey: 'achSpellCasterDesc', icon: '✨' },
  { id: 'early_caller', nameKey: 'achEarlyCallerName', descKey: 'achEarlyCallerDesc', icon: '⏩' },
  { id: 'gold_hoarder', nameKey: 'achGoldHoarderName', descKey: 'achGoldHoarderDesc', icon: '💰' },
  { id: 'level_1_clear', nameKey: 'achLevel1Name', descKey: 'achLevel1Desc', icon: '🌲' },
  { id: 'level_2_clear', nameKey: 'achLevel2Name', descKey: 'achLevel2Desc', icon: '⚔️' },
  { id: 'level_3_clear', nameKey: 'achLevel3Name', descKey: 'achLevel3Desc', icon: '❄️' },
  { id: 'level_4_clear', nameKey: 'achLevel4Name', descKey: 'achLevel4Desc', icon: '🌋' },
  { id: 'level_5_clear', nameKey: 'achLevel5Name', descKey: 'achLevel5Desc', icon: '🏛️' },
  { id: 'level_6_clear', nameKey: 'achLevel6Name', descKey: 'achLevel6Desc', icon: '🐉' },
  { id: 'daily_master', nameKey: 'achDailyName', descKey: 'achDailyDesc', icon: '📜' },
  { id: 'boss_rush_champion', nameKey: 'achBossRushName', descKey: 'achBossRushDesc', icon: '👑' }
];

export function achievementTitle(def: AchievementDef): string {
  return t(def.nameKey);
}

export function achievementBlurb(def: AchievementDef): string {
  return t(def.descKey);
}
