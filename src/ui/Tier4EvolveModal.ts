import Phaser from 'phaser';
import { TacticalModifier, TowerBranchId } from '../core/Constants';
import { Tower } from '../entities/Tower';
import { t } from '../i18n/locales';
import { SafeArea } from '../utils/SafeArea';
import { addModalClose, bindSized, createDimModal, hudStyle, UI } from './UiKit';

export function openTier4EvolveModal(
  scene: Phaser.Scene,
  tower: Tower,
  gold: number,
  modifiers: TacticalModifier[],
  onClose: () => void,
  onEvolve: (branchId: TowerBranchId) => void
): Phaser.GameObjects.Container | null {
  const branches = tower.getTier4Branches();
  if (!branches) return null;

  const modal = createDimModal(scene, 9999, 600, 420);
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.text(0, -175, `👑 ${t('tier4Evolve')}`, hudStyle('24px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5)
  ];

  branches.forEach((branch, idx) => {
    const card = scene.add.container([-140, 140][idx], 10);
    const cBg = scene.add.graphics();
    cBg.fillStyle(0x12141c, 1);
    cBg.fillRoundedRect(-125, -145, 250, 290, 12);
    cBg.lineStyle(2.5, branch.accentColor, 1);
    cBg.strokeRoundedRect(-125, -145, 250, 290, 12);

    let cost = tower.getTier4Cost(branch);
    if (modifiers.includes(TacticalModifier.DOUBLE_COST)) cost *= 2;
    const canAfford = gold >= cost;

    const btn = scene.add.container(0, 105);
    const bBg = scene.add.graphics();
    bBg.fillStyle(canAfford ? 0x065f46 : 0x18181b, 1);
    bBg.fillRoundedRect(-80, -20, 160, 40, 8);
    bBg.lineStyle(1.5, canAfford ? 0x34d399 : 0x78716c, 1);
    bBg.strokeRoundedRect(-80, -20, 160, 40, 8);
    btn.add([
      bBg,
      scene.add.text(0, 0, t('evolveGold', { cost }), {
        fontSize: '12px',
        fontStyle: 'bold',
        color: canAfford ? '#ffffff' : '#78716c'
      }).setOrigin(0.5)
    ]);

    card.add([
      cBg,
      scene.add.sprite(0, -95, branch.turretTextureKey).setScale(1.1),
      scene.add.text(0, -45, t(branch.nameKey as 'tier4Evolve'), {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#facc15',
        align: 'center'
      }).setOrigin(0.5),
      scene.add.text(0, -26, t(branch.titleKey as 'tier4Evolve'), hudStyle('11px', UI.text.muted)).setOrigin(0.5),
      scene.add.text(0, 25, t(branch.descKey), {
        fontSize: '11px',
        color: '#e7e5e4',
        align: 'center',
        wordWrap: { width: 230 }
      }).setOrigin(0.5),
      btn
    ]);
    card.setSize(250, 290);
    card.setInteractive(SafeArea.createTouchHitbox(250, 290), Phaser.Geom.Rectangle.Contains);
    bindSized(card, () => onEvolve(branch.branchId));
    items.push(card);
  });

  items.push(addModalClose(scene, 270, -180, onClose));
  modal.add(items);
  return modal;
}
