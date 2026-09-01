import { DamageType } from '../core/Constants';
import { EnemyConfigData } from '../config/gameConfig';
import { t } from '../i18n/locales';

const DMG_KEY: Record<DamageType, 'dmgPhysical' | 'dmgArcane' | 'dmgFrost' | 'dmgFire' | 'dmgElectric'> = {
  [DamageType.PHYSICAL]: 'dmgPhysical',
  [DamageType.LASER]: 'dmgArcane',
  [DamageType.FROST]: 'dmgFrost',
  [DamageType.FIRE]: 'dmgFire',
  [DamageType.ELECTRIC]: 'dmgElectric'
};

export function damageTypeLabel(type: DamageType): string {
  return t(DMG_KEY[type]);
}

export function listResistances(resistances: Partial<Record<DamageType, number>>): {
  weak: string[];
  resist: string[];
} {
  const weak: string[] = [];
  const resist: string[] = [];
  (Object.keys(DMG_KEY) as DamageType[]).forEach(type => {
    const mult = resistances[type];
    if (mult == null || Math.abs(mult - 1) < 0.04) return;
    const label = `${damageTypeLabel(type)} ${mult.toFixed(1)}×`;
    if (mult > 1) weak.push(label);
    else resist.push(label);
  });
  return { weak, resist };
}

export function describeEnemyThreat(config: Pick<EnemyConfigData, 'armor' | 'resistances' | 'isFlying'> & { isStealth?: boolean }): string {
  const { weak, resist } = listResistances(config.resistances);
  const bits: string[] = [];
  if (config.isFlying) bits.push(t('traitFlying'));
  if (config.isStealth) bits.push(t('traitStealth'));
  if (config.armor > 0) bits.push(t('traitArmor', { pct: Math.round(config.armor * 100) }));
  if (weak.length) bits.push(t('threatWeak', { list: weak.join(', ') }));
  if (resist.length) bits.push(t('threatResist', { list: resist.join(', ') }));
  return bits.length ? bits.join(' · ') : t('threatNone');
}
