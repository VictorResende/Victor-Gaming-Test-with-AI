import Phaser from 'phaser';
import { DamageType, ModChipType } from '../core/Constants';
import { MOD_CHIPS_CONFIG, ModChipData, ModChipStats } from '../config/modChipsConfig';
import { Enemy } from './Enemy';

export class ModChip {
  public type: ModChipType;
  public data: ModChipData;
  public stats: ModChipStats;

  constructor(type: ModChipType) {
    this.type = type;
    this.data = MOD_CHIPS_CONFIG[type];
    this.stats = this.data.stats;
  }

  public checkCritical(): { isCrit: boolean; multiplier: number } {
    if (this.type === ModChipType.CRITICAL_STRIKE && this.stats.critChance) {
      const roll = Math.random();
      if (roll < this.stats.critChance) {
        return { isCrit: true, multiplier: this.stats.critMultiplier || 2.5 };
      }
    }
    return { isCrit: false, multiplier: 1.0 };
  }

  public modifyDamage(damage: number, target?: Enemy): { finalDamage: number; ignoreArmor: boolean } {
    let finalDamage = damage;
    let ignoreArmor = false;

    if (this.type === ModChipType.ARMOR_PIERCE) {
      ignoreArmor = true;
      if (target && target.config.armor > 0 && this.stats.bonusArmoredDamageMultiplier) {
        finalDamage *= this.stats.bonusArmoredDamageMultiplier;
      }
    }

    return { finalDamage, ignoreArmor };
  }

  public applyOnHitEffects(
    scene: Phaser.Scene,
    hitX: number,
    hitY: number,
    primaryTarget: Enemy,
    damage: number,
    damageType: DamageType,
    allEnemies: Enemy[]
  ): void {
    // 1. Cryo Blast AoE Slow Shockwave
    if (this.type === ModChipType.CRYO_BLAST && this.stats.cryoBlastRadius) {
      const radius = this.stats.cryoBlastRadius;
      const slowFactor = this.stats.slowFactor || 0.6;
      const slowDuration = this.stats.slowDuration || 3000;

      // Animação de anel de gelo
      const frostRing = scene.add.circle(hitX, hitY, 12, 0x06b6d4, 0.8);
      scene.tweens.add({
        targets: frostRing,
        radius: radius,
        alpha: 0,
        duration: 300,
        onComplete: () => frostRing.destroy()
      });

      allEnemies.forEach(e => {
        if (e.isAlive) {
          const dist = Phaser.Math.Distance.Between(hitX, hitY, e.x, e.y);
          if (dist <= radius) {
            e.applyStatus('SLOW', slowDuration, slowFactor);
            if (e !== primaryTarget) {
              e.takeDamage(damage * 0.35, DamageType.FROST);
            }
          }
        }
      });
    }

    // 2. Chain Ricochet
    if (this.type === ModChipType.CHAIN_RICOCHET && this.stats.bounceCount) {
      const bounceCount = this.stats.bounceCount;
      const radius = this.stats.bounceRadius || 130;
      const dmgMult = this.stats.bounceDamageMultiplier || 0.7;

      const hitEnemies: Enemy[] = [primaryTarget];
      let currentSource = primaryTarget;

      for (let i = 0; i < bounceCount; i++) {
        const candidates = allEnemies.filter(
          e => e.isAlive && !hitEnemies.includes(e) && Phaser.Math.Distance.Between(currentSource.x, currentSource.y, e.x, e.y) <= radius
        );
        if (candidates.length === 0) break;

        const nextTarget = candidates[0];
        hitEnemies.push(nextTarget);

        // Visual beam / tracer between bounced targets
        const line = scene.add.graphics();
        line.lineStyle(2, 0xfacc15, 0.9);
        line.lineBetween(currentSource.x, currentSource.y, nextTarget.x, nextTarget.y);
        scene.tweens.add({
          targets: line,
          alpha: 0,
          duration: 180,
          onComplete: () => line.destroy()
        });

        nextTarget.takeDamage(damage * dmgMult, damageType);
        currentSource = nextTarget;
      }
    }
  }
}
