import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';
import { UI, UI_FONT } from './theme';

export { UI, UI_FONT };

export function applyUiScene(scene: Phaser.Scene): void {
  scene.input.topOnly = true;
  scene.input.setDefaultCursor('default');
}

export function delayedStart(scene: Phaser.Scene, key: string, data?: object): void {
  if (!scene.input.enabled) return;
  scene.input.enabled = false;
  scene.time.delayedCall(0, () => scene.scene.start(key, data));
}

export function paintBackdrop(
  scene: Phaser.Scene,
  width: number,
  height: number,
  highContrast = false
): void {
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x07080f, 0x0b1020, 0x12081a, 0x050508, 1);
  bg.fillRect(0, 0, width, height);

  const glow = scene.add.graphics();
  glow.fillStyle(0xf59e0b, highContrast ? 0.04 : 0.07);
  glow.fillCircle(width * 0.2, height * 0.32, 260);
  glow.fillStyle(0x6366f1, highContrast ? 0.04 : 0.08);
  glow.fillCircle(width * 0.82, height * 0.62, 300);

  const colors = [0x38bdf8, 0xa78bfa, 0xfbbf24];
  for (let i = 0; i < 14; i++) {
    const star = scene.add.circle(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height),
      Phaser.Math.Between(1, 2),
      colors[i % colors.length],
      Phaser.Math.FloatBetween(0.2, 0.55)
    );
    scene.tweens.add({
      targets: star,
      y: star.y - Phaser.Math.Between(12, 36),
      alpha: 0.1,
      duration: Phaser.Math.Between(4200, 7800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}

export function fillPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 14,
  opts?: { fill?: number; stroke?: number; alpha?: number; highContrast?: boolean }
): void {
  const fill = opts?.fill ?? (opts?.highContrast ? 0x09090b : UI.color.panel);
  const stroke = opts?.stroke ?? (opts?.highContrast ? UI.color.strokeHi : UI.color.stroke);
  g.fillStyle(fill, opts?.alpha ?? 0.94);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(opts?.highContrast ? 2 : 1, stroke, opts?.highContrast ? 1 : 0.85);
  g.strokeRoundedRect(x, y, w, h, radius);
}

export function fillPill(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = UI.color.panel,
  stroke = UI.color.stroke
): void {
  g.fillStyle(fill, 0.94);
  g.fillRoundedRect(x, y, w, h, h / 2);
  g.lineStyle(1, stroke, 0.9);
  g.strokeRoundedRect(x, y, w, h, h / 2);
}

export function uiText(
  color: string,
  size: string,
  extra?: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT,
    fontSize: size,
    color,
    ...extra
  };
}

export function bindControl(
  target: Phaser.GameObjects.Container,
  w: number,
  h: number,
  onClick: () => void,
  hover?: { enter: () => void; leave: () => void },
  onPointerDown?: (pointer: Phaser.Input.Pointer) => void
): void {
  const hitW = Math.max(w, UI.minTouch);
  const hitH = Math.max(h, UI.minTouch);
  target.setSize(hitW, hitH);
  target.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, hitW, hitH),
    Phaser.Geom.Rectangle.Contains
  );
  if (target.input) {
    target.input.cursor = 'pointer';
  }

  let over = false;
  target.on('pointerover', () => {
    over = true;
    hover?.enter();
  });
  target.on('pointerout', () => {
    over = false;
    hover?.leave();
  });
  if (onPointerDown) {
    target.on('pointerdown', (pointer: Phaser.Input.Pointer) => onPointerDown(pointer));
  }
  target.on('pointerup', () => {
    if (!over) return;
    hover?.enter();
    AudioManager.getInstance().playClick();
    onClick();
  });
}

/** Wire a container that already called setSize. */
export function bindSized(
  target: Phaser.GameObjects.Container,
  onClick: () => void,
  onPointerDown?: (pointer: Phaser.Input.Pointer) => void
): void {
  bindControl(target, target.width || UI.minTouch, target.height || UI.minTouch, onClick, undefined, onPointerDown);
}

export function addGhostButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 108,
  height = 40
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  fillPanel(bg, -width / 2, -height / 2, width, height, 12);
  const text = scene.add.text(0, 0, label, uiText(UI.text.primary, '14px', { fontStyle: '700' })).setOrigin(0.5);
  container.add([bg, text]);
  bindControl(container, width, height, onClick, {
    enter: () => {
      bg.clear();
      fillPanel(bg, -width / 2, -height / 2, width, height, 12, { stroke: UI.color.amber });
    },
    leave: () => {
      bg.clear();
      fillPanel(bg, -width / 2, -height / 2, width, height, 12);
    }
  });
  return container;
}

export function addPrimaryButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 160,
  height = 40
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const paint = (color: number) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
  };
  paint(UI.color.amber);
  const text = scene.add.text(0, 0, label, uiText(UI.text.ink, '14px', { fontStyle: '800' })).setOrigin(0.5);
  container.add([bg, text]);
  bindControl(container, width, height, onClick, {
    enter: () => paint(UI.color.amberHi),
    leave: () => paint(UI.color.amber)
  });
  return container;
}

export function addDangerButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 160,
  height = 40
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const paint = (fill: number) => {
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
  };
  paint(UI.color.danger);
  const text = scene.add.text(0, 0, label, uiText(UI.text.primary, '14px', { fontStyle: '800' })).setOrigin(0.5);
  container.add([bg, text]);
  bindControl(container, width, height, onClick);
  return container;
}

export function addStarChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  stars: number
): Phaser.GameObjects.Container {
  const chip = scene.add.container(x, y);
  const bg = scene.add.graphics();
  fillPill(bg, -56, -18, 112, 36);
  const label = scene.add.text(0, 0, `★  ${stars}`, uiText(UI.text.amber, '15px', { fontStyle: '600' })).setOrigin(0.5);
  chip.add([bg, label]);
  chip.setSize(112, UI.minTouch);
  return chip;
}

export function paintGlassRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 12,
  selected = false,
  customStroke?: number
): void {
  g.clear();
  g.fillStyle(selected ? 0x1c1917 : UI.color.panelHi, selected ? 1 : 0.96);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, customStroke ?? (selected ? UI.color.amber : UI.color.stroke), selected ? 1 : 0.9);
  g.strokeRoundedRect(x, y, w, h, radius);
}

export function hudStyle(
  size: string,
  color: string = UI.text.primary,
  extra?: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.Types.GameObjects.Text.TextStyle {
  return uiText(color, size, { fontStyle: '700', ...extra });
}

export function addModalClose(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onClick: () => void
): Phaser.GameObjects.Container {
  const closeBtn = scene.add.container(x, y);
  closeBtn.add(scene.add.text(0, 0, '✕', hudStyle('18px', UI.text.muted)).setOrigin(0.5));
  bindControl(closeBtn, 36, 36, onClick);
  return closeBtn;
}

export function createDimModal(
  scene: Phaser.Scene,
  depth: number,
  panelW: number,
  panelH: number,
  opts?: { stroke?: number; overlayAlpha?: number }
): Phaser.GameObjects.Container {
  const { width, height } = scene.scale;
  const root = scene.add.container(width / 2, height / 2);
  root.setDepth(depth);
  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, opts?.overlayAlpha ?? 0.82);
  overlay.setInteractive();
  const box = scene.add.graphics();
  fillPanel(box, -panelW / 2, -panelH / 2, panelW, panelH, 16, { alpha: 0.98, stroke: opts?.stroke });
  root.add([overlay, box]);
  return root;
}

export function addScreenTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, title, uiText(UI.text.primary, '20px', { fontStyle: '800' })).setOrigin(0.5);
}
