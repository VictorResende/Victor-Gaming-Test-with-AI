export interface TechNode {
  id: string;
  name: string;
  description: string;
  starCost: number;
  icon: string;
  effect: {
    rangeMultiplier?: number;
    damageMultiplier?: number;
    costMultiplier?: number;
    extraGold?: number;
    extraLives?: number;
    cooldownMultiplier?: number;
  };
}

export const TECH_TREE_NODES: TechNode[] = [
  {
    id: 'starting_gold',
    name: 'Cofre do Rei',
    description: 'Comece todas as fases com +150 de Ouro imperial extra.',
    starCost: 2,
    icon: '💰',
    effect: { extraGold: 150 }
  },
  {
    id: 'starting_lives',
    name: 'Baluarte da Fortaleza',
    description: 'Aumenta as vidas do reino em +5 corações de honra.',
    starCost: 2,
    icon: '🛡️',
    effect: { extraLives: 5 }
  },
  {
    id: 'range_all',
    name: 'Olho de Águia & Clarividência',
    description: 'Aumenta o alcance de visão e disparo de todas as defesas em +15%.',
    starCost: 3,
    icon: '🎯',
    effect: { rangeMultiplier: 1.15 }
  },
  {
    id: 'cost_discount',
    name: 'Arquitetura Real',
    description: 'Reduz o custo de construção de todas as torres em 10%.',
    starCost: 3,
    icon: '⚙️',
    effect: { costMultiplier: 0.9 }
  },
  {
    id: 'damage_all',
    name: 'Encantamento de Lâminas & Runas',
    description: 'Aumenta o poder de dano e impacto de todas as defesas em +20%.',
    starCost: 4,
    icon: '⚡',
    effect: { damageMultiplier: 1.2 }
  },
  {
    id: 'spell_cd',
    name: 'Canalização Arcana',
    description: 'Reduz o tempo de recarga (cooldown) das magias e feitiços em 25%.',
    starCost: 3,
    icon: '🚀',
    effect: { cooldownMultiplier: 0.75 }
  }
];
