import { TowerType } from '../core/Constants';
import { t } from '../i18n/locales';

export interface TowerCombatStats {
  damage: number;
  fireRate: number;
  laserDPS?: number;
  slowFactor?: number;
  slowDuration?: number;
  splashRadius?: number;
  chainCount?: number;
  ignoreArmor?: boolean;
  revealsStealth?: boolean;
}

export function slowPercent(slowFactor: number): number {
  return Math.round((1 - slowFactor) * 100);
}

export function describeTowerCombat(stats: TowerCombatStats): string {
  const parts: string[] = [];
  const dps = stats.laserDPS ?? stats.damage * stats.fireRate;
  parts.push(`${Math.round(dps)} DPS`);

  if (stats.slowFactor != null) {
    const pct = slowPercent(stats.slowFactor);
    const sec = ((stats.slowDuration ?? 0) / 1000).toFixed(1).replace(/\.0$/, '');
    parts.push(t('combatSlow', { pct, sec }));
  }
  if (stats.splashRadius) {
    parts.push(`AoE ${Math.round(stats.splashRadius)}`);
  }
  if (stats.chainCount) {
    parts.push(t('combatChain', { n: stats.chainCount }));
  }
  if (stats.ignoreArmor) {
    parts.push(t('combatPierce'));
  }
  if (stats.revealsStealth) {
    parts.push(t('combatReveal'));
  }
  return parts.join(' · ');
}

export function describeTowerBuildRole(type: TowerType, stats: TowerCombatStats): string | null {
  if (stats.slowFactor != null) {
    return t('combatSlowShort', { pct: slowPercent(stats.slowFactor) });
  }
  if (type === TowerType.WITCH || stats.revealsStealth) {
    return t('combatStealthRole');
  }
  if (stats.chainCount) {
    return `⚡ x${stats.chainCount}`;
  }
  if (stats.splashRadius) {
    return t('combatSplashRole');
  }
  return null;
}
