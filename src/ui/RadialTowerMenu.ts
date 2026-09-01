import Phaser from 'phaser';
import { TacticalModifier } from '../core/Constants';
import { Tower } from '../entities/Tower';
import { t } from '../i18n/locales';
import { bindControl, hudStyle, UI } from './UiKit';
import { describeTargetPriorityShort } from './priorityText';

export interface RadialTowerMenuActions {
  onUpgrade(tower: Tower): void;
  onEvolve(tower: Tower): void;
  onSell(): void;
  onPriority(tower: Tower): void;
  onChip(tower: Tower): void;
  onClose(): void;
}

export class RadialTowerMenu {
  private container: Phaser.GameObjects.Container | null = null;

  constructor(private scene: Phaser.Scene) {}

  isOpen(): boolean {
    return this.container !== null;
  }

  hide(): void {
    this.container?.destroy();
    this.container = null;
  }

  show(tower: Tower, gold: number, modifiers: TacticalModifier[], actions: RadialTowerMenuActions): void {
    this.hide();
    const radius = 74;
    this.container = this.scene.add.container(tower.x, tower.y);

    const ring = this.scene.add.graphics();
    ring.lineStyle(2, UI.color.amber, 0.45);
    ring.strokeCircle(0, 0, radius);
    ring.lineStyle(1, UI.color.stroke, 0.8);
    ring.strokeCircle(0, 0, radius + 6);
    this.container.add(ring);

    const upCost = tower.canUpgrade()
      ? (modifiers.includes(TacticalModifier.DOUBLE_COST) ? tower.getUpgradeCost() * 2 : tower.getUpgradeCost())
      : 0;
    const canAffordUp = gold >= upCost;
    let upLabelStr = t('maxed');
    let upColor = 0x18181b;
    let upBorder = 0x78716c;
    if (tower.canUpgrade()) {
      upLabelStr = `${upCost}G`;
      upColor = canAffordUp ? 0x065f46 : 0x7f1d1d;
      upBorder = canAffordUp ? 0x34d399 : 0xf87171;
    } else if (tower.canEvolveTier4()) {
      upLabelStr = t('radialTier4');
      upColor = 0x92400e;
      upBorder = 0xfacc15;
    }

    const place = (angle: number) => ({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    const n = place(-Math.PI / 2);
    const ne = place(-0.42);
    const nw = place(-Math.PI + 0.42);
    const se = place(Math.PI / 4);
    const sw = place((3 * Math.PI) / 4);

    const chipLabel = tower.equippedChip
      ? t(tower.equippedChip.data.nameKey as 'modChipCrit').slice(0, 5)
      : t('radialChipFallback');

    this.container.add([
      this.button(n.x, n.y, upLabelStr, '⬆️', upColor, upBorder, () => {
        if (tower.canEvolveTier4()) actions.onEvolve(tower);
        else if (tower.canUpgrade()) actions.onUpgrade(tower);
      }),
      this.button(ne.x, ne.y, `+${tower.getSellValue()}G`, '💰', 0x991b1b, 0xfacc15, () => actions.onSell()),
      this.button(nw.x, nw.y, describeTargetPriorityShort(tower.targetPriority), '🎯', 0x1e3a8a, 0x60a5fa, () => actions.onPriority(tower)),
      this.button(se.x, se.y, chipLabel, tower.equippedChip ? tower.equippedChip.data.icon : '⚡', 0x581c87, 0xc084fc, () => actions.onChip(tower)),
      this.button(sw.x, sw.y, '', '✕', 0x7f1d1d, 0xfca5a5, () => actions.onClose())
    ]);

    this.container.setScale(0);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  private button(
    x: number,
    y: number,
    text: string,
    icon: string,
    bgColor: number,
    borderColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, 0.94);
    bg.fillCircle(0, 0, 22);
    bg.lineStyle(1, borderColor, 1);
    bg.strokeCircle(0, 0, 22);
    const items: Phaser.GameObjects.GameObject[] = [
      bg,
      this.scene.add.text(0, text ? -6 : 0, icon, { fontSize: text ? '14px' : '16px' }).setOrigin(0.5)
    ];
    if (text) items.push(this.scene.add.text(0, 10, text, hudStyle('9px')).setOrigin(0.5));
    container.add(items);
    bindControl(container, 44, 44, onClick);
    return container;
  }
}
