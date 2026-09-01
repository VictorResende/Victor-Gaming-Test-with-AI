export enum DamageType {
  PHYSICAL = 'PHYSICAL', // Dano Físico / Balístico / Cortante
  LASER = 'LASER',       // Dano Arcano / Magia Pura
  FROST = 'FROST',       // Dano Glacial / Gelo Ancestral
  FIRE = 'FIRE',         // Dano de Fogo / Magma Vulcânico
  ELECTRIC = 'ELECTRIC'  // Dano Celestial / Trovão & Tempestade
}

export enum EnemyType {
  SCOUT = 'SCOUT',           // Batedor Goblin (Goblin Scout)
  SOLDIER = 'SOLDIER',       // Guerreiro Orc (Orc Warrior)
  TANK = 'TANK',             // Golem de Magma (Magma Golem)
  FLYER = 'FLYER',           // Gárgula Alada (Gargoyle)
  BOSS = 'BOSS',             // Dragão Ancião (Elder Dragon)
  CARRIER = 'CARRIER',       // Necromante das Trevas (Necromancer)
  SHIELDER = 'SHIELDER',     // Sacerdote Protetor (Shielder Priest)
  STEALTH = 'STEALTH',       // Assassino das Sombras (Shadow Assassin)
  MINI_DRONE = 'MINI_DRONE', // Servo Esqueleto (Skeleton Minion)
  SHAMAN = 'SHAMAN'          // Xamã Goblin Curandeiro (Goblin Shaman Healer)
}

export enum EliteAffix {
  FAST = 'FAST',                 // Rápido (+30% velocidade com rastro de vento ciano)
  REGENERATING = 'REGENERATING', // Regenerativo (+5% HP/s com partículas esmeralda)
  ARMORED = 'ARMORED'            // Blindado (+40% redução de dano físico com broquel de ferro)
}

export enum TowerType {
  GATLING = 'GATLING', // Balista de Arqueiros (Archer Ballista)
  CANNON = 'CANNON',   // Catapulta de Bombardeio (Catapult Bombard)
  CRYO = 'CRYO',       // Santuário de Gelo (Frost Sanctum)
  LASER = 'LASER',     // Torre Arcana (Arcane Spire)
  TESLA = 'TESLA',     // Santuário do Trovão (Storm Temple)
  WITCH = 'WITCH'      // Torre da Bruxa Oracular (Oracle Witch Tower)
}

export enum TargetPriority {
  FIRST = 'FIRST',
  LAST = 'LAST',
  STRONGEST = 'STRONGEST',
  FASTEST = 'FASTEST',
  CLOSEST = 'CLOSEST'
}

export enum GameSpeed {
  PAUSED = 0,
  NORMAL = 1,
  FAST = 2,
  ULTRA = 4
}

export enum SpellType {
  METEOR = 'METEOR', // Chuva de Meteoros (Firestorm Meteor)
  EMP = 'EMP',       // Congelamento Glacial (Glacial Freeze)
  SUPPLY = 'SUPPLY'  // Tributo Real em Ouro (Royal Gold Bounty)
}

export enum BiomeType {
  FOREST = 'FOREST',
  RAVINE = 'RAVINE',
  CITADEL = 'CITADEL',
  MAGMA = 'MAGMA',
  RUINS = 'RUINS',
  PINNACLE = 'PINNACLE'
}

export enum TowerBranchId {
  GATLING_VULCAN = 'gatling_vulcan',
  GATLING_SNIPER = 'gatling_sniper',
  CANNON_MISSILES = 'cannon_missiles',
  CANNON_NUCLEAR = 'cannon_nuclear',
  CRYO_BLIZZARD = 'cryo_blizzard',
  CRYO_ZERO = 'cryo_zero',
  LASER_ORBITAL = 'laser_orbital',
  LASER_PRISM = 'laser_prism',
  TESLA_STORM = 'tesla_storm',
  TESLA_PLASMA = 'tesla_plasma'
}

export enum GameMode {
  STANDARD = 'STANDARD',
  ENDLESS = 'ENDLESS',
  BOSS_RUSH = 'BOSS_RUSH',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE'
}

export enum ModChipType {
  CRITICAL_STRIKE = 'CRITICAL_STRIKE', // Runa do Golpe Crítico
  CHAIN_RICOCHET = 'CHAIN_RICOCHET',   // Runa do Ricochete Mágico / das Fadas
  ARMOR_PIERCE = 'ARMOR_PIERCE',       // Runa da Perfuração Sagrada
  CRYO_BLAST = 'CRYO_BLAST'            // Runa da Nevasca Glacial / Ancestral
}

export enum TacticalModifier {
  DOUBLE_COST = 'DOUBLE_COST',
  FAST_ENEMIES = 'FAST_ENEMIES',
  NO_SPELLS = 'NO_SPELLS',
  ARMORED_HORDE = 'ARMORED_HORDE',
  GLASS_CANNONS = 'GLASS_CANNONS',
  RICH_START = 'RICH_START',
  ENERGY_SURGE = 'ENERGY_SURGE',
  CRYO_VULNERABLE = 'CRYO_VULNERABLE'
}

export enum HeroClass {
  MECHA_DEFENDER = 'MECHA_DEFENDER', // Sir Galahad (Paladino da Luz)
  CYBER_SNIPER = 'CYBER_SNIPER',     // Alleria (Arqueira Guardiã)
  DRONE_ENGINEER = 'DRONE_ENGINEER'  // Ignis (Arquimago Elemental)
}

export enum HeroAbilityId {
  GROUND_SLAM = 'GROUND_SLAM',     // Golpe Sagrado (Sir Galahad)
  ENERGY_SHIELD = 'ENERGY_SHIELD', // Aura da Luz (Sir Galahad)
  HEADSHOT = 'HEADSHOT',           // Tiro Preciso (Alleria)
  ORBITAL_STRIKE = 'ORBITAL_STRIKE', // Chuva de Flechas (Alleria)
  COMBAT_TURRET = 'COMBAT_TURRET', // Meteoro Mágico / Totem Arcana (Ignis)
  OVERCHARGE = 'OVERCHARGE'        // Sobrecarga Arcana (Ignis)
}

export enum RelicId {
  KINGS_CROWN = 'kings_crown',
  DRAGONFIRE_FLASK = 'dragonfire_flask',
  HOLY_GRAIL = 'holy_grail',
  ARCANE_HOURGLASS = 'arcane_hourglass',
  ELVEN_BROOCH = 'elven_brooch'
}

export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  GRID_SIZE: 64,
  MAP_COLS: 20,
  MAP_ROWS: 11,
  INITIAL_LIVES: 20,
  INITIAL_GOLD: 350,
  SELL_RATIO: 0.75,
  EARLY_WAVE_GOLD_BONUS: 25,
  MAX_HERO_LEVEL: 10,
  HERO_RESPAWN_TIME_MS: 15000,
  MAX_EQUIPPED_RELICS: 3
};

