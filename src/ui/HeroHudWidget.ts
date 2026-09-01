import Phaser from 'phaser';
import { Hero } from '../entities/Hero';
import { t } from '../i18n/locales';
import { bindControl, fillPanel, hudStyle, UI } from './UiKit';

export class HeroHudWidget {
  private title: Phaser.GameObjects.Text | null = null;
  private hpFill: Phaser.GameObjects.Graphics | null = null;
  private hpText: Phaser.GameObjects.Text | null = null;
  private xpFill: Phaser.GameObjects.Graphics | null = null;
  private xpText: Phaser.GameObjects.Text | null = null;
  private selection: Phaser.GameObjects.Graphics | null = null;

  create(scene: Phaser.Scene, x: number, y: number, hero: Hero): void {
    const root = scene.add.container(x, y);
    const bg = scene.add.graphics();
    fillPanel(bg, -52, -32, 128, 64, 14, { alpha: 0.92 });

    this.selection = scene.add.graphics();
    this.selection.lineStyle(2, UI.color.amber, 1);
    this.selection.strokeRoundedRect(-54, -34, 132, 68, 16);
    this.selection.setVisible(false);

    const portrait = scene.add.sprite(-24, 0, hero.config.portraitKey).setScale(0.78);
    this.title = scene.add.text(12, -18, t('heroLevel', { lvl: hero.level }), hudStyle('12px', UI.text.amber)).setOrigin(0, 0.5);

    const hpBg = scene.add.graphics();
    hpBg.fillStyle(0x09090b, 0.85);
    hpBg.fillRoundedRect(12, -8, 54, 8, 4);
    this.hpFill = scene.add.graphics();
    this.hpFill.fillStyle(0x22c55e, 1);
    this.hpFill.fillRoundedRect(12, -8, 54, 8, 4);
    this.hpText = scene.add.text(39, -4, `${Math.round(hero.currentHp)}`, hudStyle('9px')).setOrigin(0.5);

    const xpBg = scene.add.graphics();
    xpBg.fillStyle(0x09090b, 0.85);
    xpBg.fillRoundedRect(12, 8, 54, 6, 3);
    this.xpFill = scene.add.graphics();
    this.xpFill.fillStyle(0x38bdf8, 1);
    this.xpFill.fillRoundedRect(12, 8, 0, 6, 3);
    this.xpText = scene.add.text(39, 11, `${hero.currentXp}/${hero.xpToNextLevel}`, hudStyle('8px', '#e0f2fe')).setOrigin(0.5);

    root.add([bg, this.selection, portrait, this.title, hpBg, this.hpFill, this.hpText, xpBg, this.xpFill, this.xpText]);
    bindControl(root, 128, 64, () => {
      hero.setSelected(!hero.isSelected);
    });
  }

  setSelected(on: boolean): void {
    this.selection?.setVisible(on);
  }

  refreshHp(current: number, max: number, isDead = false): void {
    if (!this.hpFill || !this.hpText) return;
    this.hpFill.clear();
    const ratio = Math.max(0, current / max);
    this.hpFill.fillStyle(isDead ? 0xef4444 : ratio < 0.3 ? 0xef4444 : 0x22c55e, 1);
    this.hpFill.fillRoundedRect(12, -8, 54 * ratio, 8, 4);
    this.hpText.setText(isDead ? t('heroDead') : `${Math.round(current)}`);
  }

  refreshXp(current: number, max: number, level: number): void {
    if (!this.xpFill || !this.xpText || !this.title) return;
    this.title.setText(t('heroLevel', { lvl: level }));
    this.xpFill.clear();
    this.xpFill.fillStyle(0x38bdf8, 1);
    this.xpFill.fillRoundedRect(12, 8, 54 * Math.min(1, current / max), 6, 3);
    this.xpText.setText(`${current}/${max}`);
  }
}
