import type { I18nKey } from '../i18n/locales';

export interface TechNode {
  id: string;
  nameKey: I18nKey;
  descKey: I18nKey;
  starCost: number;
  icon: string;
  effect: {
    rangeMultiplier?: number;
    damageMultiplier?: number;
    costMultiplier?: number;
    extraGold?: number;
    extraLives?: number;
    cooldownMultiplier?: number;
  };
}

export const TECH_TREE_NODES: TechNode[] = [
  {
    id: 'starting_gold',
    nameKey: 'techGoldName',
    descKey: 'techGoldDesc',
    starCost: 2,
    icon: '💰',
    effect: { extraGold: 150 }
  },
  {
    id: 'starting_lives',
    nameKey: 'techLivesName',
    descKey: 'techLivesDesc',
    starCost: 2,
    icon: '🛡️',
    effect: { extraLives: 5 }
  },
  {
    id: 'range_all',
    nameKey: 'techRangeName',
    descKey: 'techRangeDesc',
    starCost: 3,
    icon: '🎯',
    effect: { rangeMultiplier: 1.15 }
  },
  {
    id: 'cost_discount',
    nameKey: 'techCostName',
    descKey: 'techCostDesc',
    starCost: 3,
    icon: '⚒️',
    effect: { costMultiplier: 0.9 }
  },
  {
    id: 'damage_all',
    nameKey: 'techDamageName',
    descKey: 'techDamageDesc',
    starCost: 4,
    icon: '⚡',
    effect: { damageMultiplier: 1.2 }
  },
  {
    id: 'spell_cd',
    nameKey: 'techSpellName',
    descKey: 'techSpellDesc',
    starCost: 3,
    icon: '✨',
    effect: { cooldownMultiplier: 0.75 }
  }
];
