import Phaser from 'phaser';
import { TacticalModifier } from '../core/Constants';
import { Tower } from '../entities/Tower';
import { t } from '../i18n/locales';
import { bindControl, fillPanel, hudStyle, paintGlassRect, UI } from './UiKit';
import { describeTowerCombat } from './towerStatText';
import { describeTargetPriority } from './priorityText';

export interface TowerInspectorActions {
  onPriority(): void;
  onUpgrade(): void;
  onChip(): void;
  onSell(): void;
  onClose(): void;
}

export class TowerInspectorPanel {
  private panel!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private stats!: Phaser.GameObjects.Text;
  private priorityLabel!: Phaser.GameObjects.Text;
  private upgradeBtn!: Phaser.GameObjects.Container;
  private upgradeLabel!: Phaser.GameObjects.Text;
  private chipBtn!: Phaser.GameObjects.Container;
  private chipLabel!: Phaser.GameObjects.Text;
  private sellLabel!: Phaser.GameObjects.Text;
  private actions!: TowerInspectorActions;

  constructor(private scene: Phaser.Scene) {}

  create(width: number, height: number, bottomInset: number, actions: TowerInspectorActions): void {
    this.actions = actions;
    this.panel = this.scene.add.container(width / 2, height - 118 - bottomInset);
    this.panel.setVisible(false);

    const bg = this.scene.add.graphics();
    fillPanel(bg, -270, -42, 540, 84, 16, { alpha: 0.94 });
    this.title = this.scene.add.text(-252, -28, '', hudStyle('13px')).setOrigin(0, 0.5);
    this.stats = this.scene.add.text(-252, -10, '', hudStyle('11px', '#7dd3fc')).setOrigin(0, 0.5);

    const priorityBtn = this.scene.add.container(-190, 16);
    const tpBg = this.scene.add.graphics();
    paintGlassRect(tpBg, -62, -16, 124, 32, 10);
    this.priorityLabel = this.scene.add.text(0, 0, '', hudStyle('10px', UI.text.muted)).setOrigin(0.5);
    priorityBtn.add([tpBg, this.priorityLabel]);
    bindControl(priorityBtn, 124, 32, () => this.actions.onPriority());

    this.upgradeBtn = this.scene.add.container(-45, 16);
    const upBg = this.scene.add.graphics();
    upBg.fillStyle(UI.color.success, 1);
    upBg.fillRoundedRect(-65, -18, 130, 36, 12);
    this.upgradeLabel = this.scene.add.text(0, 0, '', hudStyle('11px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5);
    this.upgradeBtn.add([upBg, this.upgradeLabel]);
    bindControl(this.upgradeBtn, 130, 36, () => this.actions.onUpgrade());

    this.chipBtn = this.scene.add.container(90, 16);
    const chipBg = this.scene.add.graphics();
    paintGlassRect(chipBg, -55, -18, 110, 36, 12);
    this.chipLabel = this.scene.add.text(0, 0, '', hudStyle('10px', UI.text.muted)).setOrigin(0.5);
    this.chipBtn.add([chipBg, this.chipLabel]);
    bindControl(this.chipBtn, 110, 36, () => this.actions.onChip());

    const sellBtn = this.scene.add.container(205, 16);
    const sellBg = this.scene.add.graphics();
    sellBg.fillStyle(UI.color.danger, 1);
    sellBg.fillRoundedRect(-45, -18, 90, 36, 12);
    this.sellLabel = this.scene.add.text(0, 0, '', hudStyle('10px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5);
    sellBtn.add([sellBg, this.sellLabel]);
    bindControl(sellBtn, 90, 36, () => this.actions.onSell());

    const closeBtn = this.scene.add.container(255, -28);
    closeBtn.add(this.scene.add.text(0, 0, '✕', hudStyle('16px', UI.text.muted)).setOrigin(0.5));
    bindControl(closeBtn, 36, 36, () => this.actions.onClose());

    this.panel.add([bg, this.title, this.stats, priorityBtn, this.upgradeBtn, this.chipBtn, sellBtn, closeBtn]);
  }

  show(): void {
    this.panel.setVisible(true);
  }

  hide(): void {
    this.panel.setVisible(false);
  }

  refresh(tower: Tower, modifiers: TacticalModifier[]): void {
    if (tower.level === 4 && tower.tier4Branch) {
      this.title.setText(t('towerLegendary', { name: t(tower.tier4Branch.nameKey as 'gatlingName') }));
    } else {
      this.title.setText(t('towerGrade', { name: t(tower.config.nameKey as 'gatlingName'), level: tower.level }));
    }
    this.stats.setText(describeTowerCombat(tower.getCombatStats()));
    this.priorityLabel.setText(t('targeting', { mode: describeTargetPriority(tower.targetPriority) }));

    if (tower.canUpgrade()) {
      let cost = tower.getUpgradeCost();
      if (modifiers.includes(TacticalModifier.DOUBLE_COST)) cost *= 2;
      this.upgradeLabel.setText(t('evolveGold', { cost }));
      this.upgradeBtn.setVisible(true);
    } else if (tower.canEvolveTier4()) {
      this.upgradeLabel.setText(`⚡ ${t('radialTier4')}`);
      this.upgradeBtn.setVisible(true);
    } else {
      this.upgradeLabel.setText(t('maxed'));
      this.upgradeBtn.setVisible(false);
    }

    if (tower.canEquipChip()) {
      this.chipBtn.setVisible(true);
      this.chipLabel.setText(
        tower.equippedChip
          ? `${tower.equippedChip.data.icon} ${t(tower.equippedChip.data.nameKey as 'modChipCrit')}`
          : t('equipChipPlus')
      );
    } else {
      this.chipBtn.setVisible(false);
    }

    this.sellLabel.setText(t('sell', { gold: tower.getSellValue() }));
  }
}
