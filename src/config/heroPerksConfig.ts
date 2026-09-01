import type { I18nKey } from '../i18n/locales';

export interface HeroPerkNode {
  id: string;
  nameKey: I18nKey;
  descKey: I18nKey;
  starCost: number;
  icon: string;
  effect: {
    damageMultiplier?: number;
    hpMultiplier?: number;
    cooldownMultiplier?: number;
    moveSpeedMultiplier?: number;
    respawnReductionMs?: number;
    xpMultiplier?: number;
  };
}

export const HERO_PERK_NODES: HeroPerkNode[] = [
  {
    id: 'hero_damage_boost',
    nameKey: 'perkDamageName',
    descKey: 'perkDamageDesc',
    starCost: 3,
    icon: '⚔️',
    effect: { damageMultiplier: 1.15 }
  },
  {
    id: 'hero_hp_boost',
    nameKey: 'perkHpName',
    descKey: 'perkHpDesc',
    starCost: 3,
    icon: '❤️',
    effect: { hpMultiplier: 1.20 }
  },
  {
    id: 'hero_cooldown_reduct',
    nameKey: 'perkCooldownName',
    descKey: 'perkCooldownDesc',
    starCost: 4,
    icon: '⚡',
    effect: { cooldownMultiplier: 0.80 }
  },
  {
    id: 'hero_move_speed',
    nameKey: 'perkMoveName',
    descKey: 'perkMoveDesc',
    starCost: 2,
    icon: '👢',
    effect: { moveSpeedMultiplier: 1.15 }
  },
  {
    id: 'hero_revive_speed',
    nameKey: 'perkReviveName',
    descKey: 'perkReviveDesc',
    starCost: 3,
    icon: '✨',
    effect: { respawnReductionMs: 5000 }
  },
  {
    id: 'hero_xp_boost',
    nameKey: 'perkXpName',
    descKey: 'perkXpDesc',
    starCost: 2,
    icon: '📖',
    effect: { xpMultiplier: 1.25 }
  }
];
