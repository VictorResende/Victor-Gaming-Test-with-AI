import { WaveData, WaveEnemyGroup, Point } from '../config/levelsConfig';
import { Enemy, EliteAffix } from '../entities/Enemy';
import { EventBus, GameEvents } from '../core/EventBus';
import { EnemyType, GAME_CONSTANTS, TacticalModifier } from '../core/Constants';
import { EconomyManager } from './EconomyManager';
import { SaveManager } from './SaveManager';
import { generateBossRushEndlessWave } from '../config/bossRushConfig';

export class WaveManager {
  private waves: WaveData[];
  private paths: Point[][];
  private currentWaveIndex = -1;
  private isWaveInProgress = false;
  private isEndless = false;
  private isBossRush = false;
  private modifiers: TacticalModifier[] = [];

  private spawnQueue: { enemyType: EnemyType; pathIndex: number; delayMs: number }[] = [];
  private timeUntilNextSpawn = 0;
  private economyManager: EconomyManager;

  constructor(
    waves: WaveData[],
    paths: Point[][],
    economyManager: EconomyManager,
    isEndless = false,
    isBossRush = false,
    modifiers: TacticalModifier[] = []
  ) {
    this.waves = waves;
    this.paths = paths;
    this.economyManager = economyManager;
    this.isEndless = isEndless;
    this.isBossRush = isBossRush;
    this.modifiers = modifiers;
  }

  public getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  public getTotalWaves(): number {
    return (this.isEndless || (this.isBossRush && this.isEndless)) ? 999 : this.waves.length;
  }

  public isRunning(): boolean {
    return this.isWaveInProgress;
  }

  public startNextWave(isEarlyCall = false): boolean {
    const nextIndex = this.currentWaveIndex + 1;
    if (!this.isEndless && nextIndex >= this.waves.length) {
      return false;
    }

    const callingEarly = this.isWaveInProgress || isEarlyCall;
    this.currentWaveIndex = nextIndex;

    if (callingEarly) {
      this.economyManager.addGold(GAME_CONSTANTS.EARLY_WAVE_GOLD_BONUS);
    }

    this.isWaveInProgress = true;
    this.appendSpawnQueue();

    EventBus.emit(GameEvents.WAVE_STARTED, {
      waveNumber: this.getCurrentWaveNumber(),
      totalWaves: this.getTotalWaves(),
      isEarlyCall: callingEarly
    });

    return true;
  }

  private appendSpawnQueue(): void {
    let currentWave: WaveData;

    if (this.isBossRush && this.currentWaveIndex >= this.waves.length) {
      currentWave = generateBossRushEndlessWave(this.currentWaveIndex + 1);
    } else if (this.isEndless && this.currentWaveIndex >= this.waves.length) {
      currentWave = this.generateEndlessWave(this.currentWaveIndex + 1);
    } else {
      currentWave = this.waves[this.currentWaveIndex];
    }

    const countMultiplier = this.modifiers.includes(TacticalModifier.RICH_START) ? 1.4 : 1.0;

    currentWave.groups.forEach(group => {
      const finalCount = Math.round(group.count * countMultiplier);
      for (let i = 0; i < finalCount; i++) {
        this.spawnQueue.push({
          enemyType: group.enemyType,
          pathIndex: group.pathIndex || 0,
          delayMs: group.spawnIntervalMs
        });
      }
    });

    this.timeUntilNextSpawn = 500;
  }

  private generateEndlessWave(waveNum: number): WaveData {
    const groups: WaveEnemyGroup[] = [
      { enemyType: EnemyType.SCOUT, count: 10 + waveNum * 2, spawnIntervalMs: Math.max(300, 1000 - waveNum * 30) },
      { enemyType: EnemyType.SOLDIER, count: 6 + waveNum * 2, spawnIntervalMs: 1000 },
      { enemyType: EnemyType.TANK, count: Math.floor(waveNum / 2), spawnIntervalMs: 2000 }
    ];

    if (waveNum % 3 === 0) {
      groups.push({ enemyType: EnemyType.FLYER, count: 8 + waveNum, spawnIntervalMs: 800 });
      groups.push({ enemyType: EnemyType.SHAMAN, count: Math.max(1, Math.floor(waveNum / 3)), spawnIntervalMs: 2200 });
    }

    if (waveNum % 4 === 0) {
      groups.push({ enemyType: EnemyType.CARRIER, count: Math.floor(waveNum / 4), spawnIntervalMs: 2800 });
    }

    if (waveNum % 5 === 0) {
      groups.push({ enemyType: EnemyType.BOSS, count: Math.floor(waveNum / 5), spawnIntervalMs: 3000 });
    }

    return { waveNumber: waveNum, groups };
  }

  public updateWave(
    deltaMs: number,
    speedMultiplier: number,
    scene: Phaser.Scene,
    enemiesList: Enemy[]
  ): void {
    if (!this.isWaveInProgress) return;

    const effectiveDelta = deltaMs * speedMultiplier;

    if (this.spawnQueue.length > 0) {
      this.timeUntilNextSpawn -= effectiveDelta;
      if (this.timeUntilNextSpawn <= 0) {
        const item = this.spawnQueue.shift()!;
        const selectedPath = this.paths[item.pathIndex % this.paths.length] || this.paths[0];

        const enemy = new Enemy(scene, item.enemyType, selectedPath);

        // Aplica modificadores táticos nos inimigos
        if (this.modifiers.includes(TacticalModifier.FAST_ENEMIES)) {
          enemy.config = { ...enemy.config, speed: enemy.config.speed * 1.4 };
        }
        if (this.modifiers.includes(TacticalModifier.ARMORED_HORDE)) {
          enemy.config = { ...enemy.config, armor: Math.min(0.85, (enemy.config.armor || 0) + 0.30) };
        }
        if (this.modifiers.includes(TacticalModifier.CRYO_VULNERABLE)) {
          enemy.config = {
            ...enemy.config,
            resistances: {
              ...enemy.config.resistances,
              FROST: (enemy.config.resistances?.FROST || 1.0) * 2.0
            }
          };
        }

        enemiesList.push(enemy);
        EventBus.emit(GameEvents.ENEMY_SPAWNED, enemy);
        if (enemy.config.isBoss || enemy.enemyType === EnemyType.BOSS) {
          EventBus.emit(GameEvents.BOSS_SPAWNED, enemy);
        }

        // ⭐ Elite Affixes em Modo Sem Fim — 1 em cada 5 inimigos normais ganha afixo
        if (this.isEndless && !enemy.config.isBoss && enemy.enemyType !== EnemyType.BOSS
            && enemy.enemyType !== EnemyType.MINI_DRONE) {
          const roll = Math.random();
          if (roll < 0.20) {
            const waveNum = this.getCurrentWaveNumber();
            // Afixos disponíveis aumentam com ondas avançadas
            const affixes: EliteAffix[] = waveNum >= 15
              ? ['FAST', 'REGENERATING', 'ARMORED']
              : waveNum >= 8
                ? ['FAST', 'REGENERATING']
                : ['FAST'];
            const chosen = affixes[Math.floor(Math.random() * affixes.length)];
            enemy.applyEliteAffix(chosen);
          }
        }

        this.timeUntilNextSpawn = item.delayMs;
      }
    } else {
      const activeEnemies = enemiesList.filter(e => e.isAlive);
      if (activeEnemies.length === 0) {
        this.isWaveInProgress = false;
        const waveNumber = this.getCurrentWaveNumber();

        EventBus.emit(GameEvents.WAVE_COMPLETED, {
          waveNumber,
          totalWaves: this.getTotalWaves()
        });

        // 🏆 Marcos do Modo Sem Fim — Recompensas a cada marco de onda
        if (this.isEndless) {
          const milestones = [10, 20, 30, 50, 75, 100];
          if (milestones.includes(waveNumber)) {
            const save = SaveManager.getInstance();
            const alreadyClaimed = save.getData().endlessMilestonesClaimed.includes(waveNumber);
            if (!alreadyClaimed) {
              const rewardStars = waveNumber >= 50 ? 5 : (waveNumber >= 30 ? 4 : 3);
              save.claimEndlessMilestone(waveNumber, rewardStars);
              EventBus.emit('ENDLESS_MILESTONE_REACHED', {
                wave: waveNumber,
                stars: rewardStars
              });
            }
          }
        }

        if (!this.isEndless && this.currentWaveIndex + 1 >= this.waves.length) {
          EventBus.emit(GameEvents.VICTORY);
        }
      }
    }
  }
}
