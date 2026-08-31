import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

type BusHandler = Function;

/** Scene-scoped EventBus subscriptions that can be removed without `removeAllListeners()`. */
export class BoundBus {
  private bindings: Array<{ event: string; fn: BusHandler }> = [];

  public on(event: string, fn: BusHandler): void {
    EventBus.on(event, fn);
    this.bindings.push({ event, fn });
  }

  public offAll(): void {
    this.bindings.forEach(({ event, fn }) => EventBus.off(event, fn));
    this.bindings = [];
  }
}

export const GameEvents = {
  GOLD_CHANGED: 'GOLD_CHANGED',
  LIVES_CHANGED: 'LIVES_CHANGED',
  SCORE_CHANGED: 'SCORE_CHANGED',
  WAVE_STARTED: 'WAVE_STARTED',
  WAVE_COMPLETED: 'WAVE_COMPLETED',
  ENEMY_SPAWNED: 'ENEMY_SPAWNED',
  ENEMY_KILLED: 'ENEMY_KILLED',
  ENEMY_REACHED_END: 'ENEMY_REACHED_END',
  TOWER_SELECTED: 'TOWER_SELECTED',
  TOWER_PLACED: 'TOWER_PLACED',
  TOWER_UPGRADED: 'TOWER_UPGRADED',
  TOWER_SOLD: 'TOWER_SOLD',
  GAME_SPEED_CHANGED: 'GAME_SPEED_CHANGED',
  SPELL_TRIGGERED: 'SPELL_TRIGGERED',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER',
  LANGUAGE_CHANGED: 'LANGUAGE_CHANGED',
  HERO_SELECTED: 'HERO_SELECTED',
  HERO_DESELECTED: 'HERO_DESELECTED',
  HERO_HP_CHANGED: 'HERO_HP_CHANGED',
  HERO_XP_CHANGED: 'HERO_XP_CHANGED',
  HERO_LEVEL_UP: 'HERO_LEVEL_UP',
  HERO_ABILITY_USED: 'HERO_ABILITY_USED',
  HERO_RESPAWNED: 'HERO_RESPAWNED',
  HERO_MOVED: 'HERO_MOVED',
  CHIP_EQUIPPED: 'CHIP_EQUIPPED',
  TOWER_EVOLVED: 'TOWER_EVOLVED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  BOSS_SPAWNED: 'BOSS_SPAWNED',
  SHRINE_ACTIVATED: 'SHRINE_ACTIVATED',
  WEATHER_CHANGED: 'WEATHER_CHANGED',
  DRAGON_AIRSTRIKE: 'DRAGON_AIRSTRIKE',
  SURVIVAL_MILESTONE_REACHED: 'SURVIVAL_MILESTONE_REACHED'
};

