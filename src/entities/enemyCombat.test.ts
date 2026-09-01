import { describe, expect, it } from 'vitest';
import { DamageType, EliteAffix, EnemyType } from '../core/Constants';
import {
  bossMoveSpeedFactor,
  bossPhaseTransition,
  computeIncomingDamage,
  livesLostOnLeak
} from './enemyCombat';

describe('computeIncomingDamage', () => {
  it('applies resistance then armor then elite armored', () => {
    const raw = computeIncomingDamage(100, DamageType.PHYSICAL, { [DamageType.PHYSICAL]: 0.5 }, 0.2, false, EliteAffix.ARMORED);
    expect(raw).toBeCloseTo(100 * 0.5 * 0.8 * 0.6);
  });

  it('skips armor when pierce is on', () => {
    const raw = computeIncomingDamage(100, DamageType.PHYSICAL, {}, 0.5, true, null);
    expect(raw).toBe(100);
  });

  it('does not apply elite armored to frost', () => {
    const raw = computeIncomingDamage(80, DamageType.FROST, {}, 0.4, false, EliteAffix.ARMORED);
    expect(raw).toBe(80);
  });
});

describe('bossPhaseTransition', () => {
  it('enters phase 2 at 60%', () => {
    expect(bossPhaseTransition(0.6, false, false)).toBe('enter2');
    expect(bossPhaseTransition(0.61, false, false)).toBeNull();
  });

  it('enters both if HP skips straight to 30%', () => {
    expect(bossPhaseTransition(0.3, false, false)).toBe('enter2and3');
  });

  it('enters only phase 3 if phase 2 already happened', () => {
    expect(bossPhaseTransition(0.29, true, false)).toBe('enter3');
  });
});

describe('bossMoveSpeedFactor / leak lives', () => {
  it('speeds bosses from phase 2', () => {
    expect(bossMoveSpeedFactor(true, 2)).toBe(1.35);
    expect(bossMoveSpeedFactor(false, 3)).toBe(1);
  });

  it('charges extra lives for bosses and carriers', () => {
    expect(livesLostOnLeak(true, EnemyType.SCOUT)).toBe(5);
    expect(livesLostOnLeak(false, EnemyType.CARRIER)).toBe(3);
    expect(livesLostOnLeak(false, EnemyType.SCOUT)).toBe(1);
  });
});
