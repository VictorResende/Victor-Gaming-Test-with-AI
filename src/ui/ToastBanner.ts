import Phaser from 'phaser';
import { fillPanel, hudStyle, UI } from './UiKit';

export interface ToastConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  borderColor?: number;
  bgColor?: number;
  titleColor?: string;
  durationMs?: number;
}

export class ToastBanner {
  private queue: ToastConfig[] = [];
  private active = false;
  private current: Phaser.GameObjects.Container | null = null;

  reset(): void {
    this.queue = [];
    this.active = false;
    this.current?.destroy();
    this.current = null;
  }

  show(
    scene: Phaser.Scene,
    topY: number,
    title: string,
    subtitle?: string,
    icon?: string,
    customConfig?: Partial<ToastConfig>
  ): void {
    this.queue.push({
      title,
      subtitle,
      icon: icon || '📯',
      borderColor: customConfig?.borderColor || 0xfacc15,
      bgColor: customConfig?.bgColor || 0x12141c,
      titleColor: customConfig?.titleColor || '#fef08a',
      durationMs: customConfig?.durationMs || 2800
    });
    if (!this.active) this.processNext(scene, topY);
  }

  private processNext(scene: Phaser.Scene, topY: number): void {
    if (this.queue.length === 0) {
      this.active = false;
      return;
    }

    this.active = true;
    const config = this.queue.shift()!;
    const { width } = scene.scale;

    const toast = scene.add.container(width / 2, -60);
    toast.setDepth(9995);

    const bg = scene.add.graphics();
    fillPanel(bg, -220, -26, 440, 52, 14, { alpha: 0.96, stroke: config.borderColor || UI.color.amber });

    const iconTxt = scene.add.text(-190, 0, config.icon || '', { fontSize: '20px' }).setOrigin(0.5);
    const titleTxt = scene.add
      .text(-160, config.subtitle ? -10 : 0, config.title, hudStyle('13px', config.titleColor || UI.text.amber))
      .setOrigin(0, 0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, iconTxt, titleTxt];
    if (config.subtitle) {
      items.push(scene.add.text(-160, 11, config.subtitle, hudStyle('10px', UI.text.muted)).setOrigin(0, 0.5));
    }

    toast.add(items);
    this.current = toast;

    scene.tweens.add({
      targets: toast,
      y: topY,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => {
        scene.time.delayedCall(config.durationMs || 2800, () => {
          scene.tweens.add({
            targets: toast,
            y: -80,
            alpha: 0,
            duration: 250,
            ease: 'Quad.In',
            onComplete: () => {
              toast.destroy();
              this.current = null;
              this.processNext(scene, topY);
            }
          });
        });
      }
    });
  }
}
