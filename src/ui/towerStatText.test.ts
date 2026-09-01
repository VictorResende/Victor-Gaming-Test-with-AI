import { describe, expect, it, beforeEach } from 'vitest';
import { TowerType } from '../core/Constants';
import { setLanguage } from '../i18n/locales';
import { describeTowerBuildRole, describeTowerCombat, slowPercent } from './towerStatText';

describe('tower combat copy', () => {
  beforeEach(() => setLanguage('pt'));
  it('renders cryo slow as remaining-speed percent, not raw DPS-only', () => {
    expect(slowPercent(0.5)).toBe(50);
    const line = describeTowerCombat({
      damage: 14,
      fireRate: 1.4,
      slowFactor: 0.5,
      slowDuration: 2500
    });
    expect(line).toContain('−50% vel 2.5s');
    expect(line).toContain('DPS');
  });

  it('labels cryo build cards by slow, not gold-per-DPS', () => {
    expect(describeTowerBuildRole(TowerType.CRYO, {
      damage: 14,
      fireRate: 1.4,
      slowFactor: 0.5,
      slowDuration: 2500
    })).toBe('❄️ −50% vel');
  });
});
