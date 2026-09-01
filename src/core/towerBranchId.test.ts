import { describe, expect, it } from 'vitest';
import { TowerBranchId } from '../core/Constants';

describe('TowerBranchId', () => {
  it('uses unique string ids for every T4 path', () => {
    const values = Object.values(TowerBranchId);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain('gatling_sniper');
  });
});
