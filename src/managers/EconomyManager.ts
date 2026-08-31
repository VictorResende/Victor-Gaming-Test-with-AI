import { EventBus, GameEvents } from '../core/EventBus';
import { GAME_CONSTANTS } from '../core/Constants';
import { SaveManager } from './SaveManager';
import { HapticsManager } from './HapticsManager';
import { AudioManager } from './AudioManager';

export class EconomyManager {
  private gold: number;
  private lives: number;
  private score: number;
  private initialLives: number;

  constructor(initialGold = GAME_CONSTANTS.INITIAL_GOLD, initialLives = GAME_CONSTANTS.INITIAL_LIVES) {
    const save = SaveManager.getInstance();

    // Aplica bônus da árvore de tecnologias se desbloqueados
    let goldBonus = 0;
    let livesBonus = 0;
    if (save.hasTech('starting_gold')) goldBonus += 150;
    if (save.hasTech('starting_lives')) livesBonus += 5;

    this.gold = initialGold + goldBonus;
    this.initialLives = initialLives + livesBonus;
    this.lives = this.initialLives;
    this.score = 0;
  }

  public getGold(): number {
    return this.gold;
  }

  public getLives(): number {
    return this.lives;
  }

  public getScore(): number {
    return this.score;
  }

  public getInitialLives(): number {
    return this.initialLives;
  }

  public addGold(amount: number): void {
    this.gold += amount;
    EventBus.emit(GameEvents.GOLD_CHANGED, this.gold);
  }

  public spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      EventBus.emit(GameEvents.GOLD_CHANGED, this.gold);
      return true;
    }
    return false;
  }

  public addScore(points: number): void {
    this.score += points;
    EventBus.emit(GameEvents.SCORE_CHANGED, this.score);
  }

  public loseLives(amount = 1): void {
    this.lives = Math.max(0, this.lives - amount);
    HapticsManager.getInstance().lifeLost();
    EventBus.emit(GameEvents.LIVES_CHANGED, this.lives);

    if (this.lives <= 0) {
      EventBus.emit(GameEvents.GAME_OVER);
    }
  }

  public calculateStars(): number {
    if (this.lives === this.initialLives) return 3;
    if (this.lives >= Math.ceil(this.initialLives * 0.5)) return 2;
    if (this.lives > 0) return 1;
    return 0;
  }

  public emitInitialState(): void {
    EventBus.emit(GameEvents.GOLD_CHANGED, this.gold);
    EventBus.emit(GameEvents.LIVES_CHANGED, this.lives);
    EventBus.emit(GameEvents.SCORE_CHANGED, this.score);
  }
}
