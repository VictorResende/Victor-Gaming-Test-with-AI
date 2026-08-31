import Phaser from 'phaser';
import { GameEvents, EventBus } from '../core/EventBus';
import { DamageType } from '../core/Constants';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';

export enum ArcaneShrineType {
  HASTE = 'HASTE',
  SHOCKWAVE = 'SHOCKWAVE'
}

export interface ArcaneShrineConfig {
  type: ArcaneShrineType;
  name: string;
  title: string;
  description: string;
  icon: string;
  textureKey: string;
  cooldownMs: number;
  radius: number; // 180px para pressa
  glowColor: number;
  accentColorHex: string;
}

export const SHRINES_CONFIG: Record<ArcaneShrineType, ArcaneShrineConfig> = {
  [ArcaneShrineType.HASTE]: {
    type: ArcaneShrineType.HASTE,
    name: 'Santuário da Pressa',
    title: 'Pressa Arcana',
    description: '+40% Velocidade de Ataque (8s)',
    icon: '⚡',
    textureKey: 'shrine_haste',
    cooldownMs: 45000, // 45 segundos
    radius: 180,
    glowColor: 0x38bdf8,
    accentColorHex: '#38bdf8'
  },
  [ArcaneShrineType.SHOCKWAVE]: {
    type: ArcaneShrineType.SHOCKWAVE,
    name: 'Santuário do Choque',
    title: 'Onda de Choque Arcana',
    description: '250 Dano Mágico + 1.5s Stun Global',
    icon: '💥',
    textureKey: 'shrine_shockwave',
    cooldownMs: 60000, // 60 segundos
    radius: 0,
    glowColor: 0xf59e0b,
    accentColorHex: '#facc15'
  }
};

export class ArcaneShrine extends Phaser.GameObjects.Container {
  public shrineType: ArcaneShrineType;
  public config: ArcaneShrineConfig;
  public cooldownRemainingMs = 0;

  private auraGraphics: Phaser.GameObjects.Graphics;
  private rangePreviewGraphics: Phaser.GameObjects.Graphics;
  private baseSprite: Phaser.GameObjects.Sprite;
  private shrineSprite: Phaser.GameObjects.Sprite;
  private cooldownGraphics: Phaser.GameObjects.Graphics;
  private badgeContainer: Phaser.GameObjects.Container;
  private badgeText: Phaser.GameObjects.Text;
  private auraPulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, shrineType: ArcaneShrineType) {
    super(scene, x, y);

    this.shrineType = shrineType;
    this.config = SHRINES_CONFIG[shrineType];

    // 1. Círculo de Alcance / Área de Efeito (oculto por padrão, visível no hover/clique)
    this.rangePreviewGraphics = scene.add.graphics();
    this.add(this.rangePreviewGraphics);

    // 2. Gráfico de Aura Rúnica Brilhante
    this.auraGraphics = scene.add.graphics();
    this.add(this.auraGraphics);

    // 3. Base de Alvenaria Sagrada
    this.baseSprite = scene.add.sprite(0, 0, 'shrine_base');
    this.add(this.baseSprite);

    // 4. Sprite Principal do Santuário Arcano
    this.shrineSprite = scene.add.sprite(0, -6, this.config.textureKey);
    this.add(this.shrineSprite);

    // 5. Gráfico de Cooldown Circular
    this.cooldownGraphics = scene.add.graphics();
    this.add(this.cooldownGraphics);

    // 6. Badge de Ícone & Status
    this.badgeContainer = scene.add.container(0, 26);
    const badgeBg = scene.add.graphics();
    badgeBg.fillStyle(0x18110b, 0.9);
    badgeBg.fillRoundedRect(-24, -9, 48, 18, 4);
    badgeBg.lineStyle(1.5, this.config.glowColor, 0.9);
    badgeBg.strokeRoundedRect(-24, -9, 48, 18, 4);

    this.badgeText = scene.add.text(0, 0, this.config.icon, {
      fontSize: '11px',
      fontStyle: 'bold',
      color: this.config.accentColorHex
    }).setOrigin(0.5);

    this.badgeContainer.add([badgeBg, this.badgeText]);
    this.add(this.badgeContainer);

    // 7. Interatividade Touch
    this.setSize(64, 64);
    this.setInteractive(new Phaser.Geom.Rectangle(-32, -32, 64, 64), Phaser.Geom.Rectangle.Contains);

    this.on('pointerover', () => {
      this.drawRangePreview(true);
      scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 150
      });
    });

    this.on('pointerout', () => {
      this.drawRangePreview(false);
      scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150
      });
    });

    this.on('pointerdown', () => {
      this.activate();
    });

    // 8. Inicia Animações Visuais
    this.setupAuraPulse();
    this.drawAura();
    this.drawCooldown();

    scene.add.existing(this);
  }

  private setupAuraPulse(): void {
    this.auraPulseTween = this.scene.tweens.add({
      targets: this.auraGraphics,
      alpha: { from: 0.55, to: 1.0 },
      scaleX: { from: 0.96, to: 1.04 },
      scaleY: { from: 0.96, to: 1.04 },
      yoyo: true,
      duration: 1400,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public drawAura(): void {
    this.auraGraphics.clear();
    const isReady = this.cooldownRemainingMs <= 0;
    const color = isReady ? this.config.glowColor : 0x64748b;

    // Resplendor rúnico circular sob o santuário
    this.auraGraphics.fillStyle(color, isReady ? 0.25 : 0.08);
    this.auraGraphics.fillCircle(0, 0, 36);
    this.auraGraphics.lineStyle(2, color, isReady ? 0.9 : 0.35);
    this.auraGraphics.strokeCircle(0, 0, 36);

    // Glifos em órbita
    if (isReady) {
      this.auraGraphics.lineStyle(1.5, 0xfde047, 0.7);
      this.auraGraphics.strokeCircle(0, 0, 26);

      const time = this.scene.time.now * 0.002;
      for (let i = 0; i < 3; i++) {
        const angle = time + (i * Math.PI * 2) / 3;
        const gx = Math.cos(angle) * 36;
        const gy = Math.sin(angle) * 36;
        this.auraGraphics.fillStyle(0xfde047, 0.95);
        this.auraGraphics.fillCircle(gx, gy, 3);
      }
    }
  }

  private drawRangePreview(visible: boolean): void {
    this.rangePreviewGraphics.clear();
    if (!visible || this.config.radius <= 0) return;

    // Área de alcance de 180px para o Santuário da Pressa
    this.rangePreviewGraphics.fillStyle(this.config.glowColor, 0.12);
    this.rangePreviewGraphics.fillCircle(0, 0, this.config.radius);
    this.rangePreviewGraphics.lineStyle(2, this.config.glowColor, 0.85);
    this.rangePreviewGraphics.strokeCircle(0, 0, this.config.radius);
  }

  public drawCooldown(): void {
    this.cooldownGraphics.clear();

    if (this.cooldownRemainingMs > 0) {
      const ratio = this.cooldownRemainingMs / this.config.cooldownMs;
      const startAngle = Phaser.Math.DegToRad(-90);
      const endAngle = Phaser.Math.DegToRad(-90 + 360 * ratio);

      // Setor circular de recarga (Pie slice escuro)
      this.cooldownGraphics.fillStyle(0x000000, 0.65);
      this.cooldownGraphics.beginPath();
      this.cooldownGraphics.moveTo(0, 0);
      this.cooldownGraphics.arc(0, 0, 34, startAngle, endAngle, false);
      this.cooldownGraphics.closePath();
      this.cooldownGraphics.fillPath();

      // Anel dourado do progresso de recarga
      this.cooldownGraphics.lineStyle(3, this.config.glowColor, 0.95);
      this.cooldownGraphics.beginPath();
      this.cooldownGraphics.arc(0, 0, 34, startAngle, endAngle, false);
      this.cooldownGraphics.strokePath();

      // Atualiza texto da badge
      const secs = Math.ceil(this.cooldownRemainingMs / 1000);
      this.badgeText.setText(`${secs}s`);
      this.badgeText.setColor('#f87171');
      this.shrineSprite.setTint(0x94a3b8);
    } else {
      this.badgeText.setText(this.config.icon);
      this.badgeText.setColor(this.config.accentColorHex);
      this.shrineSprite.clearTint();
    }
  }

  public updateShrine(deltaMs: number, speedMultiplier: number): void {
    const effectiveDelta = deltaMs * speedMultiplier;
    const wasOnCooldown = this.cooldownRemainingMs > 0;

    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - effectiveDelta);
      this.drawCooldown();

      // Efeito sonoro/visual quando sai do cooldown
      if (wasOnCooldown && this.cooldownRemainingMs === 0) {
        this.drawAura();
        this.triggerReadyVFX();
      }
    }
  }

  private triggerReadyVFX(): void {
    // Brilho de prontidão
    const halo = this.scene.add.circle(this.x, this.y, 10, this.config.glowColor, 0.9);
    this.scene.tweens.add({
      targets: halo,
      radius: 45,
      alpha: 0,
      duration: 500,
      onComplete: () => halo.destroy()
    });

    this.showFloatingText('✨ PRONTO!', this.config.accentColorHex);
    AudioManager.getInstance().playClick();
  }

  public activate(): boolean {
    if (this.cooldownRemainingMs > 0) {
      const secs = Math.ceil(this.cooldownRemainingMs / 1000);
      this.showFloatingText(`⏳ Cooldown (${secs}s)`, '#ef4444');
      HapticsManager.getInstance().tap();

      // Balanço de negação
      this.scene.tweens.add({
        targets: this,
        x: this.x + 4,
        yoyo: true,
        duration: 40,
        repeat: 3,
        onComplete: () => this.setX(this.x)
      });
      return false;
    }

    const gameScene = this.scene as any;

    if (this.shrineType === ArcaneShrineType.HASTE) {
      this.triggerHasteEffect(gameScene);
    } else if (this.shrineType === ArcaneShrineType.SHOCKWAVE) {
      this.triggerShockwaveEffect(gameScene);
    }

    this.cooldownRemainingMs = this.config.cooldownMs;
    this.drawAura();
    this.drawCooldown();

    EventBus.emit(GameEvents.SHRINE_ACTIVATED, {
      shrine: this,
      shrineType: this.shrineType
    });

    return true;
  }

  // ==========================================
  // EFEITO 1: PRESSA ARCANA (+40% ATK SPEED / 8S / 180PX)
  // ==========================================
  private triggerHasteEffect(gameScene: any): void {
    AudioManager.getInstance().playShrineHaste();
    HapticsManager.getInstance().heroAbility();

    const towers: Tower[] = gameScene.towers || [];
    let affectedCount = 0;

    // Onda de choque rúnica expansiva (180px)
    const wave = this.scene.add.circle(this.x, this.y, 10, 0x38bdf8, 0.85);
    this.scene.tweens.add({
      targets: wave,
      radius: 180,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => wave.destroy()
    });

    const ring = this.scene.add.graphics();
    ring.lineStyle(4, 0xfde047, 1);
    ring.strokeCircle(this.x, this.y, 20);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 9,
      scaleY: 9,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    // Aplica buff em todas as torres dentro do raio de 180px
    towers.forEach(tower => {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
      if (dist <= 180) {
        affectedCount++;
        tower.applyHaste(1.4, 8000);

        // Feixe de conexão de mana entre o santuário e a torre
        const beam = this.scene.add.graphics();
        beam.lineStyle(3, 0x38bdf8, 0.9);
        beam.lineBetween(this.x, this.y, tower.x, tower.y);
        beam.lineStyle(1.5, 0xffffff, 1);
        beam.lineBetween(this.x, this.y, tower.x, tower.y);

        this.scene.time.delayedCall(300, () => beam.destroy());
      }
    });

    this.showFloatingText(`⚡ PRESSA ARCANA! (${affectedCount} TORRES)`, '#38bdf8');
  }

  // ==========================================
  // EFEITO 2: ONDA DE CHOQUE ARCANA (250 DANO + 1.5S STUN GLOBAL)
  // ==========================================
  private triggerShockwaveEffect(gameScene: any): void {
    AudioManager.getInstance().playShrineShockwave();
    HapticsManager.getInstance().cannonShot();

    // Tremor de tela épico
    gameScene.cameras.main.shake(350, 0.015);

    // Flash dourado na tela
    const { width, height } = this.scene.scale;
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xfde047, 0.35);
    flash.fillRect(0, 0, width, height);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy()
    });

    // Anéis de Nova Dourada Gigantes se expandindo pelo mapa
    const rings = [0, 100, 200];
    rings.forEach((delay, idx) => {
      this.scene.time.delayedCall(delay, () => {
        const nova = this.scene.add.circle(this.x, this.y, 20, 0xf59e0b, 0.9 - idx * 0.2);
        this.scene.tweens.add({
          targets: nova,
          radius: Math.max(width, height),
          alpha: 0,
          duration: 750,
          ease: 'Quad.easeOut',
          onComplete: () => nova.destroy()
        });
      });
    });

    // Aplica 250 de dano mágico e 1.5s de stun em todos os monstros vivos da tela
    const enemies: Enemy[] = gameScene.enemies || [];
    let enemiesHit = 0;

    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        enemiesHit++;
        enemy.takeDamage(250, DamageType.LASER, true, enemies);
        enemy.applyStatus('STUN', 1500);

        // Faíscas elétricas de choque no monstro
        const spark = this.scene.add.circle(enemy.x, enemy.y, 14, 0xfde047, 1);
        this.scene.tweens.add({
          targets: spark,
          radius: 28,
          alpha: 0,
          duration: 300,
          onComplete: () => spark.destroy()
        });
      }
    });

    this.showFloatingText(`💥 ONDA DE CHOQUE! (250 DANO + STUN)`, '#facc15');
  }

  private showFloatingText(text: string, color = '#ffffff'): void {
    const txt = this.scene.add.text(this.x, this.y - 36, text, {
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => txt.destroy()
    });
  }

  public destroy(fromScene?: boolean): void {
    if (this.auraPulseTween) {
      this.auraPulseTween.stop();
      this.auraPulseTween = null;
    }
    this.auraGraphics.destroy();
    this.rangePreviewGraphics.destroy();
    this.cooldownGraphics.destroy();
    super.destroy(fromScene);
  }
}
