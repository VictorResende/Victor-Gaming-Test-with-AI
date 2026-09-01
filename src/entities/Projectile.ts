import Phaser from 'phaser';
import { DamageType } from '../core/Constants';
import { Enemy, pickNearestEnemy } from './Enemy';
import { ModChip } from './ModChip';
import { HapticsManager } from '../managers/HapticsManager';

export class Projectile extends Phaser.GameObjects.Sprite {
  private target: Enemy | null = null;
  private speed = 650;
  private damage = 0;
  private damageType: DamageType = DamageType.PHYSICAL;
  private splashRadius = 0;
  private slowFactor?: number;
  private slowDuration?: number;
  private burnDPS?: number;
  private burnDurationMs?: number;
  private isHoming = false;
  private modChip: ModChip | null = null;
  private enemiesRef: Enemy[] = [];
  private pierceArmor = false;
  public isActive = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'proj_bullet');
    scene.add.existing(this);
    this.setVisible(false);
  }

  public fire(
    startX: number,
    startY: number,
    target: Enemy,
    damage: number,
    damageType: DamageType,
    textureKey: string,
    speed = 650,
    splashRadius = 0,
    slowFactor?: number,
    slowDuration?: number,
    enemiesList: Enemy[] = [],
    modChip?: ModChip | null,
    isHoming = false,
    burnDPS?: number,
    burnDurationMs?: number,
    ignoreArmor = false
  ): void {
    this.setPosition(startX, startY);
    this.setTexture(textureKey);
    this.target = target;
    this.damage = damage;
    this.damageType = damageType;
    this.speed = speed;
    this.splashRadius = splashRadius;
    this.slowFactor = slowFactor;
    this.slowDuration = slowDuration;
    this.enemiesRef = enemiesList;
    this.modChip = modChip || null;
    this.isHoming = isHoming;
    this.burnDPS = burnDPS;
    this.burnDurationMs = burnDurationMs;
    this.pierceArmor = ignoreArmor;
    this.isActive = true;
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(textureKey === 'proj_nuke' ? 1.4 : (textureKey === 'proj_missile' ? 1.2 : 1.0));
  }

  public updateProjectile(deltaMs: number, speedMultiplier: number): void {
    if (!this.isActive) return;

    const effectiveDelta = (deltaMs * speedMultiplier) / 1000;

    let targetX = this.x;
    let targetY = this.y;

    if (this.target && this.target.isAlive) {
      targetX = this.target.x;
      targetY = this.target.y;
    } else if (this.isHoming && this.enemiesRef.length > 0) {
      const next = pickNearestEnemy(this.x, this.y, this.enemiesRef);
      if (next) {
        this.target = next;
        targetX = next.x;
        targetY = next.y;
      }
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    const step = this.speed * effectiveDelta;

    if (dist <= step || dist < 12) {
      this.hit(targetX, targetY);
    } else {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * step;
      this.y += Math.sin(angle) * step;
      this.rotation = angle + Math.PI / 2;
    }
  }

  private hit(hitX: number, hitY: number): void {
    this.isActive = false;
    this.setVisible(false);

    // Mod Chip Crit & Damage calculations
    let hitDamage = this.damage;
    let isCrit = false;
    let ignoreArmor = this.pierceArmor;

    if (this.modChip) {
      const hit = this.modChip.applyToHit(hitDamage, this.target || undefined, this.pierceArmor);
      hitDamage = hit.damage;
      isCrit = hit.isCrit;
      ignoreArmor = hit.ignoreArmor;
    }

    if (this.splashRadius > 0) {
      // Dano em Área (Splash)
      HapticsManager.getInstance().cannonShot();
      this.enemiesRef.forEach(enemy => {
        if (enemy.isAlive) {
          const d = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
          if (d <= this.splashRadius) {
            const falloff = 1 - (d / this.splashRadius) * 0.4;
            enemy.takeDamage(hitDamage * falloff, this.damageType, true, this.enemiesRef, ignoreArmor, isCrit);
            if (this.slowFactor && this.slowDuration) {
              enemy.applyStatus('SLOW', this.slowDuration, this.slowFactor);
            }
            if (this.burnDPS && this.burnDurationMs) {
              enemy.applyStatus('BURN', this.burnDurationMs, undefined, this.burnDPS);
            }
          }
        }
      });

      // Efeito visual de explosão
      const blastColor = this.damageType === DamageType.FROST ? 0x06b6d4 : (this.burnDPS ? 0x84cc16 : 0xf97316);
      const circle = this.scene.add.circle(hitX, hitY, 10, blastColor, 0.75);
      this.scene.tweens.add({
        targets: circle,
        radius: this.splashRadius,
        alpha: 0,
        duration: 280,
        onComplete: () => circle.destroy()
      });

      if (this.target && this.modChip) {
        this.modChip.applyOnHitEffects(this.scene, hitX, hitY, this.target, hitDamage, this.damageType, this.enemiesRef);
      }
    } else {
      // Alvo único
      if (this.target && this.target.isAlive) {
        this.target.takeDamage(hitDamage, this.damageType, true, this.enemiesRef, ignoreArmor, isCrit);
        if (this.slowFactor && this.slowDuration) {
          this.target.applyStatus('SLOW', this.slowDuration, this.slowFactor);
        }
        if (this.burnDPS && this.burnDurationMs) {
          this.target.applyStatus('BURN', this.burnDurationMs, undefined, this.burnDPS);
        }

        if (this.modChip) {
          this.modChip.applyOnHitEffects(this.scene, hitX, hitY, this.target, hitDamage, this.damageType, this.enemiesRef);
        }
      }
    }
  }
}
