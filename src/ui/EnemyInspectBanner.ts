import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { enemyDisplayName } from '../config/gameConfig';
import { describeEnemyThreat } from './resistanceText';
import { fillPanel, hudStyle, UI } from './UiKit';

export class EnemyInspectBanner {
  private panel!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;

  create(scene: Phaser.Scene, width: number, topY: number): void {
    this.panel = scene.add.container(width / 2, topY);
    this.panel.setDepth(9200);
    this.panel.setVisible(false);
    const bg = scene.add.graphics();
    fillPanel(bg, -250, -28, 500, 56, 12, { alpha: 0.94 });
    this.title = scene.add.text(-236, -10, '', hudStyle('13px', UI.text.amber, { fontStyle: '700' })).setOrigin(0, 0.5);
    this.body = scene.add.text(-236, 10, '', hudStyle('11px', '#7dd3fc', { wordWrap: { width: 470 } })).setOrigin(0, 0.5);
    this.panel.add([bg, this.title, this.body]);
  }

  show(scene: Phaser.Scene, enemy: Enemy): void {
    this.title.setText(enemyDisplayName(enemy.config));
    this.body.setText(describeEnemyThreat(enemy.config));
    this.panel.setVisible(true);
    scene.time.delayedCall(4200, () => {
      if (this.panel.visible) this.panel.setVisible(false);
    });
  }
}
