import Phaser from 'phaser';
import { t, setLanguage, getLanguage } from '../i18n/locales';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { getDailyChallenge, MODIFIER_INFO } from '../config/dailyChallengeConfig';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { ACHIEVEMENTS_LIST, achievementBlurb, achievementTitle } from '../config/achievementsConfig';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MIN_TOUCH = 48;

interface ModalHandle {
  root: Phaser.GameObjects.Container;
  close: () => void;
}

/**
 * Main menu: cinematic brand column + primary campaign CTA, compact mode cards,
 * and a glass overlay system for daily / settings / achievements.
 */
export class MenuScene extends Phaser.Scene {
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;
  private highContrast = false;
  private activeModal: ModalHandle | null = null;
  private escHandler?: () => void;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    this.highContrast = SaveManager.getInstance().isHighContrast();

    this.input.topOnly = true;
    this.input.setDefaultCursor('default');

    this.createBackground(width, height);
    this.createBrandColumn(width, height);
    this.createActionColumn(width, height);
    this.createTopBar(width);
    this.bindEscape();
    this.input.once('pointerdown', () => AudioManager.getInstance().ensureMusic());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.closeActiveModal();
      if (this.escHandler && this.input.keyboard) {
        this.input.keyboard.off('keydown-ESC', this.escHandler);
      }
      this.input.setDefaultCursor('default');
    });
  }

  private bindEscape(): void {
    this.escHandler = () => this.closeActiveModal();
    this.input.keyboard?.on('keydown-ESC', this.escHandler);
  }

  private closeActiveModal(): void {
    if (!this.activeModal) return;
    this.activeModal.close();
    this.activeModal = null;
  }

  private uiStroke(): number {
    return this.highContrast ? 0xf8fafc : 0x3f3f46;
  }

  private panelFill(): number {
    return this.highContrast ? 0x09090b : 0x12141c;
  }

  // ==========================================
  // ATMOSPHERE
  // ==========================================
  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x07080f, 0x0b1020, 0x12081a, 0x050508, 1);
    bg.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    glow.fillStyle(0xf59e0b, 0.07);
    glow.fillCircle(width * 0.22, height * 0.38, 280);
    glow.fillStyle(0x6366f1, 0.08);
    glow.fillCircle(width * 0.78, height * 0.55, 320);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.35);
    vignette.fillRect(0, 0, width, 72);
    vignette.fillRect(0, height - 64, width, 64);

    const colors = [0x38bdf8, 0xa78bfa, 0xfbbf24];
    for (let i = 0; i < 18; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        colors[i % colors.length],
        Phaser.Math.FloatBetween(0.25, 0.7)
      );
      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(16, 40),
        alpha: 0.12,
        duration: Phaser.Math.Between(4200, 7800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createTopBar(width: number): void {
    const save = SaveManager.getInstance().getData();
    const y = this.safeInsets.top + 28;
    const chip = this.add.container(this.safeBounds.right - 72, y);

    const bg = this.add.graphics();
    this.drawPill(bg, -64, -18, 128, 36, this.panelFill(), this.uiStroke());
    const label = this.add.text(0, 0, `★  ${save.availableStars}`, {
      fontFamily: FONT,
      fontSize: '15px',
      fontStyle: '600',
      color: '#fbbf24'
    }).setOrigin(0.5);

    chip.add([bg, label]);
    chip.setSize(128, MIN_TOUCH);
  }

  private createBrandColumn(_width: number, height: number): void {
    const save = SaveManager.getInstance().getData();
    const x = this.safeBounds.left + 56;
    const y = height * 0.38;

    const kicker = this.add.text(x, y - 86, t('subtitle').toUpperCase(), {
      fontFamily: FONT,
      fontSize: '12px',
      fontStyle: '600',
      color: '#fbbf24',
      letterSpacing: 2.4
    }).setOrigin(0, 0.5);

    const title = this.add.text(x, y - 28, t('gameTitle'), {
      fontFamily: FONT,
      fontSize: '34px',
      fontStyle: '800',
      color: this.highContrast ? '#ffffff' : '#fafafa',
      wordWrap: { width: 520 },
      lineSpacing: 6
    }).setOrigin(0, 0.5);

    const hint = this.add.text(x, y + 48, t('playHint'), {
      fontFamily: FONT,
      fontSize: '15px',
      color: '#a1a1aa'
    }).setOrigin(0, 0.5);

    const records: string[] = [];
    if (save.bossRushBestWave > 0) {
      records.push(t('bossRushBest', { wave: save.bossRushBestWave }));
    }
    if (save.endlessBestWave > 0) {
      records.push(t('endlessBest', { wave: save.endlessBestWave }));
    }
    if (records.length > 0) {
      this.add.text(x, Math.min(height - this.safeInsets.bottom - 28, y + 108), records.join('   ·   '), {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#71717a'
      }).setOrigin(0, 0.5);
    }

    void kicker;
    void title;
    void hint;
  }

  private createActionColumn(width: number, height: number): void {
    const colX = Math.min(width - this.safeInsets.right - 220, width * 0.72);
    const startY = height * 0.28;

    this.add.text(colX - 168, startY - 58, t('modes'), {
      fontFamily: FONT,
      fontSize: '11px',
      fontStyle: '700',
      color: '#71717a',
      letterSpacing: 1.8
    }).setOrigin(0, 0.5);

    this.createPrimaryButton(colX, startY, t('playCampaign'), () => {
      this.navigate('LevelSelectScene');
    });

    const cardY = startY + 108;
    const gap = 124;
    this.createModeCard(colX - gap, cardY, '📜', t('dailyChallenge'), 0x34d399, () => this.showDailyChallengeModal());
    this.createModeCard(colX, cardY, '👑', t('bossRush'), 0xfbbf24, () => {
      this.navigate('GameScene', { isBossRush: true });
    });
    this.createModeCard(colX + gap, cardY, '∞', t('endless'), 0xa78bfa, () => {
      this.navigate('LevelSelectScene', { endlessPick: true });
    });

    this.add.text(colX - 168, cardY + 86, t('progress'), {
      fontFamily: FONT,
      fontSize: '11px',
      fontStyle: '700',
      color: '#71717a',
      letterSpacing: 1.8
    }).setOrigin(0, 0.5);

    const tileY = cardY + 132;
    const tileGap = 92;
    this.createIconTile(colX - tileGap * 1.5, tileY, '📖', t('techTree'), () => this.navigate('TechTreeScene'));
    this.createIconTile(colX - tileGap * 0.5, tileY, '✦', t('heroTalents'), () => this.navigate('HeroTalentsScene'));
    this.createIconTile(colX + tileGap * 0.5, tileY, '◆', t('achievements'), () => this.showAchievementsModal());
    this.createIconTile(colX + tileGap * 1.5, tileY, '⚙', t('settings'), () => this.showSettingsModal());
  }

  /** Start the next scene on the following tick so this pointer event cannot hit it. */
  private navigate(key: string, data?: object): void {
    if (!this.input.enabled) return;
    this.input.enabled = false;
    this.time.delayedCall(0, () => this.scene.start(key, data));
  }

  // ==========================================
  // CONTROLS
  // ==========================================
  private createPrimaryButton(x: number, y: number, label: string, onClick: () => void): void {
    const w = 360;
    const h = 58;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xf59e0b, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    if (this.highContrast) {
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    }

    const text = this.add.text(0, 0, label, {
      fontFamily: FONT,
      fontSize: '18px',
      fontStyle: '800',
      color: '#111827',
      letterSpacing: 0.6
    }).setOrigin(0.5);

    container.add([bg, text]);
    this.bindControl(container, w, h, onClick, {
      enter: () => {
        bg.clear();
        bg.fillStyle(0xfbbf24, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      },
      leave: () => {
        bg.clear();
        bg.fillStyle(0xf59e0b, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      }
    });
  }

  private createModeCard(
    x: number,
    y: number,
    icon: string,
    label: string,
    accent: number,
    onClick: () => void
  ): void {
    const w = 112;
    const h = 96;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawPanel(bg, -w / 2, -h / 2, w, h, 14);
    bg.fillStyle(accent, 0.14);
    bg.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, 36, 10);

    const iconTxt = this.add.text(0, -18, icon, { fontSize: '20px' }).setOrigin(0.5);
    const name = this.add.text(0, 22, label, {
      fontFamily: FONT,
      fontSize: '11px',
      fontStyle: '700',
      color: '#e4e4e7',
      align: 'center',
      wordWrap: { width: w - 16 }
    }).setOrigin(0.5);

    container.add([bg, iconTxt, name]);
    this.bindControl(container, w, h, onClick, {
      enter: () => container.setAlpha(1),
      leave: () => container.setAlpha(0.92)
    });
    container.setAlpha(0.92);
  }

  private createIconTile(x: number, y: number, icon: string, label: string, onClick: () => void): void {
    const w = 84;
    const h = 72;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawPanel(bg, -w / 2, -h / 2, w, h, 14);

    const iconTxt = this.add.text(0, -12, icon, { fontSize: '18px', color: '#fafafa' }).setOrigin(0.5);
    const name = this.add.text(0, 18, label, {
      fontFamily: FONT,
      fontSize: '9px',
      fontStyle: '600',
      color: '#a1a1aa',
      align: 'center',
      wordWrap: { width: w - 8 }
    }).setOrigin(0.5);

    container.add([bg, iconTxt, name]);
    this.bindControl(container, w, h, onClick, {
      enter: () => container.setAlpha(1),
      leave: () => container.setAlpha(0.92)
    });
    container.setAlpha(0.92);
  }

  /**
   * Interactive area matches the visual (origin 0.5 + Phaser displayOrigin).
   * Hover never scales the hit target; click fires on pointerup while still over.
   */
  private bindControl(
    target: Phaser.GameObjects.Container,
    w: number,
    h: number,
    onClick: () => void,
    hover?: { enter: () => void; leave: () => void }
  ): void {
    const hitW = Math.max(w, MIN_TOUCH);
    const hitH = Math.max(h, MIN_TOUCH);
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
    target.on('pointerup', () => {
      if (!over) return;
      hover?.enter();
      AudioManager.getInstance().playClick();
      onClick();
    });
  }

  private drawPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number): void {
    g.fillStyle(this.panelFill(), 0.92);
    g.fillRoundedRect(x, y, w, h, r);
    g.lineStyle(this.highContrast ? 2 : 1, this.uiStroke(), this.highContrast ? 1 : 0.85);
    g.strokeRoundedRect(x, y, w, h, r);
  }

  private drawPill(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, stroke: number): void {
    g.fillStyle(fill, 0.94);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(1, stroke, 0.9);
    g.strokeRoundedRect(x, y, w, h, h / 2);
  }

  // ==========================================
  // MODAL SHELL
  // ==========================================
  private openModal(
    panelW: number,
    panelH: number,
    title: string,
    build: (modal: Phaser.GameObjects.Container) => void
  ): void {
    this.closeActiveModal();

    const { width, height } = this.scale;
    const root = this.add.container(0, 0);
    root.setDepth(2000);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.closeActiveModal());

    const panel = this.add.container(width / 2, height / 2);
    const panelBg = this.add.graphics();
    this.drawPanel(panelBg, -panelW / 2, -panelH / 2, panelW, panelH, 20);
    const catchClicks = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.001);
    catchClicks.setInteractive();

    const heading = this.add.text(-panelW / 2 + 28, -panelH / 2 + 28, title, {
      fontFamily: FONT,
      fontSize: '20px',
      fontStyle: '800',
      color: '#fafafa'
    }).setOrigin(0, 0.5);

    const closeBtn = this.add.container(panelW / 2 - 28, -panelH / 2 + 28);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x27272a, 1);
    closeBg.fillRoundedRect(-20, -20, 40, 40, 12);
    closeBg.lineStyle(1, this.uiStroke(), 1);
    closeBg.strokeRoundedRect(-20, -20, 40, 40, 12);
    const closeTxt = this.add.text(0, 0, '✕', {
      fontFamily: FONT,
      fontSize: '16px',
      color: '#e4e4e7'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    this.bindControl(closeBtn, 40, 40, () => this.closeActiveModal());

    panel.add([panelBg, catchClicks, heading, closeBtn]);
    root.add([overlay, panel]);
    build(panel);

    const close = () => {
      this.input.setDefaultCursor('default');
      root.destroy();
    };
    this.activeModal = { root, close };
  }

  // ==========================================
  // DAILY
  // ==========================================
  private showDailyChallengeModal(): void {
    const daily = getDailyChallenge();
    const isCompleted = SaveManager.getInstance().isDailyChallengeCompleted(daily.dateStr);

    this.openModal(520, 420, t('dailyChallengeTitle'), (panel) => {
      panel.add(this.add.text(0, -148, `${daily.dateStr}  ·  +${daily.rewardStars} ★`, {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#fbbf24'
      }).setOrigin(0.5));

      panel.add(this.add.text(0, -118, t('dailyChallengeDesc'), {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#a1a1aa',
        align: 'center',
        wordWrap: { width: 440 }
      }).setOrigin(0.5));

      daily.modifiers.forEach((mod, idx) => {
        const info = MODIFIER_INFO[mod];
        const y = -48 + idx * 78;
        const card = this.add.graphics();
        this.drawPanel(card, -210, y, 420, 68, 14);
        const accent = Phaser.Display.Color.HexStringToColor(info.colorHex).color;
        card.fillStyle(accent, 0.16);
        card.fillRoundedRect(-210, y, 8, 68, 4);

        panel.add(card);
        panel.add(this.add.text(-184, y + 22, info.icon, { fontSize: '20px' }).setOrigin(0.5));
        panel.add(this.add.text(-158, y + 18, t(info.nameKey as 'modDoubleCostName'), {
          fontFamily: FONT,
          fontSize: '14px',
          fontStyle: '700',
          color: info.colorHex
        }).setOrigin(0, 0.5));
        panel.add(this.add.text(-158, y + 42, t(info.descKey as 'modDoubleCostDesc'), {
          fontFamily: FONT,
          fontSize: '12px',
          color: '#a1a1aa',
          wordWrap: { width: 340 }
        }).setOrigin(0, 0.5));
      });

      const cta = this.add.container(0, 162);
      const ctaBg = this.add.graphics();
      ctaBg.fillStyle(isCompleted ? 0x3f3f46 : 0xf59e0b, 1);
      ctaBg.fillRoundedRect(-140, -24, 280, 48, 14);
      const ctaTxt = this.add.text(0, 0, isCompleted ? t('dailyCompleted') : t('play'), {
        fontFamily: FONT,
        fontSize: '15px',
        fontStyle: '800',
        color: isCompleted ? '#fafafa' : '#111827'
      }).setOrigin(0.5);
      cta.add([ctaBg, ctaTxt]);
      this.bindControl(cta, 280, 48, () => {
        this.closeActiveModal();
        this.navigate('GameScene', {
          isDailyChallenge: true,
          dailyDate: daily.dateStr,
          modifiers: daily.modifiers
        });
      });
      panel.add(cta);
    });
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  private showSettingsModal(): void {
    const save = SaveManager.getInstance();
    const data = save.getData();

    this.openModal(480, 430, t('settings'), (panel) => {
      const rows: Array<{ label: string; on: boolean; toggle: () => void }> = [
        {
          label: `${t('language')}: ${getLanguage().toUpperCase()}`,
          on: getLanguage() === 'en',
          toggle: () => {
            const nextLang = getLanguage() === 'pt' ? 'en' : 'pt';
            setLanguage(nextLang);
            data.settings.language = nextLang;
            save.save();
            this.closeActiveModal();
            this.scene.restart();
          }
        },
        {
          label: t('sound'),
          on: data.settings.sfxEnabled,
          toggle: () => {
            data.settings.sfxEnabled = !data.settings.sfxEnabled;
            save.save();
            AudioManager.getInstance().updateVolumes();
            this.showSettingsModal();
          }
        },
        {
          label: t('music'),
          on: data.settings.musicEnabled,
          toggle: () => {
            data.settings.musicEnabled = !data.settings.musicEnabled;
            save.save();
            AudioManager.getInstance().updateVolumes();
            this.showSettingsModal();
          }
        },
        {
          label: t('highContrast'),
          on: save.isHighContrast(),
          toggle: () => {
            save.setHighContrast(!save.isHighContrast());
            this.closeActiveModal();
            this.scene.restart();
          }
        },
        {
          label: t('haptics'),
          on: data.settings.hapticsEnabled,
          toggle: () => {
            data.settings.hapticsEnabled = !data.settings.hapticsEnabled;
            save.save();
            this.showSettingsModal();
          }
        }
      ];

      rows.forEach((row, i) => {
        panel.add(this.createSwitchRow(0, -130 + i * 58, row.label, row.on, row.toggle));
      });
    });
  }

  private createSwitchRow(x: number, y: number, label: string, on: boolean, onToggle: () => void): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const bg = this.add.graphics();
    this.drawPanel(bg, -200, -24, 400, 48, 14);

    const text = this.add.text(-176, 0, label, {
      fontFamily: FONT,
      fontSize: '14px',
      fontStyle: '600',
      color: '#e4e4e7'
    }).setOrigin(0, 0.5);

    const track = this.add.graphics();
    const tx = 148;
    track.fillStyle(on ? 0xf59e0b : 0x3f3f46, 1);
    track.fillRoundedRect(tx, -12, 44, 24, 12);
    const thumb = this.add.circle(on ? tx + 32 : tx + 12, 0, 9, 0xffffff);

    row.add([bg, text, track, thumb]);
    this.bindControl(row, 400, 48, onToggle);
    return row;
  }

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================
  private showAchievementsModal(): void {
    const save = SaveManager.getInstance().getData();
    const unlocked = ACHIEVEMENTS_LIST.filter(a => save.achievements.includes(a.id)).length;
    const { width, height } = this.scale;
    const panelW = 640;
    const panelH = 500;
    const listW = 580;
    const listH = 360;
    const rowH = 62;
    const listWorldX = width / 2 - listW / 2;
    const listWorldY = height / 2 - 96;

    this.openModal(panelW, panelH, t('achievements'), (panel) => {
      panel.add(this.add.text(panelW / 2 - 88, -panelH / 2 + 28, t('honorsProgress', {
        unlocked,
        total: ACHIEVEMENTS_LIST.length
      }), {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#a1a1aa'
      }).setOrigin(1, 0.5));

      const list = this.add.container(0, -72);
      ACHIEVEMENTS_LIST.forEach((ach, index) => {
        const isOn = save.achievements.includes(ach.id);
        const y = index * rowH;
        const row = this.add.graphics();
        row.fillStyle(isOn ? 0x1c1917 : 0x18181b, 0.95);
        row.fillRoundedRect(-listW / 2, y, listW, rowH - 8, 12);
        row.lineStyle(1, isOn ? 0xf59e0b : 0x27272a, 0.9);
        row.strokeRoundedRect(-listW / 2, y, listW, rowH - 8, 12);

        const icon = this.add.text(-listW / 2 + 28, y + 27, ach.icon, { fontSize: '20px' }).setOrigin(0.5);
        const name = this.add.text(-listW / 2 + 52, y + 16, achievementTitle(ach), {
          fontFamily: FONT,
          fontSize: '14px',
          fontStyle: '700',
          color: isOn ? '#fafafa' : '#71717a'
        }).setOrigin(0, 0.5);
        const desc = this.add.text(-listW / 2 + 52, y + 36, achievementBlurb(ach), {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#a1a1aa',
          wordWrap: { width: 430 }
        }).setOrigin(0, 0.5);
        const status = this.add.text(listW / 2 - 20, y + 27, isOn ? '✓' : '', {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#34d399'
        }).setOrigin(0.5);

        list.add([row, icon, name, desc, status]);
      });
      panel.add(list);

      const maskG = this.add.graphics();
      maskG.fillStyle(0xffffff, 1);
      maskG.fillRect(listWorldX, listWorldY, listW, listH);
      maskG.setVisible(false);
      list.setMask(maskG.createGeometryMask());

      const contentH = ACHIEVEMENTS_LIST.length * rowH;
      const maxScroll = Math.max(0, contentH - listH);
      let scroll = 0;
      const applyScroll = (next: number) => {
        scroll = Phaser.Math.Clamp(next, -maxScroll, 0);
        list.y = -72 + scroll;
      };

      const hit = this.add.rectangle(0, 84, listW, listH, 0x000000, 0.001);
      hit.setInteractive();
      panel.add(hit);

      const onWheel = (_p: Phaser.Input.Pointer, _dx: number, dy: number) => {
        if (this.activeModal) applyScroll(scroll - dy * 0.4);
      };
      this.input.on('wheel', onWheel);

      let dragY = 0;
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        dragY = p.y;
      });
      hit.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        applyScroll(scroll + (p.y - dragY));
        dragY = p.y;
      });

      const prevClose = this.activeModal?.close;
      if (this.activeModal) {
        this.activeModal.close = () => {
          this.input.off('wheel', onWheel);
          prevClose?.();
        };
      }
    });
  }
}
