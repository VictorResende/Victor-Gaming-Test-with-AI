import { Preferences } from '@capacitor/preferences';
import { LEVELS_CONFIG } from '../config/levelsConfig';
import { RELICS_CONFIG } from '../config/relicsConfig';
import { EventBus, GameEvents } from '../core/EventBus';
import { DEFAULT_SAVE, GameSaveData, mergeLoadedSave } from './saveData';

export type { GameSaveData };

const STORAGE_KEY = 'tower_defense_save_v1';

export class SaveManager {
  private static instance: SaveManager;
  private data: GameSaveData = { ...DEFAULT_SAVE, settings: { ...DEFAULT_SAVE.settings } };
  private isLoaded = false;
  private persistQueue: Promise<void> = Promise.resolve();
  private flushHooksBound = false;

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public async load(): Promise<GameSaveData> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        this.applyLoaded(JSON.parse(value));
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          this.applyLoaded(JSON.parse(local));
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar save, usando fallback local:', e);
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          this.applyLoaded(JSON.parse(local));
        } catch {
          this.data = { ...DEFAULT_SAVE, settings: { ...DEFAULT_SAVE.settings } };
        }
      }
    }
    this.isLoaded = true;
    this.bindFlushHooks();
    return this.data;
  }

  private applyLoaded(parsed: Partial<GameSaveData>): void {
    this.data = mergeLoadedSave(parsed);
  }

  private bindFlushHooks(): void {
    if (this.flushHooksBound || typeof document === 'undefined') return;
    this.flushHooksBound = true;
    const flush = () => { void this.flush(); };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
  }

  public save(): Promise<void> {
    this.persistQueue = this.persistQueue.then(() => this.persistNow()).catch(() => this.persistNow());
    return this.persistQueue;
  }

  public flush(): Promise<void> {
    return this.persistQueue;
  }

  private async persistNow(): Promise<void> {
    try {
      const json = JSON.stringify(this.data);
      await Preferences.set({ key: STORAGE_KEY, value: json });
      localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      console.warn('Erro ao salvar:', e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  public getData(): GameSaveData {
    return this.data;
  }

  public completeLevel(levelId: number, stars: number, score: number): void {
    const prevStars = this.data.levelStars[levelId] || 0;
    if (stars > prevStars) {
      const diff = stars - prevStars;
      this.data.levelStars[levelId] = stars;
      this.data.totalStarsEarned += diff;
      this.data.availableStars += diff;
    }

    const prevScore = this.data.highScores[levelId] || 0;
    if (score > prevScore) {
      this.data.highScores[levelId] = score;
    }

    const currentIndex = LEVELS_CONFIG.findIndex(l => l.id === levelId);
    if (currentIndex !== -1 && currentIndex + 1 < LEVELS_CONFIG.length) {
      const nextLevelId = LEVELS_CONFIG[currentIndex + 1].id;
      if (!this.data.unlockedLevels.includes(nextLevelId)) {
        this.data.unlockedLevels.push(nextLevelId);
      }
    }

    const relicReward = Object.values(RELICS_CONFIG).find(r => r.unlockLevelId === levelId);
    if (relicReward && this.unlockRelic(relicReward.id)) {
      EventBus.emit(GameEvents.RELIC_UNLOCKED, relicReward);
    } else {
      this.save();
    }
  }

  public recordKill(): number {
    this.data.lifetimeKills = (this.data.lifetimeKills || 0) + 1;
    if (this.data.lifetimeKills % 10 === 0) {
      this.save();
    }
    return this.data.lifetimeKills;
  }

  public unlockTech(techId: string, cost: number): boolean {
    if (this.data.availableStars >= cost && !this.data.unlockedTechs.includes(techId)) {
      this.data.availableStars -= cost;
      this.data.unlockedTechs.push(techId);
      this.save();
      return true;
    }
    return false;
  }

  public hasTech(techId: string): boolean {
    return this.data.unlockedTechs.includes(techId);
  }

  public unlockHeroPerk(perkId: string, cost: number): boolean {
    if (!this.data.unlockedHeroPerks) this.data.unlockedHeroPerks = [];
    if (this.data.availableStars >= cost && !this.data.unlockedHeroPerks.includes(perkId)) {
      this.data.availableStars -= cost;
      this.data.unlockedHeroPerks.push(perkId);
      this.save();
      return true;
    }
    return false;
  }

  public hasHeroPerk(perkId: string): boolean {
    return (this.data.unlockedHeroPerks || []).includes(perkId);
  }

  public getHeroPerks(): string[] {
    return this.data.unlockedHeroPerks || [];
  }

  public getEquippedRelics(): string[] {
    return this.data.equippedRelics || [];
  }

  public getUnlockedRelics(): string[] {
    return this.data.unlockedRelics || [];
  }

  public hasRelic(relicId: string): boolean {
    return (this.data.unlockedRelics || []).includes(relicId);
  }

  public isRelicEquipped(relicId: string): boolean {
    return (this.data.equippedRelics || []).includes(relicId);
  }

  public unlockRelic(relicId: string): boolean {
    if (!this.data.unlockedRelics) this.data.unlockedRelics = [];
    if (!this.data.unlockedRelics.includes(relicId)) {
      this.data.unlockedRelics.push(relicId);
      this.save();
      return true;
    }
    return false;
  }

  public equipRelic(relicId: string): boolean {
    if (!this.data.equippedRelics) this.data.equippedRelics = [];
    if (!this.hasRelic(relicId)) return false;
    if (this.data.equippedRelics.includes(relicId)) return false;
    if (this.data.equippedRelics.length >= 3) return false;

    this.data.equippedRelics.push(relicId);
    this.save();
    return true;
  }

  public unequipRelic(relicId: string): boolean {
    if (!this.data.equippedRelics) this.data.equippedRelics = [];
    const idx = this.data.equippedRelics.indexOf(relicId);
    if (idx > -1) {
      this.data.equippedRelics.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public toggleRelic(relicId: string): boolean {
    if (this.isRelicEquipped(relicId)) {
      return this.unequipRelic(relicId);
    } else {
      return this.equipRelic(relicId);
    }
  }

  public unlockAchievement(achievementId: string): boolean {
    if (!this.data.achievements.includes(achievementId)) {
      this.data.achievements.push(achievementId);
      this.data.availableStars += 1;
      this.data.totalStarsEarned += 1;
      this.save();
      return true;
    }
    return false;
  }

  public completeDailyChallenge(dateStr: string, score: number, rewardStars: number): void {
    const isFirstTimeToday = this.data.dailyChallengeCompletedDate !== dateStr;
    this.data.dailyChallengeCompletedDate = dateStr;

    if (isFirstTimeToday) {
      this.data.availableStars += rewardStars;
      this.data.totalStarsEarned += rewardStars;
    }

    const prevScore = this.data.dailyHighScores[dateStr] || 0;
    if (score > prevScore) {
      this.data.dailyHighScores[dateStr] = score;
    }

    this.save();
  }

  public isDailyChallengeCompleted(dateStr: string): boolean {
    return this.data.dailyChallengeCompletedDate === dateStr;
  }

  public recordBossRushProgress(wave: number, score: number): void {
    if (wave > (this.data.bossRushBestWave || 0)) {
      this.data.bossRushBestWave = wave;
    }
    if (score > (this.data.bossRushHighScore || 0)) {
      this.data.bossRushHighScore = score;
    }
    this.save();
  }

  public recordEndlessProgress(wave: number, score: number): void {
    let changed = false;
    if (wave > (this.data.endlessBestWave || 0)) {
      this.data.endlessBestWave = wave;
      changed = true;
    }
    if (score > (this.data.endlessHighScore || 0)) {
      this.data.endlessHighScore = score;
      changed = true;
    }
    if (changed) {
      this.save();
    }
  }

  public claimEndlessMilestone(wave: number, rewardStars = 3): boolean {
    if (!this.data.endlessMilestonesClaimed) {
      this.data.endlessMilestonesClaimed = [];
    }
    this.data.availableStars += rewardStars;
    this.data.totalStarsEarned += rewardStars;
    if (!this.data.endlessMilestonesClaimed.includes(wave)) {
      this.data.endlessMilestonesClaimed.push(wave);
    }
    this.save();
    return true;
  }

  public addBonusStars(amount: number): void {
    this.data.availableStars += amount;
    this.data.totalStarsEarned += amount;
    this.save();
  }

  public getSfxVolume(): number {
    return this.data.settings.sfxVolume ?? 1.0;
  }

  public setSfxVolume(vol: number): void {
    this.data.settings.sfxVolume = Math.max(0, Math.min(1, vol));
    this.save();
  }

  public getMusicVolume(): number {
    return this.data.settings.musicVolume ?? 0.8;
  }

  public setMusicVolume(vol: number): void {
    this.data.settings.musicVolume = Math.max(0, Math.min(1, vol));
    this.save();
  }

  public isHighContrast(): boolean {
    return !!this.data.settings.highContrast;
  }

  public setHighContrast(enabled: boolean): void {
    this.data.settings.highContrast = enabled;
    this.save();
  }

  public markOnboardingSeen(): void {
    this.data.settings.seenOnboarding = true;
    this.save();
  }
}
