import { describe, expect, it } from 'vitest';
import { TowerBranchId } from '../core/Constants';
import { laserFireKind } from './laserFireKind';

describe('laserFireKind', () => {
  it('dispatches prism, orbital, and default beam modes', () => {
    expect(laserFireKind(TowerBranchId.LASER_PRISM)).toBe('prism');
    expect(laserFireKind(TowerBranchId.LASER_ORBITAL)).toBe('orbital');
    expect(laserFireKind(undefined)).toBe('beam');
    expect(laserFireKind(TowerBranchId.GATLING_SNIPER)).toBe('beam');
  });
});
