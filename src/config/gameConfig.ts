import { DamageType, EnemyType, HeroAbilityId, HeroClass, SpellType, TowerBranchId, TowerType } from '../core/Constants';
import type { I18nKey } from '../i18n/locales';
import { t } from '../i18n/locales';

export interface TowerLevelData {
  level: number;
  damage: number;
  range: number;
  fireRate: number; // Disparos por segundo
  upgradeCost: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  laserDPS?: number;
  chainCount?: number;
}

export interface Tier4BranchData extends TowerLevelData {
  branchId: TowerBranchId;
  nameKey: string;
  titleKey: string;
  descKey: I18nKey;
  accentColor: number;
  turretTextureKey: string;
  projectileTextureKey?: string;
  isSpecialAttack?: boolean;
}

export interface TowerConfigData {
  type: TowerType;
  nameKey: string;
  cost: number;
  damageType: DamageType;
  baseColor: number;
  accentColor: number;
  descKey: I18nKey;
  levels: TowerLevelData[];
  tier4Branches?: [Tier4BranchData, Tier4BranchData];
}

export const TOWERS_CONFIG: Record<TowerType, TowerConfigData> = {
  [TowerType.GATLING]: {
    type: TowerType.GATLING,
    nameKey: 'gatlingName',
    cost: 100,
    damageType: DamageType.PHYSICAL,
    baseColor: 0x475569,
    accentColor: 0x38bdf8,
    descKey: 'gatlingDesc',
    levels: [
      { level: 1, damage: 15, range: 160, fireRate: 2.5, upgradeCost: 120 },
      { level: 2, damage: 28, range: 185, fireRate: 3.2, upgradeCost: 220 },
      { level: 3, damage: 50, range: 215, fireRate: 4.2, upgradeCost: 0 }
    ],
    tier4Branches: [
      {
        level: 4,
        branchId: TowerBranchId.GATLING_VULCAN,
        nameKey: 'branchVulcanName',
        titleKey: 'branchVulcanTitle',
        descKey: 'branchVulcanDesc',
        damage: 38,
        range: 225,
        fireRate: 10.0,
        upgradeCost: 450,
        accentColor: 0xf97316,
        turretTextureKey: 'turret_gatling_vulcan',
        projectileTextureKey: 'proj_bullet'
      },
      {
        level: 4,
        branchId: TowerBranchId.GATLING_SNIPER,
        nameKey: 'branchSniperName',
        titleKey: 'branchSniperTitle',
        descKey: 'branchSniperDesc',
        damage: 320,
        range: 380,
        fireRate: 1.0,
        upgradeCost: 480,
        accentColor: 0x22c55e,
        turretTextureKey: 'turret_gatling_sniper',
        projectileTextureKey: 'proj_sniper'
      }
    ]
  },
  [TowerType.CANNON]: {
    type: TowerType.CANNON,
    nameKey: 'cannonName',
    cost: 175,
    damageType: DamageType.PHYSICAL,
    baseColor: 0x334155,
    accentColor: 0xf97316,
    descKey: 'cannonDesc',
    levels: [
      { level: 1, damage: 55, range: 190, fireRate: 0.8, splashRadius: 75, upgradeCost: 180 },
      { level: 2, damage: 110, range: 220, fireRate: 0.95, splashRadius: 95, upgradeCost: 300 },
      { level: 3, damage: 220, range: 250, fireRate: 1.15, splashRadius: 120, upgradeCost: 0 }
    ],
    tier4Branches: [
      {
        level: 4,
        branchId: TowerBranchId.CANNON_MISSILES,
        nameKey: 'branchMissilesName',
        titleKey: 'branchMissilesTitle',
        descKey: 'branchMissilesDesc',
        damage: 240,
        range: 280,
        fireRate: 1.6,
        splashRadius: 90,
        upgradeCost: 500,
        accentColor: 0xef4444,
        turretTextureKey: 'turret_cannon_missiles',
        projectileTextureKey: 'proj_missile'
      },
      {
        level: 4,
        branchId: TowerBranchId.CANNON_NUCLEAR,
        nameKey: 'branchNuclearName',
        titleKey: 'branchNuclearTitle',
        descKey: 'branchNuclearDesc',
        damage: 600,
        range: 320,
        fireRate: 0.65,
        splashRadius: 160,
        upgradeCost: 550,
        accentColor: 0x84cc16,
        turretTextureKey: 'turret_cannon_nuclear',
        projectileTextureKey: 'proj_nuke'
      }
    ]
  },
  [TowerType.CRYO]: {
    type: TowerType.CRYO,
    nameKey: 'cryoName',
    cost: 120,
    damageType: DamageType.FROST,
    baseColor: 0x1e293b,
    accentColor: 0x06b6d4,
    descKey: 'cryoDesc',
    levels: [
      { level: 1, damage: 14, range: 145, fireRate: 1.4, slowFactor: 0.5, slowDuration: 2500, upgradeCost: 150 },
      { level: 2, damage: 22, range: 165, fireRate: 1.4, slowFactor: 0.65, slowDuration: 3200, upgradeCost: 260 },
      { level: 3, damage: 45, range: 195, fireRate: 1.6, slowFactor: 0.8, slowDuration: 4000, upgradeCost: 0 }
    ],
    tier4Branches: [
      {
        level: 4,
        branchId: TowerBranchId.CRYO_BLIZZARD,
        nameKey: 'branchBlizzardName',
        titleKey: 'branchBlizzardTitle',
        descKey: 'branchBlizzardDesc',
        damage: 80,
        range: 240,
        fireRate: 2.2,
        slowFactor: 0.85,
        slowDuration: 5000,
        splashRadius: 120,
        upgradeCost: 460,
        accentColor: 0x38bdf8,
        turretTextureKey: 'turret_cryo_blizzard',
        projectileTextureKey: 'proj_cryo'
      },
      {
        level: 4,
        branchId: TowerBranchId.CRYO_ZERO,
        nameKey: 'branchZeroName',
        titleKey: 'branchZeroTitle',
        descKey: 'branchZeroDesc',
        damage: 200,
        range: 215,
        fireRate: 1.3,
        slowFactor: 0.95,
        slowDuration: 4000,
        upgradeCost: 490,
        accentColor: 0x06b6d4,
        turretTextureKey: 'turret_cryo_zero',
        projectileTextureKey: 'proj_cryo'
      }
    ]
  },
  [TowerType.LASER]: {
    type: TowerType.LASER,
    nameKey: 'laserName',
    cost: 200,
    damageType: DamageType.LASER,
    baseColor: 0x312e81,
    accentColor: 0xa855f7,
    descKey: 'laserDesc',
    levels: [
      { level: 1, damage: 4, range: 175, fireRate: 15, laserDPS: 60, upgradeCost: 210 },
      { level: 2, damage: 8, range: 205, fireRate: 15, laserDPS: 120, upgradeCost: 340 },
      { level: 3, damage: 16, range: 240, fireRate: 15, laserDPS: 240, upgradeCost: 0 }
    ],
    tier4Branches: [
      {
        level: 4,
        branchId: TowerBranchId.LASER_ORBITAL,
        nameKey: 'branchOrbitalName',
        titleKey: 'branchOrbitalTitle',
        descKey: 'branchOrbitalDesc',
        damage: 30,
        range: 280,
        fireRate: 18,
        laserDPS: 520,
        upgradeCost: 540,
        accentColor: 0xe11d48,
        turretTextureKey: 'turret_laser_orbital'
      },
      {
        level: 4,
        branchId: TowerBranchId.LASER_PRISM,
        nameKey: 'branchPrismName',
        titleKey: 'branchPrismTitle',
        descKey: 'branchPrismDesc',
        damage: 18,
        range: 250,
        fireRate: 18,
        laserDPS: 260,
        chainCount: 4,
        upgradeCost: 520,
        accentColor: 0xa855f7,
        turretTextureKey: 'turret_laser_prism'
      }
    ]
  },
  [TowerType.TESLA]: {
    type: TowerType.TESLA,
    nameKey: 'teslaName',
    cost: 240,
    damageType: DamageType.ELECTRIC,
    baseColor: 0x1e1b4b,
    accentColor: 0xeab308,
    descKey: 'teslaDesc',
    levels: [
      { level: 1, damage: 40, range: 150, fireRate: 1.0, chainCount: 3, upgradeCost: 250 },
      { level: 2, damage: 85, range: 175, fireRate: 1.2, chainCount: 4, upgradeCost: 380 },
      { level: 3, damage: 160, range: 205, fireRate: 1.4, chainCount: 6, upgradeCost: 0 }
    ],
    tier4Branches: [
      {
        level: 4,
        branchId: TowerBranchId.TESLA_STORM,
        nameKey: 'branchStormName',
        titleKey: 'branchStormTitle',
        descKey: 'branchStormDesc',
        damage: 280,
        range: 235,
        fireRate: 1.15,
        chainCount: 10,
        upgradeCost: 550,
        accentColor: 0x38bdf8,
        turretTextureKey: 'turret_tesla_storm'
      },
      {
        level: 4,
        branchId: TowerBranchId.TESLA_PLASMA,
        nameKey: 'branchPlasmaName',
        titleKey: 'branchPlasmaTitle',
        descKey: 'branchPlasmaDesc',
        damage: 480,
        range: 220,
        fireRate: 1.1,
        chainCount: 4,
        splashRadius: 80,
        upgradeCost: 530,
        accentColor: 0xfacc15,
        turretTextureKey: 'turret_tesla_plasma'
      }
    ]
  },
  [TowerType.WITCH]: {
    type: TowerType.WITCH,
    nameKey: 'witchName',
    cost: 210,
    damageType: DamageType.ELECTRIC,
    baseColor: 0x312e81,
    accentColor: 0x38bdf8,
    descKey: 'witchDesc',
    levels: [
      { level: 1, damage: 34, range: 175, fireRate: 0.95, splashRadius: 46, upgradeCost: 210 },
      { level: 2, damage: 68, range: 205, fireRate: 1.1, splashRadius: 58, upgradeCost: 330 },
      { level: 3, damage: 125, range: 235, fireRate: 1.25, splashRadius: 72, upgradeCost: 0 }
    ]
  }
};

export interface EnemyConfigData {
  type: EnemyType;
  nameKey: I18nKey;
  maxHp: number;
  speed: number;
  rewardGold: number;
  scoreValue: number;
  armor: number; // Redução percentual contra dano físico
  color: number;
  size: number;
  isFlying?: boolean;
  isBoss?: boolean;
  shieldHp?: number; // Pontos de Escudo de Proteção Sagrada/Profana
  shieldRadius?: number; // Raio de Proteção para Shielder
  isStealth?: boolean; // Se inicia invisível e indetectável
  spawnIntervalMs?: number; // Intervalo de invocação para Necromancer
  healIntervalMs?: number; // Intervalo de cura para Shaman
  healRadius?: number; // Raio da aura de cura
  healPercent?: number; // Percentual de cura (% do maxHp)
  resistances: Partial<Record<DamageType, number>>; // Multiplicador de dano (0.5 = toma 50% de dano, 1.5 = toma 150%)
}

export function enemyDisplayName(config: Pick<EnemyConfigData, 'nameKey'>): string {
  return t(config.nameKey);
}

export const ENEMIES_CONFIG: Record<EnemyType, EnemyConfigData> = {
  [EnemyType.SCOUT]: {
    type: EnemyType.SCOUT,
    nameKey: 'enemyScout',
    maxHp: 75,
    speed: 125,
    rewardGold: 12,
    scoreValue: 50,
    armor: 0,
    color: 0x38bdf8,
    size: 22,
    resistances: {
      [DamageType.PHYSICAL]: 1.0,
      [DamageType.FROST]: 1.3,
      [DamageType.LASER]: 0.9
    }
  },
  [EnemyType.SOLDIER]: {
    type: EnemyType.SOLDIER,
    nameKey: 'enemySoldier',
    maxHp: 180,
    speed: 80,
    rewardGold: 22,
    scoreValue: 90,
    armor: 0.15,
    color: 0x22c55e,
    size: 26,
    resistances: {
      [DamageType.PHYSICAL]: 0.9,
      [DamageType.FIRE]: 1.2,
      [DamageType.LASER]: 1.2
    }
  },
  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    nameKey: 'enemyTank',
    maxHp: 520,
    speed: 48,
    rewardGold: 45,
    scoreValue: 200,
    armor: 0.35,
    color: 0xeab308,
    size: 32,
    resistances: {
      [DamageType.PHYSICAL]: 0.6,
      [DamageType.LASER]: 1.5,
      [DamageType.ELECTRIC]: 1.3
    }
  },
  [EnemyType.FLYER]: {
    type: EnemyType.FLYER,
    nameKey: 'enemyFlyer',
    maxHp: 130,
    speed: 105,
    rewardGold: 25,
    scoreValue: 120,
    armor: 0.05,
    color: 0xc084fc,
    size: 24,
    isFlying: true,
    resistances: {
      [DamageType.PHYSICAL]: 1.2,
      [DamageType.FROST]: 0.8,
      [DamageType.ELECTRIC]: 1.4
    }
  },
  [EnemyType.BOSS]: {
    type: EnemyType.BOSS,
    nameKey: 'enemyBoss',
    maxHp: 2800,
    speed: 36,
    rewardGold: 250,
    scoreValue: 1500,
    armor: 0.4,
    color: 0xef4444,
    size: 44,
    isBoss: true,
    resistances: {
      [DamageType.PHYSICAL]: 0.7,
      [DamageType.LASER]: 1.1,
      [DamageType.ELECTRIC]: 1.1,
      [DamageType.FROST]: 0.6
    }
  },
  [EnemyType.GOLEM_BOSS]: {
    type: EnemyType.GOLEM_BOSS,
    nameKey: 'enemyGolemBoss',
    maxHp: 2200,
    speed: 32,
    rewardGold: 200,
    scoreValue: 1200,
    armor: 0.5,
    color: 0x78716c,
    size: 42,
    isBoss: true,
    resistances: {
      [DamageType.PHYSICAL]: 0.5,
      [DamageType.FROST]: 0.8,
      [DamageType.LASER]: 1.3,
      [DamageType.ELECTRIC]: 1.2
    }
  },
  [EnemyType.FROST_GIANT_BOSS]: {
    type: EnemyType.FROST_GIANT_BOSS,
    nameKey: 'enemyFrostGiantBoss',
    maxHp: 2600,
    speed: 30,
    rewardGold: 230,
    scoreValue: 1400,
    armor: 0.35,
    color: 0x38bdf8,
    size: 44,
    isBoss: true,
    resistances: {
      [DamageType.FROST]: 0.3,
      [DamageType.FIRE]: 1.5,
      [DamageType.PHYSICAL]: 0.7,
      [DamageType.LASER]: 1.1
    }
  },
  [EnemyType.INFERNAL_BOSS]: {
    type: EnemyType.INFERNAL_BOSS,
    nameKey: 'enemyInfernalBoss',
    maxHp: 3100,
    speed: 34,
    rewardGold: 280,
    scoreValue: 1600,
    armor: 0.45,
    color: 0xd97706,
    size: 46,
    isBoss: true,
    resistances: {
      [DamageType.FIRE]: 0.2,
      [DamageType.FROST]: 1.5,
      [DamageType.PHYSICAL]: 0.6,
      [DamageType.ELECTRIC]: 1.1
    }
  },
  [EnemyType.CARRIER]: {
    type: EnemyType.CARRIER,
    nameKey: 'enemyCarrier',
    maxHp: 850,
    speed: 42,
    rewardGold: 60,
    scoreValue: 300,
    armor: 0.25,
    color: 0x8b5cf6,
    size: 38,
    spawnIntervalMs: 3200,
    resistances: {
      [DamageType.PHYSICAL]: 0.8,
      [DamageType.LASER]: 1.2,
      [DamageType.ELECTRIC]: 1.3,
      [DamageType.FROST]: 1.0
    }
  },
  [EnemyType.SHIELDER]: {
    type: EnemyType.SHIELDER,
    nameKey: 'enemyShielder',
    maxHp: 520,
    speed: 52,
    rewardGold: 50,
    scoreValue: 240,
    armor: 0.1,
    color: 0x06b6d4,
    size: 32,
    shieldHp: 400,
    shieldRadius: 130,
    resistances: {
      [DamageType.PHYSICAL]: 0.9,
      [DamageType.LASER]: 0.7,
      [DamageType.ELECTRIC]: 1.5,
      [DamageType.FROST]: 0.8
    }
  },
  [EnemyType.STEALTH]: {
    type: EnemyType.STEALTH,
    nameKey: 'enemyStealth',
    maxHp: 220,
    speed: 110,
    rewardGold: 35,
    scoreValue: 160,
    armor: 0,
    color: 0x475569,
    size: 24,
    isStealth: true,
    resistances: {
      [DamageType.PHYSICAL]: 1.0,
      [DamageType.LASER]: 1.5,
      [DamageType.FROST]: 1.5,
      [DamageType.ELECTRIC]: 0.9
    }
  },
  [EnemyType.MINI_DRONE]: {
    type: EnemyType.MINI_DRONE,
    nameKey: 'enemyDrone',
    maxHp: 55,
    speed: 145,
    rewardGold: 6,
    scoreValue: 30,
    armor: 0,
    color: 0xc084fc,
    size: 16,
    isFlying: true,
    resistances: {
      [DamageType.PHYSICAL]: 1.2,
      [DamageType.LASER]: 1.0,
      [DamageType.FROST]: 1.0,
      [DamageType.ELECTRIC]: 1.6
    }
  },
  [EnemyType.SHAMAN]: {
    type: EnemyType.SHAMAN,
    nameKey: 'enemyShaman',
    maxHp: 380,
    speed: 56,
    rewardGold: 40,
    scoreValue: 180,
    armor: 0.1,
    color: 0x22c55e,
    size: 28,
    healIntervalMs: 2500,
    healRadius: 140,
    healPercent: 0.18,
    resistances: {
      [DamageType.PHYSICAL]: 0.9,
      [DamageType.LASER]: 1.2,
      [DamageType.FIRE]: 1.3,
      [DamageType.FROST]: 1.0,
      [DamageType.ELECTRIC]: 1.1
    }
  }
};

export interface SpellConfigData {
  type: SpellType;
  nameKey: string;
  cooldownMs: number;
  iconColor: number;
  radius?: number;
  damage?: number;
  durationMs?: number;
  goldAmount?: number;
}

export const SPELLS_CONFIG: Record<SpellType, SpellConfigData> = {
  [SpellType.METEOR]: {
    type: SpellType.METEOR,
    nameKey: 'spellMeteor',
    cooldownMs: 35000,
    iconColor: 0xf97316,
    radius: 160,
    damage: 600
  },
  [SpellType.EMP]: {
    type: SpellType.EMP,
    nameKey: 'spellEMP',
    cooldownMs: 25000,
    iconColor: 0x06b6d4,
    radius: 220,
    damage: 150,
    durationMs: 4500
  },
  [SpellType.SUPPLY]: {
    type: SpellType.SUPPLY,
    nameKey: 'spellSupply',
    cooldownMs: 45000,
    iconColor: 0xeab308,
    goldAmount: 180
  }
};

export interface HeroAbilityConfigData {
  id: HeroAbilityId;
  nameKey: string;
  descKey: string;
  cooldownMs: number;
  iconTexture: string;
  range?: number;
  radius?: number;
  damage?: number;
  durationMs?: number;
}

export interface HeroConfigData {
  heroClass: HeroClass;
  nameKey: string;
  titleKey: string;
  textureKey: string;
  portraitKey: string;
  baseHp: number;
  baseDamage: number;
  baseAttackSpeed: number; // Disparos / golpes por segundo
  baseArmor: number; // 0 a 1
  baseRange: number;
  moveSpeed: number;
  hpRegenPerSec: number;
  damageType: DamageType;
  color: number;
  abilities: [HeroAbilityConfigData, HeroAbilityConfigData];
}

export const HEROES_CONFIG: Record<HeroClass, HeroConfigData> = {
  [HeroClass.MECHA_DEFENDER]: {
    heroClass: HeroClass.MECHA_DEFENDER,
    nameKey: 'heroMechaName',
    titleKey: 'heroMechaTitle',
    textureKey: 'hero_mecha_defender',
    portraitKey: 'hero_portrait_mecha_defender',
    baseHp: 1100,
    baseDamage: 45,
    baseAttackSpeed: 1.25,
    baseArmor: 0.30,
    baseRange: 95,
    moveSpeed: 135,
    hpRegenPerSec: 15,
    damageType: DamageType.PHYSICAL,
    color: 0xf59e0b,
    abilities: [
      {
        id: HeroAbilityId.GROUND_SLAM,
        nameKey: 'groundSlam',
        descKey: 'groundSlamDesc',
        cooldownMs: 16000,
        iconTexture: 'ability_ground_slam',
        radius: 180,
        damage: 240,
        durationMs: 2500
      },
      {
        id: HeroAbilityId.ENERGY_SHIELD,
        nameKey: 'energyShield',
        descKey: 'energyShieldDesc',
        cooldownMs: 26000,
        iconTexture: 'ability_energy_shield',
        radius: 120,
        damage: 40,
        durationMs: 6000
      }
    ]
  },
  [HeroClass.CYBER_SNIPER]: {
    heroClass: HeroClass.CYBER_SNIPER,
    nameKey: 'heroSniperName',
    titleKey: 'heroSniperTitle',
    textureKey: 'hero_cyber_sniper',
    portraitKey: 'hero_portrait_cyber_sniper',
    baseHp: 520,
    baseDamage: 95,
    baseAttackSpeed: 0.9,
    baseArmor: 0.10,
    baseRange: 280,
    moveSpeed: 150,
    hpRegenPerSec: 8,
    damageType: DamageType.LASER,
    color: 0xa855f7,
    abilities: [
      {
        id: HeroAbilityId.HEADSHOT,
        nameKey: 'headshot',
        descKey: 'headshotDesc',
        cooldownMs: 18000,
        iconTexture: 'ability_headshot',
        range: 400,
        damage: 480,
        durationMs: 1500
      },
      {
        id: HeroAbilityId.ORBITAL_STRIKE,
        nameKey: 'orbitalStrike',
        descKey: 'orbitalStrikeDesc',
        cooldownMs: 28000,
        iconTexture: 'ability_orbital_strike',
        radius: 160,
        damage: 480,
        durationMs: 2500
      }
    ]
  },
  [HeroClass.DRONE_ENGINEER]: {
    heroClass: HeroClass.DRONE_ENGINEER,
    nameKey: 'heroEngineerName',
    titleKey: 'heroEngineerTitle',
    textureKey: 'hero_drone_engineer',
    portraitKey: 'hero_portrait_drone_engineer',
    baseHp: 720,
    baseDamage: 35,
    baseAttackSpeed: 1.5,
    baseArmor: 0.15,
    baseRange: 175,
    moveSpeed: 140,
    hpRegenPerSec: 12,
    damageType: DamageType.ELECTRIC,
    color: 0x06b6d4,
    abilities: [
      {
        id: HeroAbilityId.COMBAT_TURRET,
        nameKey: 'combatTurret',
        descKey: 'combatTurretDesc',
        cooldownMs: 20000,
        iconTexture: 'ability_combat_turret',
        radius: 160,
        damage: 35,
        durationMs: 15000
      },
      {
        id: HeroAbilityId.OVERCHARGE,
        nameKey: 'overcharge',
        descKey: 'overchargeDesc',
        cooldownMs: 30000,
        iconTexture: 'ability_overcharge',
        radius: 260,
        damage: 140,
        durationMs: 6000
      }
    ]
  }
};
