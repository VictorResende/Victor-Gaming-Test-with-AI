import { beforeEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS_LIST, achievementTitle } from './achievementsConfig';
import { ENEMIES_CONFIG, enemyDisplayName } from './gameConfig';
import { EnemyType } from '../core/Constants';
import { setLanguage } from '../i18n/locales';

describe('honor titles and enemy names', () => {
  beforeEach(() => setLanguage('pt'));

  it('lists every honor title in Portuguese', () => {
    expect(ACHIEVEMENTS_LIST).toHaveLength(18);
    expect(achievementTitle(ACHIEVEMENTS_LIST[0])).toBe('Primeiro Sangue');
  });

  it('names the elder dragon in both locales', () => {
    expect(enemyDisplayName(ENEMIES_CONFIG[EnemyType.BOSS])).toContain('Dragão');
    setLanguage('en');
    expect(enemyDisplayName(ENEMIES_CONFIG[EnemyType.BOSS])).toContain('Dragon');
    expect(achievementTitle(ACHIEVEMENTS_LIST[0])).toBe('First Blood');
  });
});
