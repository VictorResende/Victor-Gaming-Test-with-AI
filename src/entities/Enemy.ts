import Phaser from 'phaser';
import { DamageType, EnemyType, TowerType } from '../core/Constants';
import { ENEMIES_CONFIG, EnemyConfigData } from '../config/gameConfig';
import { EventBus, GameEvents } from '../core/EventBus';
import { Point } from '../config/levelsConfig';
import { Tower } from './Tower';
import { Hero } from './Hero';

export interface StatusEffect {
  type: 'SLOW' | 'BURN' | 'STUN';
  durationRemainingMs: number;
  factor?: number; // Para lentidão (0.5 = 50% da velocidade)
  dps?: number; // Para dano por segundo
}

export type EliteAffix = 'FAST' | 'REGENERATING' | 'ARMORED';

export function pickNearestEnemy(
  x: number,
  y: number,
  enemies: Enemy[],
  predicate?: (enemy: Enemy) => boolean
): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    if (predicate && !predicate(enemy)) continue;
    const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }
  return best;
}

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  public config: EnemyConfigData;
  public currentHp: number;
  public maxHp: number;
  public currentShield = 0;
  public maxShield = 0;
  public shieldRadius = 130;
  public isStealth = false;
  public isRevealed = false;
  public revealTimerMs = 0;
  public isAlive = true;
  public isFinished = false;

  // Elite Affix System
  public eliteAffix: EliteAffix | null = null;
  private eliteRegenTimerMs = 0;
  private eliteWindTrailTimerMs = 0;

  // Boss Multi-Phase Combat
  public bossPhase = 1;
  private bossStompTimerMs = 8000;
  private bossFuryAuraSprite?: Phaser.GameObjects.Sprite;
  private bossBlazingAegisGraphics?: Phaser.GameObjects.Graphics;
  private hasEnteredPhase2 = false;
  private hasEnteredPhase3 = false;

  // Shaman Healer
  private shamanHealTimerMs = 2500;

  private path: Point[];
  private currentWaypointIndex = 0;
  private distanceTravelled = 0;
  private sprite: Phaser.GameObjects.Sprite;
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBarFill: Phaser.GameObjects.Graphics;
  private shieldBarFill: Phaser.GameObjects.Graphics;
  private shieldBubbleGraphics?: Phaser.GameObjects.Graphics;
  private statusEffects: StatusEffect[] = [];

  // Carrier timers & flags
  private droneSpawnTimerMs = 0;
  private hasTriggeredHalfHpBurst = false;
  private teleporterCooldownMs = 0;

  constructor(scene: Phaser.Scene, enemyType: EnemyType, path: Point[]) {
    const startPos = path[0] || { x: 0, y: 0 };
    super(scene, startPos.x, startPos.y);

    this.enemyType = enemyType;
    this.config = ENEMIES_CONFIG[enemyType];
    this.path = path;
    this.maxHp = this.config.maxHp;
    this.currentHp = this.maxHp;

    // Configura Escudo de Plasma para Shielder
    if (this.config.shieldHp && this.config.shieldHp > 0) {
      this.maxShield = this.config.shieldHp;
      this.currentShield = this.maxShield;
      this.shieldRadius = this.config.shieldRadius || 130;
    }

    // Configura Camuflagem para Stealth
    if (this.config.isStealth) {
      this.isStealth = true;
      this.isRevealed = false;
      this.setAlpha(0.25);
    }

    // Configura Spawner de Drones para Carrier
    if (this.enemyType === EnemyType.CARRIER) {
      this.droneSpawnTimerMs = this.config.spawnIntervalMs || 3200;
    }

    // Configura Curandeiro para Shaman
    if (this.enemyType === EnemyType.SHAMAN) {
      this.shamanHealTimerMs = this.config.healIntervalMs || 2500;
    }

    // Configura Chefe Multi-Fase
    if (this.config.isBoss || this.enemyType === EnemyType.BOSS) {
      this.bossPhase = 1;
      this.bossStompTimerMs = 8000;
    }

    const textureKey = `enemy_${enemyType.toLowerCase()}`;
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.add(this.sprite);

    // Bolha de Plasma translúcida do Shielder
    if (this.enemyType === EnemyType.SHIELDER) {
      this.shieldBubbleGraphics = scene.add.graphics();
      this.add(this.shieldBubbleGraphics);
      this.drawShieldBubble();

      // Pulso suave do escudo de plasma
      scene.tweens.add({
        targets: this.shieldBubbleGraphics,
        scaleX: 1.05,
        scaleY: 1.05,
        alpha: 0.85,
        yoyo: true,
        duration: 1200,
        repeat: -1
      });
    }

    // Barra de Vida e Escudo
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.fillStyle(0x000000, 0.7);
    this.hpBarBg.fillRect(-18, -26, 36, 6);
    this.add(this.hpBarBg);

    this.hpBarFill = scene.add.graphics();
    this.add(this.hpBarFill);

    this.shieldBarFill = scene.add.graphics();
    this.add(this.shieldBarFill);

    this.updateHpBar();
    scene.add.existing(this);
  }

  public updateEnemy(
    deltaMs: number,
    speedMultiplier: number,
    allEnemies?: Enemy[],
    towers?: Tower[],
    hero?: Hero
  ): void {
    if (!this.isAlive || this.isFinished) return;

    const effectiveDelta = deltaMs * speedMultiplier;

    // Atualiza Stealth & Revelação
    if (this.isStealth && this.isRevealed) {
      this.revealTimerMs -= effectiveDelta;
      if (this.revealTimerMs <= 0) {
        this.isRevealed = false;
        this.setAlpha(0.25);
      }
    }

    // Atualiza geração de drones do Carrier
    if (this.enemyType === EnemyType.CARRIER && this.isAlive) {
      this.droneSpawnTimerMs -= effectiveDelta;
      if (this.droneSpawnTimerMs <= 0) {
        this.droneSpawnTimerMs = this.config.spawnIntervalMs || 3200;
        this.spawnMiniDrone();
      }
    }

    // Atualiza Curandeiro Xamã Goblin (Aura verde a cada 2.5s cura 18% max HP aliados)
    if (this.enemyType === EnemyType.SHAMAN && this.isAlive) {
      this.shamanHealTimerMs -= effectiveDelta;
      if (this.shamanHealTimerMs <= 0) {
        this.shamanHealTimerMs = this.config.healIntervalMs || 2500;
        this.performShamanHeal(allEnemies);
      }
    }

    // Atualiza Chefe Multi-Fase & Pisão Sísmico
    if ((this.config.isBoss || this.enemyType === EnemyType.BOSS) && this.isAlive) {
      this.checkBossPhases(towers, hero);
      if (this.bossPhase >= 2) {
        this.bossStompTimerMs -= effectiveDelta;
        if (this.bossStompTimerMs <= 0) {
          this.bossStompTimerMs = 8000;
          this.executeBossGroundStomp(towers, hero);
        }
      }
    }

    // Atualiza teletransporte cooldown
    if (this.teleporterCooldownMs > 0) {
      this.teleporterCooldownMs -= effectiveDelta;
    }

    // ⭐ Elite Affix: REGENERATING — regenera 5% HP/s
    if (this.eliteAffix === 'REGENERATING' && this.isAlive) {
      this.eliteRegenTimerMs -= effectiveDelta;
      if (this.eliteRegenTimerMs <= 0) {
        this.eliteRegenTimerMs = 1000;
        const regen = this.maxHp * 0.05;
        this.currentHp = Math.min(this.maxHp, this.currentHp + regen);
        this.updateHpBar();
        // Partícula verde de regeneração
        const spark = this.scene.add.text(this.x, this.y - 20, `💚+${Math.round(regen)}`, {
          fontSize: '11px', fontStyle: 'bold', color: '#4ade80', stroke: '#14532d', strokeThickness: 2
        }).setOrigin(0.5).setDepth(1000);
        this.scene.tweens.add({
          targets: spark, y: spark.y - 18, alpha: 0, duration: 700,
          onComplete: () => spark.destroy()
        });
      }
    }

    // ⭐ Elite Affix: FAST — rastro de vento ciano
    if (this.eliteAffix === 'FAST' && this.isAlive) {
      this.eliteWindTrailTimerMs -= effectiveDelta;
      if (this.eliteWindTrailTimerMs <= 0) {
        this.eliteWindTrailTimerMs = 80;
        const trail = this.scene.add.circle(this.x, this.y, 5, 0x22d3ee, 0.5);
        this.scene.tweens.add({
          targets: trail, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 220,
          onComplete: () => trail.destroy()
        });
      }
    }

    // Verifica teletransportadores no cenário
    this.checkTeleporters();

    // Atualiza status effects (lentidão, queimadura, atordoamento)
    let currentSpeedFactor = 1.0;
    let isStunned = false;

    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];
      effect.durationRemainingMs -= effectiveDelta;

      if (effect.type === 'SLOW' && effect.factor) {
        currentSpeedFactor = Math.min(currentSpeedFactor, effect.factor);
      } else if (effect.type === 'STUN') {
        isStunned = true;
      } else if (effect.type === 'BURN' && effect.dps) {
        this.takeDamage((effect.dps * effectiveDelta) / 1000, DamageType.FIRE, false, allEnemies);
      }

      if (effect.durationRemainingMs <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }

    if (isStunned) return;

    // Movimentação pelos waypoints
    const targetWaypoint = this.path[this.currentWaypointIndex];
    if (!targetWaypoint) {
      this.reachEnd();
      return;
    }

    const dx = targetWaypoint.x - this.x;
    const dy = targetWaypoint.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Bônus de velocidade para Chefes em Fase 2 e 3 (+35% de velocidade de movimento)
    const bossSpeedBonus = ((this.config.isBoss || this.enemyType === EnemyType.BOSS) && this.bossPhase >= 2) ? 1.35 : 1.0;
    const step = (this.config.speed * bossSpeedBonus * currentSpeedFactor * (effectiveDelta / 1000));

    if (dist <= step) {
      this.x = targetWaypoint.x;
      this.y = targetWaypoint.y;
      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= this.path.length) {
        this.reachEnd();
        return;
      }
    } else {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * step;
      this.y += Math.sin(angle) * step;
      this.sprite.rotation = angle + Math.PI / 2;
      this.distanceTravelled += step;
    }
  }

  public reveal(durationMs = 3000): void {
    if (!this.isStealth) return;
    this.isRevealed = true;
    this.revealTimerMs = Math.max(this.revealTimerMs, durationMs);
    this.setAlpha(1.0);

    // Efeito visual de scanner/revelação
    const scanRing = this.scene.add.circle(this.x, this.y, 8, 0x06b6d4, 0.9);
    this.scene.tweens.add({
      targets: scanRing,
      radius: 35,
      alpha: 0,
      duration: 350,
      onComplete: () => scanRing.destroy()
    });
  }

  /** ⭐ Aplica um afixo de Elite ao inimigo — modifica stats e aparência */
  public applyEliteAffix(affix: EliteAffix): void {
    this.eliteAffix = affix;

    // Cor de aura elite sobre o sprite
    switch (affix) {
      case 'FAST':
        this.config = { ...this.config, speed: this.config.speed * 1.3 };
        // Anel ciano pulsante
        const fastRing = this.scene.add.circle(0, 0, 24, 0x22d3ee, 0.18);
        this.add(fastRing);
        this.scene.tweens.add({
          targets: fastRing, scaleX: 1.5, scaleY: 1.5, alpha: 0.05,
          yoyo: true, repeat: -1, duration: 500
        });
        // Badge de afixo
        const fastBadge = this.scene.add.text(-2, -32, '⚡', { fontSize: '11px' }).setOrigin(0.5);
        this.add(fastBadge);
        break;

      case 'REGENERATING':
        this.eliteRegenTimerMs = 1000;
        // Brilho verde suave
        const regenRing = this.scene.add.circle(0, 0, 24, 0x4ade80, 0.15);
        this.add(regenRing);
        this.scene.tweens.add({
          targets: regenRing, scaleX: 1.4, scaleY: 1.4, alpha: 0.04,
          yoyo: true, repeat: -1, duration: 700
        });
        const regenBadge = this.scene.add.text(-2, -32, '💚', { fontSize: '11px' }).setOrigin(0.5);
        this.add(regenBadge);
        break;

      case 'ARMORED':
        // Tinge o sprite de cinza-metálico
        this.sprite.setTint(0x9ca3af);
        // Anel cinza de blindagem
        const armorRing = this.scene.add.circle(0, 0, 22, 0x6b7280, 0.25);
        this.add(armorRing);
        const armorBadge = this.scene.add.text(-2, -32, '🛡️', { fontSize: '11px' }).setOrigin(0.5);
        this.add(armorBadge);
        break;
    }

    // HP extra para elites
    const hpBonus = 1.35;
    this.maxHp = Math.round(this.maxHp * hpBonus);
    this.currentHp = this.maxHp;
    this.updateHpBar();
  }

  public takeShieldDamage(amount: number): number {
    if (this.currentShield <= 0) return amount;

    const absorbed = Math.min(this.currentShield, amount);
    this.currentShield -= absorbed;
    this.updateHpBar();

    // Efeito visual de escudo absorvendo
    this.showDamageText(Math.round(absorbed), DamageType.LASER, true);

    if (this.currentShield <= 0) {
      if (this.shieldBubbleGraphics) {
        this.shieldBubbleGraphics.setVisible(false);
      }
      if (this.bossBlazingAegisGraphics) {
        this.bossBlazingAegisGraphics.setVisible(false);
      }
    }

    return amount - absorbed;
  }

  public takeDamage(
    amount: number,
    damageType: DamageType,
    showText = true,
    allEnemies?: Enemy[],
    ignoreArmor = false,
    isCrit = false
  ): void {
    if (!this.isAlive) return;

    // Se estiver camuflado, qualquer dano em área/feitiço revela o inimigo
    if (this.isStealth && !this.isRevealed) {
      this.reveal(3000);
    }

    // Calcula resistência elemental e armadura
    let finalDamage = amount;
    const mult = this.config.resistances[damageType] ?? 1.0;
    finalDamage *= mult;

    if (!ignoreArmor && damageType === DamageType.PHYSICAL && this.config.armor > 0) {
      finalDamage *= (1.0 - this.config.armor);
    }

    // ⭐ Elite Affix ARMORED: reduz 40% dano físico extra
    if (this.eliteAffix === 'ARMORED' && damageType === DamageType.PHYSICAL) {
      finalDamage *= 0.6;
    }

    // 1. Shielder / Blazing Aegis Próprio: Escudo absorve primeiro
    if (this.currentShield > 0) {
      finalDamage = this.takeShieldDamage(finalDamage);
    } else if (allEnemies) {
      // 2. Proteção de Shielder Aliado Próximo: Reduz 50% de dano e transfere para o Shielder
      const nearbyShielder = allEnemies.find(
        e => e !== this &&
             e.isAlive &&
             e.enemyType === EnemyType.SHIELDER &&
             e.currentShield > 0 &&
             Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= e.shieldRadius
      );

      if (nearbyShielder) {
        const halfDmg = finalDamage * 0.5;
        nearbyShielder.takeShieldDamage(halfDmg);
        finalDamage = halfDmg;

        // Traço de plasma protetor visual
        const line = this.scene.add.graphics();
        line.lineStyle(2, 0x06b6d4, 0.8);
        line.lineBetween(this.x, this.y, nearbyShielder.x, nearbyShielder.y);
        this.scene.time.delayedCall(100, () => line.destroy());
      }
    }

    if (finalDamage > 0) {
      this.currentHp = Math.max(0, this.currentHp - finalDamage);
      this.updateHpBar();

      if (showText) {
        this.showDamageText(Math.round(finalDamage), damageType, false, isCrit);
      }

      // Carrier: Lança drones ao sofrer dano pesado ou atingir 50% HP
      if (this.enemyType === EnemyType.CARRIER && !this.hasTriggeredHalfHpBurst && this.currentHp <= this.maxHp * 0.5) {
        this.hasTriggeredHalfHpBurst = true;
        this.spawnMiniDrone();
        this.spawnMiniDrone();
      }

      // Chefe: Verifica transições dinâmicas de fase (Fase 2 a 60% e Fase 3 a 30%)
      if (this.config.isBoss || this.enemyType === EnemyType.BOSS) {
        const sceneAny = this.scene as any;
        this.checkBossPhases(sceneAny?.towers, sceneAny?.hero);
      }

      if (this.currentHp <= 0) {
        this.die();
      }
    }
  }

  private spawnMiniDrone(): void {
    if (!this.isAlive || !this.scene) return;

    const remainingWaypoints = this.path.slice(this.currentWaypointIndex);
    const dronePath: Point[] = [{ x: this.x, y: this.y }, ...remainingWaypoints];

    const drone = new Enemy(this.scene, EnemyType.MINI_DRONE, dronePath);
    drone.setPosition(
      this.x + Phaser.Math.Between(-15, 15),
      this.y + Phaser.Math.Between(-15, 15)
    );

    EventBus.emit(GameEvents.ENEMY_SPAWNED, drone);

    // Efeito de saída do hangar do Carrier
    const flash = this.scene.add.circle(this.x, this.y, 14, 0xc084fc, 0.9);
    this.scene.tweens.add({
      targets: flash,
      radius: 28,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy()
    });
  }

  private checkTeleporters(): void {
    if (this.teleporterCooldownMs > 0) return;

    const sceneWithTeleporters = this.scene as any;
    const teleporters = sceneWithTeleporters?.levelData?.teleporters as { from: Point; to: Point }[] | undefined;
    if (!teleporters || teleporters.length === 0) return;

    for (const tp of teleporters) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, tp.from.x, tp.from.y);
      if (dist <= 24) {
        this.teleportTo(tp.to);
        break;
      }
    }
  }

  private teleportTo(destination: Point): void {
    this.teleporterCooldownMs = 3000;

    // Efeito de desmaterialização
    const startWarp = this.scene.add.circle(this.x, this.y, 22, 0xa855f7, 0.9);
    this.scene.tweens.add({
      targets: startWarp,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 300,
      onComplete: () => startWarp.destroy()
    });

    this.x = destination.x;
    this.y = destination.y;

    // Encontra o waypoint mais próximo ou subsequente
    let closestIndex = this.currentWaypointIndex;
    let minDistance = Infinity;
    for (let i = 0; i < this.path.length; i++) {
      const d = Phaser.Math.Distance.Between(destination.x, destination.y, this.path[i].x, this.path[i].y);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }
    this.currentWaypointIndex = Math.min(this.path.length - 1, closestIndex + 1);

    // Efeito de rematerialização
    const endWarp = this.scene.add.circle(destination.x, destination.y, 10, 0x38bdf8, 1);
    this.scene.tweens.add({
      targets: endWarp,
      radius: 26,
      alpha: 0,
      duration: 300,
      onComplete: () => endWarp.destroy()
    });
  }

  public heal(amount: number): void {
    if (!this.isAlive || this.currentHp >= this.maxHp) return;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    this.updateHpBar();
    this.showHealText(Math.round(amount));
  }

  private showHealText(amount: number): void {
    if (!this.scene) return;
    const txt = this.scene.add.text(this.x + Phaser.Math.Between(-10, 10), this.y - 30, `💚+${amount}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#4ade80',
      stroke: '#064e3b',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 25,
      alpha: 0,
      duration: 750,
      onComplete: () => txt.destroy()
    });
  }

  private performShamanHeal(allEnemies?: Enemy[]): void {
    if (!this.isAlive || !this.scene) return;

    const healRadius = this.config.healRadius || 140;
    const healPct = this.config.healPercent || 0.18;

    // Efeito visual de círculo de cura em expansão (healing_circle)
    const circle = this.scene.add.sprite(this.x, this.y, 'healing_circle');
    circle.setScale(0.2).setAlpha(0.9);
    this.scene.tweens.add({
      targets: circle,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 600,
      onComplete: () => circle.destroy()
    });

    if (!allEnemies) return;

    let healedAny = false;
    allEnemies.forEach(e => {
      if (e.isAlive && e.currentHp < e.maxHp) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (dist <= healRadius) {
          const healAmount = Math.round(e.maxHp * healPct);
          e.heal(healAmount);
          healedAny = true;

          // Traço de energia druídica verde
          if (e !== this) {
            const beam = this.scene.add.graphics();
            beam.lineStyle(2.5, 0x22c55e, 0.85);
            beam.lineBetween(this.x, this.y, e.x, e.y);
            this.scene.time.delayedCall(150, () => beam.destroy());
          }
        }
      }
    });

    if (healedAny) {
      this.showPhaseAnnouncementText('✨ REJUVENESCIMENTO!', '#22c55e');
    }
  }

  public checkBossPhases(towers?: Tower[], hero?: Hero): void {
    if (!this.isAlive || (!this.config.isBoss && this.enemyType !== EnemyType.BOSS)) return;
    const hpRatio = this.currentHp / this.maxHp;

    if (hpRatio <= 0.60 && !this.hasEnteredPhase2) {
      this.enterBossPhase2(towers, hero);
    }
    if (hpRatio <= 0.30 && !this.hasEnteredPhase3) {
      if (!this.hasEnteredPhase2) {
        this.enterBossPhase2(towers, hero);
      }
      this.enterBossPhase3();
    }
  }

  private enterBossPhase2(towers?: Tower[], hero?: Hero): void {
    this.bossPhase = 2;
    this.hasEnteredPhase2 = true;
    this.bossStompTimerMs = 8000;

    // 1. Aura de Fúria Vermelha Flamejante
    if (!this.bossFuryAuraSprite && this.scene) {
      this.bossFuryAuraSprite = this.scene.add.sprite(0, 0, 'fury_aura');
      this.bossFuryAuraSprite.setAlpha(0.85);
      this.addAt(this.bossFuryAuraSprite, 0);

      this.scene.tweens.add({
        targets: this.bossFuryAuraSprite,
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: 1,
        rotation: Math.PI * 2,
        yoyo: true,
        duration: 1000,
        repeat: -1
      });
    }

    // 2. Anúncio e tremor de tela
    this.showPhaseAnnouncementText('🔥 FASE 2: FÚRIA DRACÔNICA! (+35% VELOCIDADE)', '#ef4444');
    this.scene.cameras.main.shake(350, 0.015);

    // 3. Executa o primeiro golpe no solo
    this.executeBossGroundStomp(towers, hero);
  }

  private executeBossGroundStomp(towers?: Tower[], hero?: Hero): void {
    if (!this.isAlive || !this.scene) return;

    // Câmera treme com impacto colossal
    this.scene.cameras.main.shake(250, 0.012);

    // Efeito visual de onda de choque sísmica
    const shock = this.scene.add.sprite(this.x, this.y, 'fx_shockwave');
    shock.setTint(0xef4444);
    shock.setScale(0.3).setAlpha(0.95);
    this.scene.tweens.add({
      targets: shock,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 450,
      onComplete: () => shock.destroy()
    });

    const stompRadius = 190;

    // Atordoa torres próximas por 2s
    if (towers) {
      towers.forEach(t => {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
        if (dist <= stompRadius) {
          t.stun(2000);
        }
      });
    }

    // Atordoa herói se estiver no raio por 2s
    if (hero && hero.isAlive) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);
      if (dist <= stompRadius) {
        hero.applyStun(2000);
      }
    }

    this.showFloatingText('💥 PISÃO SÍSMICO! (2s STUN)', '#f97316');
  }

  private enterBossPhase3(): void {
    this.bossPhase = 3;
    this.hasEnteredPhase3 = true;

    // 1. Blazing Aegis (Domo de Chamas / Escudo Ardente)
    const shieldAmount = Math.round(this.maxHp * 0.35);
    this.maxShield = (this.maxShield || 0) + shieldAmount;
    this.currentShield = (this.currentShield || 0) + shieldAmount;
    this.shieldRadius = 140;

    if (!this.bossBlazingAegisGraphics && this.scene) {
      this.bossBlazingAegisGraphics = this.scene.add.graphics();
      this.add(this.bossBlazingAegisGraphics);
      this.drawBlazingAegis();

      this.scene.tweens.add({
        targets: this.bossBlazingAegisGraphics,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.9,
        yoyo: true,
        duration: 800,
        repeat: -1
      });
    }

    this.updateHpBar();

    // 2. Invoca 2 Guardas de Elite Orcs Armados
    this.spawnBodyguardOrc();
    this.spawnBodyguardOrc();

    // 3. Anúncio e Shake
    this.showPhaseAnnouncementText('🛡️ FASE 3: DOMO ARDENTE & GUARDA REAL!', '#f59e0b');
    this.scene.cameras.main.shake(400, 0.02);
  }

  private drawBlazingAegis(): void {
    if (!this.bossBlazingAegisGraphics) return;
    this.bossBlazingAegisGraphics.clear();
    this.bossBlazingAegisGraphics.fillStyle(0xea580c, 0.25);
    this.bossBlazingAegisGraphics.fillCircle(0, 0, 52);
    this.bossBlazingAegisGraphics.lineStyle(3, 0xf97316, 0.95);
    this.bossBlazingAegisGraphics.strokeCircle(0, 0, 52);
    this.bossBlazingAegisGraphics.lineStyle(1.5, 0xfde047, 0.9);
    this.bossBlazingAegisGraphics.strokeCircle(0, 0, 46);
  }

  private spawnBodyguardOrc(): void {
    if (!this.isAlive || !this.scene) return;

    const remainingWaypoints = this.path.slice(this.currentWaypointIndex);
    const bodyguardPath: Point[] = [{ x: this.x, y: this.y }, ...remainingWaypoints];

    const bodyguard = new Enemy(this.scene, EnemyType.SOLDIER, bodyguardPath);
    bodyguard.setPosition(
      this.x + Phaser.Math.Between(-30, 30),
      this.y + Phaser.Math.Between(-30, 30)
    );

    EventBus.emit(GameEvents.ENEMY_SPAWNED, bodyguard);

    // Efeito de invocação flamejante
    const burst = this.scene.add.circle(bodyguard.x, bodyguard.y, 20, 0xf97316, 0.9);
    this.scene.tweens.add({
      targets: burst,
      radius: 40,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy()
    });
  }

  private showPhaseAnnouncementText(text: string, color: string): void {
    if (!this.scene) return;
    const txt = this.scene.add.text(this.x, this.y - 45, text, {
      fontSize: '15px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 35,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1400,
      onComplete: () => txt.destroy()
    });
  }

  private showFloatingText(text: string, color = '#ffffff'): void {
    if (!this.scene) return;
    const txt = this.scene.add.text(this.x + Phaser.Math.Between(-10, 10), this.y - 32, text, {
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy()
    });
  }

  public applyStatus(type: 'SLOW' | 'BURN' | 'STUN', durationMs: number, factor?: number, dps?: number): void {
    if (this.isStealth && !this.isRevealed) {
      this.reveal(3000);
    }

    const existing = this.statusEffects.find(e => e.type === type);
    if (existing) {
      existing.durationRemainingMs = Math.max(existing.durationRemainingMs, durationMs);
      if (factor && existing.factor) {
        existing.factor = Math.min(existing.factor, factor);
      }
    } else {
      this.statusEffects.push({ type, durationRemainingMs: durationMs, factor, dps });
    }
  }

  private drawShieldBubble(): void {
    if (!this.shieldBubbleGraphics) return;
    this.shieldBubbleGraphics.clear();
    this.shieldBubbleGraphics.fillStyle(0x06b6d4, 0.15);
    this.shieldBubbleGraphics.fillCircle(0, 0, this.shieldRadius);
    this.shieldBubbleGraphics.lineStyle(2, 0x38bdf8, 0.75);
    this.shieldBubbleGraphics.strokeCircle(0, 0, this.shieldRadius);
  }

  private updateHpBar(): void {
    this.hpBarFill.clear();
    this.shieldBarFill.clear();

    const hpRatio = Math.max(0, this.currentHp / this.maxHp);
    const hpWidth = 34 * hpRatio;

    let hpColor = 0x22c55e;
    if (hpRatio < 0.3) hpColor = 0xef4444;
    else if (hpRatio < 0.6) hpColor = 0xf59e0b;

    this.hpBarFill.fillStyle(hpColor, 0.9);
    this.hpBarFill.fillRect(-17, -25, hpWidth, 4);

    // Barra de Escudo azul-ciano no topo
    if (this.maxShield > 0 && this.currentShield > 0) {
      const shieldRatio = Math.max(0, this.currentShield / this.maxShield);
      const shieldWidth = 34 * shieldRatio;
      this.shieldBarFill.fillStyle(0x06b6d4, 1);
      this.shieldBarFill.fillRect(-17, -29, shieldWidth, 3);
    }
  }

  private showDamageText(damage: number, type: DamageType, isShield = false, isCrit = false): void {
    let colorStr = '#ffffff';
    let elementIcon = '';
    if (isCrit) { colorStr = '#f43f5e'; }
    else if (isShield) { colorStr = '#38bdf8'; }
    else if (type === DamageType.FIRE)     { colorStr = '#f97316'; elementIcon = '🔥'; }
    else if (type === DamageType.FROST)    { colorStr = '#06b6d4'; elementIcon = '❄️'; }
    else if (type === DamageType.LASER)    { colorStr = '#d8b4fe'; elementIcon = '🔮'; }
    else if (type === DamageType.ELECTRIC) { colorStr = '#fde047'; elementIcon = '⚡'; }

    const ox = Phaser.Math.Between(-14, 14);
    const startX = this.x + ox;
    const startY = this.y - 32;

    if (isCrit) {
      // Starburst dourado ao redor do texto crítico
      const burst = this.scene.add.graphics();
      burst.setPosition(startX, startY);
      burst.setDepth(1500);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const len = Phaser.Math.Between(14, 22);
        burst.lineStyle(2.5, 0xfbbf24, 1);
        burst.lineBetween(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
      }
      burst.fillStyle(0xfef08a, 0.7);
      burst.fillCircle(0, 0, 8);
      this.scene.tweens.add({
        targets: burst,
        scaleX: 2.2, scaleY: 2.2, alpha: 0,
        duration: 420, ease: 'Quad.Out',
        onComplete: () => burst.destroy()
      });

      const critTxt = this.scene.add.text(startX, startY, `💥CRIT!-${damage}`, {
        fontSize: '18px', fontStyle: 'bold',
        color: '#fbbf24', stroke: '#7c2d12', strokeThickness: 5
      }).setOrigin(0.5).setDepth(1501);

      this.scene.tweens.add({
        targets: critTxt,
        y: startY - 48, scaleX: 1.3, scaleY: 1.3,
        alpha: 0, duration: 900, ease: 'Back.Out',
        onComplete: () => critTxt.destroy()
      });
    } else {
      const label = isShield
        ? `🛡️-${damage}`
        : `${elementIcon}-${damage}`;

      const txt = this.scene.add.text(startX, startY, label, {
        fontSize: isShield ? '12px' : '13px',
        fontStyle: 'bold',
        color: colorStr,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(1500);

      this.scene.tweens.add({
        targets: txt,
        y: startY - 26, alpha: 0,
        duration: 580, ease: 'Quad.Out',
        onComplete: () => txt.destroy()
      });
    }
  }

  public getDistanceTravelled(): number {
    return this.distanceTravelled;
  }

  private die(): void {
    this.isAlive = false;

    // Carrier death rattle: Solta 1-2 drones finais
    if (this.enemyType === EnemyType.CARRIER) {
      this.spawnMiniDrone();
    }

    // ✨ Boss Slayed: Efeito Cinemático de Câmera Lenta (Bullet-Time 0.4s)
    if ((this.config.isBoss || this.enemyType === EnemyType.BOSS) && this.scene) {
      // Flash dourado em tela cheia
      const { width, height } = this.scene.scale;
      const flash = this.scene.add.graphics().setDepth(9998);
      flash.fillStyle(0xfef08a, 0.55);
      flash.fillRect(0, 0, width, height);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 380,
        ease: 'Quad.Out',
        onComplete: () => flash.destroy()
      });

      // Câmera lenta: timeScale 0.18 → 1.0 suavemente
      this.scene.time.timeScale = 0.18;
      this.scene.tweens.addCounter({
        from: 0.18,
        to: 1.0,
        duration: 450,
        ease: 'Cubic.Out',
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          this.scene.time.timeScale = tween.getValue() ?? 1.0;
        },
        onComplete: () => {
          this.scene.time.timeScale = 1.0;
        }
      });

      // Tremor de câmera épico
      const cam = this.scene.cameras.main;
      if (cam) cam.shake(380, 0.022);

      // Texto "BOSS DERROTADO!" dramático
      const bossKillTxt = this.scene.add.text(width / 2, height / 2 - 30, '👑 BOSS DERROTADO! 👑', {
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#fef08a',
        stroke: '#7c2d12',
        strokeThickness: 7
      }).setOrigin(0.5).setDepth(9999).setScale(0.1);

      this.scene.tweens.add({
        targets: bossKillTxt,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        ease: 'Back.Out',
        onComplete: () => {
          this.scene.tweens.add({
            targets: bossKillTxt,
            alpha: 0,
            y: bossKillTxt.y - 40,
            delay: 1200,
            duration: 600,
            onComplete: () => bossKillTxt.destroy()
          });
        }
      });
    }

    EventBus.emit(GameEvents.ENEMY_KILLED, {
      enemy: this,
      gold: this.config.rewardGold,
      score: this.config.scoreValue
    });

    // Animação de explosão
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }

  private reachEnd(): void {
    this.isFinished = true;
    this.isAlive = false;
    EventBus.emit(GameEvents.ENEMY_REACHED_END, {
      enemy: this,
      livesLost: this.config.isBoss ? 5 : (this.enemyType === EnemyType.CARRIER ? 3 : 1)
    });
    this.destroy();
  }
}

