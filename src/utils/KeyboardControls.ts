import Phaser from 'phaser';
import { SpellType, TowerType } from '../core/Constants';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';

export class KeyboardControls {
  private scene: Phaser.Scene;
  private gameScene: GameScene;
  private uiScene: UIScene;

  constructor(scene: Phaser.Scene, gameScene: GameScene, uiScene: UIScene) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.uiScene = uiScene;
    this.setupKeybindings();
  }

  private setupKeybindings(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // 1-5: Selecionar Torres para Construção
    keyboard.on('keydown-ONE', () => this.gameScene.selectTowerToBuild(TowerType.GATLING));
    keyboard.on('keydown-TWO', () => this.gameScene.selectTowerToBuild(TowerType.CANNON));
    keyboard.on('keydown-THREE', () => this.gameScene.selectTowerToBuild(TowerType.CRYO));
    keyboard.on('keydown-FOUR', () => this.gameScene.selectTowerToBuild(TowerType.LASER));
    keyboard.on('keydown-FIVE', () => this.gameScene.selectTowerToBuild(TowerType.TESLA));

    // Q, W, E: Feitiços Globais
    keyboard.on('keydown-Q', () => this.gameScene.spellsManager.cast(SpellType.METEOR, this.scene.time.now));
    keyboard.on('keydown-W', () => this.gameScene.spellsManager.cast(SpellType.EMP, this.scene.time.now));
    keyboard.on('keydown-E', () => this.gameScene.spellsManager.cast(SpellType.SUPPLY, this.scene.time.now));

    // Z, X: Habilidades do Herói
    keyboard.on('keydown-Z', () => {
      if (this.gameScene.hero && this.gameScene.hero.isAlive) {
        this.gameScene.hero.useAbility(1, this.gameScene.enemies, this.gameScene.towers);
      }
    });
    keyboard.on('keydown-X', () => {
      if (this.gameScene.hero && this.gameScene.hero.isAlive) {
        this.gameScene.hero.useAbility(2, this.gameScene.enemies, this.gameScene.towers);
      }
    });

    // Barra de Espaço: Iniciar / Chamar Onda
    keyboard.on('keydown-SPACE', () => {
      this.gameScene.waveManager.startNextWave(this.gameScene.waveManager.isRunning());
    });

    // P ou ESC: Pausar / Menu
    keyboard.on('keydown-P', () => {
      this.uiScene.openPauseModal();
    });
    keyboard.on('keydown-ESC', () => {
      this.gameScene.selectTowerToBuild(null);
      this.gameScene.selectTowerForInspection(null);
    });

    // U: Upgrade na torre selecionada
    keyboard.on('keydown-U', () => {
      this.gameScene.upgradeCurrentTower();
    });

    // S: Vender torre selecionada
    keyboard.on('keydown-S', () => {
      this.gameScene.sellCurrentTower();
    });

    // T: Alternar mira da torre selecionada
    keyboard.on('keydown-T', () => {
      if (this.gameScene.activeInspectedTower) {
        this.gameScene.activeInspectedTower.cycleTargetPriority();
      }
    });

    // 6, 7: Ativar Santuários Arcanos
    keyboard.on('keydown-SIX', () => {
      this.gameScene.shrines[0]?.activate();
    });
    keyboard.on('keydown-SEVEN', () => {
      this.gameScene.shrines[1]?.activate();
    });

    // C ou R: Alternar Clima Dinâmico (Chuva / Tempestade / Limpo)
    keyboard.on('keydown-C', () => {
      this.gameScene.toggleWeather();
    });
    keyboard.on('keydown-R', () => {
      this.gameScene.toggleWeather();
    });

    // D: Invocação / Passagem do Dragão Alado
    keyboard.on('keydown-D', () => {
      this.gameScene.triggerDragonAirstrike();
    });

    // F: Alternar Tela Cheia (Fullscreen)
    keyboard.on('keydown-F', () => {
      this.toggleFullscreen();
    });
  }

  public toggleFullscreen(): void {
    if (this.scene.scale.isFullscreen) {
      this.scene.scale.stopFullscreen();
    } else {
      this.scene.scale.startFullscreen();
    }
  }

  public destroy(): void {
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.removeAllListeners();
    }
  }
}
