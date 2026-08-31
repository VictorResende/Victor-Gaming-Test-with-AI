import Phaser from 'phaser';
import { HERO_PERK_NODES, HeroPerkNode } from '../config/heroPerksConfig';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { attachSpringFeedback } from '../utils/UIFeedback';
import { t } from '../i18n/locales';

export class HeroTalentsScene extends Phaser.Scene {
  private starText!: Phaser.GameObjects.Text;
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  constructor() {
    super('HeroTalentsScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    const save = SaveManager.getInstance();

    // 1. Fundo do Santuário Heroico e Runas Celestes
    this.createSanctuaryBackground(width, height);

    // 2. Cabeçalho Real Ancorado
    const headerY = this.safeInsets.top + 38;

    // Fita de Título do Santuário
    const headerRibbon = this.add.graphics();
    headerRibbon.fillStyle(0x2d180a, 0.96);
    headerRibbon.fillRoundedRect(width / 2 - 270, headerY - 22, 540, 44, 8);
    headerRibbon.lineStyle(2.5, 0xfacc15, 1);
    headerRibbon.strokeRoundedRect(width / 2 - 270, headerY - 22, 540, 44, 8);
    headerRibbon.lineStyle(1, 0x92400e, 0.8);
    headerRibbon.strokeRoundedRect(width / 2 - 266, headerY - 18, 532, 36, 6);

    this.add.text(width / 2, headerY, `👑 ${t('heroTalentsTitle')}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 4,
      letterSpacing: 1
    }).setOrigin(0.5);

    // Botão Voltar (Top Left Seguro, Hitbox 105x48px com Spring)
    const backBtnX = this.safeBounds.left + 55;
    const backBtn = this.add.container(backBtnX, headerY);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1c140e, 0.95);
    backBg.fillRoundedRect(-50, -19, 100, 38, 8);
    backBg.lineStyle(2, 0xd97706, 1);
    backBg.strokeRoundedRect(-50, -19, 100, 38, 8);
    const backTxt = this.add.text(0, 0, `← ${t('back')}`, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBtn.setSize(105, 48);
    backBtn.setInteractive(SafeArea.createTouchHitbox(105, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(backBtn, this, {
      rippleColor: 0xd97706,
      onClick: () => {
        this.scene.start('MenuScene');
      }
    });

    // Botão Alternar para Tech Tree de Torres (Top Left Central, Hitbox 160x48px)
    const toggleBtnX = backBtnX + 130;
    const toggleBtn = this.add.container(toggleBtnX, headerY);
    const togBg = this.add.graphics();
    togBg.fillStyle(0x1e3a8a, 0.95);
    togBg.fillRoundedRect(-75, -19, 150, 38, 8);
    togBg.lineStyle(2, 0x60a5fa, 1);
    togBg.strokeRoundedRect(-75, -19, 150, 38, 8);
    const togTxt = this.add.text(0, 0, `📖 ${t('towerTechTab')}`, {
      fontSize: '12.5px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1e3a8a',
      strokeThickness: 2
    }).setOrigin(0.5);
    toggleBtn.add([togBg, togTxt]);
    toggleBtn.setSize(150, 48);
    toggleBtn.setInteractive(SafeArea.createTouchHitbox(150, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(toggleBtn, this, {
      rippleColor: 0x60a5fa,
      onClick: () => {
        this.scene.start('TechTreeScene');
      }
    });

    // Contador de Estrelas de Glória (Top Right Seguro, Hitbox 120x48px)
    const starCardX = this.safeBounds.right - 60;
    const starCard = this.add.container(starCardX, headerY);
    const starBg = this.add.graphics();
    starBg.fillStyle(0x1c140e, 0.95);
    starBg.fillRoundedRect(-55, -19, 110, 38, 8);
    starBg.lineStyle(2, 0xfacc15, 1);
    starBg.strokeRoundedRect(-55, -19, 110, 38, 8);
    this.starText = this.add.text(0, 0, `⭐ ${save.getData().availableStars}`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    starCard.add([starBg, this.starText]);
    starCard.setSize(120, 48);
    starCard.setInteractive(SafeArea.createTouchHitbox(120, 48), Phaser.Geom.Rectangle.Contains);

    // 3. Grid 2x3 de Cartas de Talentos de Herói
    const cardW = Math.min(360, (this.safeBounds.safeWidth - 40) / 3);
    const cardH = 165;
    const cols = 3;
    const colSpacing = (this.safeBounds.safeWidth - cardW * cols) / (cols - 1);
    const startX = this.safeBounds.left + cardW / 2;
    const startY = headerY + 115;

    HERO_PERK_NODES.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + colSpacing);
      const y = startY + row * (cardH + 28);

      this.createHeroPerkCard(x, y, cardW, cardH, node);
    });
  }

  // ==========================================
  // FUNDO DO SANTUÁRIO HEROICO
  // ==========================================
  private createSanctuaryBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    // Gradiente imperial profundo: Azul Real Noturno -> Carmesim Místico
    bg.fillGradientStyle(0x140e24, 0x140e24, 0x221332, 0x0a0614, 1);
    bg.fillRect(0, 0, width, height);

    // Moldura do Santuário em Ouro Duplo
    bg.lineStyle(4, 0x92400e, 0.6);
    bg.strokeRect(12, 12, width - 24, height - 24);
    bg.lineStyle(1.5, 0xfacc15, 0.4);
    bg.strokeRect(16, 16, width - 32, height - 32);

    // Partículas Celestiais e Runas Douradas Flutuantes
    const runes = ['⚔️', '🛡️', '⚡', '✨', '👑', '🌟', '✦', '✧'];
    for (let i = 0; i < 40; i++) {
      const runeChar = runes[i % runes.length];
      const rune = this.add.text(
        Phaser.Math.Between(30, width - 30),
        Phaser.Math.Between(30, height - 30),
        runeChar,
        {
          fontSize: `${Phaser.Math.Between(12, 20)}px`,
          color: '#facc15'
        }
      ).setOrigin(0.5).setAlpha(Phaser.Math.FloatBetween(0.12, 0.4));

      this.tweens.add({
        targets: rune,
        y: rune.y - Phaser.Math.Between(20, 60),
        alpha: { from: rune.alpha, to: 0.05 },
        duration: Phaser.Math.Between(3500, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // ==========================================
  // CARD DE TALENTO DE HERÓI EM PERGAMINHO
  // ==========================================
  private createHeroPerkCard(x: number, y: number, w: number, h: number, node: HeroPerkNode): void {
    const save = SaveManager.getInstance();
    const isUnlocked = save.hasHeroPerk(node.id);
    const canAfford = save.getData().availableStars >= node.starCost;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    // Fundo em Veludo Nobre / Couro Heroico
    bg.fillStyle(isUnlocked ? 0x064e3b : 0x24160c, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    // Borda Rúnica Dourada ou Esmeralda
    const borderColor = isUnlocked ? 0x34d399 : (canAfford ? 0xfacc15 : 0x57534e);
    bg.lineStyle(2.5, borderColor, isUnlocked ? 1.0 : (canAfford ? 0.9 : 0.4));
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(1, 0x1c140e, 0.8);
    bg.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 10);

    // Pedestal Rúnico com Ícone
    const iconPedestal = this.add.graphics();
    iconPedestal.fillStyle(isUnlocked ? 0x065f46 : (canAfford ? 0x78350f : 0x1c140e), 1);
    iconPedestal.fillCircle(-w / 2 + 38, -h / 2 + 38, 22);
    iconPedestal.lineStyle(1.5, borderColor, 1);
    iconPedestal.strokeCircle(-w / 2 + 38, -h / 2 + 38, 22);

    const icon = this.add.text(-w / 2 + 38, -h / 2 + 38, node.icon, { fontSize: '26px' }).setOrigin(0.5);

    // Título do Talento
    const title = this.add.text(-w / 2 + 70, -h / 2 + 26, node.name, {
      fontSize: '14.5px',
      fontStyle: 'bold',
      color: isUnlocked ? '#a7f3d0' : (canAfford ? '#fef08a' : '#a8a29e'),
      stroke: '#1c140e',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    // Descrição do Poder
    const desc = this.add.text(-w / 2 + 20, 8, node.description, {
      fontSize: '11px',
      color: isUnlocked ? '#e7e5e4' : '#d6d3d1',
      wordWrap: { width: w - 36 }
    }).setOrigin(0, 0.5);

    // Botão de Desbloquear / Status (Hitbox expandida)
    const btnBg = this.add.graphics();
    const btnColor = isUnlocked ? 0x047857 : (canAfford ? 0xb45309 : 0x1c140e);
    btnBg.fillStyle(btnColor, 1);
    btnBg.fillRoundedRect(-w / 2 + 20, h / 2 - 38, w - 40, 32, 6);
    btnBg.lineStyle(1.5, borderColor, 1);
    btnBg.strokeRoundedRect(-w / 2 + 20, h / 2 - 38, w - 40, 32, 6);

    const btnLabelStr = isUnlocked
      ? `✓ ${t('unlocked')}`
      : `${t('unlock', { cost: node.starCost })}`;

    const btnLabel = this.add.text(0, h / 2 - 22, btnLabelStr, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: isUnlocked ? '#ffffff' : (canAfford ? '#ffffff' : '#78716c'),
      stroke: isUnlocked ? '#064e3b' : '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, iconPedestal, icon, title, desc, btnBg, btnLabel]);

    if (!isUnlocked && canAfford) {
      container.setSize(w, h);
      container.setInteractive(SafeArea.createTouchHitbox(w, h), Phaser.Geom.Rectangle.Contains);
      attachSpringFeedback(container, this, {
        rippleColor: 0xfacc15,
        onClick: () => {
          const success = save.unlockHeroPerk(node.id, node.starCost);
          if (success) {
            AudioManager.getInstance().playUpgrade();
            HapticsManager.getInstance().victory();
            this.starText.setText(`⭐ ${save.getData().availableStars}`);
            this.scene.restart();
          }
        }
      });
    }
  }
}
