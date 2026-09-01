import { SaveManager } from './SaveManager';
import { HapticsManager } from './HapticsManager';
import { AudioManager } from './AudioManager';
import { EventBus, GameEvents } from '../core/EventBus';
import { ACHIEVEMENTS_LIST } from '../config/achievementsConfig';

export { ACHIEVEMENTS_LIST, achievementBlurb, achievementTitle } from '../config/achievementsConfig';
export type { AchievementDef } from '../config/achievementsConfig';

export class AchievementsManager {
  private static instance: AchievementsManager;

  public static getInstance(): AchievementsManager {
    if (!AchievementsManager.instance) {
      AchievementsManager.instance = new AchievementsManager();
    }
    return AchievementsManager.instance;
  }

  public checkAndUnlock(id: string): boolean {
    const save = SaveManager.getInstance();
    const unlocked = save.unlockAchievement(id);
    if (unlocked) {
      HapticsManager.getInstance().victory();
      AudioManager.getInstance().playUpgrade();
      const def = ACHIEVEMENTS_LIST.find(a => a.id === id);
      if (def) {
        EventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, def);
      }
    }
    return unlocked;
  }
}
