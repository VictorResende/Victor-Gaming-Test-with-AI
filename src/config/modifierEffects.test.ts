import { describe, expect, it } from 'vitest';
import { DamageType, TacticalModifier } from '../core/Constants';
import { spellsDisabled, towerCostMultiplier, towerDamageModifierMultiplier } from './modifierEffects';

describe('modifierEffects', () => {
  it('doubles tower gold cost', () => {
    expect(towerCostMultiplier([TacticalModifier.DOUBLE_COST])).toBe(2);
    expect(towerCostMultiplier([])).toBe(1);
  });

  it('blocks spells on NO_SPELLS', () => {
    expect(spellsDisabled([TacticalModifier.NO_SPELLS])).toBe(true);
    expect(spellsDisabled([])).toBe(false);
  });

  it('Energy Surge boosts arcane/lightning and cuts physical', () => {
    expect(towerDamageModifierMultiplier([TacticalModifier.ENERGY_SURGE], DamageType.LASER)).toBe(1.5);
    expect(towerDamageModifierMultiplier([TacticalModifier.ENERGY_SURGE], DamageType.ELECTRIC)).toBe(1.5);
    expect(towerDamageModifierMultiplier([TacticalModifier.ENERGY_SURGE], DamageType.PHYSICAL)).toBeCloseTo(0.7);
    expect(towerDamageModifierMultiplier([TacticalModifier.ENERGY_SURGE], DamageType.FIRE)).toBe(1);
  });

  it('Glass Cannons stacks with Energy Surge on lasers', () => {
    expect(
      towerDamageModifierMultiplier(
        [TacticalModifier.ENERGY_SURGE, TacticalModifier.GLASS_CANNONS],
        DamageType.LASER
      )
    ).toBeCloseTo(2.25);
  });
});
