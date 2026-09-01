import Phaser from 'phaser';
import { TowerType } from '../core/Constants';
import { GameScene } from '../scenes/GameScene';

export class BuildDeckDrag {
  skipClick = false;
  private dragging = false;
  private dragged: TowerType | null = null;
  private potential: TowerType | null = null;
  private startX = 0;
  private startY = 0;

  arm(type: TowerType, pointer: Phaser.Input.Pointer): void {
    this.startX = pointer.worldX;
    this.startY = pointer.worldY;
    this.potential = type;
  }

  bind(scene: Phaser.Scene, game: GameScene): void {
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.potential && !this.dragging) {
        const dist = Phaser.Math.Distance.Between(this.startX, this.startY, pointer.worldX, pointer.worldY);
        if (dist > 12) {
          this.dragging = true;
          this.skipClick = true;
          this.dragged = this.potential;
          game.startTowerDrag(this.dragged, pointer.worldX, pointer.worldY);
          this.potential = null;
        }
      }
      if (this.dragging && this.dragged) {
        game.updateTowerDrag(pointer.worldX, pointer.worldY);
      }
    });
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.potential = null;
      if (this.dragging && this.dragged) {
        game.finishTowerDrag(pointer.worldX, pointer.worldY);
        this.dragging = false;
        this.dragged = null;
      }
    });
  }
}
