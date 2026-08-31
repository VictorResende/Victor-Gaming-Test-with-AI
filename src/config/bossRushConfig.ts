import { BiomeType, EnemyType } from '../core/Constants';
import { LevelData, WaveData } from './levelsConfig';

export const BOSS_RUSH_LEVEL: LevelData = {
  id: 99,
  name: 'Arena dos Titãs (Boss Rush)',
  biome: BiomeType.CYBER,
  description: 'Enfrente ondas implacáveis de Chefes Colossais e suas escoltas de elite.',
  initialGold: 1200,
  initialLives: 20,
  paths: [
    // Rota Superior
    [
      { x: -30, y: 220 },
      { x: 360, y: 220 },
      { x: 520, y: 360 },
      { x: 800, y: 360 },
      { x: 960, y: 220 },
      { x: 1320, y: 220 }
    ],
    // Rota Inferior
    [
      { x: -30, y: 500 },
      { x: 360, y: 500 },
      { x: 520, y: 360 },
      { x: 800, y: 360 },
      { x: 960, y: 500 },
      { x: 1320, y: 500 }
    ]
  ],
  buildSlots: [
    { x: 160, y: 140 }, { x: 160, y: 360 }, { x: 160, y: 580 },
    { x: 360, y: 140 }, { x: 360, y: 360 }, { x: 360, y: 580 },
    { x: 520, y: 220 }, { x: 520, y: 500 },
    { x: 680, y: 220 }, { x: 680, y: 500 },
    { x: 840, y: 220 }, { x: 840, y: 500 },
    { x: 1040, y: 140 }, { x: 1040, y: 360 }, { x: 1040, y: 580 }
  ],
  waves: [
    {
      waveNumber: 1,
      groups: [
        { enemyType: EnemyType.BOSS, count: 1, spawnIntervalMs: 2000, pathIndex: 0 },
        { enemyType: EnemyType.TANK, count: 3, spawnIntervalMs: 1500, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 2,
      groups: [
        { enemyType: EnemyType.CARRIER, count: 2, spawnIntervalMs: 3000, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 1, spawnIntervalMs: 2500, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 3,
      groups: [
        { enemyType: EnemyType.SHIELDER, count: 3, spawnIntervalMs: 2000, pathIndex: 0 },
        { enemyType: EnemyType.SHAMAN, count: 2, spawnIntervalMs: 2200, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 3000, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 4,
      groups: [
        { enemyType: EnemyType.STEALTH, count: 6, spawnIntervalMs: 1000, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 2500, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 1, spawnIntervalMs: 2500, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 5,
      groups: [
        { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 2500, pathIndex: 0 },
        { enemyType: EnemyType.SHAMAN, count: 3, spawnIntervalMs: 2000, pathIndex: 1 },
        { enemyType: EnemyType.CARRIER, count: 2, spawnIntervalMs: 2500, pathIndex: 1 },
        { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 2500, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 6,
      groups: [
        { enemyType: EnemyType.BOSS, count: 3, spawnIntervalMs: 2000, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 3, spawnIntervalMs: 2000, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 7,
      groups: [
        { enemyType: EnemyType.SHIELDER, count: 4, spawnIntervalMs: 1500, pathIndex: 0 },
        { enemyType: EnemyType.SHAMAN, count: 3, spawnIntervalMs: 1800, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 4, spawnIntervalMs: 2200, pathIndex: 0 },
        { enemyType: EnemyType.CARRIER, count: 3, spawnIntervalMs: 2200, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 8,
      groups: [
        { enemyType: EnemyType.BOSS, count: 4, spawnIntervalMs: 1800, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 4, spawnIntervalMs: 1800, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 9,
      groups: [
        { enemyType: EnemyType.BOSS, count: 5, spawnIntervalMs: 1800, pathIndex: 0 },
        { enemyType: EnemyType.CARRIER, count: 4, spawnIntervalMs: 2000, pathIndex: 1 },
        { enemyType: EnemyType.SHIELDER, count: 4, spawnIntervalMs: 1800, pathIndex: 1 }
      ]
    },
    {
      waveNumber: 10,
      groups: [
        { enemyType: EnemyType.BOSS, count: 6, spawnIntervalMs: 1500, pathIndex: 0 },
        { enemyType: EnemyType.BOSS, count: 6, spawnIntervalMs: 1500, pathIndex: 1 }
      ]
    }
  ]
};

export function getBossRushLevelData(): LevelData {
  return JSON.parse(JSON.stringify(BOSS_RUSH_LEVEL));
}

export function generateBossRushEndlessWave(waveNum: number): WaveData {
  const bossCount = 3 + Math.floor(waveNum * 0.8);
  const carrierCount = 2 + Math.floor(waveNum * 0.5);
  const shielderCount = 2 + Math.floor(waveNum * 0.4);

  return {
    waveNumber: waveNum,
    groups: [
      { enemyType: EnemyType.BOSS, count: bossCount, spawnIntervalMs: Math.max(800, 2000 - waveNum * 50), pathIndex: 0 },
      { enemyType: EnemyType.CARRIER, count: carrierCount, spawnIntervalMs: 2200, pathIndex: 1 },
      { enemyType: EnemyType.SHIELDER, count: shielderCount, spawnIntervalMs: 1800, pathIndex: 0 }
    ]
  };
}
