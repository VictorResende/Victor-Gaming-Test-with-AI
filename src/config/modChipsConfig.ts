import { ModChipType } from '../core/Constants';
import type { I18nKey } from '../i18n/locales';

export interface ModChipStats {
  critChance?: number;
  critMultiplier?: number;
  bounceCount?: number;
  bounceRadius?: number;
  bounceDamageMultiplier?: number;
  armorPiercePercent?: number;
  bonusArmoredDamageMultiplier?: number;
  cryoBlastRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
}

export interface ModChipData {
  type: ModChipType;
  id: string;
  nameKey: I18nKey;
  descKey: I18nKey;
  icon: string;
  color: number;
  accentColor: number;
  badgeHex: string;
  textureKey: string;
  stats: ModChipStats;
}

export const MOD_CHIPS_CONFIG: Record<ModChipType, ModChipData> = {
  [ModChipType.CRITICAL_STRIKE]: {
    type: ModChipType.CRITICAL_STRIKE,
    id: 'chip_crit',
    nameKey: 'modChipCrit',
    descKey: 'modChipCritDesc',
    icon: '⚡',
    color: 0xef4444,
    accentColor: 0xfca5a5,
    badgeHex: '#ef4444',
    textureKey: 'chip_crit',
    stats: {
      critChance: 0.25,
      critMultiplier: 2.5
    }
  },
  [ModChipType.CHAIN_RICOCHET]: {
    type: ModChipType.CHAIN_RICOCHET,
    id: 'chip_ricochet',
    nameKey: 'modChipRicochet',
    descKey: 'modChipRicochetDesc',
    icon: '✨',
    color: 0xeab308,
    accentColor: 0xfef08a,
    badgeHex: '#eab308',
    textureKey: 'chip_ricochet',
    stats: {
      bounceCount: 2,
      bounceRadius: 130,
      bounceDamageMultiplier: 0.7
    }
  },
  [ModChipType.ARMOR_PIERCE]: {
    type: ModChipType.ARMOR_PIERCE,
    id: 'chip_pierce',
    nameKey: 'modChipPierce',
    descKey: 'modChipPierceDesc',
    icon: '🗡️',
    color: 0xf97316,
    accentColor: 0xfed7aa,
    badgeHex: '#f97316',
    textureKey: 'chip_pierce',
    stats: {
      armorPiercePercent: 1.0,
      bonusArmoredDamageMultiplier: 1.25
    }
  },
  [ModChipType.CRYO_BLAST]: {
    type: ModChipType.CRYO_BLAST,
    id: 'chip_cryo',
    nameKey: 'modChipCryo',
    descKey: 'modChipCryoDesc',
    icon: '❄️',
    color: 0x06b6d4,
    accentColor: 0xa5f3fc,
    badgeHex: '#06b6d4',
    textureKey: 'chip_cryo',
    stats: {
      cryoBlastRadius: 90,
      slowFactor: 0.6,
      slowDuration: 3000
    }
  }
};
