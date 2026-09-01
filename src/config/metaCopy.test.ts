import { beforeEach, describe, expect, it } from 'vitest';
import { TECH_TREE_NODES } from './techTreeConfig';
import { HERO_PERK_NODES } from './heroPerksConfig';
import { MOD_CHIPS_CONFIG } from './modChipsConfig';
import { TOWERS_CONFIG } from './gameConfig';
import { ModChipType, TowerType } from '../core/Constants';
import { setLanguage, t } from '../i18n/locales';

describe('meta copy', () => {
  beforeEach(() => setLanguage('pt'));

  it('localizes grimório and talent nodes', () => {
    expect(t(TECH_TREE_NODES[0].nameKey)).toContain('Cofre');
    expect(t(HERO_PERK_NODES[0].nameKey)).toContain('Fúria');
    setLanguage('en');
    expect(t(TECH_TREE_NODES[0].nameKey)).toContain('Vault');
    expect(t(HERO_PERK_NODES[3].descKey)).toContain('15%');
  });

  it('localizes rune and legendary branch blurbs', () => {
    expect(t(MOD_CHIPS_CONFIG[ModChipType.CRITICAL_STRIKE].descKey)).toContain('25%');
    expect(t(TOWERS_CONFIG[TowerType.WITCH].descKey)).toContain('Bruxa');
    setLanguage('en');
    expect(t(TOWERS_CONFIG[TowerType.WITCH].descKey)).toContain('witch');
  });
});
