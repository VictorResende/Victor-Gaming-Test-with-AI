import Phaser from 'phaser';
import { SpellType } from '../core/Constants';
import { Hero } from '../entities/Hero';
import { bindControl, hudStyle, UI } from './UiKit';

export function createHeroAbilityButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  hero: Hero,
  abilityIndex: 1 | 2,
  onUse: () => void
): { gfx: Phaser.GameObjects.Graphics; txt: Phaser.GameObjects.Text } | null {
  const ability = hero.config.abilities[abilityIndex - 1];
  if (!ability) return null;

  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(UI.color.panelHi, 1);
  bg.fillRoundedRect(-24, -24, 48, 48, 14);
  bg.lineStyle(1, hero.config.color, 0.9);
  bg.strokeRoundedRect(-24, -24, 48, 48, 14);

  const cdG = scene.add.graphics();
  const cdTxt = scene.add.text(0, 0, '', hudStyle('12px')).setOrigin(0.5).setVisible(false);
  container.add([
    bg,
    scene.add.sprite(0, -2, ability.iconTexture).setScale(0.68),
    cdG,
    cdTxt,
    scene.add.text(18, -18, abilityIndex === 1 ? 'Z' : 'X', hudStyle('9px', UI.text.faint)).setOrigin(0.5)
  ]);
  bindControl(container, 48, 48, onUse);
  return { gfx: cdG, txt: cdTxt };
}

const SPELL_LOOK: Record<SpellType, { fill: number; border: number; icon: string; key: string }> = {
  [SpellType.METEOR]: { fill: 0xb91c1c, border: 0xf97316, icon: '🔥', key: 'Q' },
  [SpellType.EMP]: { fill: 0x0369a1, border: 0x38bdf8, icon: '❄️', key: 'W' },
  [SpellType.SUPPLY]: { fill: 0xa16207, border: 0xfde047, icon: '💰', key: 'E' }
};

export function createSpellGem(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: SpellType,
  onCast: () => void
): Phaser.GameObjects.Graphics {
  const look = SPELL_LOOK[type];
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  bg.fillStyle(UI.color.panelHi, 1);
  bg.fillRoundedRect(-24, -24, 48, 48, 14);
  bg.fillStyle(look.fill, 0.88);
  bg.fillCircle(0, 0, 16);
  bg.lineStyle(1, look.border, 1);
  bg.strokeRoundedRect(-24, -24, 48, 48, 14);
  const cdG = scene.add.graphics();
  container.add([
    bg,
    scene.add.text(0, -1, look.icon, { fontSize: '18px' }).setOrigin(0.5),
    cdG,
    scene.add.text(18, -18, look.key, hudStyle('9px', UI.text.faint)).setOrigin(0.5)
  ]);
  bindControl(container, 48, 48, onCast);
  return cdG;
}
