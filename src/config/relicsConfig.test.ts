import { beforeEach, describe, expect, it } from 'vitest';
import { RelicId } from '../core/Constants';
import { RELICS_CONFIG, relicDesc, relicName } from './relicsConfig';
import { setLanguage } from '../i18n/locales';

describe('relic copy', () => {
  beforeEach(() => setLanguage('pt'));

  it('uses Portuguese names by default', () => {
    expect(relicName(RELICS_CONFIG[RelicId.KINGS_CROWN])).toContain('Arthur');
    expect(relicDesc(RELICS_CONFIG[RelicId.HOLY_GRAIL])).toContain('Vidas');
  });

  it('switches names when locale is English', () => {
    setLanguage('en');
    expect(relicName(RELICS_CONFIG[RelicId.KINGS_CROWN])).toContain('Crown');
    expect(relicDesc(RELICS_CONFIG[RelicId.ARCANE_HOURGLASS])).toContain('cooldown');
  });
});
