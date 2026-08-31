import Phaser from 'phaser';
import { LEVELS_CONFIG } from '../config/levelsConfig';
import { SaveManager } from '../managers/SaveManager';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { t } from '../i18n/locales';
import { RELICS_CONFIG } from '../config/relicsConfig';
import {
  applyUiScene,
  bindControl,
  delayedStart,
  fillPanel,
  paintBackdrop,
  addGhostButton,
  addPrimaryButton,
  addStarChip,
  addScreenTitle,
  uiText,
  UI
} from '../ui/UiKit';

export class LevelSelectScene extends Phaser.Scene {
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  constructor() {
    super('LevelSelectScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    const save = SaveManager.getInstance().getData();
    const hi = SaveManager.getInstance().isHighContrast();

    applyUiScene(this);
    paintBackdrop(this, width, height, hi);

    const headerY = this.safeInsets.top + 34;
    addGhostButton(this, this.safeBounds.left + 58, headerY, `← ${t('back')}`, () => {
      delayedStart(this, 'MenuScene');
    }, 112, 40);
    addScreenTitle(this, width / 2, headerY, t('level'));
    addStarChip(this, this.safeBounds.right - 64, headerY, save.availableStars);

    const topModesY = headerY + 52;
    addGhostButton(this, width / 2 - 140, topModesY, `📜 ${t('dailyChallenge')}`, () => {
      delayedStart(this, 'GameScene', { isDailyChallenge: true });
    }, 200, 40);
    addGhostButton(this, width / 2 + 140, topModesY, `👑 ${t('bossRush')}`, () => {
      delayedStart(this, 'GameScene', { isBossRush: true });
    }, 200, 40);

    const relicsY = topModesY + 50;
    addGhostButton(this, width / 2, relicsY, 'Relíquias — 3 slots', () => this.openRelicsModal(), 280, 40);

    const cardWidth = Math.min(340, (this.safeBounds.safeWidth - 48) / 3);
    const cardHeight = 210;
    const colSpacing = (this.safeBounds.safeWidth - cardWidth * 3) / 2;
    const startX = this.safeBounds.left + cardWidth / 2;
    const startY = relicsY + 128;
    const rowSpacing = cardHeight + 18;

    const biomeIcons: Record<number, string> = {
      1: '🌲', 2: '🪓', 3: '❄️', 4: '🌋', 5: '🔮', 6: '🐉'
    };

    LEVELS_CONFIG.forEach((level, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      this.createLevelCard(
        startX + col * (cardWidth + colSpacing),
        startY + row * rowSpacing,
        cardWidth,
        cardHeight,
        level,
        save.unlockedLevels.includes(level.id),
        save.levelStars[level.id] || 0,
        biomeIcons[level.id] || '🏰',
        hi
      );
    });
  }

  private createLevelCard(
    x: number,
    y: number,
    w: number,
    h: number,
    level: typeof LEVELS_CONFIG[0],
    isUnlocked: boolean,
    stars: number,
    biomeIcon: string,
    highContrast: boolean
  ): void {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    fillPanel(bg, -w / 2, -h / 2, w, h, 16, {
      highContrast,
      stroke: isUnlocked ? UI.color.amber : UI.color.stroke,
      alpha: isUnlocked ? 0.94 : 0.72
    });

    const title = this.add.text(0, -h / 2 + 28, `${biomeIcon}  ${level.name}`, uiText(
      isUnlocked ? UI.text.primary : UI.text.faint,
      '14px',
      { fontStyle: '700', wordWrap: { width: w - 24 }, align: 'center' }
    )).setOrigin(0.5);

    const desc = this.add.text(0, -h / 2 + 72, level.description, uiText(
      isUnlocked ? UI.text.muted : UI.text.faint,
      '11px',
      { wordWrap: { width: w - 28 }, align: 'center' }
    )).setOrigin(0.5);

    const starsRow = this.add.container(0, 18);
    if (isUnlocked) {
      for (let s = 0; s < 3; s++) {
        starsRow.add(this.add.text((s - 1) * 28, 0, s < stars ? '★' : '☆', uiText(
          s < stars ? UI.text.amber : UI.text.faint,
          '18px'
        )).setOrigin(0.5));
      }
    } else {
      starsRow.add(this.add.text(0, 0, '🔒', { fontSize: '18px' }).setOrigin(0.5));
    }

    const btn = isUnlocked
      ? addPrimaryButton(this, 0, h / 2 - 36, t('play'), () => {
        delayedStart(this, 'GameScene', { levelId: level.id, isEndless: false });
      }, 150, 40)
      : this.add.text(0, h / 2 - 36, t('locked'), uiText(UI.text.faint, '12px', { fontStyle: '700' })).setOrigin(0.5);

    container.add([bg, title, desc, starsRow, btn]);
  }

  private openRelicsModal(): void {
    const { width, height } = this.scale;
    const save = SaveManager.getInstance();
    const root = this.add.container(0, 0).setDepth(2000);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
    overlay.setInteractive();

    const panelW = Math.min(560, width - 48);
    const panelH = 460;
    const panel = this.add.container(width / 2, height / 2);
    const panelBg = this.add.graphics();
    fillPanel(panelBg, -panelW / 2, -panelH / 2, panelW, panelH, 20);
    const catchClicks = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.001);
    catchClicks.setInteractive();

    const heading = this.add.text(-panelW / 2 + 24, -panelH / 2 + 28, 'Relíquias', uiText(UI.text.primary, '20px', { fontStyle: '800' })).setOrigin(0, 0.5);
    const sub = this.add.text(0, -panelH / 2 + 56, 'Até 3 bônus passivos no início da batalha', uiText(UI.text.muted, '12px')).setOrigin(0.5);

    const close = () => root.destroy();
    overlay.on('pointerdown', close);
    const closeBtn = addGhostButton(this, panelW / 2 - 28, -panelH / 2 + 28, '✕', close, 40, 40);

    panel.add([panelBg, catchClicks, heading, sub, closeBtn]);

    const relicEntries = Object.values(RELICS_CONFIG);
    const cardW = (panelW - 56) / 2;
    const cardH = 72;
    relicEntries.forEach((relic, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = -panelW / 2 + 20 + col * (cardW + 12) + cardW / 2;
      const cy = -panelH / 2 + 118 + row * (cardH + 10) + cardH / 2;
      const isEquipped = save.isRelicEquipped(relic.id.toLowerCase());
      const isUnlocked = save.hasRelic(relic.id.toLowerCase());

      const card = this.add.container(cx, cy);
      const bg = this.add.graphics();
      fillPanel(bg, -cardW / 2, -cardH / 2, cardW, cardH, 12, {
        stroke: isEquipped ? UI.color.indigo : UI.color.stroke
      });
      const icon = this.add.text(-cardW / 2 + 20, 0, relic.icon, { fontSize: '20px' }).setOrigin(0.5);
      const name = this.add.text(-cardW / 2 + 40, -12, relic.nameDefault, uiText(relic.colorHex || UI.text.primary, '12px', { fontStyle: '700' })).setOrigin(0, 0.5);
      const desc = this.add.text(-cardW / 2 + 40, 8, relic.descDefault, uiText(UI.text.muted, '10px', { wordWrap: { width: cardW - 52 } })).setOrigin(0, 0.5);
      const status = this.add.text(cardW / 2 - 10, -cardH / 2 + 12, isEquipped ? 'ON' : (isUnlocked ? '' : '🔒'), uiText(isEquipped ? UI.text.success : UI.text.faint, '10px', { fontStyle: '700' })).setOrigin(1, 0.5);
      card.add([bg, icon, name, desc, status]);
      if (isUnlocked) {
        bindControl(card, cardW, cardH, () => {
          save.toggleRelic(relic.id.toLowerCase());
          close();
          this.openRelicsModal();
        });
      }
      panel.add(card);
    });

    const equippedNow = save.getEquippedRelics();
    panel.add(this.add.text(0, panelH / 2 - 52, `${equippedNow.length}/3`, uiText(UI.text.amber, '13px', { fontStyle: '700' })).setOrigin(0.5));
    panel.add(addPrimaryButton(this, 0, panelH / 2 - 24, t('back'), close, 140, 40));

    root.add([overlay, panel]);
  }
}
