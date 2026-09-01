import Phaser from 'phaser';
import { GameSpeed, SpellType, TowerType } from '../core/Constants';
import { LevelData } from '../config/levelsConfig';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { GameScene } from './GameScene';
import { EventBus, GameEvents, BoundBus } from '../core/EventBus';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SaveManager } from '../managers/SaveManager';
import {
  applyUiScene,
  UI,
  hudStyle
} from '../ui/UiKit';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { KeyboardControls } from '../utils/KeyboardControls';
import { RelicConfig, relicName } from '../config/relicsConfig';
import { AchievementDef, achievementTitle } from '../config/achievementsConfig';
import { t } from '../i18n/locales';
import { ToastBanner, ToastConfig } from '../ui/ToastBanner';
import { ThreatIndicators } from '../ui/ThreatIndicators';
import { openPauseModal } from '../ui/PauseModal';
import { openModChipModal } from '../ui/ModChipModal';
import { openTier4EvolveModal } from '../ui/Tier4EvolveModal';
import { paintTowerCardSelected } from '../ui/BuildDeckCard';
import { RadialTowerMenu } from '../ui/RadialTowerMenu';
import { TowerInspectorPanel } from '../ui/TowerInspectorPanel';
import { HeroHudWidget } from '../ui/HeroHudWidget';
import { EnemyInspectBanner } from '../ui/EnemyInspectBanner';
import { paintCooldownWedge } from '../ui/HudCooldown';
import { TopMatchHud } from '../ui/TopMatchHud';
import { createBuildDock } from '../ui/BuildDock';
import { BuildDeckDrag } from '../ui/BuildDeckDrag';
import {
  openBestiaryDialog,
  openConfirmDialog,
  showDefeatDialog,
  showVictoryDialog
} from '../ui/MatchDialogs';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private levelData!: LevelData;
  private isEndless = false;
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  private displayedGold = 350;
  private targetGold = 350;
  private goldRollingTween: Phaser.Tweens.Tween | null = null;
  private previousLives = 20;
  private redVignetteOverlay!: Phaser.GameObjects.Graphics;

  private toasts = new ToastBanner();
  private threats = new ThreatIndicators();
  private radial = new RadialTowerMenu(this);
  private inspector = new TowerInspectorPanel(this);
  private heroHud = new HeroHudWidget();
  private enemyInspect = new EnemyInspectBanner();
  private topHud = new TopMatchHud();
  private deckDrag = new BuildDeckDrag();

  // Botões de Velocidade e Pausa
  private currentSpeed: GameSpeed = GameSpeed.NORMAL;
  private prePauseSpeed: GameSpeed = GameSpeed.NORMAL;

  private heroAbilityCooldownGfx: Phaser.GameObjects.Graphics[] = [];
  private heroAbilityCooldownTexts: Phaser.GameObjects.Text[] = [];

  // Torre inspecionada (radial + painel)
  private activeInspectedTower: Tower | null = null;
  private confirmModal: Phaser.GameObjects.Container | null = null;

  // Modais de Pausa, Chips, Tier 4, Vitória e Derrota
  private pauseModal: Phaser.GameObjects.Container | null = null;
  private modChipModal: Phaser.GameObjects.Container | null = null;
  private tier4Modal: Phaser.GameObjects.Container | null = null;

  // Cards de Construção de Torres & Drag-and-Drop
  private towerCards: Map<TowerType, Phaser.GameObjects.Container> = new Map();
  private selectedBuildType: TowerType | null = null;

  // Cooldowns de Spells
  private spellCooldownGraphics: Map<SpellType, Phaser.GameObjects.Graphics> = new Map();

  // Controles de Teclado Web
  private keyboardControls!: KeyboardControls;
  private bus = new BoundBus(EventBus);

  constructor() {
    super('UIScene');
  }

  public init(data: { gameScene: GameScene; levelData: LevelData; isEndless: boolean }): void {
    this.gameScene = data.gameScene;
    this.levelData = data.levelData;
    this.isEndless = data.isEndless;
    this.displayedGold = data.levelData.initialGold;
    this.targetGold = data.levelData.initialGold;
    this.previousLives = data.levelData.initialLives;
    this.toasts.reset();
    this.threats.reset();
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    applyUiScene(this);

    // 1. Cria Vinheta Vermelha para Dano no Reino
    this.createRedVignette(width, height);

    // 2. Cria Barra Superior Medieval com Brasão Real Ancorada à Safe-Area
    this.createTopHUD(width);

    // 3. Cria Widget do Herói no HUD Superior Esquerdo
    this.createHeroHUD();

    // 4. Cria Deck Inferior Estilo Grimório Arcano & Estandartes de Torres
    this.createBottomHUD(width, height);

    // 5. Cria Painel Inferior de Inspeção de Torre em Pergaminho
    this.createTowerInspector(width, height);
    this.createEnemyInspect(width);

    // 6. Configura Handlers de Drag-and-Drop Global
    this.setupGlobalDragHandlers();

    // 7. Registra Listeners do EventBus
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.setupEventListeners();

    // 8. Inicializa Controles de Teclado e Atalhos para a Versão Web
    this.keyboardControls = new KeyboardControls(this, this.gameScene, this);
    this.input.once('pointerdown', () => AudioManager.getInstance().ensureMusic());
    this.startOnboarding();
  }

  private onSceneShutdown(): void {
    this.bus.offAll();
    this.keyboardControls?.destroy();
    this.toasts.reset();
    this.threats.reset();
    this.radial.hide();
  }

  private createRedVignette(width: number, height: number): void {
    this.redVignetteOverlay = this.add.graphics();
    this.redVignetteOverlay.setDepth(9990);
    this.redVignetteOverlay.setAlpha(0);
  }

  private triggerRedVignetteFlash(): void {
    const { width, height } = this.scale;
    this.redVignetteOverlay.clear();
    this.redVignetteOverlay.fillStyle(0x991b1b, 0.38);
    this.redVignetteOverlay.fillRect(0, 0, width, height);
    this.redVignetteOverlay.lineStyle(28, 0xdc2626, 0.9);
    this.redVignetteOverlay.strokeRect(0, 0, width, height);
    this.redVignetteOverlay.lineStyle(12, 0x7f1d1d, 0.95);
    this.redVignetteOverlay.strokeRect(8, 8, width - 16, height - 16);

    this.redVignetteOverlay.setAlpha(0.9);
    this.tweens.add({
      targets: this.redVignetteOverlay,
      alpha: 0,
      duration: 550,
      ease: 'Quad.Out'
    });
  }

  // ==========================================
  // HUD SUPERIOR
  // ==========================================
  private createTopHUD(width: number): void {
    this.topHud.create(
      this,
      width,
      this.safeInsets,
      this.safeBounds,
      {
        gold: this.displayedGold,
        lives: this.previousLives,
        bossRush: this.gameScene.isBossRush,
        daily: this.gameScene.isDailyChallenge,
        modifiers: this.gameScene.modifiers,
        speed: this.currentSpeed
      },
      {
        onLeave: () => this.returnToLevelSelect(),
        onCallWave: () => this.gameScene.waveManager.startNextWave(this.gameScene.waveManager.isRunning()),
        onPause: () => this.openPauseModal(),
        onSpeed: speed => this.setGameSpeed(speed),
        onWeather: () => this.gameScene.toggleWeather(),
        onFullscreen: () => {
          if (this.scale.isFullscreen) this.scale.stopFullscreen();
          else this.scale.startFullscreen();
        }
      }
    );
  }

  // ==========================================
  // WIDGET DO HERÓI NO HUD
  // ==========================================
  private createHeroHUD(): void {
    const hero = this.gameScene.hero;
    if (!hero) return;
    this.heroHud.create(this, this.safeBounds.left + 72, this.safeInsets.top + 98, hero);
  }

  private refreshHeroHp(current: number, max: number, isDead = false): void {
    this.heroHud.refreshHp(current, max, isDead);
  }

  private refreshHeroXp(current: number, max: number, level: number): void {
    this.heroHud.refreshXp(current, max, level);
  }

  // ==========================================
  // DECK INFERIOR ESTILO GRIMÓRIO ARCANO
  // ==========================================
  private createBottomHUD(width: number, height: number): void {
    const dock = createBuildDock(
      this,
      width,
      height,
      this.safeInsets,
      this.safeBounds,
      this.gameScene,
      type => {
        if (this.deckDrag.skipClick) {
          this.deckDrag.skipClick = false;
          return;
        }
        if (this.selectedBuildType === type) {
          this.selectedBuildType = null;
          this.gameScene.selectTowerToBuild(null);
        } else {
          this.selectedBuildType = type;
          this.gameScene.selectTowerToBuild(type);
        }
        this.updateTowerCardHighlights();
      },
      (type, pointer) => this.deckDrag.arm(type, pointer)
    );
    this.towerCards = dock.cards;
    this.heroAbilityCooldownGfx = dock.abilityGfx;
    this.heroAbilityCooldownTexts = dock.abilityTxt;
    this.spellCooldownGraphics = dock.spellGfx;
  }

  private setupGlobalDragHandlers(): void {
    this.deckDrag.bind(this, this.gameScene);
  }

  private updateTowerCardHighlights(): void {
    this.towerCards.forEach((card, type) => paintTowerCardSelected(card, this.selectedBuildType === type));
  }


  // ==========================================
  private showRadialMenu(tower: Tower): void {
    this.activeInspectedTower = tower;
    this.radial.show(tower, this.gameScene.economyManager.getGold(), this.gameScene.modifiers, {
      onUpgrade: _t => {
        this.gameScene.upgradeCurrentTower();
        this.refreshRadialMenu();
        this.refreshInspector();
      },
      onEvolve: t => this.openTier4EvolveModal(t),
      onSell: () => this.requestSell(),
      onPriority: t => {
        t.cycleTargetPriority();
        this.refreshRadialMenu();
        this.refreshInspector();
      },
      onChip: t => this.openModChipModal(t),
      onClose: () => {
        this.hideRadialMenu();
        this.hideInspector();
      }
    });
  }

  private refreshRadialMenu(): void {
    if (this.activeInspectedTower && this.radial.isOpen()) {
      this.showRadialMenu(this.activeInspectedTower);
    }
  }

  private hideRadialMenu(): void {
    this.radial.hide();
  }

  private createTowerInspector(width: number, height: number): void {
    this.inspector.create(width, height, this.safeInsets.bottom, {
      onPriority: () => {
        if (!this.activeInspectedTower) return;
        this.activeInspectedTower.cycleTargetPriority();
        this.refreshInspector();
        this.refreshRadialMenu();
      },
      onUpgrade: () => {
        if (!this.activeInspectedTower) return;
        if (this.activeInspectedTower.canEvolveTier4()) {
          this.openTier4EvolveModal(this.activeInspectedTower);
        } else {
          this.gameScene.upgradeCurrentTower();
          this.refreshInspector();
          this.refreshRadialMenu();
        }
      },
      onChip: () => {
        if (this.activeInspectedTower?.canEquipChip()) this.openModChipModal(this.activeInspectedTower);
      },
      onSell: () => this.requestSell(),
      onClose: () => {
        this.hideInspector();
        this.hideRadialMenu();
      }
    });
  }

  private showInspector(tower: Tower): void {
    this.activeInspectedTower = tower;
    this.refreshInspector();
    this.inspector.show();
  }

  private hideInspector(): void {
    if (this.activeInspectedTower) {
      this.activeInspectedTower.setSelected(false);
      this.activeInspectedTower = null;
    }
    this.inspector.hide();
  }

  private refreshInspector(): void {
    if (!this.activeInspectedTower) return;
    this.inspector.refresh(this.activeInspectedTower, this.gameScene.modifiers);
  }


  public requestSell(): void {
    if (!this.activeInspectedTower && !this.gameScene.activeInspectedTower) return;
    this.openConfirm(t('sell'), t('sellConfirm'), () => {
      this.gameScene.sellCurrentTower();
      this.hideInspector();
      this.hideRadialMenu();
    });
  }

  private createEnemyInspect(width: number): void {
    this.enemyInspect.create(this, width, this.safeInsets.top + 92);
  }

  private showEnemyInspect(enemy: Enemy): void {
    this.enemyInspect.show(this, enemy);
  }

  private openConfirm(title: string, body: string, onYes: () => void): void {
    this.confirmModal?.destroy();
    this.confirmModal = openConfirmDialog(this, title, body, onYes, () => {
      this.confirmModal = null;
    });
  }

  private startOnboarding(): void {
    const save = SaveManager.getInstance();
    const data = save.getData();
    if (data.settings.seenOnboarding || (data.unlockedLevels?.length ?? 1) > 1) return;
    save.markOnboardingSeen();
    this.showToast(t('playHint'), t('onboardPlace'), '🏰', { durationMs: 3200 });
    this.time.delayedCall(3400, () => {
      this.showToast(t('radialPriority'), t('onboardPriority'), '🎯', { durationMs: 3200 });
    });
    this.time.delayedCall(6800, () => {
      this.showToast(t('bestiary'), t('onboardInspect'), '📘', { durationMs: 3600 });
    });
  }

  private openBestiary(): void {
    if (this.pauseModal) {
      this.pauseModal.destroy();
      this.pauseModal = null;
    }
    openBestiaryDialog(this, () => this.setGameSpeed(this.prePauseSpeed));
  }

  // ==========================================
  // MODAL DE PAUSA & DECRETOS EM PERGAMINHO
  // ==========================================
  public openPauseModal(): void {
    this.pauseModal?.destroy();
    this.prePauseSpeed = this.currentSpeed === GameSpeed.PAUSED ? GameSpeed.NORMAL : this.currentSpeed;
    this.setGameSpeed(GameSpeed.PAUSED);
    this.pauseModal = openPauseModal(this, {
      refresh: () => this.openPauseModal(),
      resume: () => {
        this.pauseModal = null;
        this.setGameSpeed(this.prePauseSpeed);
      },
      openBestiary: () => this.openBestiary(),
      confirmRestart: () => {
        this.openConfirm(t('restart'), t('restartConfirm'), () => {
          this.pauseModal?.destroy();
          this.pauseModal = null;
          this.replayCurrentMatch();
        });
      },
      confirmSurrender: () => {
        this.openConfirm(t('surrender'), t('surrenderConfirm'), () => {
          this.pauseModal?.destroy();
          this.pauseModal = null;
          this.returnToLevelSelect();
        });
      }
    });
  }

  public openModChipModal(tower: Tower): void {
    this.modChipModal?.destroy();
    const modal = openModChipModal(
      this,
      tower,
      () => {
        this.modChipModal = null;
      },
      chip => {
        this.gameScene.equipChipOnCurrentTower(chip);
        modal.destroy();
        this.modChipModal = null;
        this.refreshInspector();
        this.refreshRadialMenu();
      }
    );
    this.modChipModal = modal;
  }

  public openTier4EvolveModal(tower: Tower): void {
    this.tier4Modal?.destroy();
    const modal = openTier4EvolveModal(
      this,
      tower,
      this.gameScene.economyManager.getGold(),
      this.gameScene.modifiers,
      () => {
        this.tier4Modal?.destroy();
        this.tier4Modal = null;
      },
      branchId => {
        this.gameScene.evolveCurrentTowerTier4(branchId);
        this.tier4Modal?.destroy();
        this.tier4Modal = null;
        this.refreshInspector();
        this.refreshRadialMenu();
      }
    );
    this.tier4Modal = modal;
  }

  public replayCurrentMatch(): void {
    this.scene.stop('GameScene');
    this.scene.start('GameScene', {
      levelId: this.levelData.id,
      isEndless: this.isEndless,
      isBossRush: this.gameScene.isBossRush,
      isDailyChallenge: this.gameScene.isDailyChallenge,
      dailyDate: this.gameScene.dailyDateStr,
      modifiers: this.gameScene.modifiers,
      heroClass: this.gameScene.heroClass
    });
  }

  public returnToLevelSelect(): void {
    this.scene.stop('GameScene');
    this.scene.start('LevelSelectScene');
  }

  // ==========================================
  // SISTEMA DE TOASTS & THREAT INDICATORS
  // ==========================================
  public showToast(title: string, subtitle?: string, icon?: string, customConfig?: Partial<ToastConfig>): void {
    this.toasts.show(this, this.safeInsets.top + 75, title, subtitle, icon, customConfig);
  }

  private spawnFloatingGoldParticles(worldX: number, worldY: number, count = 3): void {
    for (let i = 0; i < count; i++) {
      const goldIcon = this.add.text(
        worldX + Phaser.Math.Between(-16, 16),
        worldY + Phaser.Math.Between(-16, 16),
        'G',
        hudStyle('13px', UI.text.amber)
      ).setOrigin(0.5);
      goldIcon.setDepth(9992);

      const targetX = this.topHud.goldText.x + 10;
      const targetY = this.topHud.goldText.y;

      this.tweens.add({
        targets: goldIcon,
        props: {
          x: { value: targetX, ease: 'Cubic.In' },
          y: { value: targetY, ease: 'Quad.In' }
        },
        duration: Phaser.Math.Between(450, 650),
        delay: i * 70,
        onComplete: () => {
          goldIcon.destroy();
          AudioManager.getInstance().playCoin();
        }
      });
    }
  }

  private setGameSpeed(speed: GameSpeed): void {
    this.currentSpeed = speed;
    AudioManager.getInstance().playClick();
    HapticsManager.getInstance().tap();
    this.topHud.paintSpeed(speed);
    EventBus.emit(GameEvents.GAME_SPEED_CHANGED, speed);
  }

  private setupEventListeners(): void {
    this.bus.offAll();

    // 1. Rolamento Suave de Recursos (King's Gold Rolling Counter)
    this.bus.on(GameEvents.GOLD_CHANGED, (gold: number) => {
      const startVal = this.displayedGold;
      if (this.goldRollingTween) {
        this.goldRollingTween.stop();
      }

      if (gold > this.targetGold) {
        this.tweens.add({
          targets: this.topHud.goldText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 110,
          yoyo: true,
          ease: 'Back.Out'
        });
      }

      this.targetGold = gold;

      this.goldRollingTween = this.tweens.addCounter({
        from: startVal,
        to: gold,
        duration: 380,
        ease: 'Cubic.Out',
        onUpdate: (tw) => {
          this.displayedGold = (tw.getValue() as number) || 0;
          this.topHud.setGold(this.displayedGold);
        },
        onComplete: () => {
          this.displayedGold = gold;
          this.topHud.setGold(gold);
        }
      });

      this.refreshInspector();
      this.refreshRadialMenu();
    });

    // 2. Perda de Vidas e Pulso Vermelho Carmesim
    this.bus.on(GameEvents.LIVES_CHANGED, (lives: number) => {
      if (lives < this.previousLives) {
        this.triggerRedVignetteFlash();
        this.cameras.main.shake(220, 0.015);

        this.tweens.add({
          targets: this.topHud.livesText,
          scaleX: 1.45,
          scaleY: 1.45,
          duration: 100,
          yoyo: true,
          ease: 'Back.Out'
        });

        const lost = this.previousLives - lives;
        const txt = this.add.text(this.topHud.livesText.x + 20, this.topHud.livesText.y + 20, `-${lost} ❤️`, {
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ef4444',
          stroke: '#450a0a',
          strokeThickness: 3
        }).setOrigin(0.5);
        txt.setDepth(9999);

        this.tweens.add({
          targets: txt,
          y: txt.y - 25,
          alpha: 0,
          duration: 700,
          onComplete: () => txt.destroy()
        });
      }

      this.previousLives = lives;
      this.topHud.setLives(lives);
    });

    // 3. Partículas flutuantes ao eliminar invasores
    this.bus.on(GameEvents.ENEMY_KILLED, (data: { enemy: Enemy; gold: number; score: number }) => {
      this.spawnFloatingGoldParticles(
        data.enemy.x,
        data.enemy.y,
        Math.min(5, Math.max(2, Math.floor(data.gold / 10)))
      );
    });

    this.bus.on(GameEvents.TOWER_SOLD, () => {
      this.spawnFloatingGoldParticles(this.scale.width / 2, this.scale.height - 150, 4);
    });

    // 4. Início de Onda e Notificações Toast
    this.bus.on(GameEvents.WAVE_STARTED, (data: { waveNumber: number; totalWaves: number; isEarlyCall?: boolean }) => {
      this.topHud.setWave(data.waveNumber, data.totalWaves);
      this.topHud.nextWaveLabel.setText(t('callEarly', { bonus: 25 }));

      const isBossWave = this.gameScene.isBossRush || (data.waveNumber % 5 === 0);
      if (isBossWave) {
        this.showToast(t('toastBossAlertTitle'), t('toastBossAlertDesc'), '👑', {
          borderColor: 0xef4444,
          titleColor: '#ef4444',
          durationMs: 3200
        });
      } else {
        this.showToast(
          t('toastWaveStartedTitle', { wave: data.waveNumber }),
          data.isEarlyCall ? t('toastWaveEarlyBonus') : t('toastWaveDefend'),
          '💀',
          {
            borderColor: 0xfacc15,
            titleColor: '#fef08a',
            durationMs: 2500
          }
        );
      }
    });

    this.bus.on(GameEvents.WAVE_COMPLETED, () => {
      this.topHud.nextWaveLabel.setText(t('nextWave'));
    });

    // 🏆 Marcos do Modo Sem Fim — Toast com estrelas
    this.bus.on(GameEvents.SURVIVAL_MILESTONE_REACHED, (data: { wave: number; stars: number }) => {
      this.showToast(t('toastEndlessTitle', { wave: data.wave }), t('toastEndlessDesc', { stars: data.stars }), '🏆', {
        borderColor: 0xfbbf24,
        titleColor: '#fef08a',
        durationMs: 4500
      });
    });

    this.bus.on(GameEvents.TOWER_SELECTED, (tower: Tower | null) => {
      if (tower) {
        this.showRadialMenu(tower);
        this.showInspector(tower);
      } else {
        this.hideRadialMenu();
        this.hideInspector();
      }
    });

    this.bus.on(GameEvents.TOWER_PLACED, () => {
      this.selectedBuildType = null;
      this.updateTowerCardHighlights();
    });

    this.bus.on(GameEvents.TOWER_UPGRADED, () => {
      this.refreshInspector();
      this.refreshRadialMenu();
    });

    this.bus.on(GameEvents.CHIP_EQUIPPED, () => {
      this.refreshInspector();
      this.refreshRadialMenu();
    });

    // 5. Level Up do Herói e Notificação
    this.bus.on(GameEvents.HERO_LEVEL_UP, (data: { level: number; maxHp: number; damage: number }) => {
      this.showToast(t('toastHeroLevelUpTitle'), t('toastHeroLevelUpDesc', { lvl: data.level }), '⭐', {
        borderColor: 0xfacc15,
        titleColor: '#facc15',
        durationMs: 3000
      });
    });

    this.bus.on(GameEvents.HERO_HP_CHANGED, (data: { current: number; max: number; isDead?: boolean }) => {
      this.refreshHeroHp(data.current, data.max, data.isDead);
    });

    this.bus.on(GameEvents.HERO_XP_CHANGED, (data: { current: number; max: number; level: number }) => {
      this.refreshHeroXp(data.current, data.max, data.level);
    });

    this.bus.on(GameEvents.HERO_SELECTED, () => {
      this.heroHud.setSelected(true);
    });

    this.bus.on(GameEvents.HERO_DESELECTED, () => {
      this.heroHud.setSelected(false);
    });

    this.bus.on(GameEvents.VICTORY, () => {
      this.hideRadialMenu();
      this.hideInspector();
      this.showVictoryModal();
    });

    this.bus.on(GameEvents.GAME_OVER, () => {
      this.hideRadialMenu();
      this.hideInspector();
      this.showDefeatModal();
    });

    this.bus.on(GameEvents.BOSS_SPAWNED, () => {
      this.showToast(t('toastBossSpawnedTitle'), t('toastBossSpawnedDesc'), '👑', {
        borderColor: 0xef4444,
        titleColor: '#ef4444',
        durationMs: 3600
      });
    });

    this.bus.on(GameEvents.ENEMY_INSPECTED, (enemy: Enemy) => {
      this.showEnemyInspect(enemy);
    });

    this.bus.on(GameEvents.WEATHER_CHANGED, (data: { weather: 'CLEAR' | 'RAIN' | 'STORM' }) => {
      this.topHud.setWeather(data.weather);
    });

    this.bus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (def: AchievementDef) => {
      this.showToast(t('toastAchievementTitle'), achievementTitle(def), def.icon || '🏆', {
        borderColor: 0xfbbf24,
        titleColor: '#fef08a',
        durationMs: 3800
      });
    });

    this.bus.on(GameEvents.RELIC_UNLOCKED, (relic: RelicConfig) => {
      const name = relicName(relic);
      this.showToast(t('relicUnlockedToast', { name }), name, relic.icon || '👑', {
        borderColor: 0xfbbf24,
        titleColor: '#fef08a',
        durationMs: 4000
      });
    });
  }

  // ==========================================
  // MODAL DE VITÓRIA REAL
  // ==========================================
  private showVictoryModal(): void {
    showVictoryDialog(
      this,
      this.gameScene.economyManager.calculateStars(),
      t('runStats', {
        score: this.gameScene.economyManager.getScore(),
        towers: this.gameScene.towers.length,
        kills: this.gameScene.sessionKills
      }),
      () => this.returnToLevelSelect()
    );
  }

  private showDefeatModal(): void {
    const stats = t('runStats', {
      score: this.gameScene.economyManager.getScore(),
      towers: this.gameScene.towers.length,
      kills: this.gameScene.sessionKills
    });
    showDefeatDialog(this, stats, () => this.replayCurrentMatch(), () => this.returnToLevelSelect());
  }

  public update(): void {
    this.spellCooldownGraphics.forEach((g, type) => {
      paintCooldownWedge(g, this.gameScene.spellsManager.getCooldownProgress(type, this.time.now));
    });

    if (this.gameScene.hero) {
      const hero = this.gameScene.hero;
      [1, 2].forEach(abilityIndex => {
        const idx = abilityIndex - 1;
        const g = this.heroAbilityCooldownGfx[idx];
        const txt = this.heroAbilityCooldownTexts[idx];
        if (!g || !txt) return;
        const progress = hero.getAbilityCooldownProgress(abilityIndex as 1 | 2);
        paintCooldownWedge(g, progress, 22, 0.78);
        if (progress < 1) {
          txt.setText(`${(hero.abilityCooldowns[idx] / 1000).toFixed(1)}s`).setVisible(true);
        } else {
          txt.setVisible(false);
        }
      });
    }

    this.threats.update(this, this.gameScene.enemies, this.safeBounds, this.safeInsets);
  }
}
