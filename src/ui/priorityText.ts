import { TargetPriority } from '../core/Constants';
import { t } from '../i18n/locales';

const FULL: Record<TargetPriority, 'targetFirst' | 'targetLast' | 'targetStrongest' | 'targetFastest' | 'targetClosest'> = {
  [TargetPriority.FIRST]: 'targetFirst',
  [TargetPriority.LAST]: 'targetLast',
  [TargetPriority.STRONGEST]: 'targetStrongest',
  [TargetPriority.FASTEST]: 'targetFastest',
  [TargetPriority.CLOSEST]: 'targetClosest'
};

const SHORT: Record<TargetPriority, 'prioShortFirst' | 'prioShortLast' | 'prioShortStrong' | 'prioShortFast' | 'prioShortNear'> = {
  [TargetPriority.FIRST]: 'prioShortFirst',
  [TargetPriority.LAST]: 'prioShortLast',
  [TargetPriority.STRONGEST]: 'prioShortStrong',
  [TargetPriority.FASTEST]: 'prioShortFast',
  [TargetPriority.CLOSEST]: 'prioShortNear'
};

export function describeTargetPriority(priority: TargetPriority): string {
  return t(FULL[priority]);
}

export function describeTargetPriorityShort(priority: TargetPriority): string {
  return t(SHORT[priority]);
}
