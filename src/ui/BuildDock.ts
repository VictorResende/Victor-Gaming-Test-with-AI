import Phaser from 'phaser';
import { SpellType, TacticalModifier, TowerType } from '../core/Constants';
import { TOWERS_CONFIG } from '../config/gameConfig';
import { GameScene } from '../scenes/GameScene';
import { fillPanel } from './UiKit';
import { createHeraldicTowerCard } from './BuildDeckCard';
import { createHeroAbilityButton, createSpellGem } from './HudActionGems';
import { SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';

export interface BuildDockResult {
  cards: Map<TowerType, Phaser.GameObjects.Container>;
  abilityGfx: Phaser.GameObjects.Graphics[];
  abilityTxt: Phaser.GameObjects.Text[];
  spellGfx: Map<SpellType, Phaser.GameObjects.Graphics>;
}

export function createBuildDock(
  scene: Phaser.Scene,
  width: number,
  height: number,
  safeInsets: SafeAreaInsets,
  safeBounds: SafeAreaBounds,
  game: GameScene,
  onSelect: (type: TowerType) => void,
  onDragReady: (type: TowerType, pointer: Phaser.Input.Pointer) => void
): BuildDockResult {
  const inset = 12;
  const dockH = 84;
  const dockTop = height - dockH - safeInsets.bottom - 8;
  const centerY = dockTop + dockH / 2;
  const bottomBg = scene.add.graphics();
  fillPanel(bottomBg, inset, dockTop, width - inset * 2, dockH, 16, { alpha: 0.92 });

  const towerTypes = [
    TowerType.GATLING, TowerType.CANNON, TowerType.CRYO,
    TowerType.LASER, TowerType.TESLA, TowerType.WITCH
  ];
  const cardW = 72;
  const startX = safeBounds.left + 48;
  const cards = new Map<TowerType, Phaser.GameObjects.Container>();
  towerTypes.forEach((type, idx) => {
    const cost = game.modifiers.includes(TacticalModifier.DOUBLE_COST)
      ? TOWERS_CONFIG[type].cost * 2
      : TOWERS_CONFIG[type].cost;
    const card = createHeraldicTowerCard(
      scene,
      startX + idx * (cardW + 6),
      centerY,
      type,
      cost,
      () => onSelect(type),
      pointer => onDragReady(type, pointer)
    );
    cards.set(type, card);
  });

  const abilityGfx: Phaser.GameObjects.Graphics[] = [];
  const abilityTxt: Phaser.GameObjects.Text[] = [];
  const hero = game.hero;
  const heroSkillStartX = startX + towerTypes.length * (cardW + 6) + 18;
  if (hero) {
    [1, 2].forEach((abilityIndex, i) => {
      const made = createHeroAbilityButton(
        scene,
        heroSkillStartX + i * 56,
        centerY,
        hero,
        abilityIndex as 1 | 2,
        () => game.hero.useAbility(abilityIndex as 1 | 2, game.enemies, game.towers)
      );
      if (made) {
        abilityGfx.push(made.gfx);
        abilityTxt.push(made.txt);
      }
    });
  }

  const spellGfx = new Map<SpellType, Phaser.GameObjects.Graphics>();
  if (!game.modifiers.includes(TacticalModifier.NO_SPELLS)) {
    const spells = [SpellType.METEOR, SpellType.EMP, SpellType.SUPPLY];
    const spellStartX = safeBounds.right - 168;
    spells.forEach((sp, idx) => {
      spellGfx.set(sp, createSpellGem(scene, spellStartX + idx * 56, centerY, sp, () => {
        game.spellsManager.cast(sp, scene.time.now);
      }));
    });
  }

  return { cards, abilityGfx, abilityTxt, spellGfx };
}
