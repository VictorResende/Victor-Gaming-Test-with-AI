import Phaser from 'phaser';
import { DamageType, EliteAffix, EnemyType } from '../core/Constants';
import { ENEMIES_CONFIG, EnemyConfigData } from '../config/gameConfig';
import { EventBus, GameEvents } from '../core/EventBus';
import { Point } from '../config/levelsConfig';
import type { Tower } from './Tower';
import type { Hero } from './Hero';
import {
  bossMoveSpeedFactor,
  computeIncomingDamage,
  isBossEnemy,
  livesLostOnLeak
} from './enemyCombat';
import { floatHeal, pulseRing } from './enemyFx';
import { t } from '../i18n/locales';
import {
  applyBossPhases,
  applyEliteVisuals,
  maybeCarrierHalfBurst,
  playBossDeathCinematic,
  shareDamageWithShielder,
  spawnCarrierDrone,
  tickBoss,
  tickCarrier,
  tickEliteAffixes,
  tickShaman,
  tickTeleporters
} from './enemySpecials';

export { EliteAffix };

export interface StatusEffect {
  type: 'SLOW' | 'BURN' | 'STUN';
  durationRemainingMs: number;
  factor?: number;
  dps?: number;
}

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

  public eliteAffix: EliteAffix | null = null;
  public eliteRegenTimerMs = 0;
  public eliteWindTrailTimerMs = 0;

  public bossPhase = 1;
  public bossStompTimerMs = 8000;
  public bossFuryAuraSprite?: Phaser.GameObjects.Sprite;
  public bossBlazingAegisGraphics?: Phaser.GameObjects.Graphics;
  public hasEnteredPhase2 = false;
  public hasEnteredPhase3 = false;

  public shamanHealTimerMs = 2500;
  public droneSpawnTimerMs = 0;
  public hasTriggeredHalfHpBurst = false;
  public teleporterCooldownMs = 0;
  public bodySprite: Phaser.GameObjects.Sprite;

  private path: Point[];
  private currentWaypointIndex = 0;
  private distanceTravelled = 0;
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBarFill: Phaser.GameObjects.Graphics;
  private shieldBarFill: Phaser.GameObjects.Graphics;
  private shieldBubbleGraphics?: Phaser.GameObjects.Graphics;
  private statusEffects: StatusEffect[] = [];

  constructor(scene: Phaser.Scene, enemyType: EnemyType, path: Point[]) {
    const startPos = path[0] || { x: 0, y: 0 };
    super(scene, startPos.x, startPos.y);

    this.enemyType = enemyType;
    this.config = ENEMIES_CONFIG[enemyType];
    this.path = path;
    this.maxHp = this.config.maxHp;
    this.currentHp = this.maxHp;

    if (this.config.shieldHp && this.config.shieldHp > 0) {
      this.maxShield = this.config.shieldHp;
      this.currentShield = this.maxShield;
      this.shieldRadius = this.config.shieldRadius || 130;
    }

    if (this.config.isStealth) {
      this.isStealth = true;
      this.isRevealed = false;
      this.setAlpha(0.25);
    }

    if (this.enemyType === EnemyType.CARRIER) {
      this.droneSpawnTimerMs = this.config.spawnIntervalMs || 3200;
    }
    if (this.enemyType === EnemyType.SHAMAN) {
      this.shamanHealTimerMs = this.config.healIntervalMs || 2500;
    }
    if (isBossEnemy(!!this.config.isBoss, this.enemyType)) {
      this.bossPhase = 1;
      this.bossStompTimerMs = 8000;
    }

    this.bodySprite = scene.add.sprite(0, 0, `enemy_${enemyType.toLowerCase()}`);
    this.add(this.bodySprite);

    if (this.enemyType === EnemyType.SHIELDER) {
      this.shieldBubbleGraphics = scene.add.graphics();
      this.add(this.shieldBubbleGraphics);
      this.drawShieldBubble();
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

    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.fillStyle(0x000000, 0.7);
    this.hpBarBg.fillRect(-18, -26, 36, 6);
    this.add(this.hpBarBg);
    this.hpBarFill = scene.add.graphics();
    this.add(this.hpBarFill);
    this.shieldBarFill = scene.add.graphics();
    this.add(this.shieldBarFill);

    this.refreshBars();
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

    if (this.isStealth && this.isRevealed) {
      this.revealTimerMs -= effectiveDelta;
      if (this.revealTimerMs <= 0) {
        this.isRevealed = false;
        this.setAlpha(0.25);
      }
    }

    tickCarrier(this, effectiveDelta);
    tickShaman(this, effectiveDelta, allEnemies);
    tickBoss(this, effectiveDelta, towers, hero);
    tickTeleporters(this, effectiveDelta);
    tickEliteAffixes(this, effectiveDelta);

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

    const targetWaypoint = this.path[this.currentWaypointIndex];
    if (!targetWaypoint) {
      this.reachEnd();
      return;
    }

    const dx = targetWaypoint.x - this.x;
    const dy = targetWaypoint.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.config.speed
      * bossMoveSpeedFactor(isBossEnemy(!!this.config.isBoss, this.enemyType), this.bossPhase)
      * currentSpeedFactor
      * (effectiveDelta / 1000);

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
      this.bodySprite.rotation = angle + Math.PI / 2;
      this.distanceTravelled += step;
    }
  }

  public reveal(durationMs = 3000): void {
    if (!this.isStealth) return;
    this.isRevealed = true;
    this.revealTimerMs = Math.max(this.revealTimerMs, durationMs);
    this.setAlpha(1.0);
    pulseRing(this.scene, this.x, this.y, 0x06b6d4, 8, 35, 350);
  }

  public applyEliteAffix(affix: EliteAffix): void {
    this.eliteAffix = affix;
    applyEliteVisuals(this, affix);
  }

  public takeShieldDamage(amount: number): number {
    if (this.currentShield <= 0) return amount;

    const absorbed = Math.min(this.currentShield, amount);
    this.currentShield -= absorbed;
    this.refreshBars();
    this.showDamageText(Math.round(absorbed), DamageType.LASER, true);

    if (this.currentShield <= 0) {
      this.shieldBubbleGraphics?.setVisible(false);
      this.bossBlazingAegisGraphics?.setVisible(false);
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

    if (this.isStealth && !this.isRevealed) {
      this.reveal(3000);
    }

    let finalDamage = computeIncomingDamage(
      amount,
      damageType,
      this.config.resistances,
      this.config.armor,
      ignoreArmor,
      this.eliteAffix
    );

    if (this.currentShield > 0) {
      finalDamage = this.takeShieldDamage(finalDamage);
    } else {
      finalDamage = shareDamageWithShielder(this, finalDamage, allEnemies);
    }

    if (finalDamage > 0) {
      this.currentHp = Math.max(0, this.currentHp - finalDamage);
      this.refreshBars();

      if (showText) {
        this.showDamageText(Math.round(finalDamage), damageType, false, isCrit);
      }

      maybeCarrierHalfBurst(this);

      if (isBossEnemy(!!this.config.isBoss, this.enemyType)) {
        const sceneAny = this.scene as Phaser.Scene & { towers?: Tower[]; hero?: Hero };
        applyBossPhases(this, sceneAny.towers, sceneAny.hero);
      }

      if (this.currentHp <= 0) {
        this.die();
      }
    }
  }

  public spawnAlongPath(type: EnemyType, scatterPx: number): Enemy {
    const remainingWaypoints = this.path.slice(this.currentWaypointIndex);
    const minionPath: Point[] = [{ x: this.x, y: this.y }, ...remainingWaypoints];
    const minion = new Enemy(this.scene, type, minionPath);
    minion.setPosition(
      this.x + Phaser.Math.Between(-scatterPx, scatterPx),
      this.y + Phaser.Math.Between(-scatterPx, scatterPx)
    );
    EventBus.emit(GameEvents.ENEMY_SPAWNED, minion);
    return minion;
  }

  public snapToPathNear(destination: Point): void {
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
  }

  public heal(amount: number): void {
    if (!this.isAlive || this.currentHp >= this.maxHp) return;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    this.refreshBars();
    floatHeal(this.scene, this.x, this.y, Math.round(amount));
  }

  public checkBossPhases(towers?: Tower[], hero?: Hero): void {
    applyBossPhases(this, towers, hero);
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

  public refreshBars(): void {
    this.hpBarFill.clear();
    this.shieldBarFill.clear();

    const hpRatio = Math.max(0, this.currentHp / this.maxHp);
    const hpWidth = 34 * hpRatio;

    let hpColor = 0x22c55e;
    if (hpRatio < 0.3) hpColor = 0xef4444;
    else if (hpRatio < 0.6) hpColor = 0xf59e0b;

    this.hpBarFill.fillStyle(hpColor, 0.9);
    this.hpBarFill.fillRect(-17, -25, hpWidth, 4);

    if (this.maxShield > 0 && this.currentShield > 0) {
      const shieldRatio = Math.max(0, this.currentShield / this.maxShield);
      this.shieldBarFill.fillStyle(0x06b6d4, 1);
      this.shieldBarFill.fillRect(-17, -29, 34 * shieldRatio, 3);
    }
  }

  public getDistanceTravelled(): number {
    return this.distanceTravelled;
  }

  private drawShieldBubble(): void {
    if (!this.shieldBubbleGraphics) return;
    this.shieldBubbleGraphics.clear();
    this.shieldBubbleGraphics.fillStyle(0x06b6d4, 0.15);
    this.shieldBubbleGraphics.fillCircle(0, 0, this.shieldRadius);
    this.shieldBubbleGraphics.lineStyle(2, 0x38bdf8, 0.75);
    this.shieldBubbleGraphics.strokeCircle(0, 0, this.shieldRadius);
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

      const critTxt = this.scene.add.text(startX, startY, t('combatCrit', { damage }), {
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
      const label = isShield ? `🛡️-${damage}` : `${elementIcon}-${damage}`;
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

  private die(): void {
    this.isAlive = false;

    if (this.enemyType === EnemyType.CARRIER) {
      spawnCarrierDrone(this, true);
    }

    if (isBossEnemy(!!this.config.isBoss, this.enemyType) && this.scene) {
      playBossDeathCinematic(this);
    }

    EventBus.emit(GameEvents.ENEMY_KILLED, {
      enemy: this,
      gold: this.config.rewardGold,
      score: this.config.scoreValue
    });

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
      livesLost: livesLostOnLeak(isBossEnemy(!!this.config.isBoss, this.enemyType), this.enemyType)
    });
    this.destroy();
  }
}
