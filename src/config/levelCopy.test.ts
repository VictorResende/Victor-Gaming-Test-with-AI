import { beforeEach, describe, expect, it } from 'vitest';
import { LEVELS_CONFIG, levelBlurb, levelTitle } from './levelsConfig';
import { BOSS_RUSH_LEVEL } from './bossRushConfig';
import { setLanguage } from '../i18n/locales';

describe('level copy', () => {
  beforeEach(() => setLanguage('pt'));

  it('titles campaign maps in Portuguese', () => {
    expect(levelTitle(LEVELS_CONFIG[0])).toContain('Floresta');
    expect(levelBlurb(LEVELS_CONFIG[LEVELS_CONFIG.length - 1])).toContain('Dragão');
  });

  it('switches map titles in English', () => {
    setLanguage('en');
    expect(levelTitle(LEVELS_CONFIG[0])).toContain('Forest');
    expect(levelTitle(BOSS_RUSH_LEVEL)).toContain('Titans');
  });
});
