import Phaser from 'phaser';
import { AssetGenerator } from '../utils/AssetGenerator';
import { SaveManager } from '../managers/SaveManager';
import { setLanguage } from '../i18n/locales';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public async create(): Promise<void> {
    // Carrega dados salvos
    const saveData = await SaveManager.getInstance().load();
    setLanguage(saveData.settings.language);

    // Gera todas as texturas vetoriais/sprites
    AssetGenerator.generateAll(this);

    // Transição suave para o Menu Principal
    this.scene.start('MenuScene');
  }
}
