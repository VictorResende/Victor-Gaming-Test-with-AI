import { RelicId } from '../core/Constants';

export const CURRENT_SAVE_VERSION = 1;

export interface GameSaveData {
  unlockedLevels: number[];
  levelStars: Record<number, number>;
  highScores: Record<number, number>;
  unlockedTechs: string[];
  totalStarsEarned: number;
  availableStars: number;
  achievements: string[];
  settings: {
    sfxEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    language: 'pt' | 'en' | 'es';
    sfxVolume: number;
    musicVolume: number;
    highContrast: boolean;
    reducedMotion: boolean;
    seenOnboarding: boolean;
  };
  unlockedChips: string[];
  unlockedHeroPerks: string[];
  unlockedRelics: string[];
  equippedRelics: string[];
  dailyChallengeCompletedDate?: string;
  dailyHighScores: Record<string, number>;
  bossRushBestWave: number;
  bossRushHighScore: number;
  endlessBestWave: number;
  endlessHighScore: number;
  endlessMilestonesClaimed: number[];
  lifetimeKills: number;
  saveVersion: number;
}

export const DEFAULT_SAVE: GameSaveData = {
  unlockedLevels: [1],
  levelStars: {},
  highScores: {},
  unlockedTechs: [],
  totalStarsEarned: 0,
  availableStars: 0,
  achievements: [],
  settings: {
    sfxEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    language: 'pt',
    sfxVolume: 1.0,
    musicVolume: 0.8,
    highContrast: false,
    reducedMotion: false,
    seenOnboarding: false
  },
  unlockedChips: ['CRITICAL_STRIKE', 'CHAIN_RICOCHET', 'ARMOR_PIERCE', 'CRYO_BLAST'],
  unlockedHeroPerks: [],
  unlockedRelics: [RelicId.KINGS_CROWN],
  equippedRelics: [RelicId.KINGS_CROWN],
  dailyHighScores: {},
  bossRushBestWave: 0,
  bossRushHighScore: 0,
  endlessBestWave: 0,
  endlessHighScore: 0,
  endlessMilestonesClaimed: [],
  lifetimeKills: 0,
  saveVersion: CURRENT_SAVE_VERSION
};

export function mergeLoadedSave(parsed: Partial<GameSaveData>): GameSaveData {
  return {
    ...DEFAULT_SAVE,
    ...parsed,
    settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
    unlockedHeroPerks: parsed.unlockedHeroPerks || [],
    unlockedRelics: parsed.unlockedRelics || [...DEFAULT_SAVE.unlockedRelics],
    equippedRelics: parsed.equippedRelics || [...DEFAULT_SAVE.equippedRelics],
    endlessBestWave: parsed.endlessBestWave ?? 0,
    endlessHighScore: parsed.endlessHighScore ?? 0,
    endlessMilestonesClaimed: parsed.endlessMilestonesClaimed || [],
    lifetimeKills: parsed.lifetimeKills ?? 0,
    saveVersion: CURRENT_SAVE_VERSION
  };
}
