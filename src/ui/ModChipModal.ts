import Phaser from 'phaser';
import { ModChipType } from '../core/Constants';
import { MOD_CHIPS_CONFIG } from '../config/modChipsConfig';
import { Tower } from '../entities/Tower';
import { t } from '../i18n/locales';
import { SafeArea } from '../utils/SafeArea';
import { addModalClose, bindSized, createDimModal, hudStyle, UI } from './UiKit';

export function openModChipModal(
  scene: Phaser.Scene,
  tower: Tower,
  onClose: () => void,
  onPick: (chip: ModChipType | null) => void
): Phaser.GameObjects.Container {
  const modal = createDimModal(scene, 9999, 560, 400);
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.text(0, -165, `⚡ ${t('chipsTitle')}`, hudStyle('22px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5),
    scene.add.text(0, -135, t('chipsDesc'), hudStyle('12px', UI.text.muted)).setOrigin(0.5)
  ];

  Object.values(MOD_CHIPS_CONFIG).forEach((chipData, idx) => {
    const isEquipped = tower.equippedChip?.type === chipData.type;
    const card = scene.add.container(-200 + idx * 135, 5);
    const cBg = scene.add.graphics();
    cBg.fillStyle(isEquipped ? 0x18181b : 0x09090b, 1);
    cBg.fillRoundedRect(-58, -100, 116, 200, 10);
    cBg.lineStyle(2, chipData.color, isEquipped ? 1.0 : 0.6);
    cBg.strokeRoundedRect(-58, -100, 116, 200, 10);

    const btnBg = scene.add.graphics();
    btnBg.fillStyle(isEquipped ? 0x065f46 : 0x78350f, 1);
    btnBg.fillRoundedRect(-45, 66, 90, 30, 6);
    btnBg.lineStyle(1.5, isEquipped ? 0x34d399 : 0xfacc15, 1);
    btnBg.strokeRoundedRect(-45, 66, 90, 30, 6);

    card.add([
      cBg,
      scene.add.text(0, -65, chipData.icon, { fontSize: '32px' }).setOrigin(0.5),
      scene.add.text(0, -30, t(chipData.nameKey), {
        fontSize: '11px',
        fontStyle: 'bold',
        color: chipData.badgeHex,
        align: 'center',
        wordWrap: { width: 105 }
      }).setOrigin(0.5),
      scene.add.text(0, 20, t(chipData.descKey), {
        fontSize: '9.5px',
        color: '#e7e5e4',
        align: 'center',
        wordWrap: { width: 102 }
      }).setOrigin(0.5),
      btnBg,
      scene.add.text(0, 81, isEquipped ? t('chipEquippedMark') : t('equipChip'), {
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5)
    ]);
    card.setSize(116, 200);
    card.setInteractive(SafeArea.createTouchHitbox(116, 200), Phaser.Geom.Rectangle.Contains);
    bindSized(card, () => onPick(chipData.type));
    items.push(card);
  });

  if (tower.equippedChip) {
    const unequipBtn = scene.add.container(0, 155);
    const uBg = scene.add.graphics();
    uBg.fillStyle(0x7f1d1d, 1);
    uBg.fillRoundedRect(-75, -18, 150, 36, 8);
    uBg.lineStyle(1.5, 0xf87171, 1);
    uBg.strokeRoundedRect(-75, -18, 150, 36, 8);
    unequipBtn.add([uBg, scene.add.text(0, 0, t('unequipChip'), { fontSize: '12px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5)]);
    unequipBtn.setSize(150, 48);
    unequipBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);
    bindSized(unequipBtn, () => onPick(null));
    items.push(unequipBtn);
  }

  items.push(addModalClose(scene, 250, -170, () => {
    modal.destroy();
    onClose();
  }));
  modal.add(items);
  return modal;
}
