import Phaser from 'phaser';
import { ENEMIES_CONFIG, enemyDisplayName } from '../config/gameConfig';
import { t } from '../i18n/locales';
import { SaveManager } from '../managers/SaveManager';
import { describeEnemyThreat } from './resistanceText';
import {
  addDangerButton,
  addGhostButton,
  addPrimaryButton,
  createDimModal,
  hudStyle,
  UI
} from './UiKit';

export function openConfirmDialog(
  scene: Phaser.Scene,
  title: string,
  body: string,
  onYes: () => void,
  onDismiss?: () => void
): Phaser.GameObjects.Container {
  const modal = createDimModal(scene, 10050, 440, 180);
  const close = () => {
    modal.destroy();
    onDismiss?.();
  };
  modal.add([
    scene.add.text(0, -52, title, hudStyle('18px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5),
    scene.add.text(0, -12, body, hudStyle('13px', UI.text.muted, { wordWrap: { width: 380 }, align: 'center' })).setOrigin(0.5),
    addGhostButton(scene, -90, 48, t('confirmNo'), close, 140, 40),
    addDangerButton(scene, 90, 48, t('confirmYes'), () => {
      close();
      onYes();
    }, 140, 40)
  ]);
  return modal;
}

export function openBestiaryDialog(scene: Phaser.Scene, onClose: () => void): Phaser.GameObjects.Container {
  const modal = createDimModal(scene, 9999, 600, 420);
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.text(0, -180, t('bestiary'), hudStyle('20px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5)
  ];
  Object.values(ENEMIES_CONFIG).slice(0, 8).forEach((cfg, idx) => {
    const y = -140 + idx * 38;
    items.push(scene.add.text(-270, y, enemyDisplayName(cfg), hudStyle('12px', UI.text.amber, { fontStyle: '700' })).setOrigin(0, 0.5));
    items.push(scene.add.text(-80, y, describeEnemyThreat(cfg), hudStyle('11px', UI.text.muted, { wordWrap: { width: 340 } })).setOrigin(0, 0.5));
  });
  items.push(addGhostButton(scene, 0, 180, t('close'), () => {
    modal.destroy();
    onClose();
  }, 140, 40));
  modal.add(items);
  return modal;
}

export function showVictoryDialog(
  scene: Phaser.Scene,
  stars: number,
  stats: string,
  onMenu: () => void
): void {
  if (!SaveManager.getInstance().isReducedMotion()) {
    scene.cameras.main.zoomTo(1.12, 900, 'Cubic.easeOut', true);
  }

  const modal = createDimModal(scene, 9999, 460, 320);
  const desc = scene.add.text(0, 8, t('victoryDesc'), hudStyle('13px', UI.text.muted)).setOrigin(0.5);
  desc.setAlign('center');
  desc.setWordWrapWidth(390);
  modal.add([
    scene.add.text(0, -108, t('victoryTitle'), hudStyle('28px', UI.text.amber, { fontStyle: '800' })).setOrigin(0.5),
    scene.add.text(0, -42, '★'.repeat(stars) + '☆'.repeat(3 - stars), hudStyle('28px', UI.text.amber)).setOrigin(0.5),
    desc,
    scene.add.text(0, 48, stats, hudStyle('12px', UI.text.amber)).setOrigin(0.5),
    addPrimaryButton(scene, 0, 105, t('mainMenu'), onMenu, 210, 44)
  ]);
}

export function showDefeatDialog(
  scene: Phaser.Scene,
  stats: string,
  onRestart: () => void,
  onMenu: () => void
): void {
  if (!SaveManager.getInstance().isReducedMotion()) {
    scene.cameras.main.shake(400, 0.015);
  }

  const modal = createDimModal(scene, 9999, 460, 300, { stroke: UI.color.danger, overlayAlpha: 0.85 });
  const desc = scene.add.text(0, -22, t('defeatDesc'), hudStyle('13px', UI.text.muted)).setOrigin(0.5);
  desc.setAlign('center');
  desc.setWordWrapWidth(390);
  modal.add([
    scene.add.text(0, -96, t('defeatTitle'), hudStyle('28px', UI.text.danger, { fontStyle: '800' })).setOrigin(0.5),
    desc,
    scene.add.text(0, 18, stats, hudStyle('12px', UI.text.amber)).setOrigin(0.5),
    addPrimaryButton(scene, -90, 78, t('restart'), onRestart, 140, 44),
    addGhostButton(scene, 90, 78, t('mainMenu'), onMenu, 140, 44)
  ]);
}
