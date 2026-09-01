import { describe, expect, it, beforeEach } from 'vitest';
import { DamageType } from '../core/Constants';
import { setLanguage } from '../i18n/locales';
import { describeEnemyThreat, listResistances } from './resistanceText';

describe('enemy resistance copy', () => {
  beforeEach(() => setLanguage('pt'));
  it('splits weaknesses from resists', () => {
    const { weak, resist } = listResistances({
      [DamageType.PHYSICAL]: 0.6,
      [DamageType.LASER]: 1.5,
      [DamageType.FROST]: 1.0
    });
    expect(resist.join(' ')).toContain('Físico');
    expect(weak.join(' ')).toContain('Arcano');
    expect(weak.join(' ')).not.toContain('Gelo');
  });

  it('describes a magma golem as physical-resist / arcane-weak', () => {
    const line = describeEnemyThreat({
      armor: 0.35,
      isFlying: false,
      resistances: {
        [DamageType.PHYSICAL]: 0.6,
        [DamageType.LASER]: 1.5
      }
    });
    expect(line).toContain('armadura 35%');
    expect(line).toContain('fraco: Arcano');
    expect(line).toContain('resiste: Físico');
  });

  it('uses English armor copy when locale is en', () => {
    setLanguage('en');
    const line = describeEnemyThreat({
      armor: 0.35,
      isFlying: false,
      resistances: { [DamageType.PHYSICAL]: 0.6 }
    });
    expect(line).toContain('armor 35%');
    expect(line).toContain('resists: Physical');
    setLanguage('pt');
  });
});
