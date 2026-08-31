import Phaser from 'phaser';
import { GameSpeed, SpellType, TowerType, ModChipType, TacticalModifier, TargetPriority, EnemyType } from '../core/Constants';
import { TOWERS_CONFIG, SPELLS_CONFIG } from '../config/gameConfig';
import { MOD_CHIPS_CONFIG } from '../config/modChipsConfig';
import { MODIFIER_INFO } from '../config/dailyChallengeConfig';
import { LevelData } from '../config/levelsConfig';
import { Tower } from '../entities/Tower';
import { Hero } from '../entities/Hero';
import { Enemy } from '../entities/Enemy';
import { GameScene } from './GameScene';
import { EventBus, GameEvents } from '../core/EventBus';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SaveManager } from '../managers/SaveManager';
import { attachSpringFeedback } from '../utils/UIFeedback';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { KeyboardControls } from '../utils/KeyboardControls';
import { t, setLanguage, getLanguage } from '../i18n/locales';

export interface ToastConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  borderColor?: number;
  bgColor?: number;
  titleColor?: string;
  durationMs?: number;
}

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private levelData!: LevelData;
  private isEndless = false;
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  // Elementos do HUD Superior
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private nextWaveBtn!: Phaser.GameObjects.Container;
  private nextWaveLabel!: Phaser.GameObjects.Text;

  // Contador de Ouro Suave (Rolling Counter) e Vidas Anteriores
  private displayedGold = 350;
  private targetGold = 350;
  private goldRollingTween: Phaser.Tweens.Tween | null = null;
  private previousLives = 20;
  private redVignetteOverlay!: Phaser.GameObjects.Graphics;

  // Sistema de Notificações Toast Banner
  private toastQueue: ToastConfig[] = [];
  private isToastActive = false;
  private currentToastContainer: Phaser.GameObjects.Container | null = null;

  // Indicadores de Ameaça Direcionais (Bosses & Carriers nas Bordas)
  private threatIndicators: Map<Enemy, Phaser.GameObjects.Container> = new Map();

  // Botões de Velocidade e Pausa
  private speedButtons: Map<GameSpeed, Phaser.GameObjects.Container> = new Map();
  private currentSpeed: GameSpeed = GameSpeed.NORMAL;
  private prePauseSpeed: GameSpeed = GameSpeed.NORMAL;

  // Widget do Herói no HUD
  private heroWidgetContainer!: Phaser.GameObjects.Container;
  private heroPortraitSprite!: Phaser.GameObjects.Sprite;
  private heroTitleText!: Phaser.GameObjects.Text;
  private heroHpBarFill!: Phaser.GameObjects.Graphics;
  private heroHpText!: Phaser.GameObjects.Text;
  private heroXpBarFill!: Phaser.GameObjects.Graphics;
  private heroXpText!: Phaser.GameObjects.Text;
  private heroSelectionBorder!: Phaser.GameObjects.Graphics;

  // Botões de Habilidades Ativas do Herói
  private heroAbilityBtns: Phaser.GameObjects.Container[] = [];
  private heroAbilityCooldownGfx: Phaser.GameObjects.Graphics[] = [];
  private heroAbilityCooldownTexts: Phaser.GameObjects.Text[] = [];

  // Menu Radial Contextual em volta da Torre Selecionada (1-Tap Operation)
  private radialMenuContainer: Phaser.GameObjects.Container | null = null;
  private radialRingGraphics: Phaser.GameObjects.Graphics | null = null;
  private activeInspectedTower: Tower | null = null;

  // Painel de Detalhes da Torre Inspecionada (Sincronizado)
  private towerInspectorPanel!: Phaser.GameObjects.Container;
  private inspectedTowerTitle!: Phaser.GameObjects.Text;
  private targetPriorityBtn!: Phaser.GameObjects.Container;
  private targetPriorityLabel!: Phaser.GameObjects.Text;
  private upgradeBtn!: Phaser.GameObjects.Container;
  private upgradeLabel!: Phaser.GameObjects.Text;
  private chipBtn!: Phaser.GameObjects.Container;
  private chipBtnLabel!: Phaser.GameObjects.Text;
  private sellBtn!: Phaser.GameObjects.Container;
  private sellLabel!: Phaser.GameObjects.Text;

  // Modais de Pausa, Chips, Tier 4, Vitória e Derrota
  private pauseModal: Phaser.GameObjects.Container | null = null;
  private modChipModal: Phaser.GameObjects.Container | null = null;
  private tier4Modal: Phaser.GameObjects.Container | null = null;

  // Cards de Construção de Torres & Drag-and-Drop
  private towerCards: Map<TowerType, Phaser.GameObjects.Container> = new Map();
  private selectedBuildType: TowerType | null = null;
  private isDraggingTowerCard = false;
  private draggedTowerType: TowerType | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private potentialDragType: TowerType | null = null;

  // Cooldowns de Spells
  private spellCooldownGraphics: Map<SpellType, Phaser.GameObjects.Graphics> = new Map();

  // Controles de Teclado Web
  private keyboardControls!: KeyboardControls;

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
    this.toastQueue = [];
    this.isToastActive = false;
    this.threatIndicators.clear();
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);

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

    // 6. Configura Handlers de Drag-and-Drop Global
    this.setupGlobalDragHandlers();

    // 7. Registra Listeners do EventBus
    this.setupEventListeners();

    // 8. Inicializa Controles de Teclado e Atalhos para a Versão Web
    this.keyboardControls = new KeyboardControls(this, this.gameScene, this);
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
  // HUD SUPERIOR MEDIEVAL COM BRASÃO REAL
  // ==========================================
  private createTopHUD(width: number): void {
    const barHeight = 58 + this.safeInsets.top;
    const centerY = this.safeInsets.top + 29;

    const topBarBg = this.add.graphics();
    // Fundo de Couro Nobre / Ferro Escuro com Filigrana Dourada cobrindo toda a largura
    topBarBg.fillStyle(0x1a120b, 0.98);
    topBarBg.fillRect(0, 0, width, barHeight);
    topBarBg.lineStyle(3, 0xd97706, 1);
    topBarBg.lineBetween(0, barHeight, width, barHeight);
    topBarBg.lineStyle(1.5, 0xfacc15, 0.8);
    topBarBg.lineBetween(0, barHeight - 3, width, barHeight - 3);

    // Botão Voltar (Estilo Escudo de Ferro e Ouro com Hitbox 56x48px e Spring)
    const backBtnX = this.safeBounds.left + 28;
    const backBtn = this.add.container(backBtnX, centerY);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x2d180a, 1);
    backBg.fillRoundedRect(-25, -19, 50, 38, 8);
    backBg.lineStyle(2, 0xd97706, 1);
    backBg.strokeRoundedRect(-25, -19, 50, 38, 8);
    const backTxt = this.add.text(0, 0, '←', { fontSize: '22px', fontStyle: 'bold', color: '#fef08a' }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBtn.setSize(56, 48);
    backBtn.setInteractive(SafeArea.createTouchHitbox(56, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(backBtn, this, {
      rippleColor: 0xd97706,
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.start('LevelSelectScene');
      }
    });

    // 1. King's Gold 💰 (Tesouro Real com Rolamento Suave e Moldura Nobre)
    const goldX = backBtnX + 50;
    const goldShield = this.add.graphics();
    goldShield.fillStyle(0x2d180a, 0.9);
    goldShield.fillRoundedRect(goldX - 6, centerY - 18, 92, 36, 6);
    goldShield.lineStyle(1.5, 0xfacc15, 0.85);
    goldShield.strokeRoundedRect(goldX - 6, centerY - 18, 92, 36, 6);

    this.goldText = this.add.text(goldX + 4, centerY, `💰 ${this.displayedGold}`, {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    // 2. Hearts of Life ❤️ (Corações de Honra do Reino)
    const livesX = goldX + 104;
    const livesShield = this.add.graphics();
    livesShield.fillStyle(0x2d180a, 0.9);
    livesShield.fillRoundedRect(livesX - 6, centerY - 18, 80, 36, 6);
    livesShield.lineStyle(1.5, 0xef4444, 0.85);
    livesShield.strokeRoundedRect(livesX - 6, centerY - 18, 80, 36, 6);

    this.livesText = this.add.text(livesX + 4, centerY, `❤️ ${this.previousLives}`, {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ef4444',
      stroke: '#450a0a',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    // 3. Skull of War 💀 (Caveira de Cerco / Onda Inimiga)
    const waveX = livesX + 92;
    const waveShield = this.add.graphics();
    waveShield.fillStyle(0x2d180a, 0.9);
    waveShield.fillRoundedRect(waveX - 6, centerY - 18, 126, 36, 6);
    waveShield.lineStyle(1.5, this.gameScene.isBossRush ? 0xfacc15 : 0x60a5fa, 0.85);
    waveShield.strokeRoundedRect(waveX - 6, centerY - 18, 126, 36, 6);

    const waveLabel = this.gameScene.isBossRush ? '👑 BOSS' : '💀 ONDA';
    this.waveText = this.add.text(waveX + 4, centerY, `${waveLabel} 0/10`, {
      fontSize: '15.5px',
      fontStyle: 'bold',
      color: this.gameScene.isBossRush ? '#facc15' : '#93c5fd',
      stroke: '#1c140e',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    // 4. Botão Estandarte de Iniciar / Antecipar Onda (Hitbox 148x48px com Spring)
    const nextWaveX = waveX + 180;
    this.nextWaveBtn = this.add.container(nextWaveX, centerY);
    const nwBg = this.add.graphics();
    nwBg.fillStyle(0x78350f, 1);
    nwBg.fillRoundedRect(-70, -19, 140, 38, 8);
    nwBg.lineStyle(2, 0xfacc15, 1);
    nwBg.strokeRoundedRect(-70, -19, 140, 38, 8);

    this.nextWaveLabel = this.add.text(0, 0, `📯 ${t('nextWave')}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.nextWaveBtn.add([nwBg, this.nextWaveLabel]);
    this.nextWaveBtn.setSize(148, 48);
    this.nextWaveBtn.setInteractive(SafeArea.createTouchHitbox(148, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.nextWaveBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        this.gameScene.waveManager.startNextWave(this.gameScene.waveManager.isRunning());
      }
    });

    // Badges de Modificadores Diários no HUD (Selos Heráldicos)
    if (this.gameScene.isDailyChallenge && this.gameScene.modifiers.length > 0) {
      let modX = nextWaveX + 138;
      this.gameScene.modifiers.forEach(mod => {
        const info = MODIFIER_INFO[mod];
        if (info) {
          const modBadge = this.add.container(modX, centerY);
          const mBg = this.add.graphics();
          mBg.fillStyle(0x29180e, 0.95);
          mBg.fillRoundedRect(-48, -15, 96, 30, 6);
          mBg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(info.colorHex).color, 0.9);
          mBg.strokeRoundedRect(-48, -15, 96, 30, 6);

          const mTxt = this.add.text(0, 0, `${info.icon} ${t(info.nameKey as any)}`, {
            fontSize: '11px',
            fontStyle: 'bold',
            color: info.colorHex
          }).setOrigin(0.5);

          modBadge.add([mBg, mTxt]);
          modX += 104;
        }
      });
    }

    // Controles Reais de Velocidade e Pausa (⏸, 1x, 2x, 4x) - Ancorados à direita com Safe-Area
    const speeds = [GameSpeed.PAUSED, GameSpeed.NORMAL, GameSpeed.FAST, GameSpeed.ULTRA];
    const speedLabels = ['⏸', '1x', '2x', '4x'];
    const speedSpacing = 46;
    const speedStartX = this.safeBounds.right - (speeds.length - 1) * speedSpacing - 22;

    speeds.forEach((sp, idx) => {
      const btn = this.add.container(speedStartX + idx * speedSpacing, centerY);
      const bg = this.add.graphics();
      const isCurrent = sp === this.currentSpeed;
      bg.fillStyle(isCurrent ? 0x78350f : 0x2d180a, 1);
      bg.fillRoundedRect(-19, -19, 38, 38, 8);
      bg.lineStyle(2, isCurrent ? 0xfacc15 : 0x78716c, 1);
      bg.strokeRoundedRect(-19, -19, 38, 38, 8);

      const label = this.add.text(0, 0, speedLabels[idx], {
        fontSize: '15px',
        fontStyle: 'bold',
        color: isCurrent ? '#fef08a' : '#d6d3d1'
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setSize(48, 48);
      btn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(btn, this, {
        rippleColor: 0xfacc15,
        onClick: () => {
          if (sp === GameSpeed.PAUSED) {
            this.openPauseModal();
          } else {
            this.setGameSpeed(sp);
          }
        }
      });

      this.speedButtons.set(sp, btn);
    });

    // Botão de Clima Dinâmico (🌩️ / 🌧️ / ☀️)
    const weatherX = speedStartX + speeds.length * speedSpacing + 4;
    const weatherBtn = this.add.container(weatherX, centerY);
    const weatherBg = this.add.graphics();
    weatherBg.fillStyle(0x1e1b4b, 1);
    weatherBg.fillRoundedRect(-19, -19, 38, 38, 8);
    weatherBg.lineStyle(2, 0x38bdf8, 1);
    weatherBg.strokeRoundedRect(-19, -19, 38, 38, 8);

    const weatherLabel = this.add.text(0, 0, '⛈️', {
      fontSize: '17px'
    }).setOrigin(0.5);

    weatherBtn.add([weatherBg, weatherLabel]);
    weatherBtn.setSize(48, 48);
    weatherBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(weatherBtn, this, {
      rippleColor: 0x38bdf8,
      onClick: () => {
        this.gameScene.toggleWeather();
      }
    });

    // Atualiza ícone do clima quando o evento é emitido
    EventBus.on(GameEvents.WEATHER_CHANGED, (data: { weather: 'CLEAR' | 'RAIN' | 'STORM' }) => {
      const icon = data.weather === 'CLEAR' ? '☀️' : (data.weather === 'RAIN' ? '🌧️' : '⛈️');
      weatherLabel.setText(icon);
    });

    // Botão de Tela Cheia (Fullscreen Web) ⛶
    const fsX = weatherX + speedSpacing;
    const fsBtn = this.add.container(fsX, centerY);
    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x2d180a, 1);
    fsBg.fillRoundedRect(-19, -19, 38, 38, 8);
    fsBg.lineStyle(2, 0xd97706, 1);
    fsBg.strokeRoundedRect(-19, -19, 38, 38, 8);

    const fsLabel = this.add.text(0, 0, '⛶', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    fsBtn.add([fsBg, fsLabel]);
    fsBtn.setSize(48, 48);
    fsBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(fsBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        if (this.scale.isFullscreen) {
          this.scale.stopFullscreen();
        } else {
          this.scale.startFullscreen();
        }
      }
    });
  }

  // ==========================================
  // WIDGET DO HERÓI NO HUD
  // ==========================================
  private createHeroHUD(): void {
    const hero = this.gameScene.hero;
    if (!hero) return;

    const heroX = this.safeBounds.left + 65;
    const heroY = this.safeInsets.top + 105;
    this.heroWidgetContainer = this.add.container(heroX, heroY);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a120b, 0.96);
    bg.fillRoundedRect(-48, -35, 126, 70, 10);
    bg.lineStyle(2.5, 0xd97706, 1);
    bg.strokeRoundedRect(-48, -35, 126, 70, 10);
    bg.lineStyle(1, 0xfacc15, 0.6);
    bg.strokeRoundedRect(-45, -32, 120, 64, 8);

    this.heroSelectionBorder = this.add.graphics();
    this.heroSelectionBorder.lineStyle(3, 0xfacc15, 1);
    this.heroSelectionBorder.strokeRoundedRect(-50, -37, 130, 74, 12);
    this.heroSelectionBorder.setVisible(false);

    this.heroPortraitSprite = this.add.sprite(-22, 0, hero.config.portraitKey).setScale(0.85);

    this.heroTitleText = this.add.text(16, -24, `Nvl ${hero.level}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x000000, 0.7);
    hpBg.fillRect(16, -12, 52, 8);

    this.heroHpBarFill = this.add.graphics();
    this.heroHpBarFill.fillStyle(0x22c55e, 1);
    this.heroHpBarFill.fillRect(16, -12, 52, 8);

    this.heroHpText = this.add.text(42, -8, `${Math.round(hero.currentHp)}`, {
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x000000, 0.7);
    xpBg.fillRect(16, 6, 52, 6);

    this.heroXpBarFill = this.add.graphics();
    this.heroXpBarFill.fillStyle(0x38bdf8, 1);
    this.heroXpBarFill.fillRect(16, 6, 0, 6);

    this.heroXpText = this.add.text(42, 9, `${hero.currentXp}/${hero.xpToNextLevel}`, {
      fontSize: '8px',
      color: '#e0f2fe'
    }).setOrigin(0.5);

    this.heroWidgetContainer.add([
      bg,
      this.heroSelectionBorder,
      this.heroPortraitSprite,
      this.heroTitleText,
      hpBg,
      this.heroHpBarFill,
      this.heroHpText,
      xpBg,
      this.heroXpBarFill,
      this.heroXpText
    ]);

    this.heroWidgetContainer.setSize(126, 72);
    this.heroWidgetContainer.setInteractive(SafeArea.createTouchHitbox(126, 72), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.heroWidgetContainer, this, {
      rippleColor: hero.config.color,
      onClick: () => {
        hero.setSelected(!hero.isSelected);
      }
    });
  }

  private refreshHeroHp(current: number, max: number, isDead = false): void {
    if (!this.heroHpBarFill || !this.heroHpText) return;
    this.heroHpBarFill.clear();
    const ratio = Math.max(0, current / max);
    const width = 52 * ratio;
    const color = isDead ? 0xef4444 : (ratio < 0.3 ? 0xef4444 : 0x22c55e);
    this.heroHpBarFill.fillStyle(color, 1);
    this.heroHpBarFill.fillRect(16, -12, width, 8);
    this.heroHpText.setText(isDead ? 'MORTO' : `${Math.round(current)}`);
  }

  private refreshHeroXp(current: number, max: number, level: number): void {
    if (!this.heroXpBarFill || !this.heroXpText || !this.heroTitleText) return;
    this.heroTitleText.setText(`Nvl ${level}`);
    this.heroXpBarFill.clear();
    const ratio = Math.min(1.0, current / max);
    const width = 52 * ratio;
    this.heroXpBarFill.fillStyle(0x38bdf8, 1);
    this.heroXpBarFill.fillRect(16, 6, width, 6);
    this.heroXpText.setText(`${current}/${max}`);
  }

  // ==========================================
  // DECK INFERIOR ESTILO GRIMÓRIO ARCANO
  // ==========================================
  private createBottomHUD(width: number, height: number): void {
    const dockHeight = 92 + this.safeInsets.bottom;
    const dockTop = height - dockHeight;
    const centerY = dockTop + 46;

    // Fundo do Grimório de Feitiços (Couro Nobre, Dobradiças de Bronze e Filigrana em Ouro)
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0x1a120b, 0.98);
    bottomBg.fillRect(0, dockTop, width, dockHeight);
    bottomBg.lineStyle(3, 0xd97706, 1);
    bottomBg.lineBetween(0, dockTop, width, dockTop);
    bottomBg.lineStyle(1.5, 0xfacc15, 0.7);
    bottomBg.lineBetween(0, dockTop + 3, width, dockTop + 3);

    // Cantoneiras e rebites rúnicos nos extremos do grimório
    bottomBg.fillStyle(0xfde047, 1);
    bottomBg.fillCircle(12, dockTop + 12, 3.5);
    bottomBg.fillCircle(width - 12, dockTop + 12, 3.5);

    // 1. Cards de Construção de Torres como Estandartes Medievais
    const towerTypes = [
      TowerType.GATLING,
      TowerType.CANNON,
      TowerType.CRYO,
      TowerType.LASER,
      TowerType.TESLA
    ];

    const cardW = 86;
    const cardSpacing = 14;
    const startX = this.safeBounds.left + 50;

    towerTypes.forEach((type, idx) => {
      const x = startX + idx * (cardW + cardSpacing);
      const card = this.createHeraldicTowerCard(x, centerY, type);
      this.towerCards.set(type, card);
    });

    // 2. Botões de Habilidades Ativas do Herói (Selos Rúnicos)
    const hero = this.gameScene.hero;
    const heroSkillStartX = startX + towerTypes.length * (cardW + cardSpacing) + 26;
    if (hero) {
      this.createHeroAbilityButton(heroSkillStartX, centerY, 1);
      this.createHeroAbilityButton(heroSkillStartX + 68, centerY, 2);
    }

    // 3. Deck de Feitiços Globais com Orbes/Gemas Elementais Brilhantes
    if (!this.gameScene.modifiers.includes(TacticalModifier.NO_SPELLS)) {
      const spells = [SpellType.METEOR, SpellType.EMP, SpellType.SUPPLY];
      const spellStartX = this.safeBounds.right - 180;

      spells.forEach((sp, idx) => {
        const x = spellStartX + idx * 68;
        this.createElementalSpellGem(x, centerY, sp);
      });
    }
  }

  // ==========================================
  // CARD DE TORRE ESTILO ESTANDARTE MEDIEVAL
  // ==========================================
  private createHeraldicTowerCard(x: number, y: number, type: TowerType): Phaser.GameObjects.Container {
    const config = TOWERS_CONFIG[type];
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    // Fundo do Estandarte em Couro/Tecido Nobre
    bg.fillStyle(0x24160c, 0.98);
    bg.fillRoundedRect(-42, -38, 84, 76, 10);
    // Borda bordada em fio de ouro
    bg.lineStyle(2, 0xd97706, 0.95);
    bg.strokeRoundedRect(-42, -38, 84, 76, 10);
    bg.lineStyle(1, 0xfacc15, 0.6);
    bg.strokeRoundedRect(-39, -35, 78, 70, 8);

    // Haste superior do estandarte com ilhós dourados
    bg.fillStyle(0xfacc15, 1);
    bg.fillRect(-38, -36, 5, 4);
    bg.fillRect(33, -36, 5, 4);

    const turretKey = `turret_${type.toLowerCase()}`;
    const icon = this.add.sprite(0, -12, turretKey).setScale(0.85);

    let displayCost = config.cost;
    if (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
      displayCost *= 2;
    }

    const costTxt = this.add.text(0, 22, `💰 ${displayCost}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Badge de Tecla de Atalho Web [1-5]
    const hotkeysMap: Record<TowerType, string> = {
      [TowerType.GATLING]: '1',
      [TowerType.CANNON]: '2',
      [TowerType.CRYO]: '3',
      [TowerType.LASER]: '4',
      [TowerType.TESLA]: '5'
    };
    const hotkeyNum = hotkeysMap[type] || '1';
    const keyBadge = this.add.text(32, -28, `[${hotkeyNum}]`, {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fde047',
      stroke: '#1c1917',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, icon, costTxt, keyBadge]);
    container.setSize(84, 76);
    container.setInteractive(SafeArea.createTouchHitbox(84, 76), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(container, this, {
      rippleColor: config.accentColor,
      onClick: () => {
        // Alterna seleção da torre no clique do mouse ou toque
        if (this.selectedBuildType === type) {
          this.selectedBuildType = null;
          this.gameScene.selectTowerToBuild(null);
        } else {
          this.selectedBuildType = type;
          this.gameScene.selectTowerToBuild(type);
        }
        this.updateTowerCardHighlights();
      },
      onPointerDown: (pointer: Phaser.Input.Pointer) => {
        this.dragStartX = pointer.worldX;
        this.dragStartY = pointer.worldY;
        this.potentialDragType = type;
      }
    });

    return container;
  }

  private setupGlobalDragHandlers(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Inicia o arrasto apenas se o ponteiro se moveu mais de 12px segurando o botão
      if (this.potentialDragType && !this.isDraggingTowerCard) {
        const dist = Phaser.Math.Distance.Between(this.dragStartX, this.dragStartY, pointer.worldX, pointer.worldY);
        if (dist > 12) {
          this.isDraggingTowerCard = true;
          this.draggedTowerType = this.potentialDragType;
          this.gameScene.startTowerDrag(this.draggedTowerType, pointer.worldX, pointer.worldY);
          this.potentialDragType = null;
        }
      }

      if (this.isDraggingTowerCard && this.draggedTowerType) {
        this.gameScene.updateTowerDrag(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.potentialDragType = null;
      if (this.isDraggingTowerCard && this.draggedTowerType) {
        this.gameScene.finishTowerDrag(pointer.worldX, pointer.worldY);
        this.isDraggingTowerCard = false;
        this.draggedTowerType = null;
      }
    });
  }

  private updateTowerCardHighlights(): void {
    this.towerCards.forEach((card, type) => {
      const isSelected = this.selectedBuildType === type;
      card.setScale(isSelected ? 1.08 : 1.0);
    });
  }

  private createHeroAbilityButton(x: number, y: number, abilityIndex: 1 | 2): void {
    const hero = this.gameScene.hero;
    if (!hero) return;

    const ability = hero.config.abilities[abilityIndex - 1];
    if (!ability) return;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a120b, 1);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(3, 0xd97706, 1);
    bg.strokeCircle(0, 0, 30);
    bg.lineStyle(1.5, hero.config.color, 1);
    bg.strokeCircle(0, 0, 26);

    const icon = this.add.sprite(0, 0, ability.iconTexture).setScale(0.75);
    const cdG = this.add.graphics();

    const cdTxt = this.add.text(0, 0, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);

    // Badge de Atalho Web [Z, X]
    const keyLetter = abilityIndex === 1 ? 'Z' : 'X';
    const keyBadge = this.add.text(20, -20, `[${keyLetter}]`, {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#1c1917',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, icon, cdG, cdTxt, keyBadge]);
    container.setSize(60, 60);
    container.setInteractive(SafeArea.createTouchCircle(30, 24), Phaser.Geom.Circle.Contains);

    attachSpringFeedback(container, this, {
      rippleColor: hero.config.color,
      onClick: () => {
        this.gameScene.hero.useAbility(
          abilityIndex,
          this.gameScene.enemies,
          this.gameScene.towers
        );
      }
    });

    this.heroAbilityBtns.push(container);
    this.heroAbilityCooldownGfx.push(cdG);
    this.heroAbilityCooldownTexts.push(cdTxt);
  }

  // ==========================================
  // ORBE / GEMA ELEMENTAL BRILHANTE DE FEITIÇO
  // ==========================================
  private createElementalSpellGem(x: number, y: number, type: SpellType): void {
    const container = this.add.container(x, y);

    // Cores e ícones elementais
    let gemColor = 0xb91c1c; // Fogo / Rubi
    let gemBorder = 0xf97316;
    let iconChar = '🔥';
    let hotkeyChar = 'Q';

    if (type === SpellType.EMP) {
      gemColor = 0x0369a1; // Gelo / Safira
      gemBorder = 0x38bdf8;
      iconChar = '❄️';
      hotkeyChar = 'W';
    } else if (type === SpellType.SUPPLY) {
      gemColor = 0xa16207; // Ouro / Topázio
      gemBorder = 0xfde047;
      iconChar = '💰';
      hotkeyChar = 'E';
    }

    const bg = this.add.graphics();
    // Engaste de Ouro Real do Orbe
    bg.fillStyle(0x1a120b, 1);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(3, 0xfacc15, 1);
    bg.strokeCircle(0, 0, 30);

    // Gema Elemental
    bg.fillStyle(gemColor, 0.9);
    bg.fillCircle(0, 0, 24);
    bg.lineStyle(2, gemBorder, 1);
    bg.strokeCircle(0, 0, 24);

    const iconTxt = this.add.text(0, 0, iconChar, { fontSize: '22px' }).setOrigin(0.5);

    // Badge de Atalho Web [Q, W, E]
    const keyBadge = this.add.text(20, -20, `[${hotkeyChar}]`, {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#1c1917',
      strokeThickness: 2
    }).setOrigin(0.5);

    const cdG = this.add.graphics();
    container.add([bg, iconTxt, cdG, keyBadge]);
    this.spellCooldownGraphics.set(type, cdG);

    container.setSize(60, 60);
    container.setInteractive(SafeArea.createTouchCircle(30, 24), Phaser.Geom.Circle.Contains);

    attachSpringFeedback(container, this, {
      rippleColor: gemBorder,
      onClick: () => {
        this.gameScene.spellsManager.cast(type, this.time.now);
      }
    });
  }

  // ==========================================
  // MENU RADIAL CONTEXTUAL EM OURO E RUBI
  // ==========================================
  private showRadialMenu(tower: Tower): void {
    this.hideRadialMenu();
    this.activeInspectedTower = tower;

    const cx = tower.x;
    const cy = tower.y;
    const radius = 74;

    this.radialMenuContainer = this.add.container(cx, cy);

    // Anel Rúnico de Ouro Imperial ao redor da torre
    this.radialRingGraphics = this.add.graphics();
    this.radialRingGraphics.lineStyle(2.5, 0xfacc15, 0.7);
    this.radialRingGraphics.strokeCircle(0, 0, radius);
    this.radialRingGraphics.lineStyle(1.5, 0xd97706, 0.5);
    this.radialRingGraphics.strokeCircle(0, 0, radius + 8);
    this.radialMenuContainer.add(this.radialRingGraphics);

    // 1. Botão Upgrade / Tier 4 (Norte / Top: 0°, angle = -90° / -π/2)
    const upCost = tower.canUpgrade() ? (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST) ? tower.getUpgradeCost() * 2 : tower.getUpgradeCost()) : 0;
    const canAffordUp = this.gameScene.economyManager.getGold() >= upCost;
    const upAngle = -Math.PI / 2;
    const upX = Math.cos(upAngle) * radius;
    const upY = Math.sin(upAngle) * radius;

    let upLabelStr = 'MAX';
    let upColor = 0x2d180a;
    let upBorder = 0x78716c;

    if (tower.canUpgrade()) {
      upLabelStr = `${upCost}G`;
      upColor = canAffordUp ? 0x065f46 : 0x7f1d1d;
      upBorder = canAffordUp ? 0x34d399 : 0xf87171;
    } else if (tower.canEvolveTier4()) {
      upLabelStr = 'TIER 4';
      upColor = 0x92400e;
      upBorder = 0xfacc15;
    }

    const upBtn = this.createRadialButton(upX, upY, upLabelStr, '⬆️', upColor, upBorder, () => {
      if (tower.canEvolveTier4()) {
        this.openTier4EvolveModal(tower);
      } else if (tower.canUpgrade()) {
        this.gameScene.upgradeCurrentTower();
        this.refreshRadialMenu();
        this.refreshInspector();
      }
    });

    // 2. Botão Vender (Nordeste / Top-Right: angle = -25°) - Selo do Tesouro em Rubi
    const sellAngle = -0.42;
    const sellX = Math.cos(sellAngle) * radius;
    const sellY = Math.sin(sellAngle) * radius;
    const sellVal = tower.getSellValue();
    const sellBtn = this.createRadialButton(sellX, sellY, `+${sellVal}G`, '💰', 0x991b1b, 0xfacc15, () => {
      this.gameScene.sellCurrentTower();
      this.hideRadialMenu();
      this.hideInspector();
    });

    // 3. Botão Mira / Prioridade (Noroeste / Top-Left: angle = -155°) - Cavaleiro Safira
    const prioAngle = -Math.PI + 0.42;
    const prioX = Math.cos(prioAngle) * radius;
    const prioY = Math.sin(prioAngle) * radius;
    const prioShortMap: Record<TargetPriority, string> = {
      [TargetPriority.FIRST]: '1º',
      [TargetPriority.LAST]: 'ÚLT',
      [TargetPriority.STRONGEST]: 'FORTE',
      [TargetPriority.FASTEST]: 'RÁP',
      [TargetPriority.CLOSEST]: 'PERTO'
    };
    const prioShort = prioShortMap[tower.targetPriority] || '1º';
    const prioBtn = this.createRadialButton(prioX, prioY, prioShort, '🎯', 0x1e3a8a, 0x60a5fa, () => {
      tower.cycleTargetPriority();
      this.refreshRadialMenu();
      this.refreshInspector();
    });

    // 4. Botão Mod Chip (Sudeste / Bottom-Right: angle = +45°) - Runa Ametista
    const chipAngle = Math.PI / 4;
    const chipX = Math.cos(chipAngle) * radius;
    const chipY = Math.sin(chipAngle) * radius;
    const chipIcon = tower.equippedChip ? tower.equippedChip.data.icon : '⚡';
    const chipLabelStr = tower.equippedChip ? t(tower.equippedChip.data.nameKey as any).slice(0, 5) : 'CHIP';
    const chipBtn = this.createRadialButton(chipX, chipY, chipLabelStr, chipIcon, 0x581c87, 0xc084fc, () => {
      this.openModChipModal(tower);
    });

    // 5. Botão Fechar (Sudoeste / Bottom-Left: angle = +135°) - Selo de Cera
    const closeAngle = (3 * Math.PI) / 4;
    const closeX = Math.cos(closeAngle) * radius;
    const closeY = Math.sin(closeAngle) * radius;
    const closeBtn = this.createRadialButton(closeX, closeY, '', '✕', 0x7f1d1d, 0xfca5a5, () => {
      this.hideRadialMenu();
      this.hideInspector();
    });

    this.radialMenuContainer.add([upBtn, sellBtn, prioBtn, chipBtn, closeBtn]);

    // Animação Pop-in suave com Spring Easing
    this.radialMenuContainer.setScale(0);
    this.radialMenuContainer.setAlpha(0);
    this.tweens.add({
      targets: this.radialMenuContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  private createRadialButton(
    x: number,
    y: number,
    text: string,
    icon: string,
    bgColor: number,
    borderColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.96);
    bg.fillCircle(0, 0, 24);
    bg.lineStyle(2.5, borderColor, 1);
    bg.strokeCircle(0, 0, 24);

    const iconTxt = this.add.text(0, text ? -6 : 0, icon, {
      fontSize: text ? '15px' : '18px'
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, iconTxt];

    if (text) {
      const labelTxt = this.add.text(0, 11, text, {
        fontSize: '9.5px',
        fontStyle: 'bold',
        color: '#fef08a',
        stroke: '#1c140e',
        strokeThickness: 2
      }).setOrigin(0.5);
      items.push(labelTxt);
    }

    container.add(items);
    container.setSize(52, 52);
    container.setInteractive(SafeArea.createTouchCircle(26, 24), Phaser.Geom.Circle.Contains);

    attachSpringFeedback(container, this, {
      rippleColor: borderColor,
      onClick
    });

    return container;
  }

  private refreshRadialMenu(): void {
    if (this.activeInspectedTower && this.radialMenuContainer) {
      this.showRadialMenu(this.activeInspectedTower);
    }
  }

  private hideRadialMenu(): void {
    if (this.radialMenuContainer) {
      this.radialMenuContainer.destroy();
      this.radialMenuContainer = null;
    }
    if (this.radialRingGraphics) {
      this.radialRingGraphics.destroy();
      this.radialRingGraphics = null;
    }
  }

  // ==========================================
  // PAINEL DE INSPEÇÃO INFERIOR EM PERGAMINHO
  // ==========================================
  private createTowerInspector(width: number, height: number): void {
    const panelY = height - 148 - this.safeInsets.bottom;
    this.towerInspectorPanel = this.add.container(width / 2, panelY);
    this.towerInspectorPanel.setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a120b, 0.98);
    bg.fillRoundedRect(-280, -48, 560, 96, 14);
    bg.lineStyle(3, 0xfacc15, 1);
    bg.strokeRoundedRect(-280, -48, 560, 96, 14);
    bg.lineStyle(1, 0x92400e, 0.7);
    bg.strokeRoundedRect(-276, -44, 552, 88, 11);

    this.inspectedTowerTitle = this.add.text(-260, -30, 'Torre Nvl 1', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    // 1. Botão de Prioridade de Mira (Hitbox 130x48px com Spring)
    this.targetPriorityBtn = this.add.container(-190, 16);
    const tpBg = this.add.graphics();
    tpBg.fillStyle(0x2d180a, 1);
    tpBg.fillRoundedRect(-65, -18, 130, 36, 8);
    tpBg.lineStyle(1.5, 0xd97706, 0.9);
    tpBg.strokeRoundedRect(-65, -18, 130, 36, 8);

    this.targetPriorityLabel = this.add.text(0, 0, 'MIRA: PRIMEIRO', {
      fontSize: '10.5px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);
    this.targetPriorityBtn.add([tpBg, this.targetPriorityLabel]);
    this.targetPriorityBtn.setSize(130, 48);
    this.targetPriorityBtn.setInteractive(SafeArea.createTouchHitbox(130, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.targetPriorityBtn, this, {
      rippleColor: 0xd97706,
      onClick: () => {
        if (this.activeInspectedTower) {
          const next = this.activeInspectedTower.cycleTargetPriority();
          this.targetPriorityLabel.setText(`MIRA: ${next}`);
          this.refreshRadialMenu();
        }
      }
    });

    // 2. Botão de Upgrade / Tier 4 Evolve (Hitbox 130x48px com Spring)
    this.upgradeBtn = this.add.container(-45, 16);
    const upBg = this.add.graphics();
    upBg.fillStyle(0x065f46, 1);
    upBg.fillRoundedRect(-65, -18, 130, 36, 8);
    upBg.lineStyle(1.5, 0x34d399, 1);
    upBg.strokeRoundedRect(-65, -18, 130, 36, 8);

    this.upgradeLabel = this.add.text(0, 0, 'EVOLUIR 120G', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.upgradeBtn.add([upBg, this.upgradeLabel]);
    this.upgradeBtn.setSize(130, 48);
    this.upgradeBtn.setInteractive(SafeArea.createTouchHitbox(130, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.upgradeBtn, this, {
      rippleColor: 0x34d399,
      onClick: () => {
        if (this.activeInspectedTower) {
          if (this.activeInspectedTower.canEvolveTier4()) {
            this.openTier4EvolveModal(this.activeInspectedTower);
          } else {
            this.gameScene.upgradeCurrentTower();
            this.refreshInspector();
            this.refreshRadialMenu();
          }
        }
      }
    });

    // 3. Botão de Mod Chip Slot (Hitbox 110x48px com Spring)
    this.chipBtn = this.add.container(90, 16);
    const chipBg = this.add.graphics();
    chipBg.fillStyle(0x581c87, 1);
    chipBg.fillRoundedRect(-55, -18, 110, 36, 8);
    chipBg.lineStyle(1.5, 0xc084fc, 1);
    chipBg.strokeRoundedRect(-55, -18, 110, 36, 8);

    this.chipBtnLabel = this.add.text(0, 0, '⚡ CHIP', {
      fontSize: '10.5px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);
    this.chipBtn.add([chipBg, this.chipBtnLabel]);
    this.chipBtn.setSize(110, 48);
    this.chipBtn.setInteractive(SafeArea.createTouchHitbox(110, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.chipBtn, this, {
      rippleColor: 0xc084fc,
      onClick: () => {
        if (this.activeInspectedTower && this.activeInspectedTower.canEquipChip()) {
          this.openModChipModal(this.activeInspectedTower);
        }
      }
    });

    // 4. Botão de Venda (Hitbox 90x48px com Spring)
    this.sellBtn = this.add.container(205, 16);
    const sellBg = this.add.graphics();
    sellBg.fillStyle(0x7f1d1d, 1);
    sellBg.fillRoundedRect(-45, -18, 90, 36, 8);
    sellBg.lineStyle(1.5, 0xfca5a5, 1);
    sellBg.strokeRoundedRect(-45, -18, 90, 36, 8);

    this.sellLabel = this.add.text(0, 0, 'VENDER', {
      fontSize: '10.5px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.sellBtn.add([sellBg, this.sellLabel]);
    this.sellBtn.setSize(90, 48);
    this.sellBtn.setInteractive(SafeArea.createTouchHitbox(90, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(this.sellBtn, this, {
      rippleColor: 0xfca5a5,
      onClick: () => {
        this.gameScene.sellCurrentTower();
        this.hideInspector();
        this.hideRadialMenu();
      }
    });

    // Fechar Inspector (Hitbox 48x48px)
    const closeBtn = this.add.container(255, -28);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '20px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        this.hideInspector();
        this.hideRadialMenu();
      }
    });

    this.towerInspectorPanel.add([
      bg,
      this.inspectedTowerTitle,
      this.targetPriorityBtn,
      this.upgradeBtn,
      this.chipBtn,
      this.sellBtn,
      closeBtn
    ]);
  }

  private showInspector(tower: Tower): void {
    this.activeInspectedTower = tower;
    this.refreshInspector();
    this.towerInspectorPanel.setVisible(true);
  }

  private hideInspector(): void {
    if (this.activeInspectedTower) {
      this.activeInspectedTower.setSelected(false);
      this.activeInspectedTower = null;
    }
    this.towerInspectorPanel.setVisible(false);
  }

  private refreshInspector(): void {
    if (!this.activeInspectedTower) return;
    const tTower = this.activeInspectedTower;

    if (tTower.level === 4 && tTower.tier4Branch) {
      this.inspectedTowerTitle.setText(`${t(tTower.tier4Branch.nameKey as any)} (Tier 4)`);
    } else {
      this.inspectedTowerTitle.setText(`${t(tTower.config.nameKey as any)} (Grau ${tTower.level})`);
    }

    this.targetPriorityLabel.setText(`MIRA: ${tTower.targetPriority}`);

    if (tTower.canUpgrade()) {
      let cost = tTower.getUpgradeCost();
      if (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }
      this.upgradeLabel.setText(`EVOLUIR (${cost}G)`);
      this.upgradeBtn.setVisible(true);
    } else if (tTower.canEvolveTier4()) {
      this.upgradeLabel.setText(`⚡ TIER 4`);
      this.upgradeBtn.setVisible(true);
    } else {
      this.upgradeLabel.setText('MÁXIMO');
      this.upgradeBtn.setVisible(false);
    }

    // Chip button state
    if (tTower.canEquipChip()) {
      this.chipBtn.setVisible(true);
      if (tTower.equippedChip) {
        this.chipBtnLabel.setText(`${tTower.equippedChip.data.icon} ${t(tTower.equippedChip.data.nameKey as any)}`);
      } else {
        this.chipBtnLabel.setText(`+ EQUIPAR CHIP`);
      }
    } else {
      this.chipBtn.setVisible(false);
    }

    this.sellLabel.setText(`VENDER (+${tTower.getSellValue()}G)`);
  }

  // ==========================================
  // MODAL DE PAUSA & DECRETOS EM PERGAMINHO
  // ==========================================
  public openPauseModal(): void {
    if (this.pauseModal) this.pauseModal.destroy();

    this.prePauseSpeed = this.currentSpeed === GameSpeed.PAUSED ? GameSpeed.NORMAL : this.currentSpeed;
    this.setGameSpeed(GameSpeed.PAUSED);

    const { width, height } = this.scale;
    const save = SaveManager.getInstance();
    const settings = save.getData().settings;

    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(9999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-280, -220, 560, 440, 16);
    box.lineStyle(3, 0xfacc15, 1);
    box.strokeRoundedRect(-280, -220, 560, 440, 16);
    box.lineStyle(1.5, 0xd97706, 0.8);
    box.strokeRoundedRect(-274, -214, 548, 428, 12);

    const title = this.add.text(0, -185, `⏸ ${t('pauseTitle')}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    // 1. Controle de Volume SFX
    const sfxLabel = this.add.text(-240, -140, `🔊 ${t('sfxVolume')}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0, 0.5);
    items.push(sfxLabel);

    const sfxSteps = [0.0, 0.25, 0.5, 0.75, 1.0];
    const sfxStepLabels = ['MUDO', '25%', '50%', '75%', '100%'];
    const currentSfx = settings.sfxEnabled ? (settings.sfxVolume ?? 1.0) : 0.0;

    sfxSteps.forEach((vol, idx) => {
      const stepX = -70 + idx * 72;
      const isSelected = Math.abs(currentSfx - vol) < 0.12;
      const btn = this.add.container(stepX, -140);
      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x78350f : 0x2d180a, 1);
      bg.fillRoundedRect(-32, -18, 64, 36, 6);
      bg.lineStyle(1.5, isSelected ? 0xfacc15 : 0x78716c, 1);
      bg.strokeRoundedRect(-32, -18, 64, 36, 6);

      const txt = this.add.text(0, 0, sfxStepLabels[idx], {
        fontSize: '11px',
        fontStyle: 'bold',
        color: isSelected ? '#fef08a' : '#d6d3d1'
      }).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setSize(64, 48);
      btn.setInteractive(SafeArea.createTouchHitbox(64, 48), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(btn, this, {
        rippleColor: 0xfacc15,
        onClick: () => {
          settings.sfxEnabled = vol > 0;
          save.setSfxVolume(vol);
          AudioManager.getInstance().updateVolumes();
          this.openPauseModal();
        }
      });

      items.push(btn);
    });

    // 2. Controle de Volume de Música
    const musicLabel = this.add.text(-240, -85, `🎵 ${t('musicVolume')}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0, 0.5);
    items.push(musicLabel);

    const currentMusic = settings.musicEnabled ? (settings.musicVolume ?? 0.8) : 0.0;
    sfxSteps.forEach((vol, idx) => {
      const stepX = -70 + idx * 72;
      const isSelected = Math.abs(currentMusic - vol) < 0.12;
      const btn = this.add.container(stepX, -85);
      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x581c87 : 0x2d180a, 1);
      bg.fillRoundedRect(-32, -18, 64, 36, 6);
      bg.lineStyle(1.5, isSelected ? 0xc084fc : 0x78716c, 1);
      bg.strokeRoundedRect(-32, -18, 64, 36, 6);

      const txt = this.add.text(0, 0, sfxStepLabels[idx], {
        fontSize: '11px',
        fontStyle: 'bold',
        color: isSelected ? '#ffffff' : '#d6d3d1'
      }).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setSize(64, 48);
      btn.setInteractive(SafeArea.createTouchHitbox(64, 48), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(btn, this, {
        rippleColor: 0xc084fc,
        onClick: () => {
          settings.musicEnabled = vol > 0;
          save.setMusicVolume(vol);
          AudioManager.getInstance().updateVolumes();
          this.openPauseModal();
        }
      });

      items.push(btn);
    });

    // 3. Toggle Alto Contraste Real
    const isHC = save.isHighContrast();
    const hcBtn = this.add.container(-130, -25);
    const hcBg = this.add.graphics();
    hcBg.fillStyle(isHC ? 0x065f46 : 0x2d180a, 1);
    hcBg.fillRoundedRect(-110, -20, 220, 40, 8);
    hcBg.lineStyle(1.5, isHC ? 0x6ee7b7 : 0x78716c, 1);
    hcBg.strokeRoundedRect(-110, -20, 220, 40, 8);

    const hcTxt = this.add.text(0, 0, `👁️ ${t('highContrast')}: ${isHC ? t('highContrastOn') : t('highContrastOff')}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    hcBtn.add([hcBg, hcTxt]);
    hcBtn.setSize(220, 48);
    hcBtn.setInteractive(SafeArea.createTouchHitbox(220, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(hcBtn, this, {
      rippleColor: 0x6ee7b7,
      onClick: () => {
        save.setHighContrast(!isHC);
        this.openPauseModal();
      }
    });
    items.push(hcBtn);

    // 4. Toggle Vibração Tátil
    const isHap = settings.hapticsEnabled;
    const hapBtn = this.add.container(130, -25);
    const hapBg = this.add.graphics();
    hapBg.fillStyle(isHap ? 0x065f46 : 0x2d180a, 1);
    hapBg.fillRoundedRect(-110, -20, 220, 40, 8);
    hapBg.lineStyle(1.5, isHap ? 0x6ee7b7 : 0x78716c, 1);
    hapBg.strokeRoundedRect(-110, -20, 220, 40, 8);

    const hapTxt = this.add.text(0, 0, `📳 ${t('haptics')}: ${isHap ? 'ON' : 'OFF'}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    hapBtn.add([hapBg, hapTxt]);
    hapBtn.setSize(220, 48);
    hapBtn.setInteractive(SafeArea.createTouchHitbox(220, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(hapBtn, this, {
      rippleColor: 0x6ee7b7,
      onClick: () => {
        settings.hapticsEnabled = !isHap;
        save.save();
        this.openPauseModal();
      }
    });
    items.push(hapBtn);

    // 5. Botões de Ação Inferiores: Retomar, Reiniciar, Desistir
    const resumeBtn = this.add.container(-160, 65);
    const resBg = this.add.graphics();
    resBg.fillStyle(0x065f46, 1);
    resBg.fillRoundedRect(-75, -22, 150, 44, 8);
    resBg.lineStyle(2, 0x34d399, 1);
    resBg.strokeRoundedRect(-75, -22, 150, 44, 8);

    const resTxt = this.add.text(0, 0, `▶ ${t('resume')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    resumeBtn.add([resBg, resTxt]);
    resumeBtn.setSize(150, 48);
    resumeBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(resumeBtn, this, {
      rippleColor: 0x34d399,
      onClick: () => {
        modal.destroy();
        this.pauseModal = null;
        this.setGameSpeed(this.prePauseSpeed);
      }
    });
    items.push(resumeBtn);

    const restartBtn = this.add.container(0, 65);
    const restBg = this.add.graphics();
    restBg.fillStyle(0x78350f, 1);
    restBg.fillRoundedRect(-75, -22, 150, 44, 8);
    restBg.lineStyle(2, 0xfde047, 1);
    restBg.strokeRoundedRect(-75, -22, 150, 44, 8);

    const restTxt = this.add.text(0, 0, `🔄 ${t('restart')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    restartBtn.add([restBg, restTxt]);
    restartBtn.setSize(150, 48);
    restartBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(restartBtn, this, {
      rippleColor: 0xfde047,
      onClick: () => {
        modal.destroy();
        this.pauseModal = null;
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
    });
    items.push(restartBtn);

    const surrenderBtn = this.add.container(160, 65);
    const surrBg = this.add.graphics();
    surrBg.fillStyle(0x7f1d1d, 1);
    surrBg.fillRoundedRect(-75, -22, 150, 44, 8);
    surrBg.lineStyle(2, 0xfca5a5, 1);
    surrBg.strokeRoundedRect(-75, -22, 150, 44, 8);

    const surrTxt = this.add.text(0, 0, `🏳️ ${t('surrender')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    surrenderBtn.add([surrBg, surrTxt]);
    surrenderBtn.setSize(150, 48);
    surrenderBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(surrenderBtn, this, {
      rippleColor: 0xfca5a5,
      onClick: () => {
        modal.destroy();
        this.pauseModal = null;
        this.scene.stop('GameScene');
        this.scene.start('LevelSelectScene');
      }
    });
    items.push(surrenderBtn);

    // Fechar Modal
    const closeBtn = this.add.container(250, -185);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '22px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        modal.destroy();
        this.pauseModal = null;
        this.setGameSpeed(this.prePauseSpeed);
      }
    });
    items.push(closeBtn);

    modal.add(items);
    this.pauseModal = modal;
  }

  // ==========================================
  // MODAIS DE CHIPS RÚNICOS E TIER 4 EVOLVE
  // ==========================================
  public openModChipModal(tower: Tower): void {
    if (this.modChipModal) this.modChipModal.destroy();

    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(9999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-280, -200, 560, 400, 16);
    box.lineStyle(3, 0xfacc15, 1);
    box.strokeRoundedRect(-280, -200, 560, 400, 16);

    const title = this.add.text(0, -165, `⚡ ${t('chipsTitle')}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const desc = this.add.text(0, -135, t('chipsDesc'), {
      fontSize: '12px',
      color: '#d6d3d1'
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title, desc];

    const allChips = Object.values(MOD_CHIPS_CONFIG);
    const cardStartX = -200;
    const cardSpacing = 135;
    const cardY = 5;

    allChips.forEach((chipData, idx) => {
      const cx = cardStartX + idx * cardSpacing;
      const isEquipped = tower.equippedChip?.type === chipData.type;

      const card = this.add.container(cx, cardY);
      const cBg = this.add.graphics();
      cBg.fillStyle(isEquipped ? 0x2d180a : 0x140e09, 1);
      cBg.fillRoundedRect(-58, -100, 116, 200, 10);
      cBg.lineStyle(2, chipData.color, isEquipped ? 1.0 : 0.6);
      cBg.strokeRoundedRect(-58, -100, 116, 200, 10);

      const icon = this.add.text(0, -65, chipData.icon, { fontSize: '32px' }).setOrigin(0.5);
      const name = this.add.text(0, -30, t(chipData.nameKey as any), {
        fontSize: '11px',
        fontStyle: 'bold',
        color: chipData.badgeHex,
        align: 'center',
        wordWrap: { width: 105 }
      }).setOrigin(0.5);

      const dTxt = this.add.text(0, 20, chipData.description, {
        fontSize: '9.5px',
        color: '#e7e5e4',
        align: 'center',
        wordWrap: { width: 102 }
      }).setOrigin(0.5);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(isEquipped ? 0x065f46 : 0x78350f, 1);
      btnBg.fillRoundedRect(-45, 66, 90, 30, 6);
      btnBg.lineStyle(1.5, isEquipped ? 0x34d399 : 0xfacc15, 1);
      btnBg.strokeRoundedRect(-45, 66, 90, 30, 6);

      const btnTxt = this.add.text(0, 81, isEquipped ? '✓ EQUIPADO' : 'EQUIPAR', {
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      card.add([cBg, icon, name, dTxt, btnBg, btnTxt]);
      card.setSize(116, 200);
      card.setInteractive(SafeArea.createTouchHitbox(116, 200), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(card, this, {
        rippleColor: chipData.color,
        onClick: () => {
          this.gameScene.equipChipOnCurrentTower(chipData.type);
          modal.destroy();
          this.modChipModal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
        }
      });

      items.push(card);
    });

    // Botão Desequipar / Remover (Hitbox 150x48px)
    if (tower.equippedChip) {
      const unequipBtn = this.add.container(0, 155);
      const uBg = this.add.graphics();
      uBg.fillStyle(0x7f1d1d, 1);
      uBg.fillRoundedRect(-75, -18, 150, 36, 8);
      uBg.lineStyle(1.5, 0xf87171, 1);
      uBg.strokeRoundedRect(-75, -18, 150, 36, 8);
      const uTxt = this.add.text(0, 0, t('unequipChip'), { fontSize: '12px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      unequipBtn.add([uBg, uTxt]);
      unequipBtn.setSize(150, 48);
      unequipBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(unequipBtn, this, {
        rippleColor: 0xf87171,
        onClick: () => {
          this.gameScene.equipChipOnCurrentTower(null);
          modal.destroy();
          this.modChipModal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
        }
      });
      items.push(unequipBtn);
    }

    // Fechar
    const closeBtn = this.add.container(250, -170);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '22px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        modal.destroy();
        this.modChipModal = null;
      }
    });
    items.push(closeBtn);

    modal.add(items);
    this.modChipModal = modal;
  }

  public openTier4EvolveModal(tower: Tower): void {
    if (this.tier4Modal) this.tier4Modal.destroy();

    const branches = tower.getTier4Branches();
    if (!branches) return;

    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(9999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-300, -210, 600, 420, 16);
    box.lineStyle(3, 0xfacc15, 1);
    box.strokeRoundedRect(-300, -210, 600, 420, 16);

    const title = this.add.text(0, -175, `👑 ${t('tier4Evolve')}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    const cardPositions = [-140, 140];
    branches.forEach((branch, idx) => {
      const bx = cardPositions[idx];
      const card = this.add.container(bx, 10);

      const cBg = this.add.graphics();
      cBg.fillStyle(0x24160c, 1);
      cBg.fillRoundedRect(-125, -145, 250, 290, 12);
      cBg.lineStyle(2.5, branch.accentColor, 1);
      cBg.strokeRoundedRect(-125, -145, 250, 290, 12);

      const turretSprite = this.add.sprite(0, -95, branch.turretTextureKey).setScale(1.1);

      const name = this.add.text(0, -45, t(branch.nameKey as any), {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#facc15',
        align: 'center'
      }).setOrigin(0.5);

      const titleSub = this.add.text(0, -26, t(branch.titleKey as any), {
        fontSize: '11px',
        color: '#d6d3d1'
      }).setOrigin(0.5);

      const desc = this.add.text(0, 25, branch.description, {
        fontSize: '11px',
        color: '#e7e5e4',
        align: 'center',
        wordWrap: { width: 230 }
      }).setOrigin(0.5);

      let cost = tower.getTier4Cost(branch);
      if (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }
      const canAfford = this.gameScene.economyManager.getGold() >= cost;

      const btn = this.add.container(0, 105);
      const bBg = this.add.graphics();
      bBg.fillStyle(canAfford ? 0x065f46 : 0x2d180a, 1);
      bBg.fillRoundedRect(-80, -20, 160, 40, 8);
      bBg.lineStyle(1.5, canAfford ? 0x34d399 : 0x78716c, 1);
      bBg.strokeRoundedRect(-80, -20, 160, 40, 8);

      const bTxt = this.add.text(0, 0, `EVOLUIR (${cost}G)`, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: canAfford ? '#ffffff' : '#78716c'
      }).setOrigin(0.5);

      btn.add([bBg, bTxt]);

      card.add([cBg, turretSprite, name, titleSub, desc, btn]);
      card.setSize(250, 290);
      card.setInteractive(SafeArea.createTouchHitbox(250, 290), Phaser.Geom.Rectangle.Contains);

      attachSpringFeedback(card, this, {
        rippleColor: branch.accentColor,
        onClick: () => {
          this.gameScene.evolveCurrentTowerTier4(branch.branchId);
          modal.destroy();
          this.tier4Modal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
        }
      });

      items.push(card);
    });

    // Fechar
    const closeBtn = this.add.container(270, -180);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '22px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        modal.destroy();
        this.tier4Modal = null;
      }
    });
    items.push(closeBtn);

    modal.add(items);
    this.tier4Modal = modal;
  }

  // ==========================================
  // SISTEMA DE TOASTS & THREAT INDICATORS
  // ==========================================
  public showToast(title: string, subtitle?: string, icon?: string, customConfig?: Partial<ToastConfig>): void {
    const config: ToastConfig = {
      title,
      subtitle,
      icon: icon || '📯',
      borderColor: customConfig?.borderColor || 0xfacc15,
      bgColor: customConfig?.bgColor || 0x1a120b,
      titleColor: customConfig?.titleColor || '#fef08a',
      durationMs: customConfig?.durationMs || 2800
    };

    this.toastQueue.push(config);
    if (!this.isToastActive) {
      this.processNextToast();
    }
  }

  private processNextToast(): void {
    if (this.toastQueue.length === 0) {
      this.isToastActive = false;
      return;
    }

    this.isToastActive = true;
    const config = this.toastQueue.shift()!;
    const { width } = this.scale;

    const toast = this.add.container(width / 2, -60);
    toast.setDepth(9995);

    const bg = this.add.graphics();
    bg.fillStyle(config.bgColor || 0x1a120b, 0.98);
    bg.fillRoundedRect(-220, -26, 440, 52, 10);
    bg.lineStyle(2, config.borderColor || 0xfacc15, 1);
    bg.strokeRoundedRect(-220, -26, 440, 52, 10);

    const iconTxt = this.add.text(-190, 0, config.icon || '📯', { fontSize: '24px' }).setOrigin(0.5);

    const titleTxt = this.add.text(-160, config.subtitle ? -10 : 0, config.title, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: config.titleColor || '#fef08a'
    }).setOrigin(0, 0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, iconTxt, titleTxt];

    if (config.subtitle) {
      const subTxt = this.add.text(-160, 11, config.subtitle, {
        fontSize: '10.5px',
        color: '#e7e5e4'
      }).setOrigin(0, 0.5);
      items.push(subTxt);
    }

    toast.add(items);
    this.currentToastContainer = toast;

    const targetY = this.safeInsets.top + 75;

    // Animação Slide-Down com Spring
    this.tweens.add({
      targets: toast,
      y: targetY,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(config.durationMs || 2800, () => {
          this.tweens.add({
            targets: toast,
            y: -80,
            alpha: 0,
            duration: 250,
            ease: 'Quad.In',
            onComplete: () => {
              toast.destroy();
              this.currentToastContainer = null;
              this.processNextToast();
            }
          });
        });
      }
    });
  }

  private spawnFloatingGoldParticles(worldX: number, worldY: number, count = 3): void {
    for (let i = 0; i < count; i++) {
      const goldIcon = this.add.text(
        worldX + Phaser.Math.Between(-16, 16),
        worldY + Phaser.Math.Between(-16, 16),
        '💰',
        { fontSize: '15px' }
      ).setOrigin(0.5);
      goldIcon.setDepth(9992);

      const targetX = this.goldText.x + 10;
      const targetY = this.goldText.y;

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

    this.speedButtons.forEach((btn, sp) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
      const isCurrent = sp === speed;
      bg.clear();
      bg.fillStyle(isCurrent ? 0x78350f : 0x2d180a, 1);
      bg.fillRoundedRect(-19, -19, 38, 38, 8);
      bg.lineStyle(2, isCurrent ? 0xfacc15 : 0x78716c, 1);
      bg.strokeRoundedRect(-19, -19, 38, 38, 8);
    });

    EventBus.emit(GameEvents.GAME_SPEED_CHANGED, speed);
  }

  private setupEventListeners(): void {
    // 1. Rolamento Suave de Recursos (King's Gold Rolling Counter)
    EventBus.on(GameEvents.GOLD_CHANGED, (gold: number) => {
      const startVal = this.displayedGold;
      if (this.goldRollingTween) {
        this.goldRollingTween.stop();
      }

      if (gold > this.targetGold) {
        this.tweens.add({
          targets: this.goldText,
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
          this.goldText.setText(`💰 ${Math.round(this.displayedGold)}`);
        },
        onComplete: () => {
          this.displayedGold = gold;
          this.goldText.setText(`💰 ${gold}`);
        }
      });

      this.refreshInspector();
      this.refreshRadialMenu();
    });

    // 2. Perda de Vidas e Pulso Vermelho Carmesim
    EventBus.on(GameEvents.LIVES_CHANGED, (lives: number) => {
      if (lives < this.previousLives) {
        this.triggerRedVignetteFlash();
        this.cameras.main.shake(220, 0.015);

        this.tweens.add({
          targets: this.livesText,
          scaleX: 1.45,
          scaleY: 1.45,
          duration: 100,
          yoyo: true,
          ease: 'Back.Out'
        });

        const lost = this.previousLives - lives;
        const txt = this.add.text(this.livesText.x + 20, this.livesText.y + 20, `-${lost} ❤️`, {
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
      this.livesText.setText(`❤️ ${lives}`);
    });

    // 3. Partículas flutuantes ao eliminar invasores
    EventBus.on(GameEvents.ENEMY_KILLED, (data: { enemy: Enemy; gold: number; score: number }) => {
      this.spawnFloatingGoldParticles(
        data.enemy.x,
        data.enemy.y,
        Math.min(5, Math.max(2, Math.floor(data.gold / 10)))
      );
    });

    EventBus.on(GameEvents.TOWER_SOLD, () => {
      this.spawnFloatingGoldParticles(this.scale.width / 2, this.scale.height - 150, 4);
    });

    // 4. Início de Onda e Notificações Toast
    EventBus.on(GameEvents.WAVE_STARTED, (data: { waveNumber: number; totalWaves: number; isEarlyCall?: boolean }) => {
      const prefix = this.gameScene.isBossRush ? '👑 BOSS' : '💀';
      this.waveText.setText(`${prefix} ${data.waveNumber}/${data.totalWaves}`);
      this.nextWaveLabel.setText(`⏩ ${t('callEarly', { bonus: 25 })}`);

      const isBossWave = this.gameScene.isBossRush || (data.waveNumber % 5 === 0);
      if (isBossWave) {
        this.showToast('ALERTA DE CHEFE COLOSSAL', 'Prepare as defesas do Reino!', '👑', {
          borderColor: 0xef4444,
          titleColor: '#ef4444',
          durationMs: 3200
        });
      } else {
        this.showToast(`ONDA ${data.waveNumber} INICIADA`, data.isEarlyCall ? '+25G Bônus do Rei' : 'Invasores marchando', '💀', {
          borderColor: 0xfacc15,
          titleColor: '#fef08a',
          durationMs: 2500
        });
      }
    });

    EventBus.on(GameEvents.WAVE_COMPLETED, () => {
      this.nextWaveLabel.setText(`📯 ${t('nextWave')}`);
    });

    // 🏆 Marcos do Modo Sem Fim — Toast com estrelas
    EventBus.on('ENDLESS_MILESTONE_REACHED', (data: { wave: number; stars: number }) => {
      const starStr = '⭐'.repeat(data.stars);
      this.showToast(
        `🏆 MARCO ATINGIDO! ONDA ${data.wave}`,
        `${starStr} +${data.stars} Estrelas Arcanas conquistadas!`,
        '🏆',
        { borderColor: 0xfbbf24, titleColor: '#fef08a', durationMs: 4500 }
      );
    });

    EventBus.on(GameEvents.TOWER_SELECTED, (tower: Tower | null) => {
      if (tower) {
        this.showRadialMenu(tower);
        this.showInspector(tower);
      } else {
        this.hideRadialMenu();
        this.hideInspector();
      }
    });

    EventBus.on(GameEvents.TOWER_PLACED, () => {
      this.selectedBuildType = null;
      this.updateTowerCardHighlights();
    });

    EventBus.on(GameEvents.TOWER_UPGRADED, () => {
      this.refreshInspector();
      this.refreshRadialMenu();
    });

    EventBus.on(GameEvents.CHIP_EQUIPPED, () => {
      this.refreshInspector();
      this.refreshRadialMenu();
    });

    // 5. Level Up do Herói e Notificação
    EventBus.on(GameEvents.HERO_LEVEL_UP, (data: { level: number; maxHp: number; damage: number }) => {
      this.showToast('HERÓI DO REINO SUBIU DE NÍVEL!', `Nível ${data.level} alcançado! Glória aos guardiões.`, '⭐', {
        borderColor: 0xfacc15,
        titleColor: '#facc15',
        durationMs: 3000
      });
    });

    EventBus.on(GameEvents.HERO_HP_CHANGED, (data: { current: number; max: number; isDead?: boolean }) => {
      this.refreshHeroHp(data.current, data.max, data.isDead);
    });

    EventBus.on(GameEvents.HERO_XP_CHANGED, (data: { current: number; max: number; level: number }) => {
      this.refreshHeroXp(data.current, data.max, data.level);
    });

    EventBus.on(GameEvents.HERO_SELECTED, () => {
      if (this.heroSelectionBorder) this.heroSelectionBorder.setVisible(true);
    });

    EventBus.on(GameEvents.HERO_DESELECTED, () => {
      if (this.heroSelectionBorder) this.heroSelectionBorder.setVisible(false);
    });

    EventBus.on(GameEvents.VICTORY, () => {
      this.hideRadialMenu();
      this.hideInspector();
      this.showVictoryModal();
    });

    EventBus.on(GameEvents.GAME_OVER, () => {
      this.hideRadialMenu();
      this.hideInspector();
      this.showDefeatModal();
    });
  }

  // ==========================================
  // MODAL DE VITÓRIA REAL
  // ==========================================
  private showVictoryModal(): void {
    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(9999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-230, -160, 460, 320, 16);
    box.lineStyle(3, 0xfacc15, 1);
    box.strokeRoundedRect(-230, -160, 460, 320, 16);
    box.lineStyle(1.5, 0xd97706, 0.8);
    box.strokeRoundedRect(-224, -154, 448, 308, 12);

    const title = this.add.text(0, -108, `👑 ${t('victoryTitle')}`, {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 4
    }).setOrigin(0.5);

    const stars = this.gameScene.economyManager.calculateStars();
    const starsTxt = this.add.text(0, -42, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
      fontSize: '38px',
      color: '#facc15'
    }).setOrigin(0.5);

    const desc = this.add.text(0, 25, t('victoryDesc'), {
      fontSize: '13.5px',
      color: '#e7e5e4',
      wordWrap: { width: 390 },
      align: 'center'
    }).setOrigin(0.5);

    // Botão Menu Principal (Hitbox 210x48px com Spring)
    const menuBtn = this.add.container(0, 95);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x78350f, 1);
    menuBg.fillRoundedRect(-105, -22, 210, 44, 8);
    menuBg.lineStyle(2, 0xfacc15, 1);
    menuBg.strokeRoundedRect(-105, -22, 210, 44, 8);
    const menuTxt = this.add.text(0, 0, `🗺️ ${t('mainMenu')}`, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    menuBtn.add([menuBg, menuTxt]);
    menuBtn.setSize(210, 48);
    menuBtn.setInteractive(SafeArea.createTouchHitbox(210, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(menuBtn, this, {
      rippleColor: 0xfacc15,
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.start('LevelSelectScene');
      }
    });

    modal.add([overlay, box, title, starsTxt, desc, menuBtn]);
  }

  // ==========================================
  // MODAL DE DERROTA
  // ==========================================
  private showDefeatModal(): void {
    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(9999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-230, -150, 460, 300, 16);
    box.lineStyle(3, 0xef4444, 1);
    box.strokeRoundedRect(-230, -150, 460, 300, 16);
    box.lineStyle(1.5, 0x991b1b, 0.8);
    box.strokeRoundedRect(-224, -144, 448, 288, 12);

    const title = this.add.text(0, -96, `💀 ${t('defeatTitle')}`, {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ef4444',
      stroke: '#450a0a',
      strokeThickness: 4
    }).setOrigin(0.5);

    const desc = this.add.text(0, -22, t('defeatDesc'), {
      fontSize: '14px',
      color: '#d6d3d1',
      wordWrap: { width: 390 },
      align: 'center'
    }).setOrigin(0.5);

    // Botão Reiniciar (Hitbox 140x48px com Spring)
    const restartBtn = this.add.container(-90, 68);
    const restBg = this.add.graphics();
    restBg.fillStyle(0x78350f, 1);
    restBg.fillRoundedRect(-70, -22, 140, 44, 8);
    restBg.lineStyle(1.5, 0xfde047, 1);
    restBg.strokeRoundedRect(-70, -22, 140, 44, 8);
    const restTxt = this.add.text(0, 0, `🔄 ${t('restart')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    restartBtn.add([restBg, restTxt]);
    restartBtn.setSize(140, 48);
    restartBtn.setInteractive(SafeArea.createTouchHitbox(140, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(restartBtn, this, {
      rippleColor: 0xfde047,
      onClick: () => {
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
    });

    // Botão Menu (Hitbox 140x48px com Spring)
    const menuBtn = this.add.container(90, 68);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x2d180a, 1);
    menuBg.fillRoundedRect(-70, -22, 140, 44, 8);
    menuBg.lineStyle(1.5, 0xd97706, 1);
    menuBg.strokeRoundedRect(-70, -22, 140, 44, 8);
    const menuTxt = this.add.text(0, 0, `🗺️ ${t('mainMenu')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    menuBtn.add([menuBg, menuTxt]);
    menuBtn.setSize(140, 48);
    menuBtn.setInteractive(SafeArea.createTouchHitbox(140, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(menuBtn, this, {
      rippleColor: 0xd97706,
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.start('LevelSelectScene');
      }
    });

    modal.add([overlay, box, title, desc, restartBtn, menuBtn]);
  }

  public update(): void {
    // Atualiza progresso dos cooldowns de spells
    this.spellCooldownGraphics.forEach((g, type) => {
      const progress = this.gameScene.spellsManager.getCooldownProgress(type, this.time.now);
      g.clear();
      if (progress < 1.0) {
        g.fillStyle(0x000000, 0.75);
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress), false);
        g.closePath();
        g.fillPath();
      }
    });

    // Atualiza progresso dos cooldowns de habilidades do herói
    if (this.gameScene.hero) {
      const hero = this.gameScene.hero;
      [1, 2].forEach(abilityIndex => {
        const idx = abilityIndex - 1;
        const g = this.heroAbilityCooldownGfx[idx];
        const txt = this.heroAbilityCooldownTexts[idx];
        if (!g || !txt) return;

        const progress = hero.getAbilityCooldownProgress(abilityIndex as 1 | 2);
        const remainingMs = hero.abilityCooldowns[idx];

        g.clear();
        if (progress < 1.0) {
          g.fillStyle(0x000000, 0.78);
          g.beginPath();
          g.moveTo(0, 0);
          g.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress), false);
          g.closePath();
          g.fillPath();

          const sec = (remainingMs / 1000).toFixed(1);
          txt.setText(`${sec}s`).setVisible(true);
        } else {
          txt.setVisible(false);
        }
      });
    }

    // Atualiza Indicadores de Ameaça nas Bordas da Tela
    this.updateThreatIndicators();
  }

  private updateThreatIndicators(): void {
    const { width, height } = this.scale;
    const enemies = this.gameScene.enemies;

    // Encontra inimigos de elite (Boss e Carrier)
    const eliteEnemies = enemies.filter(e => e.active && (e.enemyType === EnemyType.BOSS || e.enemyType === EnemyType.CARRIER));

    // Remove indicadores de inimigos mortos
    this.threatIndicators.forEach((container, enemy) => {
      if (!enemy.active || !eliteEnemies.includes(enemy)) {
        container.destroy();
        this.threatIndicators.delete(enemy);
      }
    });

    // Atualiza ou cria indicadores para inimigos de elite
    const minX = this.safeBounds.left + 35;
    const maxX = this.safeBounds.right - 35;
    const minY = this.safeInsets.top + 70;
    const maxY = height - 100 - this.safeInsets.bottom;

    eliteEnemies.forEach(enemy => {
      let container = this.threatIndicators.get(enemy);
      if (!container) {
        container = this.add.container(0, 0);
        container.setDepth(9980);

        const isBoss = enemy.enemyType === EnemyType.BOSS;
        const threatColor = isBoss ? 0xef4444 : 0xf59e0b;

        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x1a120b, 0.95);
        badgeBg.fillRoundedRect(-22, -22, 44, 44, 10);
        badgeBg.lineStyle(2, threatColor, 1);
        badgeBg.strokeRoundedRect(-22, -22, 44, 44, 10);

        const iconTxt = this.add.text(0, -4, isBoss ? '👑' : '🛸', { fontSize: '18px' }).setOrigin(0.5);

        const hpTxt = this.add.text(0, 12, '100%', {
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);

        container.add([badgeBg, iconTxt, hpTxt]);
        this.threatIndicators.set(enemy, container);
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const angle = Phaser.Math.Angle.Between(centerX, centerY, enemy.x, enemy.y);

      let edgeX = centerX + Math.cos(angle) * (width / 2 - 40);
      let edgeY = centerY + Math.sin(angle) * (height / 2 - 40);

      edgeX = Phaser.Math.Clamp(edgeX, minX, maxX);
      edgeY = Phaser.Math.Clamp(edgeY, minY, maxY);

      container.setPosition(edgeX, edgeY);

      const pulse = 1.0 + Math.sin(this.time.now * 0.008) * 0.12;
      container.setScale(pulse);

      const hpTxt = container.getAt(2) as Phaser.GameObjects.Text;
      const hpRatio = Math.max(0, Math.round((enemy.currentHp / enemy.maxHp) * 100));
      hpTxt.setText(`${hpRatio}%`);
    });
  }
}
