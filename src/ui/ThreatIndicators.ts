import Phaser from 'phaser';
import { EnemyType } from '../core/Constants';
import { Enemy } from '../entities/Enemy';
import { SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';

export class ThreatIndicators {
  private badges = new Map<Enemy, Phaser.GameObjects.Container>();

  reset(): void {
    this.badges.forEach(c => c.destroy());
    this.badges.clear();
  }

  update(
    scene: Phaser.Scene,
    enemies: Enemy[],
    safeBounds: SafeAreaBounds,
    safeInsets: SafeAreaInsets
  ): void {
    const { width, height } = scene.scale;
    const eliteEnemies = enemies.filter(e => e.active && (e.enemyType === EnemyType.BOSS || e.enemyType === EnemyType.CARRIER));

    this.badges.forEach((container, enemy) => {
      if (!enemy.active || !eliteEnemies.includes(enemy)) {
        container.destroy();
        this.badges.delete(enemy);
      }
    });

    const minX = safeBounds.left + 35;
    const maxX = safeBounds.right - 35;
    const minY = safeInsets.top + 70;
    const maxY = height - 100 - safeInsets.bottom;

    eliteEnemies.forEach(enemy => {
      let container = this.badges.get(enemy);
      if (!container) {
        container = scene.add.container(0, 0);
        container.setDepth(9980);

        const isBoss = enemy.enemyType === EnemyType.BOSS;
        const threatColor = isBoss ? 0xef4444 : 0xf59e0b;

        const badgeBg = scene.add.graphics();
        badgeBg.fillStyle(0x12141c, 0.95);
        badgeBg.fillRoundedRect(-22, -22, 44, 44, 10);
        badgeBg.lineStyle(2, threatColor, 1);
        badgeBg.strokeRoundedRect(-22, -22, 44, 44, 10);

        const iconTxt = scene.add.text(0, -4, isBoss ? '👑' : '💀', { fontSize: '18px' }).setOrigin(0.5);
        const hpTxt = scene.add.text(0, 12, '100%', {
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);

        container.add([badgeBg, iconTxt, hpTxt]);
        this.badges.set(enemy, container);
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const angle = Phaser.Math.Angle.Between(centerX, centerY, enemy.x, enemy.y);

      let edgeX = centerX + Math.cos(angle) * (width / 2 - 40);
      let edgeY = centerY + Math.sin(angle) * (height / 2 - 40);
      edgeX = Phaser.Math.Clamp(edgeX, minX, maxX);
      edgeY = Phaser.Math.Clamp(edgeY, minY, maxY);

      container.setPosition(edgeX, edgeY);
      container.setScale(1.0 + Math.sin(scene.time.now * 0.008) * 0.12);

      const hpTxt = container.getAt(2) as Phaser.GameObjects.Text;
      hpTxt.setText(`${Math.max(0, Math.round((enemy.currentHp / enemy.maxHp) * 100))}%`);
    });
  }
}
