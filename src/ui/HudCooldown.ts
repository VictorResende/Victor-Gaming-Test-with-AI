import Phaser from 'phaser';

export function paintCooldownWedge(
  g: Phaser.GameObjects.Graphics,
  progress: number,
  radius = 22,
  alpha = 0.75
): void {
  g.clear();
  if (progress >= 1) return;
  g.fillStyle(0x000000, alpha);
  g.beginPath();
  g.moveTo(0, 0);
  g.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress), false);
  g.closePath();
  g.fillPath();
}
