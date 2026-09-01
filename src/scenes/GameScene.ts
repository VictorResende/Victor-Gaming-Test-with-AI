import Phaser from 'phaser';
import { BiomeType, DamageType, EnemyType, GameMode, GameSpeed, HeroClass, ModChipType, SpellType, TacticalModifier, TowerBranchId, TowerType } from '../core/Constants';
import { LevelData, LEVELS_CONFIG, ObstacleData, Point } from '../config/levelsConfig';
import { TOWERS_CONFIG, HEROES_CONFIG } from '../config/gameConfig';
import { getBossRushLevelData } from '../config/bossRushConfig';
import { getDailyChallenge } from '../config/dailyChallengeConfig';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Hero } from '../entities/Hero';
import { ArcaneShrine, ArcaneShrineType } from '../entities/ArcaneShrine';
import { ObjectPool } from '../core/ObjectPool';
import { EconomyManager } from '../managers/EconomyManager';
import { WaveManager } from '../managers/WaveManager';
import { SpellsManager } from '../managers/SpellsManager';
import { SaveManager } from '../managers/SaveManager';
import { AchievementsManager } from '../managers/AchievementsManager';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { EventBus, GameEvents, BoundBus } from '../core/EventBus';
import { KeyboardControls } from '../utils/KeyboardControls';
import { t } from '../i18n/locales';
import { weatherAnnounceKey } from '../config/weatherCopy';

export class GameScene extends Phaser.Scene {
  public levelData!: LevelData;
  public gameMode: GameMode = GameMode.STANDARD;
  public isEndless = false;
  public isBossRush = false;
  public isDailyChallenge = false;
  public dailyDateStr?: string;
  public modifiers: TacticalModifier[] = [];

  public economyManager!: EconomyManager;
  public waveManager!: WaveManager;
  public spellsManager!: SpellsManager;
  public hero!: Hero;
  public heroClass: HeroClass = HeroClass.MECHA_DEFENDER;

  public activeInspectedTower: Tower | null = null;
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public shrines: ArcaneShrine[] = [];
  private projectilesPool!: ObjectPool<Projectile>;
  private activeProjectiles: Projectile[] = [];
  private bus = new BoundBus(EventBus);
  private sessionSpellCasts = 0;
  private sessionEarlyCalls = 0;
  public sessionKills = 0;
  private buildSlotSprites: Phaser.GameObjects.Sprite[] = [];
  private occupiedSlots: Set<string> = new Set();

  private obstacleContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private obstacleDataMap: Map<string, ObstacleData> = new Map();

  private gameSpeed: GameSpeed = GameSpeed.NORMAL;
  private selectedTowerTypeToBuild: TowerType | null = null;

  // Clima Dinâmico (Tempestade de Chuva, Trovões e Ventos Místicos)
  public isWeatherEnabled = true;
  public currentWeather: 'CLEAR' | 'RAIN' | 'STORM' = 'RAIN';
  private weatherContainer: Phaser.GameObjects.Container | null = null;
  private weatherDarknessOverlay: Phaser.GameObjects.Graphics | null = null;
  private rainDropSprites: Phaser.GameObjects.Sprite[] = [];
  private thunderTimerMs = 12000;
  private windTimerMs = 4000;

  // Evento da Passagem do Dragão Alado
  private dragonAirstrikeTriggeredThisWave = false;
  private activeFireTrails: {
    container: Phaser.GameObjects.Container;
    x: number;
    y: number;
    radius: number;
    remainingMs: number;
    dps: number;
  }[] = [];

  // Ghost Tower Drag-and-Drop
  public static readonly DRAG_THUMB_OFFSET_Y = 45;
  private isDraggingTower = false;
  private draggingTowerType: TowerType | null = null;
  private ghostTowerContainer: Phaser.GameObjects.Container | null = null;
  private ghostRangeGraphics: Phaser.GameObjects.Graphics | null = null;
  private ghostBaseSprite: Phaser.GameObjects.Sprite | null = null;
  private ghostTurretSprite: Phaser.GameObjects.Sprite | null = null;
  private slotHighlightGraphics: Phaser.GameObjects.Graphics | null = null;
  private dragTetherGraphics: Phaser.GameObjects.Graphics | null = null;
  private currentSnappedSlot: Point | null = null;
  private isSnappedSlotValid = false;

  constructor() {
    super('GameScene');
  }

  public init(data: {
    levelId?: number;
    isEndless?: boolean;
    isBossRush?: boolean;
    isDailyChallenge?: boolean;
    dailyDate?: string;
    modifiers?: TacticalModifier[];
    heroClass?: HeroClass;
  }): void {
    this.isEndless = !!data.isEndless;
    this.isBossRush = !!data.isBossRush;
    this.isDailyChallenge = !!data.isDailyChallenge;
    this.dailyDateStr = data.dailyDate;
    this.modifiers = data.modifiers || [];
    this.heroClass = data.heroClass || HeroClass.MECHA_DEFENDER;

    if (this.isBossRush) {
      this.gameMode = GameMode.BOSS_RUSH;
      this.levelData = getBossRushLevelData();
    } else if (this.isDailyChallenge && this.dailyDateStr) {
      this.gameMode = GameMode.DAILY_CHALLENGE;
      const daily = getDailyChallenge(this.dailyDateStr);
      this.levelData = daily.levelData;
      this.modifiers = daily.modifiers;
      this.dailyDateStr = daily.dateStr;
    } else if (this.isEndless) {
      this.gameMode = GameMode.ENDLESS;
      const lvlId = data.levelId || 1;
      this.levelData = LEVELS_CONFIG.find(l => l.id === lvlId) || LEVELS_CONFIG[0];
    } else {
      this.gameMode = GameMode.STANDARD;
      const lvlId = data.levelId || 1;
      this.levelData = LEVELS_CONFIG.find(l => l.id === lvlId) || LEVELS_CONFIG[0];
    }

    this.gameSpeed = GameSpeed.NORMAL;
    this.towers = [];
    this.enemies = [];
    this.shrines = [];
    this.activeFireTrails = [];
    this.activeProjectiles = [];
    this.sessionSpellCasts = 0;
    this.sessionEarlyCalls = 0;
    this.sessionKills = 0;
    this.occupiedSlots.clear();
    this.obstacleContainers.clear();
    this.obstacleDataMap.clear();
    this.selectedTowerTypeToBuild = null;
    this.activeInspectedTower = null;
    this.isDraggingTower = false;
    this.draggingTowerType = null;
    this.dragonAirstrikeTriggeredThisWave = false;
    this.thunderTimerMs = 12000;
    this.windTimerMs = 4000;
  }

  public create(): void {
    // 1. Inicializa Gerenciadores com bônus de Relíquias Ancestrais
    const save = SaveManager.getInstance();
    let initialGold = this.levelData.initialGold;
    let initialLives = this.levelData.initialLives;

    if (save.isRelicEquipped('kings_crown')) {
      initialGold += 100;
    }
    if (save.isRelicEquipped('holy_grail')) {
      initialLives += 5;
    }

    this.economyManager = new EconomyManager(initialGold, initialLives);
    this.waveManager = new WaveManager(
      this.levelData.waves,
      this.levelData.paths,
      this.economyManager,
      this.isEndless,
      this.isBossRush,
      this.modifiers
    );
    this.spellsManager = new SpellsManager();

    // 2. Cria Pool de Projéteis zero-GC
    this.projectilesPool = new ObjectPool<Projectile>(() => new Projectile(this), p => {
      p.isActive = false;
      p.setVisible(false);
    }, 60);
    this.activeProjectiles = [];

    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);

    // 3. Renderiza Terreno, Estradas Sinuosas Orgânicas e Props Estilo Kingdom Rush
    this.renderTerrain();
    this.renderPaths();
    this.renderDecorations();
    this.renderBuildSlots();
    this.renderObstacles();
    this.createArcaneShrines();
    this.setupDynamicWeather();
    this.createAtmosphericEmbers();

    // 4. Cria e Posiciona o Herói
    this.spawnHero();

    // 5. Configura Interações de Toque no Mapa para Comandar o Herói
    this.setupMapInput();

    // 6. Inicia UIScene sobreposta
    this.scene.launch('UIScene', {
      gameScene: this,
      levelData: this.levelData,
      isEndless: this.isEndless
    });

    // 7. Configura Eventos do EventBus
    this.setupEventListeners();

    // Emite estado inicial para o HUD
    this.time.delayedCall(100, () => {
      this.economyManager.emitInitialState();
    });
  }

  private spawnHero(): void {
    // Posiciona o herói estrategicamente perto do primeiro caminho ou centro
    const firstPath = this.levelData.paths[0];
    let spawnX = this.scale.width / 2;
    let spawnY = this.scale.height / 2;

    if (firstPath && firstPath.length > 1) {
      spawnX = firstPath[1].x + 40;
      spawnY = firstPath[1].y;
    }

    this.hero = new Hero(this, spawnX, spawnY, this.heroClass);
  }

  private setupMapInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Clique com botão direito cancela construção e desseleciona torre
      if (pointer.rightButtonDown()) {
        this.selectTowerToBuild(null);
        this.selectTowerForInspection(null);
        return;
      }

      if (this.isDraggingTower) return;

      const tappedEnemy = this.enemies.find(e =>
        e.isAlive && Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, e.x, e.y) <= Math.max(36, e.config.size)
      );
      if (tappedEnemy) {
        EventBus.emit(GameEvents.ENEMY_INSPECTED, tappedEnemy);
        return;
      }

      // Se há uma torre selecionada para construir, detecta clique próximo a qualquer slot
      if (this.selectedTowerTypeToBuild) {
        let closestSlot: { x: number; y: number } | null = null;
        let minDist = 55;
        this.levelData.buildSlots.forEach(slot => {
          const d = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, slot.x, slot.y);
          if (d < minDist) {
            minDist = d;
            closestSlot = slot;
          }
        });

        if (closestSlot) {
          const target: { x: number; y: number } = closestSlot;
          this.handleSlotTouch(target.x, target.y);
          return;
        }
      }

      // Se o herói estiver selecionado, move o herói para o local clicado
      if (this.hero && this.hero.isSelected && this.hero.isAlive) {
        this.hero.walkTo(pointer.worldX, pointer.worldY);
        return;
      }

      // Se havia uma torre inspecionada e clicou no chão livre, desmarca
      if (this.activeInspectedTower) {
        const d = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.activeInspectedTower.x, this.activeInspectedTower.y);
        if (d > 50) {
          this.selectTowerForInspection(null);
        }
      }
    });
  }

  private renderTerrain(): void {
    const { width, height } = this.scale;
    let groundTexture = 'kr_ground';

    if (this.levelData.biome === BiomeType.MAGMA) {
      groundTexture = 'magma_ground';
    } else if (this.levelData.biome === BiomeType.RUINS) {
      groundTexture = 'ruins_ground';
    } else if (this.levelData.biome === BiomeType.PINNACLE) {
      groundTexture = 'orbital_ground';
    }

    for (let x = 0; x < width; x += 128) {
      for (let y = 0; y < height; y += 128) {
        this.add.image(x + 64, y + 64, groundTexture);
      }
    }
  }

  private renderPaths(): void {
    const gOuter = this.add.graphics();
    const gPath = this.add.graphics();
    const gInner = this.add.graphics();

    let outerColor = 0x271a10;
    let pathColor = 0xd4b996;
    let innerColor = 0xcab18e;

    if (this.levelData.biome === BiomeType.MAGMA) {
      outerColor = 0x18110b;
      pathColor = 0x7c2d12;
      innerColor = 0x9a3412;
    } else if (this.levelData.biome === BiomeType.RUINS) {
      outerColor = 0x090d16;
      pathColor = 0x1e293b;
      innerColor = 0x334155;
    } else if (this.levelData.biome === BiomeType.PINNACLE) {
      outerColor = 0x1c1008;
      pathColor = 0x7c2d12;
      innerColor = 0xb45309;
    }

    this.levelData.paths.forEach(path => {
      if (path.length < 2) return;

      // 1. Borda externa escura com relevo
      gOuter.lineStyle(64, outerColor, 1);
      gOuter.lineStyle(68, 0x000000, 0.5);
      gOuter.beginPath();
      gOuter.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        gOuter.lineTo(path[i].x, path[i].y);
      }
      gOuter.strokePath();

      // 2. Preenchimento da Trilha
      gPath.lineStyle(52, pathColor, 1);
      gPath.beginPath();
      gPath.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        gPath.lineTo(path[i].x, path[i].y);
      }
      gPath.strokePath();

      // 3. Textura interna da estrada
      gInner.lineStyle(38, innerColor, 0.6);
      gInner.beginPath();
      gInner.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        gInner.lineTo(path[i].x, path[i].y);
      }
      gInner.strokePath();

      // Marcador de Caveira no ponto de Entrada do Caminho
      const startPt = path[0];
      const skullMarker = this.add.image(Math.max(24, startPt.x + 30), startPt.y, 'deco_skull_marker');
      this.tweens.add({
        targets: skullMarker,
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
        duration: 1200,
        repeat: -1
      });
    });
  }

  private renderDecorations(): void {
    const { width, height } = this.scale;

    if (this.levelData.biome === BiomeType.MAGMA) {
      // Vulcão de Magma: Crateras ferventes e fendas de lava
      const craterCoords = [{ x: 90, y: height - 90 }, { x: width - 90, y: 100 }, { x: 580, y: 340 }];
      craterCoords.forEach(c => {
        const crater = this.add.image(c.x, c.y, 'deco_magma_crater');
        this.tweens.add({
          targets: crater,
          scaleX: 1.06,
          scaleY: 1.06,
          yoyo: true,
          duration: 1500,
          repeat: -1
        });
      });

      const fissureCoords = [{ x: 220, y: 440 }, { x: 880, y: 480 }, { x: 420, y: 110 }];
      fissureCoords.forEach(c => {
        this.add.image(c.x, c.y, 'deco_lava_fissure');
      });
    } else if (this.levelData.biome === BiomeType.RUINS) {
      // Ruínas arcanas: obeliscos e portais
      const pillarCoords = [{ x: 80, y: 120 }, { x: 80, y: height - 120 }, { x: width - 80, y: 140 }, { x: width - 80, y: height - 120 }];
      pillarCoords.forEach(c => {
        const pillar = this.add.image(c.x, c.y, 'deco_torch');
        this.tweens.add({
          targets: pillar,
          y: pillar.y - 8,
          yoyo: true,
          duration: 2000,
          repeat: -1
        });
      });

      // Renderiza Portais de Teletransporte se existirem na fase
      if (this.levelData.teleporters) {
        this.levelData.teleporters.forEach(tp => {
          const portalIn = this.add.image(tp.from.x, tp.from.y, 'deco_teleporter_in');
          this.tweens.add({
            targets: portalIn,
            rotation: Math.PI * 2,
            duration: 4000,
            repeat: -1
          });

          const portalOut = this.add.image(tp.to.x, tp.to.y, 'deco_teleporter_out');
          this.tweens.add({
            targets: portalOut,
            rotation: -Math.PI * 2,
            duration: 4000,
            repeat: -1
          });
        });
      }
    } else if (this.levelData.biome === BiomeType.PINNACLE) {
      const torchCoords = [{ x: 90, y: 90 }, { x: 90, y: height - 90 }, { x: width - 90, y: height - 90 }];
      torchCoords.forEach(c => {
        this.add.image(c.x, c.y, 'deco_torch');
      });

      const skullCoords = [{ x: width - 100, y: 110 }, { x: 640, y: 80 }];
      skullCoords.forEach(c => {
        const skull = this.add.image(c.x, c.y, 'deco_skull_marker');
        this.tweens.add({
          targets: skull,
          y: skull.y - 12,
          x: skull.x + 8,
          rotation: 0.15,
          yoyo: true,
          duration: 3500,
          repeat: -1
        });
      });
    } else {
      // Canyon / Tundra: Boilers e Tochas
      const boiler1 = this.add.image(70, height - 70, 'deco_boiler');
      for (let i = 0; i < 6; i++) {
        const steam = this.add.circle(60 + Phaser.Math.Between(-5, 5), height - 120, 6, 0xf1f5f9, 0.4);
        this.tweens.add({
          targets: steam,
          y: steam.y - 40,
          x: steam.x + Phaser.Math.Between(10, 30),
          scaleX: 2.2,
          scaleY: 2.2,
          alpha: 0,
          duration: 2000 + i * 300,
          repeat: -1,
          delay: i * 400
        });
      }

      const boiler2 = this.add.image(width - 70, height - 70, 'deco_boiler').setFlipX(true);

      const barrelCoords = [
        { x: 180, y: 55 }, { x: 205, y: 62 }, { x: 195, y: 75 },
        { x: 580, y: 340 }, { x: 605, y: 345 },
        { x: 1160, y: 110 }, { x: 1185, y: 120 }
      ];
      barrelCoords.forEach(c => this.add.image(c.x, c.y, 'deco_barrel'));

      const torchCoords = [
        { x: 120, y: 190 }, { x: 420, y: 130 }, { x: 820, y: 170 }, { x: 1040, y: 280 }
      ];
      torchCoords.forEach(c => {
        const torch = this.add.image(c.x, c.y, 'deco_torch');
        const flame = this.add.circle(c.x, c.y - 12, 4, 0xfef08a, 0.8);
        this.tweens.add({
          targets: flame,
          scaleX: 1.3,
          scaleY: 1.5,
          alpha: 0.4,
          yoyo: true,
          duration: 200 + Phaser.Math.Between(0, 100),
          repeat: -1
        });
      });
    }
  }

  private renderBuildSlots(): void {
    this.buildSlotSprites = [];
    this.levelData.buildSlots.forEach(slot => {
      const sprite = this.add.sprite(slot.x, slot.y, 'kr_build_slot');
      sprite.setSize(72, 72);
      sprite.setInteractive(new Phaser.Geom.Rectangle(-36, -36, 72, 72), Phaser.Geom.Rectangle.Contains);

      // Animação de idle suave nos pedestais
      this.tweens.add({
        targets: sprite,
        scaleX: 1.03,
        scaleY: 1.03,
        yoyo: true,
        duration: 1500 + Phaser.Math.Between(0, 500),
        repeat: -1
      });

      sprite.on('pointerdown', () => {
        this.handleSlotTouch(slot.x, slot.y);
      });

      this.buildSlotSprites.push(sprite);
    });
  }

  private renderObstacles(): void {
    this.obstacleContainers.forEach(c => c.destroy());
    this.obstacleContainers.clear();
    this.obstacleDataMap.clear();

    const obstacles = this.levelData.obstacles || [];
    obstacles.forEach(obs => {
      this.obstacleDataMap.set(obs.id, { ...obs });

      const container = this.add.container(obs.x, obs.y);
      const texture = obs.type === 'magma_rock' ? 'obstacle_magma' : (obs.type === 'debris' ? 'obstacle_debris' : 'obstacle_rock');
      const sprite = this.add.sprite(0, 0, texture);

      // Badge de Custo em Ouro
      const costBg = this.add.graphics();
      costBg.fillStyle(0x12141c, 0.94);
      costBg.fillRoundedRect(-28, 16, 56, 18, 8);
      costBg.lineStyle(1, 0x3f3f46, 0.9);
      costBg.strokeRoundedRect(-28, 16, 56, 18, 8);

      const costTxt = this.add.text(0, 25, `${obs.clearCost}G`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: '700',
        color: '#fbbf24'
      }).setOrigin(0.5);

      container.add([sprite, costBg, costTxt]);
      container.setSize(56, 56);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 56, 56), Phaser.Geom.Rectangle.Contains);

      this.tweens.add({
        targets: sprite,
        scaleX: 1.04,
        scaleY: 1.04,
        yoyo: true,
        duration: 1600 + Phaser.Math.Between(0, 400),
        repeat: -1
      });

      container.on('pointerdown', () => {
        this.tryClearObstacle(obs.id);
      });

      this.obstacleContainers.set(obs.id, container);
    });
  }

  public tryClearObstacle(obstacleId: string): boolean {
    const obs = this.obstacleDataMap.get(obstacleId);
    const container = this.obstacleContainers.get(obstacleId);
    if (!obs || !container) return false;

    if (this.economyManager.spendGold(obs.clearCost)) {
      this.destroyObstacleVFX(obs.x, obs.y);
      container.destroy();
      this.obstacleContainers.delete(obstacleId);
      this.obstacleDataMap.delete(obstacleId);

      // Desbloqueia slot de construção
      this.unlockBuildSlot(obs.x, obs.y);

      // Texto de confirmação
      this.showFloatingText(obs.x, obs.y - 20, t('goldSpent', { cost: obs.clearCost }), '#facc15');
      this.showFloatingText(obs.x, obs.y - 40, t('slotUnlocked'), '#22c55e');

      AudioManager.getInstance().playBuild();
      HapticsManager.getInstance().build();
      return true;
    } else {
      // Falta de ouro
      this.tweens.add({
        targets: container,
        x: obs.x + 6,
        yoyo: true,
        duration: 50,
        repeat: 3,
        onComplete: () => container.setX(obs.x)
      });
      this.showFloatingText(obs.x, obs.y - 25, t('needGold', { cost: obs.clearCost }), '#ef4444');
      HapticsManager.getInstance().tap();
      return false;
    }
  }

  public damageObstacle(obstacleId: string, damage: number): void {
    const obs = this.obstacleDataMap.get(obstacleId);
    const container = this.obstacleContainers.get(obstacleId);
    if (!obs || !container) return;

    obs.hp -= damage;
    this.showFloatingText(obs.x, obs.y - 25, `💥 -${damage}`, '#f97316');

    if (obs.hp <= 0) {
      this.destroyObstacleVFX(obs.x, obs.y);
      container.destroy();
      this.obstacleContainers.delete(obstacleId);
      this.obstacleDataMap.delete(obstacleId);

      this.unlockBuildSlot(obs.x, obs.y);
      this.showFloatingText(obs.x, obs.y - 35, t('slotSpellCleared'), '#38bdf8');
      AudioManager.getInstance().playCannon();
      HapticsManager.getInstance().cannonShot();
    }
  }

  private unlockBuildSlot(x: number, y: number): void {
    const existing = this.levelData.buildSlots.find(s => s.x === x && s.y === y);
    if (!existing) {
      this.levelData.buildSlots.push({ x, y });
    }

    const sprite = this.add.sprite(x, y, 'kr_build_slot');
    sprite.setInteractive();
    this.tweens.add({
      targets: sprite,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      duration: 1500 + Phaser.Math.Between(0, 500),
      repeat: -1
    });
    sprite.on('pointerdown', () => {
      this.handleSlotTouch(x, y);
    });
    this.buildSlotSprites.push(sprite);

    // Efeito de surgimento brilhante do pedestal
    const halo = this.add.circle(x, y, 10, 0xfde047, 0.9);
    this.tweens.add({
      targets: halo,
      radius: 40,
      alpha: 0,
      duration: 400,
      onComplete: () => halo.destroy()
    });
  }

  private destroyObstacleVFX(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 6),
        0x78716c,
        0.9
      );
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-40, 40),
        y: p.y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
  }

  public showFloatingText(x: number, y: number, text: string, color: string): void {
    const isCritical = text.includes('CRÍT') || text.includes('💥');
    const isGold = text.includes('G') || text.includes('💰');

    const txt = this.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: isCritical ? '15px' : isGold ? '14px' : '13px',
      fontStyle: isCritical ? '800' : '700',
      color,
      stroke: '#000000',
      strokeThickness: isCritical ? 4 : 3
    }).setOrigin(0.5);

    if (isCritical || isGold) {
      txt.setScale(0.6);
      this.tweens.add({
        targets: txt,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 120,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: txt,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100
          });
        }
      });
    }

    this.tweens.add({
      targets: txt,
      y: y - 28,
      x: x + Phaser.Math.Between(-8, 8),
      alpha: 0,
      duration: isCritical ? 950 : 800,
      onComplete: () => txt.destroy()
    });
  }

  private createAtmosphericEmbers(): void {
    const { width, height } = this.scale;
    let emberColor = 0xf59e0b;
    let emberCount = 20;

    if (this.levelData.biome === BiomeType.MAGMA) {
      emberColor = 0xef4444;
      emberCount = 30;
    } else if (this.levelData.biome === BiomeType.RUINS) {
      emberColor = 0xa855f7;
      emberCount = 18;
    } else if (this.levelData.biome === BiomeType.PINNACLE) {
      emberColor = 0x38bdf8;
      emberCount = 25;
    } else if (this.levelData.biome === BiomeType.RAVINE) {
      emberColor = 0xe0f2fe;
      emberCount = 25;
    }

    for (let i = 0; i < emberCount; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 3),
        emberColor,
        Phaser.Math.FloatBetween(0.3, 0.8)
      );

      const yDelta = this.levelData.biome === BiomeType.RAVINE ? Phaser.Math.Between(80, 160) : -Phaser.Math.Between(60, 140);

      this.tweens.add({
        targets: ember,
        y: ember.y + yDelta,
        x: ember.x + Phaser.Math.Between(-30, 30),
        alpha: 0.1,
        duration: Phaser.Math.Between(3000, 5500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }

  public handleSlotTouch(x: number, y: number): void {
    const key = `${x}_${y}`;

    if (this.occupiedSlots.has(key)) {
      // Slot já possui torre -> Seleciona para inspeção
      const existingTower = this.towers.find(t => t.x === x && t.y === y);
      if (existingTower) {
        this.selectTowerForInspection(existingTower);
      }
      return;
    }

    if (this.selectedTowerTypeToBuild) {
      const config = TOWERS_CONFIG[this.selectedTowerTypeToBuild];
      const save = SaveManager.getInstance();
      let cost = save.hasTech('cost_discount') ? Math.round(config.cost * 0.9) : config.cost;
      if (this.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }

      if (this.economyManager.spendGold(cost)) {
        const tower = new Tower(this, x, y, this.selectedTowerTypeToBuild);
        this.towers.push(tower);
        this.occupiedSlots.add(key);

        AudioManager.getInstance().playBuild();
        HapticsManager.getInstance().build();
        EventBus.emit(GameEvents.TOWER_PLACED, tower);

        // Limpa seleção após construir
        this.selectedTowerTypeToBuild = null;
        this.selectTowerForInspection(tower);

        if (this.towers.length >= 8) {
          AchievementsManager.getInstance().checkAndUnlock('full_towers');
        }
      }
    }
  }

  public selectTowerToBuild(type: TowerType | null): void {
    this.selectedTowerTypeToBuild = type;
    if (this.activeInspectedTower) {
      this.activeInspectedTower.setSelected(false);
      this.activeInspectedTower = null;
    }
  }

  public selectTowerForInspection(tower: Tower | null): void {
    if (this.activeInspectedTower) {
      this.activeInspectedTower.setSelected(false);
    }
    this.activeInspectedTower = tower;
    if (tower) {
      tower.setSelected(true);
      EventBus.emit(GameEvents.TOWER_SELECTED, tower);
    }
  }

  public upgradeCurrentTower(): void {
    if (this.activeInspectedTower && this.activeInspectedTower.canUpgrade()) {
      let cost = this.activeInspectedTower.getUpgradeCost();
      if (this.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }
      if (this.economyManager.spendGold(cost)) {
        this.activeInspectedTower.upgrade();
        AudioManager.getInstance().playUpgrade();
        HapticsManager.getInstance().victory();
        EventBus.emit(GameEvents.TOWER_UPGRADED, this.activeInspectedTower);

        if (this.activeInspectedTower.level === 3) {
          AchievementsManager.getInstance().checkAndUnlock('max_tower');
        }
      }
    }
  }

  public evolveCurrentTowerTier4(branchId: TowerBranchId): void {
    if (this.activeInspectedTower && this.activeInspectedTower.canEvolveTier4()) {
      const branches = this.activeInspectedTower.config.tier4Branches;
      const branch = branches?.find(b => b.branchId === branchId);
      if (!branch) return;

      let cost = this.activeInspectedTower.getTier4Cost(branch);
      if (this.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }

      if (this.economyManager.spendGold(cost)) {
        this.activeInspectedTower.evolveTier4(branchId);
        AudioManager.getInstance().playUpgrade();
        HapticsManager.getInstance().victory();
        EventBus.emit(GameEvents.TOWER_UPGRADED, this.activeInspectedTower);
      }
    }
  }

  public equipChipOnCurrentTower(chipType: ModChipType | null): void {
    if (this.activeInspectedTower && this.activeInspectedTower.canEquipChip()) {
      this.activeInspectedTower.equipChip(chipType);
      AudioManager.getInstance().playClick();
      HapticsManager.getInstance().tap();
    }
  }

  public sellCurrentTower(): void {
    if (this.activeInspectedTower) {
      const refund = this.activeInspectedTower.getSellValue();
      const slotKey = `${this.activeInspectedTower.x}_${this.activeInspectedTower.y}`;

      this.economyManager.addGold(refund);
      AudioManager.getInstance().playCoin();

      this.occupiedSlots.delete(slotKey);
      const index = this.towers.indexOf(this.activeInspectedTower);
      if (index > -1) this.towers.splice(index, 1);

      const soldTower = this.activeInspectedTower;
      this.activeInspectedTower = null;
      soldTower.destroy();

      EventBus.emit(GameEvents.TOWER_SOLD, { refund });
    }
  }

  // ==========================================
  // GHOST TOWER DRAG-AND-DROP SYSTEM
  // ==========================================
  public startTowerDrag(type: TowerType, worldX: number, worldY: number): void {
    this.cancelTowerDrag();
    this.isDraggingTower = true;
    this.draggingTowerType = type;

    const effectiveY = worldY - GameScene.DRAG_THUMB_OFFSET_Y;

    // Cria Container do Ghost elevado acima do polegar
    this.ghostTowerContainer = this.add.container(worldX, effectiveY);

    // Círculo de Alcance
    this.ghostRangeGraphics = this.add.graphics();
    this.ghostTowerContainer.add(this.ghostRangeGraphics);

    // Sprites do Ghost (Translúcidos)
    this.ghostBaseSprite = this.add.sprite(0, 0, 'tower_base').setAlpha(0.65);
    this.ghostTurretSprite = this.add.sprite(0, 0, `turret_${type.toLowerCase()}`).setAlpha(0.85);
    this.ghostTowerContainer.add([this.ghostBaseSprite, this.ghostTurretSprite]);

    // Linha Guia / Tether Tátil entre o ponto de toque do polegar e o ghost elevado
    this.dragTetherGraphics = this.add.graphics();

    // Destaque suave em todos os slots de construção disponíveis no mapa
    this.slotHighlightGraphics = this.add.graphics();
    this.drawAvailableSlotsHighlight();

    // Atualiza posição inicial
    this.updateTowerDrag(worldX, worldY);
  }

  public updateTowerDrag(worldX: number, worldY: number): void {
    if (!this.isDraggingTower || !this.ghostTowerContainer || !this.draggingTowerType) return;

    const effectiveY = worldY - GameScene.DRAG_THUMB_OFFSET_Y;
    const config = TOWERS_CONFIG[this.draggingTowerType];
    const range = config.levels[0].range;
    const save = SaveManager.getInstance();
    const cost = save.hasTech('cost_discount') ? Math.round(config.cost * 0.9) : config.cost;
    const hasEnoughGold = this.economyManager.getGold() >= cost;

    // Procura o slot de construção mais próximo dentro de um raio de snap (65px) a partir do Ghost (effectiveY)
    let nearestSlot: Point | null = null;
    let minDistance = 65;

    for (const slot of this.levelData.buildSlots) {
      const dist = Phaser.Math.Distance.Between(worldX, effectiveY, slot.x, slot.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSlot = slot;
      }
    }

    let ghostTargetX = worldX;
    let ghostTargetY = effectiveY;

    if (nearestSlot) {
      // Snap no centro do slot
      const snapped: Point = nearestSlot;
      this.currentSnappedSlot = snapped;
      const slotKey = `${snapped.x}_${snapped.y}`;
      const isOccupied = this.occupiedSlots.has(slotKey);
      this.isSnappedSlotValid = !isOccupied && hasEnoughGold;

      ghostTargetX = snapped.x;
      ghostTargetY = snapped.y;
      this.ghostTowerContainer.setPosition(ghostTargetX, ghostTargetY);

      // Desenha preview de alcance colorido (Verde = Válido, Vermelho = Ocupado/Sem Ouro)
      if (this.ghostRangeGraphics) {
        this.ghostRangeGraphics.clear();
        if (this.isSnappedSlotValid) {
          // Verde Vibrante
          this.ghostRangeGraphics.fillStyle(0x22c55e, 0.18);
          this.ghostRangeGraphics.fillCircle(0, 0, range);
          this.ghostRangeGraphics.lineStyle(2.5, 0x86efac, 0.95);
          this.ghostRangeGraphics.strokeCircle(0, 0, range);
        } else {
          // Vermelho de Alerta
          this.ghostRangeGraphics.fillStyle(0xef4444, 0.22);
          this.ghostRangeGraphics.fillCircle(0, 0, range);
          this.ghostRangeGraphics.lineStyle(2.5, 0xfca5a5, 0.95);
          this.ghostRangeGraphics.strokeCircle(0, 0, range);
        }
      }
    } else {
      // Arrastando livre pelo campo (fora de slots)
      this.currentSnappedSlot = null;
      this.isSnappedSlotValid = false;
      this.ghostTowerContainer.setPosition(ghostTargetX, ghostTargetY);

      if (this.ghostRangeGraphics) {
        this.ghostRangeGraphics.clear();
        this.ghostRangeGraphics.fillStyle(0x38bdf8, 0.12);
        this.ghostRangeGraphics.fillCircle(0, 0, range);
        this.ghostRangeGraphics.lineStyle(1.5, 0x38bdf8, 0.6);
        this.ghostRangeGraphics.strokeCircle(0, 0, range);
      }
    }

    // Desenha tether visual entre o toque do polegar (worldX, worldY) e a torre suspensa (ghostTargetX, ghostTargetY)
    if (this.dragTetherGraphics) {
      this.dragTetherGraphics.clear();
      // Anel indicador sob o polegar
      this.dragTetherGraphics.fillStyle(0xfacc15, 0.25);
      this.dragTetherGraphics.fillCircle(worldX, worldY, 14);
      this.dragTetherGraphics.lineStyle(2, 0xfacc15, 0.7);
      this.dragTetherGraphics.strokeCircle(worldX, worldY, 14);

      // Linha conectando o toque ao ghost elevado
      this.dragTetherGraphics.lineStyle(1.5, 0x38bdf8, 0.4);
      this.dragTetherGraphics.lineBetween(worldX, worldY, ghostTargetX, ghostTargetY);
    }
  }

  public finishTowerDrag(worldX: number, worldY: number): boolean {
    if (!this.isDraggingTower) return false;

    // Atualiza uma última vez com o offset vertical para máxima precisão
    this.updateTowerDrag(worldX, worldY);

    let placed = false;
    const targetSlot = this.currentSnappedSlot;
    const dragType = this.draggingTowerType;

    if (this.isSnappedSlotValid && targetSlot && dragType) {
      const config = TOWERS_CONFIG[dragType];
      const save = SaveManager.getInstance();
      let cost = save.hasTech('cost_discount') ? Math.round(config.cost * 0.9) : config.cost;
      if (this.modifiers && this.modifiers.includes(TacticalModifier.DOUBLE_COST)) {
        cost *= 2;
      }

      if (this.economyManager.spendGold(cost)) {
        const slotKey = `${targetSlot.x}_${targetSlot.y}`;
        const tower = new Tower(this, targetSlot.x, targetSlot.y, dragType);
        this.towers.push(tower);
        this.occupiedSlots.add(slotKey);

        AudioManager.getInstance().playBuild();
        HapticsManager.getInstance().build();
        EventBus.emit(GameEvents.TOWER_PLACED, tower);

        // Efeito de impacto de construção
        const puff = this.add.circle(targetSlot.x, targetSlot.y, 25, 0xfacc15, 0.8);
        this.tweens.add({
          targets: puff,
          scaleX: 2.2,
          scaleY: 2.2,
          alpha: 0,
          duration: 300,
          onComplete: () => puff.destroy()
        });

        this.selectTowerForInspection(tower);
        placed = true;

        if (this.towers.length >= 8) {
          AchievementsManager.getInstance().checkAndUnlock('full_towers');
        }
      }
    }

    this.cancelTowerDrag();
    return placed;
  }

  public cancelTowerDrag(): void {
    this.isDraggingTower = false;
    this.draggingTowerType = null;
    this.currentSnappedSlot = null;
    this.isSnappedSlotValid = false;

    if (this.ghostTowerContainer) {
      this.ghostTowerContainer.destroy();
      this.ghostTowerContainer = null;
    }
    if (this.dragTetherGraphics) {
      this.dragTetherGraphics.destroy();
      this.dragTetherGraphics = null;
    }
    if (this.slotHighlightGraphics) {
      this.slotHighlightGraphics.destroy();
      this.slotHighlightGraphics = null;
    }
  }

  private drawAvailableSlotsHighlight(): void {
    if (!this.slotHighlightGraphics) return;
    this.slotHighlightGraphics.clear();

    this.levelData.buildSlots.forEach(slot => {
      const slotKey = `${slot.x}_${slot.y}`;
      const isOccupied = this.occupiedSlots.has(slotKey);

      if (!isOccupied) {
        // Círculo suave verde pulsante
        this.slotHighlightGraphics!.lineStyle(2, 0x22c55e, 0.7);
        this.slotHighlightGraphics!.strokeCircle(slot.x, slot.y, 30);
        this.slotHighlightGraphics!.fillStyle(0x22c55e, 0.12);
        this.slotHighlightGraphics!.fillCircle(slot.x, slot.y, 30);
      } else {
        // Círculo cinza escuro nos ocupados
        this.slotHighlightGraphics!.lineStyle(1.5, 0x64748b, 0.4);
        this.slotHighlightGraphics!.strokeCircle(slot.x, slot.y, 28);
      }
    });
  }

  public acquireProjectile(): Projectile {
    const projectile = this.projectilesPool.get();
    if (!this.activeProjectiles.includes(projectile)) {
      this.activeProjectiles.push(projectile);
    }
    return projectile;
  }

  private getProjectileSource(): { get: () => Projectile } {
    return { get: () => this.acquireProjectile() };
  }

  private setupEventListeners(): void {
    this.bus.offAll();

    this.bus.on(GameEvents.GAME_SPEED_CHANGED, (speed: GameSpeed) => {
      this.gameSpeed = speed;
    });

    this.bus.on(GameEvents.ENEMY_SPAWNED, (newEnemy: Enemy) => {
      if (newEnemy && !this.enemies.includes(newEnemy)) {
        this.enemies.push(newEnemy);
      }
    });

    this.bus.on(GameEvents.ENEMY_KILLED, (data: { enemy: Enemy; gold: number; score: number }) => {
      this.sessionKills += 1;
      this.economyManager.addGold(data.gold);
      this.economyManager.addScore(data.score);
      AudioManager.getInstance().playCoin();

      if (this.hero && this.hero.isAlive) {
        let xp = 15;
        if (data.enemy.config.isBoss) xp = 300;
        else if (data.enemy.enemyType === EnemyType.TANK || data.enemy.enemyType === EnemyType.CARRIER) xp = 50;
        else if (data.enemy.enemyType === EnemyType.SHAMAN) xp = 40;
        else if (data.enemy.enemyType === EnemyType.FLYER || data.enemy.enemyType === EnemyType.SHIELDER) xp = 35;
        else if (data.enemy.enemyType === EnemyType.SOLDIER || data.enemy.enemyType === EnemyType.STEALTH) xp = 25;
        this.hero.gainXp(xp);
      }

      const kills = SaveManager.getInstance().recordKill();
      AchievementsManager.getInstance().checkAndUnlock('first_kill');
      if (kills >= 50) AchievementsManager.getInstance().checkAndUnlock('kills_50');
      if (kills >= 200) AchievementsManager.getInstance().checkAndUnlock('kills_200');
      if (data.enemy.config.isBoss || data.enemy.enemyType === EnemyType.BOSS) {
        AchievementsManager.getInstance().checkAndUnlock('boss_slayer');
        if (this.hero && this.hero.isAlive) {
          this.hero.onBossSlayed();
        }
      }
    });

    this.bus.on(GameEvents.WAVE_STARTED, (data: { waveNumber: number; isEarlyCall?: boolean }) => {
      this.dragonAirstrikeTriggeredThisWave = false;
      if (data.isEarlyCall) {
        this.sessionEarlyCalls += 1;
        if (this.sessionEarlyCalls >= 3) {
          AchievementsManager.getInstance().checkAndUnlock('early_caller');
        }
      }
      if (data.waveNumber >= 5 || this.isBossRush) {
        this.time.delayedCall(4500, () => {
          if (this.scene.isActive()) {
            this.triggerDragonAirstrike();
          }
        });
      }
    });

    this.bus.on(GameEvents.ENEMY_REACHED_END, (data: { enemy: Enemy; livesLost: number }) => {
      this.economyManager.loseLives(data.livesLost);
    });

    this.bus.on(GameEvents.SPELL_TRIGGERED, (data: { type: SpellType }) => {
      this.executeSpell(data.type);
    });

    this.bus.on(GameEvents.VICTORY, () => {
      this.handleVictory();
    });

    this.bus.on(GameEvents.GAME_OVER, () => {
      this.handleGameOver();
    });

    this.bus.on(GameEvents.BOSS_SPAWNED, () => {
      this.cameras.main.shake(420, 0.016);
      AudioManager.getInstance().playThunder();
    });

    this.bus.on(GameEvents.GOLD_CHANGED, (gold: number) => {
      if (gold >= 1500) {
        AchievementsManager.getInstance().checkAndUnlock('gold_hoarder');
      }
    });
  }

  // ==========================================
  // 1. SANTUÁRIOS ARCANOS INTERATIVOS
  // ==========================================
  private createArcaneShrines(): void {
    this.shrines.forEach(s => s.destroy());
    this.shrines = [];

    // 1. Santuário da Pressa Arcana (+40% atk spd para torres em 180px)
    // Posicionado no flanco esquerdo/superior cobrindo o primeiro cluster de torres
    const hasteX = 260;
    const hasteY = 110;
    const hasteShrine = new ArcaneShrine(this, hasteX, hasteY, ArcaneShrineType.HASTE);
    this.shrines.push(hasteShrine);

    // 2. Santuário da Onda de Choque (250 dano mágico + 1.5s stun em todos os monstros)
    // Posicionado no flanco direito/superior do campo
    const shockX = 1040;
    const shockY = 120;
    const shockShrine = new ArcaneShrine(this, shockX, shockY, ArcaneShrineType.SHOCKWAVE);
    this.shrines.push(shockShrine);
  }

  // ==========================================
  // 2. SISTEMA DE CLIMA DINÂMICO
  // ==========================================
  private setupDynamicWeather(): void {
    if (this.weatherContainer) {
      this.weatherContainer.destroy();
    }
    this.weatherContainer = this.add.container(0, 0);
    this.weatherContainer.setDepth(600);

    const { width, height } = this.scale;

    // Overlay de iluminação/tempestade
    this.weatherDarknessOverlay = this.add.graphics();
    this.weatherDarknessOverlay.fillStyle(0x020617, 0.18);
    this.weatherDarknessOverlay.fillRect(0, 0, width, height);
    this.weatherContainer.add(this.weatherDarknessOverlay);

    // Cria pool de gotas de chuva
    this.rainDropSprites = [];
    const rainCount = 65;
    for (let i = 0; i < rainCount; i++) {
      const drop = this.add.sprite(
        Phaser.Math.Between(-100, width + 100),
        Phaser.Math.Between(-100, height + 100),
        'weather_rain_drop'
      );
      drop.setAlpha(Phaser.Math.FloatBetween(0.4, 0.85));
      drop.setScale(Phaser.Math.FloatBetween(0.7, 1.2));
      drop.rotation = 0.28;
      this.weatherContainer.add(drop);
      this.rainDropSprites.push(drop);
    }

    this.applyWeatherVisuals();
  }

  public toggleWeather(): void {
    if (this.currentWeather === 'RAIN') {
      this.setWeather('STORM');
    } else if (this.currentWeather === 'STORM') {
      this.setWeather('CLEAR');
    } else {
      this.setWeather('RAIN');
    }
  }

  public setWeather(type: 'CLEAR' | 'RAIN' | 'STORM'): void {
    this.currentWeather = type;
    this.applyWeatherVisuals();

    const color = type === 'CLEAR' ? '#fde047' : (type === 'RAIN' ? '#38bdf8' : '#a855f7');
    this.showFloatingText(this.scale.width / 2, 70, t(weatherAnnounceKey(type)), color);

    EventBus.emit(GameEvents.WEATHER_CHANGED, { weather: type });
  }

  private applyWeatherVisuals(): void {
    if (!this.weatherDarknessOverlay) return;

    if (this.currentWeather === 'CLEAR' || !this.isWeatherEnabled) {
      this.weatherDarknessOverlay.setAlpha(0);
      this.rainDropSprites.forEach(d => d.setVisible(false));
    } else if (this.currentWeather === 'RAIN') {
      this.weatherDarknessOverlay.setAlpha(0.18);
      this.rainDropSprites.forEach((d, idx) => {
        d.setVisible(idx < 40);
        d.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
      });
    } else if (this.currentWeather === 'STORM') {
      this.weatherDarknessOverlay.setAlpha(0.35);
      this.rainDropSprites.forEach(d => {
        d.setVisible(true);
        d.setAlpha(Phaser.Math.FloatBetween(0.5, 0.95));
      });
    }
  }

  private updateDynamicWeather(deltaMs: number, speedMultiplier: number): void {
    if (!this.isWeatherEnabled || this.currentWeather === 'CLEAR') return;

    const effectiveDelta = deltaMs * speedMultiplier;
    const { width, height } = this.scale;
    const rainSpeedMult = this.currentWeather === 'STORM' ? 1.5 : 1.0;

    // 1. Atualiza partículas de chuva
    this.rainDropSprites.forEach(drop => {
      if (!drop.visible) return;

      drop.x += (effectiveDelta / 1000) * 140 * rainSpeedMult;
      drop.y += (effectiveDelta / 1000) * 650 * rainSpeedMult;

      if (drop.y > height + 20 || drop.x > width + 40) {
        drop.x = Phaser.Math.Between(-100, width);
        drop.y = Phaser.Math.Between(-80, -10);

        if (Math.random() < 0.25) {
          const splash = this.add.circle(drop.x, Phaser.Math.Between(height - 180, height - 10), 2.5, 0xbae6fd, 0.6);
          this.tweens.add({
            targets: splash,
            scaleX: 2.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 180,
            onComplete: () => splash.destroy()
          });
        }
      }
    });

    // 2. Ventos Místicos (Wind Trails)
    this.windTimerMs -= effectiveDelta;
    if (this.windTimerMs <= 0) {
      this.windTimerMs = this.currentWeather === 'STORM' ? Phaser.Math.Between(2000, 4500) : Phaser.Math.Between(4000, 8000);
      this.spawnWindTrail();
    }

    // 3. Relâmpagos Estroboscópicos e Trovões
    this.thunderTimerMs -= effectiveDelta;
    if (this.thunderTimerMs <= 0) {
      this.thunderTimerMs = this.currentWeather === 'STORM' ? Phaser.Math.Between(6000, 14000) : Phaser.Math.Between(14000, 24000);
      this.triggerThunderFlash();
    }
  }

  public triggerThunderFlash(): void {
    const { width, height } = this.scale;

    // Áudio & Haptics
    AudioManager.getInstance().playThunder();
    HapticsManager.getInstance().cannonShot();

    // Tremor de tela
    this.cameras.main.shake(220, 0.008);

    // Clarão Estroboscópico de Relâmpago
    const flash = this.add.graphics();
    flash.setDepth(9995);
    flash.fillStyle(0xe0f2fe, 0.85);
    flash.fillRect(0, 0, width, height);

    this.tweens.add({
      targets: flash,
      alpha: { from: 0.85, to: 0.1 },
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 160,
          onComplete: () => flash.destroy()
        });
      }
    });

    // Raio Elétrico Ramificado
    const boltX = Phaser.Math.Between(100, width - 100);
    const bolt = this.add.sprite(boltX, 120, 'weather_lightning_bolt').setScale(1.6).setDepth(9994);
    bolt.setAlpha(0.95);
    this.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 220,
      onComplete: () => bolt.destroy()
    });
  }

  private spawnWindTrail(): void {
    const { width, height } = this.scale;
    const startY = Phaser.Math.Between(80, height - 100);
    const wind = this.add.sprite(-80, startY, 'weather_wind_trail').setDepth(601);
    wind.setAlpha(0.7);
    wind.setScale(Phaser.Math.FloatBetween(0.8, 1.4));

    const duration = Phaser.Math.Between(1400, 2400);
    this.tweens.add({
      targets: wind,
      x: width + 100,
      y: startY + Phaser.Math.Between(-30, 40),
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => wind.destroy()
    });
  }

  // ==========================================
  // 3. EVENTO DA PASSAGEM DO DRAGÃO ALADO
  // ==========================================
  public triggerDragonAirstrike(): void {
    if (this.dragonAirstrikeTriggeredThisWave) return;
    this.dragonAirstrikeTriggeredThisWave = true;

    const { width, height } = this.scale;

    // Áudio e Haptics do Dragão
    AudioManager.getInstance().playDragonRoar();
    HapticsManager.getInstance().cannonShot();

    // Anúncio Épico
    this.showFloatingText(width / 2, 100, t('dragonFlyby'), '#ef4444');

    // Trajetória aérea diagonal
    const startX = -120;
    const startY = 160;
    const endX = width + 160;
    const endY = height * 0.65;
    const flightAngle = Math.atan2(endY - startY, endX - startX) + Math.PI / 2;

    // 1. Sombra do Dragão no Chão
    const shadow = this.add.sprite(startX, startY + 75, 'dragon_shadow');
    shadow.setScale(1.25);
    shadow.setRotation(flightAngle);
    shadow.setDepth(150);

    // 2. Sprite do Dragão Voando no Céu
    const dragon = this.add.sprite(startX, startY, 'dragon_sprite');
    dragon.setScale(1.35);
    dragon.setRotation(flightAngle);
    dragon.setDepth(800);

    // Animação de bater asas
    const wingFlap = this.tweens.add({
      targets: [dragon, shadow],
      scaleX: 1.15,
      scaleY: 1.45,
      yoyo: true,
      duration: 180,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const flightDuration = 4500;

    this.tweens.add({
      targets: shadow,
      x: endX,
      y: endY + 75,
      duration: flightDuration,
      ease: 'Linear',
      onComplete: () => {
        shadow.destroy();
      }
    });

    this.tweens.add({
      targets: dragon,
      x: endX,
      y: endY,
      duration: flightDuration,
      ease: 'Linear',
      onComplete: () => {
        wingFlap.stop();
        dragon.destroy();
      }
    });

    // Ao atingir o trecho intermediário do mapa, o Dragão cospe chamas na estrada
    this.time.delayedCall(1600, () => {
      if (!this.scene.isActive()) return;

      const firstPath = this.levelData.paths[0] || [];
      const midIndex = Math.floor(firstPath.length / 2);
      const targetPoint = firstPath[midIndex] || { x: width / 2, y: height / 2 };

      // Sopro de Chamas descendo até a estrada
      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 120, () => {
          const breath = this.add.sprite(dragon.x, dragon.y + 10, 'dragon_fire_breath').setDepth(790);
          breath.setScale(Phaser.Math.FloatBetween(0.8, 1.4));
          this.tweens.add({
            targets: breath,
            x: targetPoint.x + (i - 4) * 45 + Phaser.Math.Between(-15, 15),
            y: targetPoint.y + Phaser.Math.Between(-15, 15),
            scaleX: 2.2,
            scaleY: 2.2,
            alpha: 0,
            duration: 450,
            onComplete: () => breath.destroy()
          });
        });
      }

      // Cria a Trilha de Fogo Purificador na Estrada (dura 6 segundos)
      this.time.delayedCall(300, () => {
        this.createRoadFireTrail(targetPoint.x, targetPoint.y);
      });
    });

    EventBus.emit(GameEvents.DRAGON_AIRSTRIKE);
  }

  private createRoadFireTrail(centerX: number, centerY: number): void {
    const save = SaveManager.getInstance();
    const hasDragonfire = save.isRelicEquipped('dragonfire_flask');
    const trailDurationMs = hasDragonfire ? 8000 : 6000; // +2s de duração
    const dps = hasDragonfire ? 100 : 80; // +25% de dano base

    const container = this.add.container(0, 0);
    container.setDepth(200);

    // Múltiplos focos de fogo na estrada
    const patchOffsets = [-90, -45, 0, 45, 90];
    patchOffsets.forEach(offsetX => {
      const px = centerX + offsetX;
      const py = centerY + Phaser.Math.Between(-8, 8);

      const firePatch = this.add.sprite(px, py, 'fire_trail_patch');
      firePatch.setScale(1.1);
      container.add(firePatch);

      this.tweens.add({
        targets: firePatch,
        scaleY: 1.35,
        scaleX: 1.18,
        alpha: { from: 0.8, to: 1.0 },
        yoyo: true,
        duration: 180 + Phaser.Math.Between(0, 80),
        repeat: -1
      });
    });

    const fireTrail = {
      container,
      x: centerX,
      y: centerY,
      radius: 120,
      remainingMs: trailDurationMs,
      dps
    };
    this.activeFireTrails.push(fireTrail);

    this.time.delayedCall(trailDurationMs - 600, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          container.destroy();
          const idx = this.activeFireTrails.indexOf(fireTrail);
          if (idx > -1) this.activeFireTrails.splice(idx, 1);
        }
      });
    });
  }

  private executeSpell(type: SpellType): void {
    this.sessionSpellCasts += 1;
    if (this.sessionSpellCasts >= 5) {
      AchievementsManager.getInstance().checkAndUnlock('spell_caster');
    }

    if (type === SpellType.METEOR) {
      this.cameras.main.shake(400, 0.02);
      const save = SaveManager.getInstance();
      const meteorDamage = save.isRelicEquipped('dragonfire_flask') ? 750 : 600;
      const burnDuration = save.isRelicEquipped('dragonfire_flask') ? 6000 : 4000;
      this.enemies.forEach(e => {
        if (e.isAlive) {
          e.takeDamage(meteorDamage, DamageType.FIRE, true, this.enemies);
          e.applyStatus('BURN', burnDuration, undefined, save.isRelicEquipped('dragonfire_flask') ? 100 : 80);
        }
      });
      // Danifica todos os obstáculos com dano em área do meteoro
      const obsIds = Array.from(this.obstacleDataMap.keys());
      obsIds.forEach(id => this.damageObstacle(id, meteorDamage));
    } else if (type === SpellType.EMP) {
      this.enemies.forEach(e => {
        if (e.isAlive) {
          e.applyStatus('STUN', 4000);
          e.applyStatus('SLOW', 6000, 0.3);
        }
      });
      const obsIds = Array.from(this.obstacleDataMap.keys());
      obsIds.forEach(id => this.damageObstacle(id, 150));
    } else if (type === SpellType.SUPPLY) {
      this.economyManager.addGold(180);
    }
  }

  private handleVictory(): void {
    AudioManager.getInstance().playVictory();
    HapticsManager.getInstance().victory();

    const stars = this.economyManager.calculateStars();
    const score = this.economyManager.getScore();

    if (this.isDailyChallenge && this.dailyDateStr) {
      SaveManager.getInstance().completeDailyChallenge(this.dailyDateStr, score, 5);
      AchievementsManager.getInstance().checkAndUnlock('daily_master');
    } else if (this.isBossRush) {
      SaveManager.getInstance().recordBossRushProgress(this.waveManager.getCurrentWaveNumber(), score);
      AchievementsManager.getInstance().checkAndUnlock('boss_rush_champion');
    } else if (this.isEndless) {
      SaveManager.getInstance().recordEndlessProgress(this.waveManager.getCurrentWaveNumber(), score);
    } else {
      SaveManager.getInstance().completeLevel(this.levelData.id, stars, score);
      if (stars === 3) {
        AchievementsManager.getInstance().checkAndUnlock('perfect_defense');
      }
      if (this.levelData.id === 1) AchievementsManager.getInstance().checkAndUnlock('level_1_clear');
      if (this.levelData.id === 2) AchievementsManager.getInstance().checkAndUnlock('level_2_clear');
      if (this.levelData.id === 3) AchievementsManager.getInstance().checkAndUnlock('level_3_clear');
      if (this.levelData.id === 4) AchievementsManager.getInstance().checkAndUnlock('level_4_clear');
      if (this.levelData.id === 5) AchievementsManager.getInstance().checkAndUnlock('level_5_clear');
      if (this.levelData.id === 6) AchievementsManager.getInstance().checkAndUnlock('level_6_clear');
    }
    SaveManager.getInstance().flush();
  }

  private handleGameOver(): void {
    AudioManager.getInstance().playDefeat();
    HapticsManager.getInstance().defeat();

    if (this.isBossRush) {
      SaveManager.getInstance().recordBossRushProgress(this.waveManager.getCurrentWaveNumber(), this.economyManager.getScore());
    } else if (this.isEndless) {
      SaveManager.getInstance().recordEndlessProgress(this.waveManager.getCurrentWaveNumber(), this.economyManager.getScore());
    }
    SaveManager.getInstance().flush();
  }

  public update(time: number, delta: number): void {
    if (this.gameSpeed === GameSpeed.PAUSED) return;

    const speedMult = this.gameSpeed;
    const effectiveDelta = delta * speedMult;

    // Atualiza Ondas & Spawner
    this.waveManager.updateWave(delta, speedMult, this, this.enemies);

    // Atualiza Inimigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isAlive) {
        enemy.updateEnemy(delta, speedMult, this.enemies, this.towers, this.hero);
      } else {
        this.enemies.splice(i, 1);
      }
    }

    // Atualiza Torres
    this.towers.forEach(tower => {
      tower.updateTower(delta, speedMult, this.enemies, this.getProjectileSource());
    });

    // Atualiza Santuários Arcanos
    this.shrines.forEach(shrine => {
      shrine.updateShrine(delta, speedMult);
    });

    // Atualiza Clima Dinâmico (Chuva, Trovões, Ventos)
    this.updateDynamicWeather(delta, speedMult);

    // Atualiza Trilhas de Fogo do Dragão na Estrada (6s de Queimadura)
    for (let i = this.activeFireTrails.length - 1; i >= 0; i--) {
      const trail = this.activeFireTrails[i];
      trail.remainingMs -= effectiveDelta;

      if (trail.remainingMs > 0) {
        const damageThisFrame = (trail.dps * effectiveDelta) / 1000;
        this.enemies.forEach(enemy => {
          if (enemy.isAlive) {
            const dist = Phaser.Math.Distance.Between(trail.x, trail.y, enemy.x, enemy.y);
            if (dist <= trail.radius) {
              enemy.takeDamage(damageThisFrame, DamageType.FIRE, false, this.enemies);
              enemy.applyStatus('BURN', 3000, undefined, 50);
            }
          }
        });
      }
    }

    // Atualiza Herói e Companheiros
    if (this.hero) {
      this.hero.updateHero(delta, speedMult, this.enemies, this.getProjectileSource(), this.towers);
    }

    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeProjectiles[i];
      projectile.updateProjectile(delta, speedMult);
      if (!projectile.isActive) {
        this.activeProjectiles.splice(i, 1);
        this.projectilesPool.release(projectile);
      }
    }
  }

  private onSceneShutdown(): void {
    this.bus.offAll();
    this.activeProjectiles.forEach(p => {
      p.isActive = false;
      p.setVisible(false);
      this.projectilesPool.release(p);
    });
    this.activeProjectiles = [];
    if (this.scene.get('UIScene')?.scene.isActive() || this.scene.isSleeping('UIScene')) {
      this.scene.stop('UIScene');
    }
  }

  public shutdown(): void {
    this.onSceneShutdown();
  }
}

