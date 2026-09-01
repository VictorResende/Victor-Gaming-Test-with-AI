import Phaser from 'phaser';
import { DamageType } from '../core/Constants';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { AudioManager } from '../managers/AudioManager';

export class MiniTurret extends Phaser.GameObjects.Container {
  public isAlive = true;
  private lifeTimerMs: number;
  private damage: number;
  private range: number;
  private fireCooldownMs = 0;
  private fireRate = 3.5;
  private baseSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, durationMs: number, damage: number, range = 160) {
    super(scene, x, y);
    this.lifeTimerMs = durationMs;
    this.damage = damage;
    this.range = range;

    this.baseSprite = scene.add.sprite(0, 0, 'turret_mini_drone');
    this.add(this.baseSprite);

    const rangeGraphics = scene.add.graphics();
    this.add(rangeGraphics);

    scene.add.existing(this);

    this.setScale(0.2);
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  public updateTurret(deltaMs: number, speedMultiplier: number, enemies: Enemy[], projectilesPool?: { get: () => Projectile }): void {
    if (!this.isAlive) return;

    const effectiveDelta = deltaMs * speedMultiplier;
    this.lifeTimerMs -= effectiveDelta;
    this.fireCooldownMs = Math.max(0, this.fireCooldownMs - effectiveDelta);

    if (this.lifeTimerMs <= 0) {
      this.destroyTurret();
      return;
    }

    const target = enemies.find(e => e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.range);
    if (target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.baseSprite.rotation = angle + Math.PI / 2;

      if (this.fireCooldownMs <= 0) {
        this.fireCooldownMs = 1000 / this.fireRate;
        if (projectilesPool) {
          const proj = projectilesPool.get();
          proj.fire(this.x, this.y, target, this.damage, DamageType.LASER, 'proj_bullet', 800);
        } else {
          target.takeDamage(this.damage, DamageType.LASER);
        }
        AudioManager.getInstance().playGatling();
      }
    }
  }

  public destroyTurret(): void {
    this.isAlive = false;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }
}
