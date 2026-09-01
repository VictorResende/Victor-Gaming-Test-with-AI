import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { t } from '../i18n/locales';
import {
  addDangerButton,
  addGhostButton,
  addModalClose,
  addPrimaryButton,
  bindControl,
  createDimModal,
  hudStyle,
  paintGlassRect,
  UI
} from './UiKit';

export interface PauseModalActions {
  refresh(): void;
  resume(): void;
  openBestiary(): void;
  confirmRestart(): void;
  confirmSurrender(): void;
}

function addVolumeRow(
  scene: Phaser.Scene,
  y: number,
  label: string,
  current: number,
  onPick: (vol: number) => void
): Phaser.GameObjects.GameObject[] {
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.text(-240, y, label, hudStyle('12px', UI.text.muted)).setOrigin(0, 0.5)
  ];
  const steps = [0, 0.25, 0.5, 0.75, 1];
  steps.forEach((vol, idx) => {
    const isSelected = Math.abs(current - vol) < 0.12;
    const btn = scene.add.container(-70 + idx * 72, y);
    const bg = scene.add.graphics();
    paintGlassRect(bg, -32, -16, 64, 32, 10, isSelected);
    const caption = vol === 0 ? t('volMute') : `${Math.round(vol * 100)}%`;
    btn.add([bg, scene.add.text(0, 0, caption, hudStyle('11px', isSelected ? UI.text.amber : UI.text.muted)).setOrigin(0.5)]);
    bindControl(btn, 64, 32, () => onPick(vol));
    items.push(btn);
  });
  return items;
}

export function openPauseModal(scene: Phaser.Scene, actions: PauseModalActions): Phaser.GameObjects.Container {
  const save = SaveManager.getInstance();
  const settings = save.getData().settings;
  const modal = createDimModal(scene, 9999, 560, 440);
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.text(0, -185, t('pauseTitle'), hudStyle('22px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5)
  ];

  const currentSfx = settings.sfxEnabled ? (settings.sfxVolume ?? 1.0) : 0.0;
  items.push(...addVolumeRow(scene, -140, t('sfxVolume'), currentSfx, vol => {
    settings.sfxEnabled = vol > 0;
    save.setSfxVolume(vol);
    AudioManager.getInstance().updateVolumes();
    actions.refresh();
  }));

  const currentMusic = settings.musicEnabled ? (settings.musicVolume ?? 0.8) : 0.0;
  items.push(...addVolumeRow(scene, -85, t('musicVolume'), currentMusic, vol => {
    settings.musicEnabled = vol > 0;
    save.setMusicVolume(vol);
    AudioManager.getInstance().updateVolumes();
    actions.refresh();
  }));

  const isHC = save.isHighContrast();
  const hcBtn = scene.add.container(-130, -25);
  const hcBg = scene.add.graphics();
  paintGlassRect(hcBg, -110, -20, 220, 40, 12, isHC);
  hcBtn.add([
    hcBg,
    scene.add.text(0, 0, `${t('highContrast')}: ${isHC ? t('highContrastOn') : t('highContrastOff')}`, hudStyle('12px', isHC ? UI.text.amber : UI.text.primary)).setOrigin(0.5)
  ]);
  bindControl(hcBtn, 220, 40, () => {
    save.setHighContrast(!isHC);
    actions.refresh();
  });
  items.push(hcBtn);

  const isHap = settings.hapticsEnabled;
  const hapBtn = scene.add.container(130, -25);
  const hapBg = scene.add.graphics();
  paintGlassRect(hapBg, -110, -20, 220, 40, 12, isHap);
  hapBtn.add([
    hapBg,
    scene.add.text(0, 0, `${t('haptics')}: ${isHap ? t('highContrastOn') : t('highContrastOff')}`, hudStyle('12px', isHap ? UI.text.amber : UI.text.primary)).setOrigin(0.5)
  ]);
  bindControl(hapBtn, 220, 40, () => {
    settings.hapticsEnabled = !isHap;
    save.save();
    actions.refresh();
  });
  items.push(hapBtn);

  items.push(addGhostButton(scene, 0, 20, t('bestiary'), () => actions.openBestiary(), 200, 40));
  items.push(addPrimaryButton(scene, -160, 75, t('resume'), () => {
    modal.destroy();
    actions.resume();
  }, 150, 44));
  items.push(addGhostButton(scene, 0, 75, t('restart'), () => actions.confirmRestart(), 150, 44));
  items.push(addDangerButton(scene, 160, 75, t('surrender'), () => actions.confirmSurrender(), 150, 44));
  items.push(addModalClose(scene, 250, -185, () => {
    modal.destroy();
    actions.resume();
  }));

  modal.add(items);
  return modal;
}
