import Phaser from 'phaser';

export function floatAnnounce(scene: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const txt = scene.add.text(x, y - 45, text, {
    fontSize: '15px',
    fontStyle: 'bold',
    color,
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: txt,
    y: txt.y - 35,
    scaleX: 1.2,
    scaleY: 1.2,
    alpha: 0,
    duration: 1400,
    onComplete: () => txt.destroy()
  });
}

export function floatCombat(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff'): void {
  const txt = scene.add.text(x + Phaser.Math.Between(-10, 10), y - 32, text, {
    fontSize: '13px',
    fontStyle: 'bold',
    color,
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: txt,
    y: txt.y - 25,
    alpha: 0,
    duration: 800,
    onComplete: () => txt.destroy()
  });
}

export function floatHeal(scene: Phaser.Scene, x: number, y: number, amount: number): void {
  const txt = scene.add.text(x + Phaser.Math.Between(-10, 10), y - 30, `💚+${amount}`, {
    fontSize: '13px',
    fontStyle: 'bold',
    color: '#4ade80',
    stroke: '#064e3b',
    strokeThickness: 3
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: txt,
    y: txt.y - 25,
    alpha: 0,
    duration: 750,
    onComplete: () => txt.destroy()
  });
}

export function pulseRing(scene: Phaser.Scene, x: number, y: number, color: number, startRadius: number, endRadius: number, duration: number): void {
  const ring = scene.add.circle(x, y, startRadius, color, 0.9);
  scene.tweens.add({
    targets: ring,
    radius: endRadius,
    alpha: 0,
    duration,
    onComplete: () => ring.destroy()
  });
}
