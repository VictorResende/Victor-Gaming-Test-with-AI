import Phaser from 'phaser';
import { EliteAffix, EnemyType } from '../core/Constants';
import { Point } from '../config/levelsConfig';
import { t } from '../i18n/locales';
import type { Hero } from './Hero';
import type { Tower } from './Tower';
import {
  BOSS_STOMP_INTERVAL_MS,
  BOSS_STOMP_RADIUS,
  BOSS_STOMP_STUN_MS,
  ELITE_FAST_SPEED,
  ELITE_HP_BONUS,
  ELITE_REGEN_PCT,
  bossPhaseTransition,
  isBossEnemy
} from './enemyCombat';
import { floatAnnounce, floatCombat, pulseRing } from './enemyFx';
import type { Enemy } from './Enemy';

export function tickEliteAffixes(enemy: Enemy, deltaMs: number): void {
  if (!enemy.isAlive) return;

  if (enemy.eliteAffix === EliteAffix.REGENERATING) {
    enemy.eliteRegenTimerMs -= deltaMs;
    if (enemy.eliteRegenTimerMs <= 0) {
      enemy.eliteRegenTimerMs = 1000;
      const regen = enemy.maxHp * ELITE_REGEN_PCT;
      enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + regen);
      enemy.refreshBars();
      const spark = enemy.scene.add.text(enemy.x, enemy.y - 20, `💚+${Math.round(regen)}`, {
        fontSize: '11px', fontStyle: 'bold', color: '#4ade80', stroke: '#14532d', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1000);
      enemy.scene.tweens.add({
        targets: spark, y: spark.y - 18, alpha: 0, duration: 700,
        onComplete: () => spark.destroy()
      });
    }
  }

  if (enemy.eliteAffix === EliteAffix.FAST) {
    enemy.eliteWindTrailTimerMs -= deltaMs;
    if (enemy.eliteWindTrailTimerMs <= 0) {
      enemy.eliteWindTrailTimerMs = 80;
      const trail = enemy.scene.add.circle(enemy.x, enemy.y, 5, 0x22d3ee, 0.5);
      enemy.scene.tweens.add({
        targets: trail, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 220,
        onComplete: () => trail.destroy()
      });
    }
  }
}

export function applyEliteVisuals(enemy: Enemy, affix: EliteAffix): void {
  switch (affix) {
    case EliteAffix.FAST:
      enemy.config = { ...enemy.config, speed: enemy.config.speed * ELITE_FAST_SPEED };
      const fastRing = enemy.scene.add.circle(0, 0, 24, 0x22d3ee, 0.18);
      enemy.add(fastRing);
      enemy.scene.tweens.add({
        targets: fastRing, scaleX: 1.5, scaleY: 1.5, alpha: 0.05,
        yoyo: true, repeat: -1, duration: 500
      });
      enemy.add(enemy.scene.add.text(-2, -32, '⚡', { fontSize: '11px' }).setOrigin(0.5));
      break;
    case EliteAffix.REGENERATING:
      enemy.eliteRegenTimerMs = 1000;
      const regenRing = enemy.scene.add.circle(0, 0, 24, 0x4ade80, 0.15);
      enemy.add(regenRing);
      enemy.scene.tweens.add({
        targets: regenRing, scaleX: 1.4, scaleY: 1.4, alpha: 0.04,
        yoyo: true, repeat: -1, duration: 700
      });
      enemy.add(enemy.scene.add.text(-2, -32, '💚', { fontSize: '11px' }).setOrigin(0.5));
      break;
    case EliteAffix.ARMORED:
      enemy.bodySprite.setTint(0x9ca3af);
      enemy.add(enemy.scene.add.circle(0, 0, 22, 0x6b7280, 0.25));
      enemy.add(enemy.scene.add.text(-2, -32, '🛡️', { fontSize: '11px' }).setOrigin(0.5));
      break;
  }

  enemy.maxHp = Math.round(enemy.maxHp * ELITE_HP_BONUS);
  enemy.currentHp = enemy.maxHp;
  enemy.refreshBars();
}

export function tickCarrier(enemy: Enemy, deltaMs: number): void {
  if (enemy.enemyType !== EnemyType.CARRIER || !enemy.isAlive) return;
  enemy.droneSpawnTimerMs -= deltaMs;
  if (enemy.droneSpawnTimerMs <= 0) {
    enemy.droneSpawnTimerMs = enemy.config.spawnIntervalMs || 3200;
    spawnCarrierDrone(enemy);
  }
}

export function maybeCarrierHalfBurst(enemy: Enemy): void {
  if (enemy.enemyType !== EnemyType.CARRIER || enemy.hasTriggeredHalfHpBurst) return;
  if (enemy.currentHp > enemy.maxHp * 0.5) return;
  enemy.hasTriggeredHalfHpBurst = true;
  spawnCarrierDrone(enemy);
  spawnCarrierDrone(enemy);
}

export function spawnCarrierDrone(enemy: Enemy, allowDead = false): void {
  if (!enemy.scene) return;
  if (!allowDead && !enemy.isAlive) return;
  enemy.spawnAlongPath(EnemyType.MINI_DRONE, 15);
  pulseRing(enemy.scene, enemy.x, enemy.y, 0xc084fc, 14, 28, 250);
}

export function tickShaman(enemy: Enemy, deltaMs: number, allEnemies?: Enemy[]): void {
  if (enemy.enemyType !== EnemyType.SHAMAN || !enemy.isAlive) return;
  enemy.shamanHealTimerMs -= deltaMs;
  if (enemy.shamanHealTimerMs <= 0) {
    enemy.shamanHealTimerMs = enemy.config.healIntervalMs || 2500;
    performShamanHeal(enemy, allEnemies);
  }
}

export function performShamanHeal(healer: Enemy, allEnemies?: Enemy[]): void {
  if (!healer.isAlive || !healer.scene) return;
  const healRadius = healer.config.healRadius || 140;
  const healPct = healer.config.healPercent || 0.18;

  const circle = healer.scene.add.sprite(healer.x, healer.y, 'healing_circle');
  circle.setScale(0.2).setAlpha(0.9);
  healer.scene.tweens.add({
    targets: circle,
    scaleX: 1.6,
    scaleY: 1.6,
    alpha: 0,
    duration: 600,
    onComplete: () => circle.destroy()
  });

  if (!allEnemies) return;

  let healedAny = false;
  for (const e of allEnemies) {
    if (!e.isAlive || e.currentHp >= e.maxHp) continue;
    const dist = Phaser.Math.Distance.Between(healer.x, healer.y, e.x, e.y);
    if (dist > healRadius) continue;
    e.heal(Math.round(e.maxHp * healPct));
    healedAny = true;
    if (e !== healer) {
      const beam = healer.scene.add.graphics();
      beam.lineStyle(2.5, 0x22c55e, 0.85);
      beam.lineBetween(healer.x, healer.y, e.x, e.y);
      healer.scene.time.delayedCall(150, () => beam.destroy());
    }
  }

  if (healedAny) {
    floatAnnounce(healer.scene, healer.x, healer.y, t('shamanHealAnnounce'), '#22c55e');
  }
}

export function tickBoss(enemy: Enemy, deltaMs: number, towers?: Tower[], hero?: Hero): void {
  if (!enemy.isAlive || !isBossEnemy(!!enemy.config.isBoss, enemy.enemyType)) return;
  applyBossPhases(enemy, towers, hero);
  if (enemy.bossPhase >= 2) {
    enemy.bossStompTimerMs -= deltaMs;
    if (enemy.bossStompTimerMs <= 0) {
      enemy.bossStompTimerMs = BOSS_STOMP_INTERVAL_MS;
      executeBossGroundStomp(enemy, towers, hero);
    }
  }
}

export function applyBossPhases(enemy: Enemy, towers?: Tower[], hero?: Hero): void {
  if (!enemy.isAlive || !isBossEnemy(!!enemy.config.isBoss, enemy.enemyType)) return;
  const event = bossPhaseTransition(enemy.currentHp / enemy.maxHp, enemy.hasEnteredPhase2, enemy.hasEnteredPhase3);
  if (!event) return;
  if (event === 'enter2' || event === 'enter2and3') enterBossPhase2(enemy, towers, hero);
  if (event === 'enter3' || event === 'enter2and3') enterBossPhase3(enemy);
}

function enterBossPhase2(enemy: Enemy, towers?: Tower[], hero?: Hero): void {
  enemy.bossPhase = 2;
  enemy.hasEnteredPhase2 = true;
  enemy.bossStompTimerMs = BOSS_STOMP_INTERVAL_MS;

  if (enemy.enemyType === EnemyType.GOLEM_BOSS) {
    enemy.config = { ...enemy.config, armor: 0.7 };
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('golemBossPhase2Announce'), '#d97706');
  } else if (enemy.enemyType === EnemyType.FROST_GIANT_BOSS) {
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('frostGiantBossPhase2Announce'), '#38bdf8');
  } else if (enemy.enemyType === EnemyType.INFERNAL_BOSS) {
    enemy.config = { ...enemy.config, speed: enemy.config.speed * 1.4 };
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('infernalBossPhase2Announce'), '#ef4444');
  } else {
    if (!enemy.bossFuryAuraSprite && enemy.scene) {
      enemy.bossFuryAuraSprite = enemy.scene.add.sprite(0, 0, 'fury_aura');
      enemy.bossFuryAuraSprite.setAlpha(0.85);
      enemy.addAt(enemy.bossFuryAuraSprite, 0);
      enemy.scene.tweens.add({
        targets: enemy.bossFuryAuraSprite,
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: 1,
        rotation: Math.PI * 2,
        yoyo: true,
        duration: 1000,
        repeat: -1
      });
    }
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('bossPhase2Announce'), '#ef4444');
  }

  enemy.scene.cameras.main.shake(350, 0.015);
  executeBossGroundStomp(enemy, towers, hero);
}

function executeBossGroundStomp(enemy: Enemy, towers?: Tower[], hero?: Hero): void {
  if (!enemy.isAlive || !enemy.scene) return;
  enemy.scene.cameras.main.shake(250, 0.012);

  let shockTint = 0xef4444;
  if (enemy.enemyType === EnemyType.GOLEM_BOSS) shockTint = 0xd97706;
  if (enemy.enemyType === EnemyType.FROST_GIANT_BOSS) shockTint = 0x38bdf8;
  if (enemy.enemyType === EnemyType.INFERNAL_BOSS) shockTint = 0xf97316;

  const shock = enemy.scene.add.sprite(enemy.x, enemy.y, 'fx_shockwave');
  shock.setTint(shockTint);
  shock.setScale(0.3).setAlpha(0.95);
  enemy.scene.tweens.add({
    targets: shock,
    scaleX: 2.2,
    scaleY: 2.2,
    alpha: 0,
    duration: 450,
    onComplete: () => shock.destroy()
  });

  if (towers) {
    for (const tower of towers) {
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, tower.x, tower.y) <= BOSS_STOMP_RADIUS) {
        tower.stun(BOSS_STOMP_STUN_MS);
      }
    }
  }

  if (hero?.isAlive && Phaser.Math.Distance.Between(enemy.x, enemy.y, hero.x, hero.y) <= BOSS_STOMP_RADIUS) {
    hero.applyStun(BOSS_STOMP_STUN_MS);
  }

  floatCombat(enemy.scene, enemy.x, enemy.y, t('bossStompAnnounce'), '#f97316');
}

function enterBossPhase3(enemy: Enemy): void {
  enemy.bossPhase = 3;
  enemy.hasEnteredPhase3 = true;

  const shieldAmount = Math.round(enemy.maxHp * 0.35);
  enemy.maxShield = (enemy.maxShield || 0) + shieldAmount;
  enemy.currentShield = (enemy.currentShield || 0) + shieldAmount;
  enemy.shieldRadius = 140;

  if (enemy.enemyType === EnemyType.GOLEM_BOSS) {
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('golemBossPhase3Announce'), '#78716c');
    enemy.spawnAlongPath(EnemyType.SCOUT, 20);
    enemy.spawnAlongPath(EnemyType.SOLDIER, 20);
  } else if (enemy.enemyType === EnemyType.FROST_GIANT_BOSS) {
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('frostGiantBossPhase3Announce'), '#38bdf8');
    enemy.spawnAlongPath(EnemyType.FLYER, 20);
    enemy.spawnAlongPath(EnemyType.FLYER, 20);
  } else if (enemy.enemyType === EnemyType.INFERNAL_BOSS) {
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('infernalBossPhase3Announce'), '#d97706');
    enemy.spawnAlongPath(EnemyType.TANK, 20);
    enemy.spawnAlongPath(EnemyType.TANK, 20);
  } else {
    if (!enemy.bossBlazingAegisGraphics && enemy.scene) {
      enemy.bossBlazingAegisGraphics = enemy.scene.add.graphics();
      enemy.add(enemy.bossBlazingAegisGraphics);
      drawBlazingAegis(enemy);
      enemy.scene.tweens.add({
        targets: enemy.bossBlazingAegisGraphics,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.9,
        yoyo: true,
        duration: 800,
        repeat: -1
      });
    }
    spawnBodyguardOrc(enemy);
    spawnBodyguardOrc(enemy);
    floatAnnounce(enemy.scene, enemy.x, enemy.y, t('bossPhase3Announce'), '#f97316');
  }

  enemy.refreshBars();
  enemy.scene.cameras.main.shake(400, 0.02);
}

export function drawBlazingAegis(enemy: Enemy): void {
  if (!enemy.bossBlazingAegisGraphics) return;
  enemy.bossBlazingAegisGraphics.clear();
  enemy.bossBlazingAegisGraphics.fillStyle(0xea580c, 0.25);
  enemy.bossBlazingAegisGraphics.fillCircle(0, 0, 52);
  enemy.bossBlazingAegisGraphics.lineStyle(3, 0xf97316, 0.95);
  enemy.bossBlazingAegisGraphics.strokeCircle(0, 0, 52);
  enemy.bossBlazingAegisGraphics.lineStyle(1.5, 0xfde047, 0.9);
  enemy.bossBlazingAegisGraphics.strokeCircle(0, 0, 46);
}

function spawnBodyguardOrc(enemy: Enemy): void {
  if (!enemy.isAlive || !enemy.scene) return;
  const bodyguard = enemy.spawnAlongPath(EnemyType.SOLDIER, 30);
  pulseRing(enemy.scene, bodyguard.x, bodyguard.y, 0xf97316, 20, 40, 300);
}

export function playBossDeathCinematic(enemy: Enemy): void {
  if (!enemy.scene) return;
  const { width, height } = enemy.scene.scale;
  const flash = enemy.scene.add.graphics().setDepth(9998);
  flash.fillStyle(0xfef08a, 0.55);
  flash.fillRect(0, 0, width, height);
  enemy.scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 380,
    ease: 'Quad.Out',
    onComplete: () => flash.destroy()
  });

  enemy.scene.time.timeScale = 0.18;
  enemy.scene.tweens.addCounter({
    from: 0.18,
    to: 1.0,
    duration: 450,
    ease: 'Cubic.Out',
    onUpdate: (tween: Phaser.Tweens.Tween) => {
      enemy.scene.time.timeScale = tween.getValue() ?? 1.0;
    },
    onComplete: () => {
      enemy.scene.time.timeScale = 1.0;
    }
  });

  enemy.scene.cameras.main?.shake(380, 0.022);

  const bossKillTxt = enemy.scene.add.text(width / 2, height / 2 - 30, t('bossSlainBanner'), {
    fontSize: '28px',
    fontStyle: 'bold',
    color: '#fef08a',
    stroke: '#7c2d12',
    strokeThickness: 7
  }).setOrigin(0.5).setDepth(9999).setScale(0.1);

  enemy.scene.tweens.add({
    targets: bossKillTxt,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 300,
    ease: 'Back.Out',
    onComplete: () => {
      enemy.scene.tweens.add({
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

export function tickTeleporters(enemy: Enemy, deltaMs: number): void {
  if (enemy.teleporterCooldownMs > 0) {
    enemy.teleporterCooldownMs -= deltaMs;
  }
  if (enemy.teleporterCooldownMs > 0) return;

  const teleporters = (enemy.scene as Phaser.Scene & { levelData?: { teleporters?: { from: Point; to: Point }[] } })
    ?.levelData?.teleporters;
  if (!teleporters?.length) return;

  for (const tp of teleporters) {
    if (Phaser.Math.Distance.Between(enemy.x, enemy.y, tp.from.x, tp.from.y) <= 24) {
      teleportTo(enemy, tp.to);
      break;
    }
  }
}

function teleportTo(enemy: Enemy, destination: Point): void {
  enemy.teleporterCooldownMs = 3000;
  pulseRing(enemy.scene, enemy.x, enemy.y, 0xa855f7, 22, 40, 300);
  enemy.x = destination.x;
  enemy.y = destination.y;
  enemy.snapToPathNear(destination);
  pulseRing(enemy.scene, destination.x, destination.y, 0x38bdf8, 10, 26, 300);
}

export function shareDamageWithShielder(target: Enemy, amount: number, allies?: Enemy[]): number {
  if (!allies) return amount;
  const nearbyShielder = allies.find(
    e => e !== target &&
      e.isAlive &&
      e.enemyType === EnemyType.SHIELDER &&
      e.currentShield > 0 &&
      Phaser.Math.Distance.Between(target.x, target.y, e.x, e.y) <= e.shieldRadius
  );
  if (!nearbyShielder) return amount;

  const halfDmg = amount * 0.5;
  nearbyShielder.takeShieldDamage(halfDmg);
  const line = target.scene.add.graphics();
  line.lineStyle(2, 0x06b6d4, 0.8);
  line.lineBetween(target.x, target.y, nearbyShielder.x, nearbyShielder.y);
  target.scene.time.delayedCall(100, () => line.destroy());
  return halfDmg;
}
