export interface HeroPerkNode {
  id: string;
  name: string;
  description: string;
  starCost: number;
  icon: string;
  effect: {
    damageMultiplier?: number;    // +15% Hero Base Damage
    hpMultiplier?: number;        // +20% Hero HP
    cooldownMultiplier?: number;  // -20% Ability Cooldown
    moveSpeedMultiplier?: number; // +15% Hero Move Speed
    respawnReductionMs?: number;  // -5000ms Respawn Time (10s instead of 15s)
    xpMultiplier?: number;        // +25% Hero XP Gain
  };
}

export const HERO_PERK_NODES: HeroPerkNode[] = [
  {
    id: 'hero_damage_boost',
    name: 'Fúria dos Campeões',
    description: 'Aumenta o dano de ataque básico de todos os heróis em +15%.',
    starCost: 3,
    icon: '⚔️',
    effect: { damageMultiplier: 1.15 }
  },
  {
    id: 'hero_hp_boost',
    name: 'Vigor dos Titãs',
    description: 'Aumenta a Vida máxima de todos os heróis em +20%.',
    starCost: 3,
    icon: '❤️',
    effect: { hpMultiplier: 1.20 }
  },
  {
    id: 'hero_cooldown_reduct',
    name: 'Canalização Arcana',
    description: 'Reduz o tempo de recarga de todas as habilidades de heróis em 20%.',
    starCost: 4,
    icon: '⚡',
    effect: { cooldownMultiplier: 0.80 }
  },
  {
    id: 'hero_move_speed',
    name: 'Passos da Tempestade',
    description: 'Aumenta a velocidade de marcha e movimentação dos heróis em +15%.',
    starCost: 2,
    icon: '👢',
    effect: { moveSpeedMultiplier: 1.15 }
  },
  {
    id: 'hero_revive_speed',
    name: 'Graça Celestial do Altar',
    description: 'Acelera o tempo de ressurreição no Altar Sagrado em 5s (10s no total).',
    starCost: 3,
    icon: '✨',
    effect: { respawnReductionMs: 5000 }
  },
  {
    id: 'hero_xp_boost',
    name: 'Mestria Marcial',
    description: 'Aumenta todo o ganho de Experiência (XP) do herói em +25%.',
    starCost: 2,
    icon: '📖',
    effect: { xpMultiplier: 1.25 }
  }
];
