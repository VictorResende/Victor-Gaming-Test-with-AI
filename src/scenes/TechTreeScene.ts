import Phaser from 'phaser';
import { TECH_TREE_NODES, TechNode } from '../config/techTreeConfig';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { t } from '../i18n/locales';
import {
  applyUiScene,
  bindControl,
  delayedStart,
  fillPanel,
  paintBackdrop,
  addGhostButton,
  addStarChip,
  addScreenTitle,
  uiText,
  UI
} from '../ui/UiKit';

export class TechTreeScene extends Phaser.Scene {
  private starText!: Phaser.GameObjects.Text;
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  constructor() {
    super('TechTreeScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    const save = SaveManager.getInstance();
    const hi = save.isHighContrast();

    applyUiScene(this);
    paintBackdrop(this, width, height, hi);

    const headerY = this.safeInsets.top + 36;
    addGhostButton(this, this.safeBounds.left + 58, headerY, `← ${t('back')}`, () => {
      delayedStart(this, 'MenuScene');
    }, 112, 40);
    addGhostButton(this, this.safeBounds.left + 186, headerY, t('heroTalentsTab'), () => {
      delayedStart(this, 'HeroTalentsScene');
    }, 132, 40);
    addScreenTitle(this, width / 2 + 24, headerY, t('techTitle'));

    const chip = addStarChip(this, this.safeBounds.right - 64, headerY, save.getData().availableStars);
    this.starText = chip.list[1] as Phaser.GameObjects.Text;

    const cardW = Math.min(340, (this.safeBounds.safeWidth - 48) / 3);
    const cardH = 158;
    const cols = 3;
    const colSpacing = (this.safeBounds.safeWidth - cardW * cols) / (cols - 1);
    const startX = this.safeBounds.left + cardW / 2;
    const startY = headerY + 108;

    TECH_TREE_NODES.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      this.createNodeCard(
        startX + col * (cardW + colSpacing),
        startY + row * (cardH + 22),
        cardW,
        cardH,
        node,
        hi
      );
    });
  }

  private createNodeCard(x: number, y: number, w: number, h: number, node: TechNode, highContrast: boolean): void {
    const save = SaveManager.getInstance();
    const isUnlocked = save.hasTech(node.id);
    const canAfford = save.getData().availableStars >= node.starCost;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    fillPanel(bg, -w / 2, -h / 2, w, h, 16, {
      highContrast,
      stroke: isUnlocked ? UI.color.success : (canAfford ? UI.color.amber : UI.color.stroke)
    });

    const icon = this.add.text(-w / 2 + 28, -h / 2 + 28, node.icon, { fontSize: '22px' }).setOrigin(0.5);
    const title = this.add.text(-w / 2 + 48, -h / 2 + 28, node.name, uiText(
      isUnlocked ? UI.text.success : (canAfford ? UI.text.amber : UI.text.muted),
      '14px',
      { fontStyle: '700' }
    )).setOrigin(0, 0.5);
    const desc = this.add.text(-w / 2 + 16, 8, node.description, uiText(UI.text.muted, '11px', { wordWrap: { width: w - 32 } })).setOrigin(0, 0.5);
    const cta = this.add.text(0, h / 2 - 22, isUnlocked ? `✓ ${t('unlocked')}` : t('unlock', { cost: node.starCost }), uiText(
      isUnlocked ? UI.text.success : (canAfford ? UI.text.ink : UI.text.faint),
      '12px',
      { fontStyle: '800' }
    )).setOrigin(0.5);
    if (!isUnlocked && canAfford) {
      const ctaBg = this.add.graphics();
      ctaBg.fillStyle(UI.color.amber, 1);
      ctaBg.fillRoundedRect(-w / 2 + 16, h / 2 - 38, w - 32, 32, 10);
      container.add([bg, ctaBg, icon, title, desc, cta]);
      bindControl(container, w, h, () => {
        if (save.unlockTech(node.id, node.starCost)) {
          AudioManager.getInstance().playUpgrade();
          HapticsManager.getInstance().victory();
          this.starText.setText(`★  ${save.getData().availableStars}`);
          this.scene.restart();
        }
      });
    } else {
      container.add([bg, icon, title, desc, cta]);
    }
  }
}
