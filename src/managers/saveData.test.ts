import { describe, expect, it } from 'vitest';
import { RelicId } from '../core/Constants';
import { CURRENT_SAVE_VERSION, mergeLoadedSave } from './saveData';

describe('mergeLoadedSave', () => {
  it('fills missing fields and stamps the current version', () => {
    const merged = mergeLoadedSave({
      availableStars: 12,
      settings: { language: 'en' }
    });
    expect(merged.availableStars).toBe(12);
    expect(merged.settings.language).toBe('en');
    expect(merged.settings.sfxEnabled).toBe(true);
    expect(merged.unlockedLevels).toEqual([1]);
    expect(merged.unlockedRelics).toContain(RelicId.KINGS_CROWN);
    expect(merged.saveVersion).toBe(CURRENT_SAVE_VERSION);
  });

  it('keeps claimed endless milestones from old blobs', () => {
    const merged = mergeLoadedSave({ endlessMilestonesClaimed: [10, 20] });
    expect(merged.endlessMilestonesClaimed).toEqual([10, 20]);
  });
});
