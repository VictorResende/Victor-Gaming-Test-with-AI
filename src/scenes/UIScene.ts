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
import { EventBus, GameEvents, BoundBus } from '../core/EventBus';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SaveManager } from '../managers/SaveManager';
import {
  bindControl,
  bindSized,
  applyUiScene,
  UI_FONT,
  fillPanel,
  UI,
  hudStyle,
  paintGlassRect,
  addPrimaryButton,
  addGhostButton,
  addDangerButton
} from '../ui/UiKit';
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
  private skipTowerCardClick = false;
  private draggedTowerType: TowerType | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private potentialDragType: TowerType | null = null;

  // Cooldowns de Spells
  private spellCooldownGraphics: Map<SpellType, Phaser.GameObjects.Graphics> = new Map();

  // Controles de Teclado Web
  private keyboardControls!: KeyboardControls;
  private bus = new BoundBus();
  private weatherIconText: Phaser.GameObjects.Text | null = null;

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

    // 6. Configura Handlers de Drag-and-Drop Global
    this.setupGlobalDragHandlers();

    // 7. Registra Listeners do EventBus
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.setupEventListeners();

    // 8. Inicializa Controles de Teclado e Atalhos para a Versão Web
    this.keyboardControls = new KeyboardControls(this, this.gameScene, this);
  }

  private onSceneShutdown(): void {
    this.bus.offAll();
    this.keyboardControls?.destroy();
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
    const inset = 12;
    const barH = 52;
    const barY = this.safeInsets.top + 8;
    const centerY = barY + barH / 2;

    const topBarBg = this.add.graphics();
    fillPanel(topBarBg, inset, barY, width - inset * 2, barH, 16, { alpha: 0.9 });

    const backBtnX = this.safeBounds.left + 36;
    const backBtn = this.add.container(backBtnX, centerY);
    const backBg = this.add.graphics();
    paintGlassRect(backBg, -20, -18, 40, 36, 10);
    const backTxt = this.add.text(0, 0, '←', hudStyle('18px')).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    bindControl(backBtn, 40, 36, () => {
      this.scene.stop('GameScene');
      this.scene.start('LevelSelectScene');
    });

    const goldX = backBtnX + 52;
    const goldShield = this.add.graphics();
    paintGlassRect(goldShield, goldX - 6, centerY - 16, 88, 32, 10);
    this.goldText = this.add.text(goldX + 8, centerY, `${this.displayedGold}G`, hudStyle('15px', UI.text.amber)).setOrigin(0, 0.5);

    const livesX = goldX + 100;
    const livesShield = this.add.graphics();
    paintGlassRect(livesShield, livesX - 6, centerY - 16, 72, 32, 10);
    this.livesText = this.add.text(livesX + 8, centerY, `♥ ${this.previousLives}`, hudStyle('15px', '#f87171')).setOrigin(0, 0.5);

    const waveX = livesX + 86;
    const waveShield = this.add.graphics();
    paintGlassRect(waveShield, waveX - 6, centerY - 16, 118, 32, 10);
    const waveLabel = this.gameScene.isBossRush ? 'BOSS' : 'ONDA';
    this.waveText = this.add.text(waveX + 8, centerY, `${waveLabel} 0/10`, hudStyle('13px', this.gameScene.isBossRush ? UI.text.amber : '#93c5fd')).setOrigin(0, 0.5);

    const nextWaveX = waveX + 168;
    this.nextWaveBtn = this.add.container(nextWaveX, centerY);
    const nwBg = this.add.graphics();
    nwBg.fillStyle(UI.color.amber, 1);
    nwBg.fillRoundedRect(-72, -18, 144, 36, 12);
    this.nextWaveLabel = this.add.text(0, 0, t('nextWave'), hudStyle('12px', UI.text.ink, { fontStyle: '800' })).setOrigin(0.5);
    this.nextWaveBtn.add([nwBg, this.nextWaveLabel]);
    bindControl(this.nextWaveBtn, 144, 36, () => {
      this.gameScene.waveManager.startNextWave(this.gameScene.waveManager.isRunning());
    });

    if (this.gameScene.isDailyChallenge && this.gameScene.modifiers.length > 0) {
      let modX = nextWaveX + 130;
      this.gameScene.modifiers.forEach(mod => {
        const info = MODIFIER_INFO[mod];
        if (!info) return;
        const modBadge = this.add.container(modX, centerY);
        const mBg = this.add.graphics();
        paintGlassRect(mBg, -46, -14, 92, 28, 10);
        const mTxt = this.add.text(0, 0, `${info.icon} ${t(info.nameKey as any)}`, hudStyle('10px', info.colorHex)).setOrigin(0.5);
        modBadge.add([mBg, mTxt]);
        modX += 98;
      });
    }

    const speeds = [GameSpeed.PAUSED, GameSpeed.NORMAL, GameSpeed.FAST, GameSpeed.ULTRA];
    const speedLabels = ['Ⅱ', '1×', '2×', '4×'];
    const speedSpacing = 42;
    const fsX = this.safeBounds.right - 28;
    const weatherX = fsX - speedSpacing;
    const speedStartX = weatherX - speeds.length * speedSpacing;

    speeds.forEach((sp, idx) => {
      const btn = this.add.container(speedStartX + idx * speedSpacing, centerY);
      const bg = this.add.graphics();
      paintGlassRect(bg, -18, -18, 36, 36, 10, sp === this.currentSpeed);
      const label = this.add.text(0, 0, speedLabels[idx], hudStyle('13px', sp === this.currentSpeed ? UI.text.amber : UI.text.muted)).setOrigin(0.5);
      btn.add([bg, label]);
      bindControl(btn, 36, 36, () => {
        if (sp === GameSpeed.PAUSED) this.openPauseModal();
        else this.setGameSpeed(sp);
      });
      this.speedButtons.set(sp, btn);
    });

    const weatherBtn = this.add.container(weatherX, centerY);
    const weatherBg = this.add.graphics();
    paintGlassRect(weatherBg, -18, -18, 36, 36, 10);
    const weatherLabel = this.add.text(0, 0, '☀️', { fontSize: '16px' }).setOrigin(0.5);
    weatherBtn.add([weatherBg, weatherLabel]);
    bindControl(weatherBtn, 36, 36, () => this.gameScene.toggleWeather());
    this.bus.on(GameEvents.WEATHER_CHANGED, (data: { weather: 'CLEAR' | 'RAIN' | 'STORM' }) => {
      weatherLabel.setText(data.weather === 'CLEAR' ? '☀️' : (data.weather === 'RAIN' ? '🌧️' : '⛈️'));
    });

    const fsBtn = this.add.container(fsX, centerY);
    const fsBg = this.add.graphics();
    paintGlassRect(fsBg, -18, -18, 36, 36, 10);
    const fsLabel = this.add.text(0, 0, '⛶', hudStyle('16px')).setOrigin(0.5);
    fsBtn.add([fsBg, fsLabel]);
    bindControl(fsBtn, 36, 36, () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }

  // ==========================================
  // WIDGET DO HERÓI NO HUD
  // ==========================================
  private createHeroHUD(): void {
    const hero = this.gameScene.hero;
    if (!hero) return;

    const heroX = this.safeBounds.left + 72;
    const heroY = this.safeInsets.top + 98;
    this.heroWidgetContainer = this.add.container(heroX, heroY);

    const bg = this.add.graphics();
    fillPanel(bg, -52, -32, 128, 64, 14, { alpha: 0.92 });

    this.heroSelectionBorder = this.add.graphics();
    this.heroSelectionBorder.lineStyle(2, UI.color.amber, 1);
    this.heroSelectionBorder.strokeRoundedRect(-54, -34, 132, 68, 16);
    this.heroSelectionBorder.setVisible(false);

    this.heroPortraitSprite = this.add.sprite(-24, 0, hero.config.portraitKey).setScale(0.78);

    this.heroTitleText = this.add.text(12, -18, `Nv ${hero.level}`, hudStyle('12px', UI.text.amber)).setOrigin(0, 0.5);

    const hpBg = this.add.graphics();
    hpBg.fillStyle(0x09090b, 0.85);
    hpBg.fillRoundedRect(12, -8, 54, 8, 4);
    this.heroHpBarFill = this.add.graphics();
    this.heroHpBarFill.fillStyle(0x22c55e, 1);
    this.heroHpBarFill.fillRoundedRect(12, -8, 54, 8, 4);
    this.heroHpText = this.add.text(39, -4, `${Math.round(hero.currentHp)}`, hudStyle('9px')).setOrigin(0.5);

    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x09090b, 0.85);
    xpBg.fillRoundedRect(12, 8, 54, 6, 3);
    this.heroXpBarFill = this.add.graphics();
    this.heroXpBarFill.fillStyle(0x38bdf8, 1);
    this.heroXpBarFill.fillRoundedRect(12, 8, 0, 6, 3);
    this.heroXpText = this.add.text(39, 11, `${hero.currentXp}/${hero.xpToNextLevel}`, hudStyle('8px', '#e0f2fe')).setOrigin(0.5);

    this.heroWidgetContainer.add([
      bg, this.heroSelectionBorder, this.heroPortraitSprite, this.heroTitleText,
      hpBg, this.heroHpBarFill, this.heroHpText, xpBg, this.heroXpBarFill, this.heroXpText
    ]);
    bindControl(this.heroWidgetContainer, 128, 64, () => {
      hero.setSelected(!hero.isSelected);
    });
  }

  private refreshHeroHp(current: number, max: number, isDead = false): void {
    if (!this.heroHpBarFill || !this.heroHpText) return;
    this.heroHpBarFill.clear();
    const ratio = Math.max(0, current / max);
    const widthBar = 54 * ratio;
    const color = isDead ? 0xef4444 : (ratio < 0.3 ? 0xef4444 : 0x22c55e);
    this.heroHpBarFill.fillStyle(color, 1);
    this.heroHpBarFill.fillRoundedRect(12, -8, widthBar, 8, 4);
    this.heroHpText.setText(isDead ? 'MORTO' : `${Math.round(current)}`);
  }

  private refreshHeroXp(current: number, max: number, level: number): void {
    if (!this.heroXpBarFill || !this.heroXpText || !this.heroTitleText) return;
    this.heroTitleText.setText(`Nv ${level}`);
    this.heroXpBarFill.clear();
    const ratio = Math.min(1.0, current / max);
    const widthBar = 54 * ratio;
    this.heroXpBarFill.fillStyle(0x38bdf8, 1);
    this.heroXpBarFill.fillRoundedRect(12, 8, widthBar, 6, 3);
    this.heroXpText.setText(`${current}/${max}`);
  }

  // ==========================================
  // DECK INFERIOR ESTILO GRIMÓRIO ARCANO
  // ==========================================
  private createBottomHUD(width: number, height: number): void {
    const inset = 12;
    const dockH = 84;
    const dockTop = height - dockH - this.safeInsets.bottom - 8;
    const centerY = dockTop + dockH / 2;

    const bottomBg = this.add.graphics();
    fillPanel(bottomBg, inset, dockTop, width - inset * 2, dockH, 16, { alpha: 0.92 });

    const towerTypes = [
      TowerType.GATLING, TowerType.CANNON, TowerType.CRYO,
      TowerType.LASER, TowerType.TESLA, TowerType.WITCH
    ];
    const cardW = 72;
    const startX = this.safeBounds.left + 48;
    towerTypes.forEach((type, idx) => {
      const card = this.createHeraldicTowerCard(startX + idx * (cardW + 6), centerY, type);
      this.towerCards.set(type, card);
    });

    const hero = this.gameScene.hero;
    const heroSkillStartX = startX + towerTypes.length * (cardW + 6) + 18;
    if (hero) {
      this.createHeroAbilityButton(heroSkillStartX, centerY, 1);
      this.createHeroAbilityButton(heroSkillStartX + 56, centerY, 2);
    }

    if (!this.gameScene.modifiers.includes(TacticalModifier.NO_SPELLS)) {
      const spells = [SpellType.METEOR, SpellType.EMP, SpellType.SUPPLY];
      const spellStartX = this.safeBounds.right - 168;
      spells.forEach((sp, idx) => this.createElementalSpellGem(spellStartX + idx * 56, centerY, sp));
    }
  }

  private createHeraldicTowerCard(x: number, y: number, type: TowerType): Phaser.GameObjects.Container {
    const config = TOWERS_CONFIG[type];
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    paintGlassRect(bg, -34, -32, 68, 64, 14);

    const turretKey = `turret_${type.toLowerCase()}`;
    const icon = this.add.sprite(0, -10, turretKey).setScale(0.72);

    let displayCost = config.cost;
    if (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
      displayCost *= 2;
    }
    const costTxt = this.add.text(0, 20, `${displayCost}G`, hudStyle('11px', UI.text.amber)).setOrigin(0.5);

    const hotkeysMap: Record<TowerType, string> = {
      [TowerType.GATLING]: '1',
      [TowerType.CANNON]: '2',
      [TowerType.CRYO]: '3',
      [TowerType.LASER]: '4',
      [TowerType.TESLA]: '5',
      [TowerType.WITCH]: '6'
    };
    const keyBadge = this.add.text(26, -24, hotkeysMap[type] || '1', hudStyle('10px', UI.text.faint)).setOrigin(0.5);

    container.add([bg, icon, costTxt, keyBadge]);
    bindControl(container, 68, 64, () => {
      if (this.skipTowerCardClick) {
        this.skipTowerCardClick = false;
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
    }, undefined, (pointer: Phaser.Input.Pointer) => {
      this.dragStartX = pointer.worldX;
      this.dragStartY = pointer.worldY;
      this.potentialDragType = type;
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
          this.skipTowerCardClick = true;
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
      const bg = card.getAt(0) as Phaser.GameObjects.Graphics;
      paintGlassRect(bg, -34, -32, 68, 64, 14, this.selectedBuildType === type);
    });
  }

  private createHeroAbilityButton(x: number, y: number, abilityIndex: 1 | 2): void {
    const hero = this.gameScene.hero;
    if (!hero) return;

    const ability = hero.config.abilities[abilityIndex - 1];
    if (!ability) return;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(UI.color.panelHi, 1);
    bg.fillRoundedRect(-24, -24, 48, 48, 14);
    bg.lineStyle(1, hero.config.color, 0.9);
    bg.strokeRoundedRect(-24, -24, 48, 48, 14);

    const icon = this.add.sprite(0, -2, ability.iconTexture).setScale(0.68);
    const cdG = this.add.graphics();
    const cdTxt = this.add.text(0, 0, '', hudStyle('12px')).setOrigin(0.5).setVisible(false);
    const keyLetter = abilityIndex === 1 ? 'Z' : 'X';
    const keyBadge = this.add.text(18, -18, keyLetter, hudStyle('9px', UI.text.faint)).setOrigin(0.5);

    container.add([bg, icon, cdG, cdTxt, keyBadge]);
    bindControl(container, 48, 48, () => {
      this.gameScene.hero.useAbility(abilityIndex, this.gameScene.enemies, this.gameScene.towers);
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
    bg.fillStyle(UI.color.panelHi, 1);
    bg.fillRoundedRect(-24, -24, 48, 48, 14);
    bg.fillStyle(gemColor, 0.88);
    bg.fillCircle(0, 0, 16);
    bg.lineStyle(1, gemBorder, 1);
    bg.strokeRoundedRect(-24, -24, 48, 48, 14);

    const iconTxt = this.add.text(0, -1, iconChar, { fontSize: '18px' }).setOrigin(0.5);
    const keyBadge = this.add.text(18, -18, hotkeyChar, hudStyle('9px', UI.text.faint)).setOrigin(0.5);
    const cdG = this.add.graphics();
    container.add([bg, iconTxt, cdG, keyBadge]);
    this.spellCooldownGraphics.set(type, cdG);
    bindControl(container, 48, 48, () => {
      this.gameScene.spellsManager.cast(type, this.time.now);
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
    this.radialRingGraphics.lineStyle(2, UI.color.amber, 0.45);
    this.radialRingGraphics.strokeCircle(0, 0, radius);
    this.radialRingGraphics.lineStyle(1, UI.color.stroke, 0.8);
    this.radialRingGraphics.strokeCircle(0, 0, radius + 6);
    this.radialMenuContainer.add(this.radialRingGraphics);

    // 1. Botão Upgrade / Tier 4 (Norte / Top: 0°, angle = -90° / -π/2)
    const upCost = tower.canUpgrade() ? (this.gameScene.modifiers.includes(TacticalModifier.DOUBLE_COST) ? tower.getUpgradeCost() * 2 : tower.getUpgradeCost()) : 0;
    const canAffordUp = this.gameScene.economyManager.getGold() >= upCost;
    const upAngle = -Math.PI / 2;
    const upX = Math.cos(upAngle) * radius;
    const upY = Math.sin(upAngle) * radius;

    let upLabelStr = 'MAX';
    let upColor = 0x18181b;
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
    bg.fillStyle(bgColor, 0.94);
    bg.fillCircle(0, 0, 22);
    bg.lineStyle(1, borderColor, 1);
    bg.strokeCircle(0, 0, 22);

    const iconTxt = this.add.text(0, text ? -6 : 0, icon, { fontSize: text ? '14px' : '16px' }).setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [bg, iconTxt];
    if (text) {
      items.push(this.add.text(0, 10, text, hudStyle('9px')).setOrigin(0.5));
    }
    container.add(items);
    bindControl(container, 44, 44, onClick);

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
    const panelY = height - 118 - this.safeInsets.bottom;
    this.towerInspectorPanel = this.add.container(width / 2, panelY);
    this.towerInspectorPanel.setVisible(false);

    const bg = this.add.graphics();
    fillPanel(bg, -270, -42, 540, 84, 16, { alpha: 0.94 });

    this.inspectedTowerTitle = this.add.text(-252, -24, 'Torre', hudStyle('14px')).setOrigin(0, 0.5);

    this.targetPriorityBtn = this.add.container(-190, 16);
    const tpBg = this.add.graphics();
    paintGlassRect(tpBg, -62, -16, 124, 32, 10);
    this.targetPriorityLabel = this.add.text(0, 0, 'MIRA: PRIMEIRO', hudStyle('10px', UI.text.muted)).setOrigin(0.5);
    this.targetPriorityBtn.add([tpBg, this.targetPriorityLabel]);
    bindControl(this.targetPriorityBtn, 124, 32, () => {
      if (this.activeInspectedTower) {
        const next = this.activeInspectedTower.cycleTargetPriority();
        this.targetPriorityLabel.setText(`MIRA: ${next}`);
        this.refreshRadialMenu();
      }
    });

    this.upgradeBtn = this.add.container(-45, 16);
    const upBg = this.add.graphics();
    upBg.fillStyle(UI.color.success, 1);
    upBg.fillRoundedRect(-65, -18, 130, 36, 12);
    this.upgradeLabel = this.add.text(0, 0, 'EVOLUIR 120G', hudStyle('11px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5);
    this.upgradeBtn.add([upBg, this.upgradeLabel]);
    bindControl(this.upgradeBtn, 130, 36, () => {
      if (this.activeInspectedTower) {
        if (this.activeInspectedTower.canEvolveTier4()) {
          this.openTier4EvolveModal(this.activeInspectedTower);
        } else {
          this.gameScene.upgradeCurrentTower();
          this.refreshInspector();
          this.refreshRadialMenu();
        }
      }
    });

    this.chipBtn = this.add.container(90, 16);
    const chipBg = this.add.graphics();
    paintGlassRect(chipBg, -55, -18, 110, 36, 12);
    this.chipBtnLabel = this.add.text(0, 0, 'CHIP', hudStyle('10px', UI.text.muted)).setOrigin(0.5);
    this.chipBtn.add([chipBg, this.chipBtnLabel]);
    bindControl(this.chipBtn, 110, 36, () => {
      if (this.activeInspectedTower && this.activeInspectedTower.canEquipChip()) {
        this.openModChipModal(this.activeInspectedTower);
      }
    });

    this.sellBtn = this.add.container(205, 16);
    const sellBg = this.add.graphics();
    sellBg.fillStyle(UI.color.danger, 1);
    sellBg.fillRoundedRect(-45, -18, 90, 36, 12);
    this.sellLabel = this.add.text(0, 0, 'VENDER', hudStyle('10px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5);
    this.sellBtn.add([sellBg, this.sellLabel]);
    bindControl(this.sellBtn, 90, 36, () => {
      this.gameScene.sellCurrentTower();
      this.hideInspector();
      this.hideRadialMenu();
    });

    const closeBtn = this.add.container(255, -28);
    const closeTxt = this.add.text(0, 0, '✕', hudStyle('16px', UI.text.muted)).setOrigin(0.5);
    closeBtn.add(closeTxt);
    bindControl(closeBtn, 36, 36, () => {
      this.hideInspector();
      this.hideRadialMenu();
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
    fillPanel(box, -280, -220, 560, 440, 18, { alpha: 0.98 });

    const title = this.add.text(0, -185, t('pauseTitle'), hudStyle('22px', UI.text.primary, { fontStyle: '800' })).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    const sfxLabel = this.add.text(-240, -140, t('sfxVolume'), hudStyle('12px', UI.text.muted)).setOrigin(0, 0.5);
    items.push(sfxLabel);

    const sfxSteps = [0.0, 0.25, 0.5, 0.75, 1.0];
    const sfxStepLabels = ['MUDO', '25%', '50%', '75%', '100%'];
    const currentSfx = settings.sfxEnabled ? (settings.sfxVolume ?? 1.0) : 0.0;

    sfxSteps.forEach((vol, idx) => {
      const stepX = -70 + idx * 72;
      const isSelected = Math.abs(currentSfx - vol) < 0.12;
      const btn = this.add.container(stepX, -140);
      const bg = this.add.graphics();
      paintGlassRect(bg, -32, -16, 64, 32, 10, isSelected);
      const txt = this.add.text(0, 0, sfxStepLabels[idx], hudStyle('11px', isSelected ? UI.text.amber : UI.text.muted)).setOrigin(0.5);
      btn.add([bg, txt]);
      bindControl(btn, 64, 32, () => {
        settings.sfxEnabled = vol > 0;
        save.setSfxVolume(vol);
        AudioManager.getInstance().updateVolumes();
        this.openPauseModal();
      });
      items.push(btn);
    });

    const musicLabel = this.add.text(-240, -85, t('musicVolume'), hudStyle('12px', UI.text.muted)).setOrigin(0, 0.5);
    items.push(musicLabel);

    const currentMusic = settings.musicEnabled ? (settings.musicVolume ?? 0.8) : 0.0;
    sfxSteps.forEach((vol, idx) => {
      const stepX = -70 + idx * 72;
      const isSelected = Math.abs(currentMusic - vol) < 0.12;
      const btn = this.add.container(stepX, -85);
      const bg = this.add.graphics();
      paintGlassRect(bg, -32, -16, 64, 32, 10, isSelected);
      const txt = this.add.text(0, 0, sfxStepLabels[idx], hudStyle('11px', isSelected ? UI.text.amber : UI.text.muted)).setOrigin(0.5);
      btn.add([bg, txt]);
      bindControl(btn, 64, 32, () => {
        settings.musicEnabled = vol > 0;
        save.setMusicVolume(vol);
        AudioManager.getInstance().updateVolumes();
        this.openPauseModal();
      });
      items.push(btn);
    });

    const isHC = save.isHighContrast();
    const hcBtn = this.add.container(-130, -25);
    const hcBg = this.add.graphics();
    paintGlassRect(hcBg, -110, -20, 220, 40, 12, isHC);
    const hcTxt = this.add.text(0, 0, `${t('highContrast')}: ${isHC ? t('highContrastOn') : t('highContrastOff')}`, hudStyle('12px', isHC ? UI.text.amber : UI.text.primary)).setOrigin(0.5);
    hcBtn.add([hcBg, hcTxt]);
    bindControl(hcBtn, 220, 40, () => {
      save.setHighContrast(!isHC);
      this.openPauseModal();
    });
    items.push(hcBtn);

    const isHap = settings.hapticsEnabled;
    const hapBtn = this.add.container(130, -25);
    const hapBg = this.add.graphics();
    paintGlassRect(hapBg, -110, -20, 220, 40, 12, isHap);
    const hapTxt = this.add.text(0, 0, `${t('haptics')}: ${isHap ? 'ON' : 'OFF'}`, hudStyle('12px', isHap ? UI.text.amber : UI.text.primary)).setOrigin(0.5);
    hapBtn.add([hapBg, hapTxt]);
    bindControl(hapBtn, 220, 40, () => {
      settings.hapticsEnabled = !isHap;
      save.save();
      this.openPauseModal();
    });
    items.push(hapBtn);

    items.push(addPrimaryButton(this, -160, 65, t('resume'), () => {
      modal.destroy();
      this.pauseModal = null;
      this.setGameSpeed(this.prePauseSpeed);
    }, 150, 44));

    items.push(addGhostButton(this, 0, 65, t('restart'), () => {
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
    }, 150, 44));

    items.push(addDangerButton(this, 160, 65, t('surrender'), () => {
      modal.destroy();
      this.pauseModal = null;
      this.scene.stop('GameScene');
      this.scene.start('LevelSelectScene');
    }, 150, 44));

    const closeBtn = this.add.container(250, -185);
    const closeTxt = this.add.text(0, 0, '✕', hudStyle('18px', UI.text.muted)).setOrigin(0.5);
    closeBtn.add(closeTxt);
    bindControl(closeBtn, 36, 36, () => {
      modal.destroy();
      this.pauseModal = null;
      this.setGameSpeed(this.prePauseSpeed);
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
    box.fillStyle(0x12141c, 0.98);
    box.fillRoundedRect(-280, -200, 560, 400, 16);
    box.lineStyle(1, 0x3f3f46, 1);
    box.strokeRoundedRect(-280, -200, 560, 400, 16);

    const title = this.add.text(0, -165, `⚡ ${t('chipsTitle')}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fafafa',
      strokeThickness: 0
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
      cBg.fillStyle(isEquipped ? 0x18181b : 0x09090b, 1);
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

      bindSized(card, () => {
          this.gameScene.equipChipOnCurrentTower(chipData.type);
          modal.destroy();
          this.modChipModal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
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

      bindSized(unequipBtn, () => {
          this.gameScene.equipChipOnCurrentTower(null);
          modal.destroy();
          this.modChipModal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
        });
      items.push(unequipBtn);
    }

    // Fechar
    const closeBtn = this.add.container(250, -170);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '22px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    bindSized(closeBtn, () => {
        modal.destroy();
        this.modChipModal = null;
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
    box.fillStyle(0x12141c, 0.98);
    box.fillRoundedRect(-300, -210, 600, 420, 16);
    box.lineStyle(1, 0x3f3f46, 1);
    box.strokeRoundedRect(-300, -210, 600, 420, 16);

    const title = this.add.text(0, -175, `👑 ${t('tier4Evolve')}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fafafa',
      strokeThickness: 0
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    const cardPositions = [-140, 140];
    branches.forEach((branch, idx) => {
      const bx = cardPositions[idx];
      const card = this.add.container(bx, 10);

      const cBg = this.add.graphics();
      cBg.fillStyle(0x12141c, 1);
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
      bBg.fillStyle(canAfford ? 0x065f46 : 0x18181b, 1);
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

      bindSized(card, () => {
          this.gameScene.evolveCurrentTowerTier4(branch.branchId);
          modal.destroy();
          this.tier4Modal = null;
          this.refreshInspector();
          this.refreshRadialMenu();
        });

      items.push(card);
    });

    // Fechar
    const closeBtn = this.add.container(270, -180);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '22px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    closeBtn.add(closeTxt);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);

    bindSized(closeBtn, () => {
        modal.destroy();
        this.tier4Modal = null;
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
      bgColor: customConfig?.bgColor || 0x12141c,
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
    fillPanel(bg, -220, -26, 440, 52, 14, { alpha: 0.96, stroke: config.borderColor || UI.color.amber });

    const iconTxt = this.add.text(-190, 0, config.icon || '', { fontSize: '20px' }).setOrigin(0.5);

    const titleTxt = this.add.text(-160, config.subtitle ? -10 : 0, config.title, hudStyle('13px', config.titleColor || UI.text.amber)).setOrigin(0, 0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, iconTxt, titleTxt];

    if (config.subtitle) {
      const subTxt = this.add.text(-160, 11, config.subtitle, hudStyle('10px', UI.text.muted)).setOrigin(0, 0.5);
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
        'G',
        hudStyle('13px', UI.text.amber)
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
      const label = btn.getAt(1) as Phaser.GameObjects.Text;
      const isCurrent = sp === speed;
      paintGlassRect(bg, -18, -18, 36, 36, 10, isCurrent);
      label.setColor(isCurrent ? UI.text.amber : UI.text.muted);
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
          this.goldText.setText(`${Math.round(this.displayedGold)}G`);
        },
        onComplete: () => {
          this.displayedGold = gold;
          this.goldText.setText(`${gold}G`);
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
      this.livesText.setText(`♥ ${lives}`);
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
      const prefix = this.gameScene.isBossRush ? 'BOSS' : 'ONDA';
      this.waveText.setText(`${prefix} ${data.waveNumber}/${data.totalWaves}`);
      this.nextWaveLabel.setText(t('callEarly', { bonus: 25 }));

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
      this.nextWaveLabel.setText(t('nextWave'));
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
    fillPanel(box, -230, -160, 460, 320, 18, { alpha: 0.98 });

    const title = this.add.text(0, -108, t('victoryTitle'), hudStyle('28px', UI.text.amber, { fontStyle: '800' })).setOrigin(0.5);

    const stars = this.gameScene.economyManager.calculateStars();
    const starsTxt = this.add.text(0, -42, '★'.repeat(stars) + '☆'.repeat(3 - stars), hudStyle('28px', UI.text.amber)).setOrigin(0.5);

    const desc = this.add.text(0, 25, t('victoryDesc'), hudStyle('13px', UI.text.muted)).setOrigin(0.5);
    desc.setAlign('center');
    desc.setWordWrapWidth(390);

    const menuBtn = addPrimaryButton(this, 0, 95, t('mainMenu'), () => {
      this.scene.stop('GameScene');
      this.scene.start('LevelSelectScene');
    }, 210, 44);

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
    fillPanel(box, -230, -150, 460, 300, 18, { alpha: 0.98, stroke: UI.color.danger });

    const title = this.add.text(0, -96, t('defeatTitle'), hudStyle('28px', UI.text.danger, { fontStyle: '800' })).setOrigin(0.5);

    const desc = this.add.text(0, -22, t('defeatDesc'), hudStyle('14px', UI.text.muted)).setOrigin(0.5);
    desc.setAlign('center');
    desc.setWordWrapWidth(390);

    const restartBtn = addPrimaryButton(this, -90, 68, t('restart'), () => {
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
    }, 140, 44);

    const menuBtn = addGhostButton(this, 90, 68, t('mainMenu'), () => {
      this.scene.stop('GameScene');
      this.scene.start('LevelSelectScene');
    }, 140, 44);

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
        g.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress), false);
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
          g.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress), false);
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
        badgeBg.fillStyle(0x12141c, 0.95);
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
