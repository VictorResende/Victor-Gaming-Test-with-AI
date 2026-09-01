import { describe, expect, it } from 'vitest';
import { importLevelFromJSON, type JSONLevelSchema } from './LevelImporter';
import { BiomeType, EnemyType } from '../core/Constants';

describe('LevelImporter', () => {
  it('imports valid JSON schema into LevelData correctly', () => {
    const json: JSONLevelSchema = {
      id: 7,
      nameKey: 'level1_5Name',
      descKey: 'level1_5Desc',
      biome: 'FOREST',
      initialGold: 400,
      initialLives: 20,
      paths: [
        [
          { x: 0, y: 100 },
          { x: 500, y: 100 },
          { x: 500, y: 400 },
          { x: 1000, y: 400 }
        ]
      ],
      buildSlots: [
        { x: 200, y: 50 },
        { x: 300, y: 150 }
      ],
      obstacles: [
        { id: 'obs_1', x: 250, y: 250, type: 'rock', clearCost: 75 }
      ],
      waves: [
        {
          waveNumber: 1,
          groups: [
            { enemyType: 'SCOUT', count: 8, spawnIntervalMs: 1000 }
          ]
        },
        {
          waveNumber: 2,
          groups: [
            { enemyType: 'GOLEM_BOSS', count: 1, spawnIntervalMs: 2000 }
          ]
        }
      ]
    };

    const level = importLevelFromJSON(json);

    expect(level.id).toBe(7);
    expect(level.biome).toBe(BiomeType.FOREST);
    expect(level.initialGold).toBe(400);
    expect(level.paths.length).toBe(1);
    expect(level.buildSlots.length).toBe(2);
    expect(level.obstacles?.length).toBe(1);
    expect(level.obstacles?.[0].clearCost).toBe(75);
    expect(level.waves.length).toBe(2);
    expect(level.waves[1].groups[0].enemyType).toBe(EnemyType.GOLEM_BOSS);
  });

  it('throws error when id or paths are missing', () => {
    expect(() => importLevelFromJSON({} as any)).toThrow();
  });
});
