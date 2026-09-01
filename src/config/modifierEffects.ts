import { DamageType, TacticalModifier } from '../core/Constants';

/** One place to apply declared daily-challenge modifiers. */
export function towerCostMultiplier(modifiers?: TacticalModifier[]): number {
  return modifiers?.includes(TacticalModifier.DOUBLE_COST) ? 2 : 1;
}

export function towerDamageModifierMultiplier(
  modifiers: TacticalModifier[] | undefined,
  damageType: DamageType
): number {
  let multiplier = 1;
  if (modifiers?.includes(TacticalModifier.ENERGY_SURGE)) {
    if (damageType === DamageType.LASER || damageType === DamageType.ELECTRIC) {
      multiplier *= 1.5;
    } else if (damageType === DamageType.PHYSICAL) {
      multiplier *= 0.7;
    }
  }
  if (modifiers?.includes(TacticalModifier.GLASS_CANNONS)) {
    multiplier *= 1.5;
  }
  return multiplier;
}

export function spellsDisabled(modifiers?: TacticalModifier[]): boolean {
  return !!modifiers?.includes(TacticalModifier.NO_SPELLS);
}

export const MODIFIER_WIRED: Record<TacticalModifier, string> = {
  [TacticalModifier.DOUBLE_COST]: 'towerCostMultiplier',
  [TacticalModifier.FAST_ENEMIES]: 'WaveManager spawn speed',
  [TacticalModifier.NO_SPELLS]: 'spellsDisabled',
  [TacticalModifier.ARMORED_HORDE]: 'WaveManager armor',
  [TacticalModifier.GLASS_CANNONS]: 'daily lives=1 + towerDamageModifierMultiplier',
  [TacticalModifier.RICH_START]: 'daily gold + WaveManager count',
  [TacticalModifier.ENERGY_SURGE]: 'towerDamageModifierMultiplier',
  [TacticalModifier.CRYO_VULNERABLE]: 'WaveManager frost resist'
};
