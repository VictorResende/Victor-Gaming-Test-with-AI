export enum RelicType {
  KINGS_CROWN = 'KINGS_CROWN',
  DRAGONFIRE_FLASK = 'DRAGONFIRE_FLASK',
  HOLY_GRAIL = 'HOLY_GRAIL',
  ARCANE_HOURGLASS = 'ARCANE_HOURGLASS',
  ELVEN_BROOCH = 'ELVEN_BROOCH'
}

export interface RelicConfig {
  id: RelicType;
  nameKey: string;
  nameDefault: string;
  descKey: string;
  descDefault: string;
  icon: string;
  costStars: number;
  colorHex: string;
}

export const RELICS_CONFIG: Record<RelicType, RelicConfig> = {
  [RelicType.KINGS_CROWN]: {
    id: RelicType.KINGS_CROWN,
    nameKey: 'relic_kings_crown_name',
    nameDefault: 'Coroa do Rei Arthur',
    descKey: 'relic_kings_crown_desc',
    descDefault: '+100 Ouro Inicial no Reino e +10% no Dano de todas as Torres',
    icon: '👑',
    costStars: 3,
    colorHex: '#facc15'
  },
  [RelicType.DRAGONFIRE_FLASK]: {
    id: RelicType.DRAGONFIRE_FLASK,
    nameKey: 'relic_dragonfire_name',
    nameDefault: 'Frasco de Fogo de Dragão',
    descKey: 'relic_dragonfire_desc',
    descDefault: '+25% de Dano de Queimadura/Fogo e +2s na duração dos Meteoros',
    icon: '🧪',
    costStars: 3,
    colorHex: '#ef4444'
  },
  [RelicType.HOLY_GRAIL]: {
    id: RelicType.HOLY_GRAIL,
    nameKey: 'relic_holy_grail_name',
    nameDefault: 'Cálice da Vida Eterna',
    descKey: 'relic_holy_grail_desc',
    descDefault: '+5 Vidas Iniciais no Coração do Reino',
    icon: '🏆',
    costStars: 2,
    colorHex: '#ec4899'
  },
  [RelicType.ARCANE_HOURGLASS]: {
    id: RelicType.ARCANE_HOURGLASS,
    nameKey: 'relic_hourglass_name',
    nameDefault: 'Ampulheta Arcana',
    descKey: 'relic_hourglass_desc',
    descDefault: '-25% no Tempo de Recarga de todos os Feitiços Globais',
    icon: '⏳',
    costStars: 4,
    colorHex: '#a855f7'
  },
  [RelicType.ELVEN_BROOCH]: {
    id: RelicType.ELVEN_BROOCH,
    nameKey: 'relic_elven_brooch_name',
    nameDefault: 'Broche da Rainha Élfica',
    descKey: 'relic_elven_brooch_desc',
    descDefault: '+15% de Alcance de Ataque em todas as Torres e Balistas',
    icon: '🧝‍♀️',
    costStars: 3,
    colorHex: '#10b981'
  }
};
