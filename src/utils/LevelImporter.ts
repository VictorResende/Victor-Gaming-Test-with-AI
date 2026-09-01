import { BiomeType, EnemyType } from '../core/Constants';
import type { LevelData, ObstacleData, Point, TeleporterData, WaveData } from '../config/levelsConfig';
import type { I18nKey } from '../i18n/locales';

export interface JSONWaveGroup {
  enemyType: string;
  count: number;
  spawnIntervalMs?: number;
  pathIndex?: number;
}

export interface JSONWaveData {
  waveNumber: number;
  groups: JSONWaveGroup[];
}

export interface JSONObstacleData {
  id: string;
  x: number;
  y: number;
  type?: 'rock' | 'debris' | 'magma_rock';
  clearCost?: number;
  hp?: number;
  maxHp?: number;
}

export interface JSONTeleporterData {
  from: Point;
  to: Point;
}

export interface JSONLevelSchema {
  id: number;
  nameKey: string;
  descKey: string;
  biome: string;
  initialGold?: number;
  initialLives?: number;
  paths: Point[][];
  buildSlots: Point[];
  obstacles?: JSONObstacleData[];
  teleporters?: JSONTeleporterData[];
  waves: JSONWaveData[];
}

export function importLevelFromJSON(schema: JSONLevelSchema): LevelData {
  if (!schema.id || typeof schema.id !== 'number') {
    throw new Error('Invalid JSONLevelSchema: Missing or invalid "id"');
  }
  if (!schema.paths || !Array.isArray(schema.paths) || schema.paths.length === 0) {
    throw new Error(`Invalid JSONLevelSchema for level ${schema.id}: "paths" array cannot be empty`);
  }
  if (!schema.buildSlots || !Array.isArray(schema.buildSlots)) {
    throw new Error(`Invalid JSONLevelSchema for level ${schema.id}: "buildSlots" must be an array`);
  }

  const biomeKey = (schema.biome || 'FOREST').toUpperCase();
  const biome = (Object.values(BiomeType).includes(biomeKey as BiomeType)
    ? biomeKey
    : BiomeType.FOREST) as BiomeType;

  const obstacles: ObstacleData[] = (schema.obstacles || []).map((obs, idx) => ({
    id: obs.id || `obs_${schema.id}_${idx + 1}`,
    x: obs.x,
    y: obs.y,
    type: obs.type || 'rock',
    clearCost: obs.clearCost ?? 80,
    hp: obs.hp ?? 300,
    maxHp: obs.maxHp ?? (obs.hp ?? 300)
  }));

  const teleporters: TeleporterData[] = (schema.teleporters || []).map(tel => ({
    from: { x: tel.from.x, y: tel.from.y },
    to: { x: tel.to.x, y: tel.to.y }
  }));

  const waves: WaveData[] = (schema.waves || []).map(w => ({
    waveNumber: w.waveNumber,
    groups: (w.groups || []).map(g => {
      const typeKey = (g.enemyType || 'SCOUT').toUpperCase();
      const enemyType = (Object.values(EnemyType).includes(typeKey as EnemyType)
        ? typeKey
        : EnemyType.SCOUT) as EnemyType;

      return {
        enemyType,
        count: Math.max(1, g.count || 1),
        spawnIntervalMs: g.spawnIntervalMs ?? 1200,
        pathIndex: g.pathIndex
      };
    })
  }));

  return {
    id: schema.id,
    nameKey: schema.nameKey as I18nKey,
    descKey: schema.descKey as I18nKey,
    biome,
    initialGold: schema.initialGold ?? 400,
    initialLives: schema.initialLives ?? 20,
    paths: schema.paths,
    buildSlots: schema.buildSlots,
    obstacles: obstacles.length > 0 ? obstacles : undefined,
    teleporters: teleporters.length > 0 ? teleporters : undefined,
    waves
  };
}
