import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';

export interface SpringFeedbackOptions {
  baseScale?: number;
  pressScale?: number;
  releaseScale?: number;
  rippleColor?: number;
  rippleRadius?: number;
  sound?: boolean;
  haptic?: boolean;
  onClick?: (pointer: Phaser.Input.Pointer) => void;
  onPointerDown?: (pointer: Phaser.Input.Pointer) => void;
  onPointerUp?: (pointer: Phaser.Input.Pointer) => void;
  disabled?: () => boolean;
}

/**
 * Anexa micro-interações elásticas com física de mola (spring) e efeito de ripple/glow a qualquer elemento interativo.
 * Totalmente robusto contra toques móveis e cliques de mouse no desktop (sem perda de clique por redimensionamento).
 */
export function attachSpringFeedback(
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Shape | any,
  scene: Phaser.Scene,
  options: SpringFeedbackOptions = {}
): void {
  const baseScale = options.baseScale ?? (target.scaleX || 1.0);
  const pressScale = options.pressScale ?? (baseScale * 0.93);
  const releaseScale = options.releaseScale ?? (baseScale * 1.06);
  const soundEnabled = options.sound ?? true;
  const hapticEnabled = options.haptic ?? true;

  target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (options.disabled && options.disabled()) return;

    if (soundEnabled) {
      AudioManager.getInstance().playClick();
    }
    if (hapticEnabled) {
      HapticsManager.getInstance().tap();
    }

    // Cria Efeito de Brilho / Ripple
    createRippleHighlight(scene, target, options.rippleColor || 0xfacc15, options.rippleRadius);

    // Micro-interação de compressão elástica rápida
    scene.tweens.killTweensOf(target);
    scene.tweens.add({
      targets: target,
      scaleX: pressScale,
      scaleY: pressScale,
      duration: 60,
      ease: 'Quad.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: target,
          scaleX: releaseScale,
          scaleY: releaseScale,
          duration: 90,
          ease: 'Back.Out',
          onComplete: () => {
            scene.tweens.add({
              targets: target,
              scaleX: baseScale,
              scaleY: baseScale,
              duration: 80,
              ease: 'Sine.InOut'
            });
          }
        });
      }
    });

    if (options.onPointerDown) {
      options.onPointerDown(pointer);
    }

    // Executa onClick no pointerdown para resposta tátil instantânea no mobile e web
    if (options.onClick) {
      options.onClick(pointer);
    }
  });

  target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (options.disabled && options.disabled()) return;
    if (options.onPointerUp) {
      options.onPointerUp(pointer);
    }
  });
}

function createRippleHighlight(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | any,
  color: number,
  customRadius?: number
): void {
  if (!scene || !scene.add) return;

  const targetX = target.x;
  const targetY = target.y;
  const radius = customRadius || (target.width ? Math.max(target.width, target.height) * 0.45 : 30);

  const ripple = scene.add.circle(targetX, targetY, 8, color, 0.45);
  ripple.setDepth(9995);

  scene.tweens.add({
    targets: ripple,
    scaleX: radius / 8,
    scaleY: radius / 8,
    alpha: 0,
    duration: 320,
    ease: 'Quad.Out',
    onComplete: () => {
      ripple.destroy();
    }
  });
}
