import Phaser from 'phaser';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';
import { GAME_CONSTANTS } from './core/Constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { TechTreeScene } from './scenes/TechTreeScene';
import { HeroTalentsScene } from './scenes/HeroTalentsScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

// Configuração do Phaser Game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONSTANTS.CANVAS_WIDTH,
  height: GAME_CONSTANTS.CANVAS_HEIGHT,
  backgroundColor: '#0a0d14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONSTANTS.CANVAS_WIDTH,
    height: GAME_CONSTANTS.CANVAS_HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    LevelSelectScene,
    TechTreeScene,
    HeroTalentsScene,
    GameScene,
    UIScene
  ]
};

// Inicialização dos recursos móveis nativos via Capacitor
async function initMobileFeatures() {
  try {
    // Trava a orientação em Paisagem (Landscape)
    await ScreenOrientation.lock({ orientation: 'landscape' });
  } catch (e) {
    console.log('ScreenOrientation lock not supported in browser environment');
  }

  try {
    // Esconde a barra de status para modo tela cheia imersivo
    await StatusBar.hide();
  } catch (e) {
    console.log('StatusBar not available in browser environment');
  }
}

initMobileFeatures();

export const game = new Phaser.Game(config);
