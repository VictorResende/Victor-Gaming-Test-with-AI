import { SPELLS_CONFIG } from '../config/gameConfig';
import { SpellType } from '../core/Constants';
import { EventBus, GameEvents } from '../core/EventBus';
import { SaveManager } from './SaveManager';
import { HapticsManager } from './HapticsManager';
import { AudioManager } from './AudioManager';

export interface SpellState {
  type: SpellType;
  lastUsedTime: number;
  cooldownMs: number;
}

export class SpellsManager {
  private spells: Map<SpellType, SpellState> = new Map();

  constructor() {
    const save = SaveManager.getInstance();
    let cdMultiplier = save.hasTech('spell_cd') ? 0.75 : 1.0;
    if (save.isRelicEquipped('arcane_hourglass')) {
      cdMultiplier *= 0.75;
    }

    Object.values(SpellType).forEach(type => {
      const config = SPELLS_CONFIG[type];
      this.spells.set(type, {
        type,
        lastUsedTime: -999999,
        cooldownMs: config.cooldownMs * cdMultiplier
      });
    });
  }

  public canCast(type: SpellType, currentTime: number): boolean {
    const state = this.spells.get(type);
    if (!state) return false;
    return currentTime - state.lastUsedTime >= state.cooldownMs;
  }

  public getCooldownProgress(type: SpellType, currentTime: number): number {
    const state = this.spells.get(type);
    if (!state) return 1.0;
    const elapsed = currentTime - state.lastUsedTime;
    return Math.min(1.0, elapsed / state.cooldownMs);
  }

  public cast(type: SpellType, currentTime: number): boolean {
    if (!this.canCast(type, currentTime)) return false;

    const state = this.spells.get(type)!;
    state.lastUsedTime = currentTime;

    HapticsManager.getInstance().cannonShot();
    if (type === SpellType.METEOR) {
      AudioManager.getInstance().playCannon();
    } else if (type === SpellType.EMP) {
      AudioManager.getInstance().playFreeze();
    } else if (type === SpellType.SUPPLY) {
      AudioManager.getInstance().playCoin();
    }

    EventBus.emit(GameEvents.SPELL_TRIGGERED, { type });
    return true;
  }
}
