import { DamageType, EliteAffix, EnemyType } from '../core/Constants';

export const BOSS_STOMP_INTERVAL_MS = 8000;
export const BOSS_STOMP_RADIUS = 190;
export const BOSS_STOMP_STUN_MS = 2000;
export const BOSS_PHASE2_HP = 0.6;
export const BOSS_PHASE3_HP = 0.3;
export const BOSS_PHASE2_SPEED = 1.35;
export const ELITE_ARMORED_PHYSICAL = 0.6;
export const ELITE_HP_BONUS = 1.35;
export const ELITE_FAST_SPEED = 1.3;
export const ELITE_REGEN_PCT = 0.05;

export type BossPhaseEvent = 'enter2' | 'enter3' | 'enter2and3';

export function computeIncomingDamage(
  amount: number,
  damageType: DamageType,
  resistances: Partial<Record<DamageType, number>>,
  armor: number,
  ignoreArmor: boolean,
  eliteAffix: EliteAffix | null
): number {
  let finalDamage = amount * (resistances[damageType] ?? 1.0);
  if (!ignoreArmor && damageType === DamageType.PHYSICAL && armor > 0) {
    finalDamage *= 1.0 - armor;
  }
  if (eliteAffix === EliteAffix.ARMORED && damageType === DamageType.PHYSICAL) {
    finalDamage *= ELITE_ARMORED_PHYSICAL;
  }
  return finalDamage;
}

export function bossPhaseTransition(
  hpRatio: number,
  entered2: boolean,
  entered3: boolean
): BossPhaseEvent | null {
  const need3 = hpRatio <= BOSS_PHASE3_HP && !entered3;
  const need2 = hpRatio <= BOSS_PHASE2_HP && !entered2;
  if (need3 && need2) return 'enter2and3';
  if (need3) return 'enter3';
  if (need2) return 'enter2';
  return null;
}

export function bossMoveSpeedFactor(isBoss: boolean, phase: number): number {
  return isBoss && phase >= 2 ? BOSS_PHASE2_SPEED : 1.0;
}

export function livesLostOnLeak(isBoss: boolean, enemyType: EnemyType): number {
  if (isBoss) return 5;
  if (enemyType === EnemyType.CARRIER) return 3;
  return 1;
}

export function isBossEnemy(isBossFlag: boolean, enemyType: EnemyType): boolean {
  return isBossFlag || enemyType === EnemyType.BOSS;
}
