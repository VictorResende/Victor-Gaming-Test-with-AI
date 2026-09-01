import { TowerBranchId } from '../core/Constants';

export type LaserFireKind = 'prism' | 'orbital' | 'beam';

export function laserFireKind(branchId?: TowerBranchId): LaserFireKind {
  if (branchId === TowerBranchId.LASER_PRISM) return 'prism';
  if (branchId === TowerBranchId.LASER_ORBITAL) return 'orbital';
  return 'beam';
}
