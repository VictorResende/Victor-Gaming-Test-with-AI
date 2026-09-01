import Phaser from 'phaser';
import { TowerType } from '../core/Constants';
import { TOWERS_CONFIG } from '../config/gameConfig';
import { bindControl, hudStyle, paintGlassRect, UI } from './UiKit';
import { describeTowerBuildRole } from './towerStatText';

export const TOWER_CARD_HOTKEYS: Record<TowerType, string> = {
  [TowerType.GATLING]: '1',
  [TowerType.CANNON]: '2',
  [TowerType.CRYO]: '3',
  [TowerType.LASER]: '4',
  [TowerType.TESLA]: '5',
  [TowerType.WITCH]: '6'
};

export function createHeraldicTowerCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: TowerType,
  displayCost: number,
  onClick: () => void,
  onPointerDown: (pointer: Phaser.Input.Pointer) => void
): Phaser.GameObjects.Container {
  const config = TOWERS_CONFIG[type];
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  paintGlassRect(bg, -34, -32, 68, 64, 14);

  const icon = scene.add.sprite(0, -12, `turret_${type.toLowerCase()}`).setScale(0.64);
  const costTxt = scene.add.text(0, 14, `${displayCost}G`, hudStyle('10px', UI.text.amber)).setOrigin(0.5);
  const lvl = config.levels[0];
  const role = describeTowerBuildRole(type, {
    damage: lvl.damage,
    fireRate: lvl.fireRate,
    laserDPS: lvl.laserDPS,
    slowFactor: lvl.slowFactor,
    slowDuration: lvl.slowDuration,
    splashRadius: lvl.splashRadius,
    chainCount: lvl.chainCount,
    revealsStealth: type === TowerType.WITCH
  });
  const roleTxt = scene.add.text(0, 26, role ?? '', hudStyle('8px', '#7dd3fc')).setOrigin(0.5);
  if (!role) roleTxt.setVisible(false);
  const keyBadge = scene.add.text(26, -24, TOWER_CARD_HOTKEYS[type] || '1', hudStyle('10px', UI.text.faint)).setOrigin(0.5);

  container.add([bg, icon, costTxt, roleTxt, keyBadge]);
  bindControl(container, 68, 64, onClick, undefined, onPointerDown);
  return container;
}

export function paintTowerCardSelected(card: Phaser.GameObjects.Container, selected: boolean): void {
  paintGlassRect(card.getAt(0) as Phaser.GameObjects.Graphics, -34, -32, 68, 64, 14, selected);
}
