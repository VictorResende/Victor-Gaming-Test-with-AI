import Phaser from 'phaser';

export type SpeechBubbleType = 'normal' | 'shout' | 'crit';

export function attachComicSpeechBubble(
  host: Phaser.GameObjects.Container,
  scene: Phaser.Scene,
  previous: Phaser.GameObjects.Container | null,
  message: string,
  durationMs = 2500,
  bubbleType: SpeechBubbleType = 'normal',
  onGone?: () => void
): Phaser.GameObjects.Container {
  if (previous?.active) {
    previous.destroy();
  }

  const bubbleContainer = scene.add.container(0, -68);
  const textColor = bubbleType === 'crit' ? '#991b1b' : (bubbleType === 'shout' ? '#1e3a8a' : '#0f172a');
  const bubbleText = scene.add.text(0, -2, message.toUpperCase(), {
    fontFamily: 'Impact, Arial Black, Trebuchet MS, sans-serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: textColor,
    align: 'center',
    letterSpacing: 0.5
  }).setOrigin(0.5);

  const padX = 14;
  const padY = 8;
  const bw = Math.max(76, bubbleText.width + padX * 2);
  const bh = Math.max(28, bubbleText.height + padY * 2);
  const bubbleGfx = scene.add.graphics();

  bubbleGfx.fillStyle(0x000000, 0.35);
  bubbleGfx.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 3, bw, bh, 8);
  bubbleGfx.fillTriangle(-5 + 2, bh / 2 + 3, 5 + 2, bh / 2 + 3, -1 + 2, bh / 2 + 10 + 3);

  const bgColor = bubbleType === 'crit' ? 0xfef9c3 : (bubbleType === 'shout' ? 0xffedd5 : 0xffffff);
  bubbleGfx.fillStyle(bgColor, 1);
  bubbleGfx.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
  bubbleGfx.fillTriangle(-6, bh / 2 - 1, 6, bh / 2 - 1, -2, bh / 2 + 9);
  bubbleGfx.lineStyle(2.5, 0x0f172a, 1);
  bubbleGfx.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
  bubbleGfx.lineBetween(-6, bh / 2 - 1, -2, bh / 2 + 9);
  bubbleGfx.lineBetween(6, bh / 2 - 1, -2, bh / 2 + 9);
  bubbleGfx.fillStyle(bgColor, 1);
  bubbleGfx.fillRect(-5, bh / 2 - 2, 10, 3);

  bubbleContainer.add([bubbleGfx, bubbleText]);
  host.add(bubbleContainer);
  bubbleContainer.setScale(0.1);
  bubbleContainer.setAlpha(0);

  scene.tweens.add({
    targets: bubbleContainer,
    scaleX: 1.18,
    scaleY: 1.18,
    alpha: 1,
    duration: 160,
    ease: 'Back.easeOut',
    onComplete: () => {
      if (bubbleContainer.active) {
        scene.tweens.add({
          targets: bubbleContainer,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 100,
          ease: 'Sine.easeInOut'
        });
      }
    }
  });

  scene.tweens.add({
    targets: bubbleContainer,
    y: -73,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  scene.time.delayedCall(Math.max(500, durationMs - 250), () => {
    if (bubbleContainer.active) {
      scene.tweens.add({
        targets: bubbleContainer,
        scaleX: 0.15,
        scaleY: 0.15,
        alpha: 0,
        duration: 250,
        ease: 'Back.easeIn',
          onComplete: () => {
            bubbleContainer.destroy();
            onGone?.();
          }
      });
    }
  });

  return bubbleContainer;
}
