import { BiomeType, EnemyType } from '../core/Constants';
import type { I18nKey } from '../i18n/locales';
import { t } from '../i18n/locales';

export interface WaveEnemyGroup {
  enemyType: EnemyType;
  count: number;
  spawnIntervalMs: number;
  pathIndex?: number; // Para mapas multi-lane
}

export interface WaveData {
  waveNumber: number;
  groups: WaveEnemyGroup[];
}

export interface Point {
  x: number;
  y: number;
}

export interface ObstacleData {
  id: string;
  x: number;
  y: number;
  type: 'rock' | 'debris' | 'magma_rock';
  clearCost: number; // Custo em ouro para desobstruir
  hp: number; // Vida para ser destruída por feitiços (ex: Meteoro)
  maxHp: number;
}

export interface TeleporterData {
  from: Point;
  to: Point;
}

export interface LevelData {
  id: number;
  nameKey: I18nKey;
  biome: BiomeType;
  descKey: I18nKey;
  initialGold: number;
  initialLives: number;
  paths: Point[][];
  buildSlots: Point[];
  obstacles?: ObstacleData[];
  teleporters?: TeleporterData[];
  waves: WaveData[];
}

export function levelTitle(level: Pick<LevelData, 'nameKey'>): string {
  return t(level.nameKey);
}

export function levelBlurb(level: Pick<LevelData, 'descKey'>): string {
  return t(level.descKey);
}

export const LEVELS_CONFIG: LevelData[] = [
  {
    id: 1,
    nameKey: 'level1Name',
    biome: BiomeType.FOREST,
    descKey: 'level1Desc',
    initialGold: 350,
    initialLives: 20,
    paths: [
      [
        { x: -30, y: 180 },
        { x: 260, y: 180 },
        { x: 260, y: 480 },
        { x: 620, y: 480 },
        { x: 620, y: 220 },
        { x: 980, y: 220 },
        { x: 980, y: 520 },
        { x: 1320, y: 520 }
      ]
    ],
    buildSlots: [
      { x: 140, y: 100 }, { x: 140, y: 260 }, { x: 380, y: 180 }, { x: 380, y: 400 },
      { x: 500, y: 400 }, { x: 500, y: 560 }, { x: 740, y: 140 }, { x: 860, y: 300 },
      { x: 860, y: 440 }, { x: 1100, y: 220 }
    ],
    obstacles: [
      { id: 'obs_1_1', x: 740, y: 300, type: 'rock', clearCost: 75, hp: 300, maxHp: 300 },
      { id: 'obs_1_2', x: 1100, y: 440, type: 'rock', clearCost: 90, hp: 300, maxHp: 300 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [{ enemyType: EnemyType.SCOUT, count: 6, spawnIntervalMs: 1400 }]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 8, spawnIntervalMs: 1200 },
          { enemyType: EnemyType.SOLDIER, count: 3, spawnIntervalMs: 1800 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 8, spawnIntervalMs: 1400 },
          { enemyType: EnemyType.FLYER, count: 4, spawnIntervalMs: 1600 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 12, spawnIntervalMs: 900 },
          { enemyType: EnemyType.TANK, count: 2, spawnIntervalMs: 2800 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 10, spawnIntervalMs: 1100 },
          { enemyType: EnemyType.FLYER, count: 8, spawnIntervalMs: 1300 },
          { enemyType: EnemyType.TANK, count: 4, spawnIntervalMs: 2500 }
        ]
      },
      {
        waveNumber: 6,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 20, spawnIntervalMs: 600 },
          { enemyType: EnemyType.TANK, count: 5, spawnIntervalMs: 2000 }
        ]
      },
      {
        waveNumber: 7,
        groups: [
          { enemyType: EnemyType.FLYER, count: 15, spawnIntervalMs: 900 },
          { enemyType: EnemyType.SOLDIER, count: 15, spawnIntervalMs: 900 }
        ]
      },
      {
        waveNumber: 8,
        groups: [
          { enemyType: EnemyType.TANK, count: 8, spawnIntervalMs: 1800 },
          { enemyType: EnemyType.SCOUT, count: 15, spawnIntervalMs: 700 }
        ]
      },
      {
        waveNumber: 9,
        groups: [
          { enemyType: EnemyType.FLYER, count: 12, spawnIntervalMs: 800 },
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1600 },
          { enemyType: EnemyType.SOLDIER, count: 16, spawnIntervalMs: 800 }
        ]
      },
      {
        waveNumber: 10,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 15, spawnIntervalMs: 600 },
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1500 },
          { enemyType: EnemyType.BOSS, count: 1, spawnIntervalMs: 1000 }
        ]
      }
    ]
  },
  {
    id: 7,
    nameKey: 'level1_5Name',
    biome: BiomeType.FOREST,
    descKey: 'level1_5Desc',
    initialGold: 400,
    initialLives: 20,
    paths: [
      [
        { x: -30, y: 220 },
        { x: 320, y: 220 },
        { x: 320, y: 520 },
        { x: 720, y: 520 },
        { x: 720, y: 280 },
        { x: 1120, y: 280 },
        { x: 1320, y: 480 }
      ]
    ],
    buildSlots: [
      { x: 180, y: 140 }, { x: 180, y: 300 }, { x: 440, y: 370 }, { x: 440, y: 590 },
      { x: 600, y: 440 }, { x: 840, y: 200 }, { x: 840, y: 360 }, { x: 1000, y: 360 },
      { x: 1180, y: 380 }
    ],
    obstacles: [
      { id: 'obs_1_5_1', x: 600, y: 280, type: 'rock', clearCost: 80, hp: 300, maxHp: 300 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [{ enemyType: EnemyType.SCOUT, count: 8, spawnIntervalMs: 1300 }]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 6, spawnIntervalMs: 1200 },
          { enemyType: EnemyType.SOLDIER, count: 4, spawnIntervalMs: 1600 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 8, spawnIntervalMs: 1300 },
          { enemyType: EnemyType.FLYER, count: 4, spawnIntervalMs: 1500 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 10, spawnIntervalMs: 900 },
          { enemyType: EnemyType.TANK, count: 3, spawnIntervalMs: 2500 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.FLYER, count: 8, spawnIntervalMs: 1000 },
          { enemyType: EnemyType.SOLDIER, count: 6, spawnIntervalMs: 1200 },
          { enemyType: EnemyType.SHAMAN, count: 1, spawnIntervalMs: 2000 }
        ]
      },
      {
        waveNumber: 6,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 12, spawnIntervalMs: 700 },
          { enemyType: EnemyType.TANK, count: 4, spawnIntervalMs: 2000 },
          { enemyType: EnemyType.FLYER, count: 8, spawnIntervalMs: 900 }
        ]
      },
      {
        waveNumber: 7,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 8, spawnIntervalMs: 1000 },
          { enemyType: EnemyType.TANK, count: 4, spawnIntervalMs: 1800 },
          { enemyType: EnemyType.GOLEM_BOSS, count: 1, spawnIntervalMs: 1000 }
        ]
      }
    ]
  },
  {
    id: 2,
    nameKey: 'level2Name',
    biome: BiomeType.RAVINE,
    descKey: 'level2Desc',
    initialGold: 450,
    initialLives: 20,
    paths: [
      // Rota Norte
      [
        { x: -30, y: 150 },
        { x: 340, y: 150 },
        { x: 480, y: 360 },
        { x: 800, y: 360 },
        { x: 960, y: 200 },
        { x: 1320, y: 200 }
      ],
      // Rota Sul
      [
        { x: -30, y: 570 },
        { x: 340, y: 570 },
        { x: 480, y: 360 },
        { x: 800, y: 360 },
        { x: 960, y: 520 },
        { x: 1320, y: 520 }
      ]
    ],
    buildSlots: [
      { x: 160, y: 260 }, { x: 160, y: 460 }, { x: 340, y: 270 }, { x: 340, y: 450 },
      { x: 480, y: 220 }, { x: 480, y: 500 }, { x: 640, y: 240 }, { x: 640, y: 480 },
      { x: 800, y: 220 }, { x: 800, y: 500 }
    ],
    obstacles: [
      { id: 'obs_2_1', x: 1080, y: 360, type: 'rock', clearCost: 80, hp: 350, maxHp: 350 },
      { id: 'obs_2_2', x: 1140, y: 200, type: 'rock', clearCost: 80, hp: 350, maxHp: 350 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 6, spawnIntervalMs: 1200, pathIndex: 0 },
          { enemyType: EnemyType.SCOUT, count: 6, spawnIntervalMs: 1200, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 6, spawnIntervalMs: 1400, pathIndex: 0 },
          { enemyType: EnemyType.SOLDIER, count: 6, spawnIntervalMs: 1400, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.FLYER, count: 8, spawnIntervalMs: 1100, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 2, spawnIntervalMs: 2500, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 12, spawnIntervalMs: 800, pathIndex: 0 },
          { enemyType: EnemyType.SOLDIER, count: 10, spawnIntervalMs: 1000, pathIndex: 1 },
          { enemyType: EnemyType.SHAMAN, count: 2, spawnIntervalMs: 2500, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 4, spawnIntervalMs: 2200, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.TANK, count: 5, spawnIntervalMs: 1800, pathIndex: 0 },
          { enemyType: EnemyType.SHAMAN, count: 2, spawnIntervalMs: 2200, pathIndex: 1 },
          { enemyType: EnemyType.FLYER, count: 12, spawnIntervalMs: 900, pathIndex: 1 },
          { enemyType: EnemyType.BOSS, count: 1, spawnIntervalMs: 1000, pathIndex: 0 }
        ]
      }
    ]
  },
  {
    id: 3,
    nameKey: 'level3Name',
    biome: BiomeType.CITADEL,
    descKey: 'level3Desc',
    initialGold: 550,
    initialLives: 20,
    paths: [
      // Entrada Oeste
      [
        { x: -30, y: 360 },
        { x: 380, y: 360 },
        { x: 540, y: 200 },
        { x: 860, y: 200 },
        { x: 1020, y: 360 },
        { x: 1320, y: 360 }
      ],
      // Entrada Sul
      [
        { x: 640, y: 740 },
        { x: 640, y: 520 },
        { x: 860, y: 520 },
        { x: 1020, y: 360 },
        { x: 1320, y: 360 }
      ]
    ],
    buildSlots: [
      { x: 160, y: 240 }, { x: 160, y: 480 }, { x: 380, y: 220 }, { x: 380, y: 500 },
      { x: 540, y: 360 }, { x: 700, y: 360 }, { x: 860, y: 360 }, { x: 1020, y: 200 },
      { x: 1020, y: 520 }, { x: 1180, y: 220 }
    ],
    obstacles: [
      { id: 'obs_3_1', x: 700, y: 200, type: 'rock', clearCost: 90, hp: 400, maxHp: 400 },
      { id: 'obs_3_2', x: 700, y: 520, type: 'rock', clearCost: 90, hp: 400, maxHp: 400 },
      { id: 'obs_3_3', x: 1180, y: 500, type: 'rock', clearCost: 110, hp: 400, maxHp: 400 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 10, spawnIntervalMs: 900, pathIndex: 0 },
          { enemyType: EnemyType.SOLDIER, count: 6, spawnIntervalMs: 1400, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 12, spawnIntervalMs: 1000, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 4, spawnIntervalMs: 2000, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.FLYER, count: 15, spawnIntervalMs: 800, pathIndex: 1 },
          { enemyType: EnemyType.TANK, count: 8, spawnIntervalMs: 1500, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 25, spawnIntervalMs: 500, pathIndex: 0 },
          { enemyType: EnemyType.SHAMAN, count: 3, spawnIntervalMs: 2200, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 10, spawnIntervalMs: 1400, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.FLYER, count: 20, spawnIntervalMs: 600, pathIndex: 1 },
          { enemyType: EnemyType.SHAMAN, count: 3, spawnIntervalMs: 2000, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 8, spawnIntervalMs: 1200, pathIndex: 0 },
          { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 3000, pathIndex: 0 }
        ]
      }
    ]
  },
  {
    id: 4,
    nameKey: 'level4Name',
    biome: BiomeType.MAGMA,
    descKey: 'level4Desc',
    initialGold: 575,
    initialLives: 20,
    paths: [
      [
        { x: -30, y: 240 },
        { x: 300, y: 240 },
        { x: 300, y: 520 },
        { x: 720, y: 520 },
        { x: 720, y: 200 },
        { x: 1040, y: 200 },
        { x: 1040, y: 460 },
        { x: 1320, y: 460 }
      ]
    ],
    buildSlots: [
      { x: 160, y: 140 }, { x: 160, y: 340 }, { x: 440, y: 200 }, { x: 440, y: 420 },
      { x: 580, y: 420 }, { x: 580, y: 590 }, { x: 860, y: 130 }, { x: 860, y: 320 }
    ],
    obstacles: [
      { id: 'obs_4_1', x: 440, y: 520, type: 'magma_rock', clearCost: 85, hp: 450, maxHp: 450 },
      { id: 'obs_4_2', x: 1040, y: 340, type: 'magma_rock', clearCost: 95, hp: 450, maxHp: 450 },
      { id: 'obs_4_3', x: 1180, y: 200, type: 'magma_rock', clearCost: 110, hp: 450, maxHp: 450 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 10, spawnIntervalMs: 900 },
          { enemyType: EnemyType.SOLDIER, count: 4, spawnIntervalMs: 1400 }
        ]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 8, spawnIntervalMs: 1100 },
          { enemyType: EnemyType.CARRIER, count: 1, spawnIntervalMs: 2000 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.FLYER, count: 12, spawnIntervalMs: 800 },
          { enemyType: EnemyType.CARRIER, count: 2, spawnIntervalMs: 3000 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1600 },
          { enemyType: EnemyType.CARRIER, count: 3, spawnIntervalMs: 2500 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 16, spawnIntervalMs: 700 },
          { enemyType: EnemyType.CARRIER, count: 4, spawnIntervalMs: 2000 },
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1800 }
        ]
      },
      {
        waveNumber: 6,
        groups: [
          { enemyType: EnemyType.CARRIER, count: 4, spawnIntervalMs: 2200 },
          { enemyType: EnemyType.TANK, count: 8, spawnIntervalMs: 1500 },
          { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 4000 }
        ]
      }
    ]
  },
  {
    id: 5,
    nameKey: 'level5Name',
    biome: BiomeType.RUINS,
    descKey: 'level5Desc',
    initialGold: 625,
    initialLives: 20,
    paths: [
      // Rota Principal com Portal de Teletransporte
      [
        { x: -30, y: 220 },
        { x: 440, y: 220 },
        { x: 840, y: 480 },
        { x: 1120, y: 480 },
        { x: 1320, y: 480 }
      ],
      // Rota Alternativa de Superfície
      [
        { x: -30, y: 540 },
        { x: 440, y: 540 },
        { x: 640, y: 320 },
        { x: 1120, y: 320 },
        { x: 1320, y: 320 }
      ]
    ],
    teleporters: [
      { from: { x: 440, y: 220 }, to: { x: 840, y: 480 } }
    ],
    buildSlots: [
      { x: 180, y: 120 }, { x: 180, y: 340 }, { x: 320, y: 380 }, { x: 540, y: 160 },
      { x: 540, y: 440 }, { x: 740, y: 220 }, { x: 960, y: 380 }, { x: 960, y: 580 }
    ],
    obstacles: [
      { id: 'obs_5_1', x: 320, y: 120, type: 'rock', clearCost: 90, hp: 500, maxHp: 500 },
      { id: 'obs_5_2', x: 740, y: 380, type: 'rock', clearCost: 100, hp: 500, maxHp: 500 },
      { id: 'obs_5_3', x: 1120, y: 180, type: 'rock', clearCost: 120, hp: 500, maxHp: 500 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [
          { enemyType: EnemyType.SCOUT, count: 12, spawnIntervalMs: 900, pathIndex: 0 },
          { enemyType: EnemyType.SHIELDER, count: 2, spawnIntervalMs: 2500, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.SOLDIER, count: 10, spawnIntervalMs: 1000, pathIndex: 1 },
          { enemyType: EnemyType.SHIELDER, count: 3, spawnIntervalMs: 2200, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.SHIELDER, count: 4, spawnIntervalMs: 1800, pathIndex: 0 },
          { enemyType: EnemyType.CARRIER, count: 2, spawnIntervalMs: 3000, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1600, pathIndex: 0 },
          { enemyType: EnemyType.SHIELDER, count: 5, spawnIntervalMs: 1600, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.FLYER, count: 18, spawnIntervalMs: 700, pathIndex: 1 },
          { enemyType: EnemyType.SHIELDER, count: 6, spawnIntervalMs: 1400, pathIndex: 0 },
          { enemyType: EnemyType.CARRIER, count: 3, spawnIntervalMs: 2400, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 6,
        groups: [
          { enemyType: EnemyType.SHIELDER, count: 6, spawnIntervalMs: 1400, pathIndex: 0 },
          { enemyType: EnemyType.CARRIER, count: 4, spawnIntervalMs: 2000, pathIndex: 1 },
          { enemyType: EnemyType.BOSS, count: 2, spawnIntervalMs: 3500, pathIndex: 0 }
        ]
      }
    ]
  },
  {
    id: 6,
    nameKey: 'level6Name',
    biome: BiomeType.PINNACLE,
    descKey: 'level6Desc',
    initialGold: 700,
    initialLives: 20,
    paths: [
      // Doca Hangar Alfa (Norte)
      [
        { x: -30, y: 160 },
        { x: 380, y: 160 },
        { x: 380, y: 360 },
        { x: 880, y: 360 },
        { x: 880, y: 180 },
        { x: 1320, y: 180 }
      ],
      // Doca Hangar Beta (Sul)
      [
        { x: -30, y: 560 },
        { x: 380, y: 560 },
        { x: 380, y: 360 },
        { x: 880, y: 360 },
        { x: 880, y: 540 },
        { x: 1320, y: 540 }
      ]
    ],
    buildSlots: [
      { x: 200, y: 260 }, { x: 200, y: 460 }, { x: 380, y: 240 }, { x: 380, y: 480 },
      { x: 560, y: 240 }, { x: 560, y: 480 }, { x: 740, y: 240 }, { x: 740, y: 480 }
    ],
    obstacles: [
      { id: 'obs_6_1', x: 640, y: 360, type: 'debris', clearCost: 100, hp: 550, maxHp: 550 },
      { id: 'obs_6_2', x: 1040, y: 260, type: 'debris', clearCost: 115, hp: 550, maxHp: 550 },
      { id: 'obs_6_3', x: 1040, y: 460, type: 'debris', clearCost: 115, hp: 550, maxHp: 550 }
    ],
    waves: [
      {
        waveNumber: 1,
        groups: [
          { enemyType: EnemyType.STEALTH, count: 8, spawnIntervalMs: 1100, pathIndex: 0 },
          { enemyType: EnemyType.SCOUT, count: 10, spawnIntervalMs: 800, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 2,
        groups: [
          { enemyType: EnemyType.STEALTH, count: 12, spawnIntervalMs: 900, pathIndex: 0 },
          { enemyType: EnemyType.SHIELDER, count: 3, spawnIntervalMs: 2000, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 3,
        groups: [
          { enemyType: EnemyType.CARRIER, count: 3, spawnIntervalMs: 2800, pathIndex: 0 },
          { enemyType: EnemyType.STEALTH, count: 12, spawnIntervalMs: 800, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 4,
        groups: [
          { enemyType: EnemyType.SHIELDER, count: 5, spawnIntervalMs: 1600, pathIndex: 0 },
          { enemyType: EnemyType.STEALTH, count: 16, spawnIntervalMs: 700, pathIndex: 1 },
          { enemyType: EnemyType.TANK, count: 6, spawnIntervalMs: 1800, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 5,
        groups: [
          { enemyType: EnemyType.CARRIER, count: 4, spawnIntervalMs: 2200, pathIndex: 1 },
          { enemyType: EnemyType.SHIELDER, count: 6, spawnIntervalMs: 1400, pathIndex: 0 },
          { enemyType: EnemyType.STEALTH, count: 18, spawnIntervalMs: 600, pathIndex: 1 }
        ]
      },
      {
        waveNumber: 6,
        groups: [
          { enemyType: EnemyType.STEALTH, count: 20, spawnIntervalMs: 500, pathIndex: 0 },
          { enemyType: EnemyType.TANK, count: 10, spawnIntervalMs: 1200, pathIndex: 1 },
          { enemyType: EnemyType.CARRIER, count: 5, spawnIntervalMs: 1800, pathIndex: 0 }
        ]
      },
      {
        waveNumber: 7,
        groups: [
          { enemyType: EnemyType.STEALTH, count: 22, spawnIntervalMs: 500, pathIndex: 0 },
          { enemyType: EnemyType.SHIELDER, count: 8, spawnIntervalMs: 1200, pathIndex: 1 },
          { enemyType: EnemyType.CARRIER, count: 6, spawnIntervalMs: 1600, pathIndex: 0 },
          { enemyType: EnemyType.BOSS, count: 3, spawnIntervalMs: 3500, pathIndex: 1 }
        ]
      }
    ]
  }
];
