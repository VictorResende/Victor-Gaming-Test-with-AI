import { TacticalModifier } from '../core/Constants';
import { LevelData, LEVELS_CONFIG } from './levelsConfig';

export interface DailyChallengeData {
  dateStr: string;
  name: string;
  description: string;
  baseLevelId: number;
  levelData: LevelData;
  modifiers: TacticalModifier[];
  rewardStars: number;
  scoreMultiplier: number;
}

export const MODIFIER_INFO: Record<TacticalModifier, { nameKey: string; icon: string; descKey: string; colorHex: string }> = {
  [TacticalModifier.DOUBLE_COST]: {
    nameKey: 'modDoubleCostName',
    icon: '💸',
    descKey: 'modDoubleCostDesc',
    colorHex: '#ef4444'
  },
  [TacticalModifier.FAST_ENEMIES]: {
    nameKey: 'modFastEnemiesName',
    icon: '⚡',
    descKey: 'modFastEnemiesDesc',
    colorHex: '#f59e0b'
  },
  [TacticalModifier.NO_SPELLS]: {
    nameKey: 'modNoSpellsName',
    icon: '🚫',
    descKey: 'modNoSpellsDesc',
    colorHex: '#dc2626'
  },
  [TacticalModifier.ARMORED_HORDE]: {
    nameKey: 'modArmoredHordeName',
    icon: '🛡️',
    descKey: 'modArmoredHordeDesc',
    colorHex: '#64748b'
  },
  [TacticalModifier.GLASS_CANNONS]: {
    nameKey: 'modGlassCannonsName',
    icon: '💥',
    descKey: 'modGlassCannonsDesc',
    colorHex: '#ec4899'
  },
  [TacticalModifier.RICH_START]: {
    nameKey: 'modRichStartName',
    icon: '💰',
    descKey: 'modRichStartDesc',
    colorHex: '#10b981'
  },
  [TacticalModifier.ENERGY_SURGE]: {
    nameKey: 'modEnergySurgeName',
    icon: '🔮',
    descKey: 'modEnergySurgeDesc',
    colorHex: '#a855f7'
  },
  [TacticalModifier.CRYO_VULNERABLE]: {
    nameKey: 'modCryoVulnName',
    icon: '❄️',
    descKey: 'modCryoVulnDesc',
    colorHex: '#06b6d4'
  }
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyChallenge(dateStr?: string): DailyChallengeData {
  const targetDate = dateStr || getTodayDateString();
  let hash = 0;
  for (let i = 0; i < targetDate.length; i++) {
    hash = (hash << 5) - hash + targetDate.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Seleciona mapa base (1, 2 ou 3)
  const levelIdx = positiveHash % LEVELS_CONFIG.length;
  const baseLevel = LEVELS_CONFIG[levelIdx];

  // Seleciona 2 modificadores táticos distintos baseados no hash
  const allModifiers = Object.values(TacticalModifier);
  const mod1Idx = positiveHash % allModifiers.length;
  let mod2Idx = (positiveHash >> 3) % allModifiers.length;
  if (mod2Idx === mod1Idx) {
    mod2Idx = (mod1Idx + 1) % allModifiers.length;
  }

  const selectedModifiers: TacticalModifier[] = [
    allModifiers[mod1Idx],
    allModifiers[mod2Idx]
  ];

  // Clona levelData para aplicar modificadores sem alterar o config base
  const levelDataCopy: LevelData = JSON.parse(JSON.stringify(baseLevel));

  if (selectedModifiers.includes(TacticalModifier.GLASS_CANNONS)) {
    levelDataCopy.initialLives = 1;
  }
  if (selectedModifiers.includes(TacticalModifier.RICH_START)) {
    levelDataCopy.initialGold = 1000;
  }

  return {
    dateStr: targetDate,
    name: `Desafio Diário: ${targetDate}`,
    description: `Operação tática especial com modificadores climáticos e de regras.`,
    baseLevelId: baseLevel.id,
    levelData: levelDataCopy,
    modifiers: selectedModifiers,
    rewardStars: 5,
    scoreMultiplier: 1.5
  };
}
