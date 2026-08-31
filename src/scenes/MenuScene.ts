import Phaser from 'phaser';
import { t, setLanguage, getLanguage } from '../i18n/locales';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { getDailyChallenge, MODIFIER_INFO } from '../config/dailyChallengeConfig';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { attachSpringFeedback } from '../utils/UIFeedback';

export class MenuScene extends Phaser.Scene {
  private settingsModal: Phaser.GameObjects.Container | null = null;
  private achievementsModal: Phaser.GameObjects.Container | null = null;
  private dailyModal: Phaser.GameObjects.Container | null = null;
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);

    // 1. Fundo Arcano Cósmico com Partículas de Mana & Estrelas
    this.createBackground(width, height);

    // 2. Brasão Real & Título Épico do Reino
    const crestY = Math.max(this.safeInsets.top + 36, height * 0.08);
    this.createCoatOfArms(width / 2, crestY);

    const titleY = crestY + 54;
    // Título Principal com borda de ouro forjado e brilho arcano
    const titleText = this.add.text(width / 2, titleY, t('gameTitle'), {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 8,
      shadow: { blur: 18, color: '#f59e0b', fill: true }
    }).setOrigin(0.5);

    // Efeito de pulso de luz no título
    this.tweens.add({
      targets: titleText,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Fita de Pergaminho do Subtítulo
    const subtitleY = titleY + 36;
    const subRibbon = this.add.graphics();
    subRibbon.fillStyle(0x2d180a, 0.9);
    subRibbon.fillRoundedRect(width / 2 - 180, subtitleY - 14, 360, 28, 6);
    subRibbon.lineStyle(1.5, 0xd97706, 0.85);
    subRibbon.strokeRoundedRect(width / 2 - 180, subtitleY - 14, 360, 28, 6);

    this.add.text(width / 2, subtitleY, `⚔️ ${t('subtitle')} ⚔️`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fde68a',
      letterSpacing: 1
    }).setOrigin(0.5);

    // 3. Indicador Real de Estrelas / Honra (Top Right Seguro)
    const save = SaveManager.getInstance().getData();
    const starCardX = this.safeBounds.right - 65;
    const starCardY = this.safeInsets.top + 34;
    const starCard = this.add.container(starCardX, starCardY);

    const starBg = this.add.graphics();
    starBg.fillStyle(0x1c140e, 0.95);
    starBg.fillRoundedRect(-60, -20, 120, 40, 8);
    starBg.lineStyle(2, 0xfacc15, 1);
    starBg.strokeRoundedRect(-60, -20, 120, 40, 8);
    starBg.lineStyle(1, 0x92400e, 0.7);
    starBg.strokeRoundedRect(-57, -17, 114, 34, 6);

    // Gemas decorativas de canto
    starBg.fillStyle(0xef4444, 1);
    starBg.fillCircle(-52, 0, 3.5);
    starBg.fillCircle(52, 0, 3.5);

    const starTxt = this.add.text(0, 0, `⭐ ${save.availableStars}`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);

    starCard.add([starBg, starTxt]);
    starCard.setSize(120, 48);
    starCard.setInteractive(SafeArea.createTouchHitbox(120, 48), Phaser.Geom.Rectangle.Contains);

    // 4. Grid de Botões Nobres em Estandarte Real (2 Colunas Centralizadas)
    const colLeftX = width / 2 - 145;
    const colRightX = width / 2 + 145;
    const btnStartY = Math.max(subtitleY + 52, height * 0.32);
    const btnSpacing = 58;

    // Coluna 1 (Esquerda)
    this.createRoyalMenuButton(colLeftX, btnStartY, `⚔️ ${t('play')}`, 0x1e3a8a, 0x60a5fa, () => {
      this.scene.start('LevelSelectScene');
    });

    this.createRoyalMenuButton(colLeftX, btnStartY + btnSpacing, `📜 ${t('dailyChallenge')}`, 0x065f46, 0x34d399, () => {
      this.showDailyChallengeModal();
    });

    this.createRoyalMenuButton(colLeftX, btnStartY + btnSpacing * 2, `👑 ${t('bossRush')}`, 0x92400e, 0xfbbf24, () => {
      this.scene.start('GameScene', { isBossRush: true });
    });

    this.createRoyalMenuButton(colLeftX, btnStartY + btnSpacing * 3, `♾️ ${t('endless')}`, 0x581c87, 0xc084fc, () => {
      this.scene.start('GameScene', { levelId: 1, isEndless: true });
    });

    // Coluna 2 (Direita)
    this.createRoyalMenuButton(colRightX, btnStartY, `📖 ${t('techTree')}`, 0x115e59, 0x2dd4bf, () => {
      this.scene.start('TechTreeScene');
    });

    this.createRoyalMenuButton(colRightX, btnStartY + btnSpacing, `👑 ${t('heroTalents')}`, 0x78350f, 0xfacc15, () => {
      this.scene.start('HeroTalentsScene');
    });

    this.createRoyalMenuButton(colRightX, btnStartY + btnSpacing * 2, `🏆 ${t('achievements')}`, 0x3730a3, 0x818cf8, () => {
      this.showAchievementsModal();
    });

    this.createRoyalMenuButton(colRightX, btnStartY + btnSpacing * 3, `⚙️ ${t('settings')}`, 0x44403c, 0xa8a29e, () => {
      this.showSettingsModal();
    });

    // Rodapé de Honra - Recorde do Boss Rush
    if (save.bossRushBestWave > 0) {
      const footerY = Math.min(height - 24, btnStartY + btnSpacing * 3.8);
      const bestCard = this.add.container(width / 2, footerY);
      const bBg = this.add.graphics();
      bBg.fillStyle(0x2d180a, 0.9);
      bBg.fillRoundedRect(-140, -15, 280, 30, 8);
      bBg.lineStyle(1.5, 0xfacc15, 0.8);
      bBg.strokeRoundedRect(-140, -15, 280, 30, 8);

      const bTxt = this.add.text(0, 0, `👑 ${t('bossRushBest', { wave: save.bossRushBestWave })}`, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#facc15',
        stroke: '#451a03',
        strokeThickness: 2
      }).setOrigin(0.5);

      bestCard.add([bBg, bTxt]);
    }
  }

  // ==========================================
  // FUNDO ARCANO & PARTÍCULAS DE MANA
  // ==========================================
  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    // Gradiente imperial profundo: Noite Arcana -> Púrpura Celestial
    bg.fillGradientStyle(0x0c0a17, 0x0c0a17, 0x1a0f2e, 0x080612, 1);
    bg.fillRect(0, 0, width, height);

    // Círculo de Invocação Rúnico Sutil no Centro
    const runeCircle = this.add.graphics();
    runeCircle.lineStyle(1, 0x6366f1, 0.15);
    runeCircle.strokeCircle(width / 2, height / 2, 280);
    runeCircle.strokeCircle(width / 2, height / 2, 240);
    runeCircle.lineStyle(1, 0xfacc15, 0.12);
    runeCircle.strokeCircle(width / 2, height / 2, 200);

    // Efeito de rotação lenta no círculo rúnico
    this.tweens.add({
      targets: runeCircle,
      angle: 360,
      duration: 90000,
      repeat: -1
    });

    // Partículas de Mana Flutuantes (Safira, Ametista e Ouro Celestial)
    const colors = [0x38bdf8, 0xa855f7, 0xfacc15, 0x34d399];
    for (let i = 0; i < 50; i++) {
      const color = colors[i % colors.length];
      const radius = Phaser.Math.Between(1, 3);
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        radius,
        color,
        Phaser.Math.FloatBetween(0.2, 0.75)
      );

      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(30, 80),
        x: star.x + Phaser.Math.Between(-20, 20),
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(3500, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // ==========================================
  // BRASÃO REAL HERALDICO DOURADO
  // ==========================================
  private createCoatOfArms(x: number, y: number): void {
    const crest = this.add.graphics();

    // Espadas Cruzadas de Prata e Ouro atrás do escudo
    crest.lineStyle(4, 0x94a3b8, 0.9);
    crest.lineBetween(x - 32, y - 28, x + 32, y + 28);
    crest.lineBetween(x + 32, y - 28, x - 32, y + 28);
    // Cabos das espadas em ouro
    crest.fillStyle(0xfacc15, 1);
    crest.fillCircle(x - 32, y - 28, 4);
    crest.fillCircle(x + 32, y - 28, 4);
    crest.fillCircle(x - 32, y + 28, 4);
    crest.fillCircle(x + 32, y + 28, 4);

    // Escudo Heráldico Nobre
    crest.fillStyle(0x1e3a8a, 1);
    crest.fillTriangle(x - 22, y - 16, x + 22, y - 16, x, y + 24);
    crest.fillStyle(0x92400e, 1);
    crest.fillTriangle(x, y - 16, x + 22, y - 16, x, y + 24);

    crest.lineStyle(2.5, 0xfacc15, 1);
    crest.strokeTriangle(x - 22, y - 16, x + 22, y - 16, x, y + 24);

    // Coroa Real Imperial no Topo
    crest.fillStyle(0xfacc15, 1);
    crest.fillRect(x - 16, y - 26, 32, 6);
    crest.fillTriangle(x - 16, y - 26, x - 10, y - 36, x - 4, y - 26);
    crest.fillTriangle(x - 6, y - 26, x, y - 38, x + 6, y - 26);
    crest.fillTriangle(x + 4, y - 26, x + 10, y - 36, x + 16, y - 26);

    // Rubis da Coroa
    crest.fillStyle(0xef4444, 1);
    crest.fillCircle(x, y - 38, 2.5);
    crest.fillCircle(x - 10, y - 36, 2);
    crest.fillCircle(x + 10, y - 36, 2);
    crest.fillCircle(x, y - 23, 2);
  }

  // ==========================================
  // BOTÕES NOBRES COM MOLDURA DOURADA & PERGAMINHO
  // ==========================================
  private createRoyalMenuButton(
    x: number,
    y: number,
    text: string,
    baseColor: number,
    highlightColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    // Fundo nobre em couro escuro / ferro
    bg.fillStyle(0x1c140e, 0.96);
    bg.fillRoundedRect(-125, -23, 250, 46, 10);

    // Preenchimento de tom heráldico interior
    bg.fillStyle(baseColor, 0.85);
    bg.fillRoundedRect(-121, -19, 242, 38, 8);

    // Borda dupla em ouro forjado
    bg.lineStyle(2.5, 0xfacc15, 1);
    bg.strokeRoundedRect(-125, -23, 250, 46, 10);
    bg.lineStyle(1, 0x78350f, 0.8);
    bg.strokeRoundedRect(-122, -20, 244, 40, 7);

    // Cantoneiras douradas ornamentadas
    bg.fillStyle(0xfde047, 1);
    bg.fillRect(-123, -21, 5, 5);
    bg.fillRect(118, -21, 5, 5);
    bg.fillRect(-123, 16, 5, 5);
    bg.fillRect(118, 16, 5, 5);

    const label = this.add.text(0, 0, text, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1c1917',
      strokeThickness: 3,
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(250, 48);
    container.setInteractive(SafeArea.createTouchHitbox(250, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(container, this, {
      rippleColor: highlightColor,
      onClick
    });

    return container;
  }

  // ==========================================
  // SELO DE CERA VERMELHA IMPERIAL
  // ==========================================
  private drawWaxSeal(g: Phaser.GameObjects.Graphics, cx: number, cy: number, radius = 22): void {
    // Cera derretida com bordas orgânicas
    g.fillStyle(0x7f1d1d, 1);
    g.fillCircle(cx, cy, radius + 3);
    g.fillStyle(0x991b1b, 1);
    g.fillCircle(cx, cy, radius);
    g.fillStyle(0xb91c1c, 1);
    g.fillCircle(cx - 2, cy - 2, radius - 4);

    // Sinete dourado central
    g.lineStyle(1.5, 0xfacc15, 0.9);
    g.strokeCircle(cx, cy, radius - 7);
    g.fillStyle(0xfde047, 1);
    g.fillCircle(cx, cy, 3);
  }

  // ==========================================
  // MODAL: DESAFIO DIÁRIO (DECRETO REAL)
  // ==========================================
  private showDailyChallengeModal(): void {
    if (this.dailyModal) this.dailyModal.destroy();

    const { width, height } = this.scale;
    const daily = getDailyChallenge();
    const save = SaveManager.getInstance();
    const isCompleted = save.isDailyChallengeCompleted(daily.dateStr);

    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    // Caixa de Pergaminho Real Antigo
    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-245, -185, 490, 370, 16);
    // Borda de Ouro Nobre e Filigrana
    box.lineStyle(3, 0xd97706, 1);
    box.strokeRoundedRect(-245, -185, 490, 370, 16);
    box.lineStyle(1.5, 0xfacc15, 0.8);
    box.strokeRoundedRect(-239, -179, 478, 358, 12);

    // Selo de Cera no Topo Esquerdo
    this.drawWaxSeal(box, -210, -150, 18);

    const title = this.add.text(10, -145, `📜 ${t('dailyChallengeTitle')}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fde047',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const dateTxt = this.add.text(0, -114, `${daily.dateStr} • Recompensa Real: +${daily.rewardStars} ⭐`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);

    const desc = this.add.text(0, -86, t('dailyChallengeDesc'), {
      fontSize: '12px',
      color: '#d6d3d1',
      align: 'center',
      wordWrap: { width: 440 }
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title, dateTxt, desc];

    // Modificadores Ativos
    daily.modifiers.forEach((mod, idx) => {
      const info = MODIFIER_INFO[mod];
      const rowY = -42 + idx * 56;

      const mBg = this.add.graphics();
      mBg.fillStyle(0x29180e, 0.95);
      mBg.fillRoundedRect(-200, rowY, 400, 46, 8);
      mBg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(info.colorHex).color, 0.85);
      mBg.strokeRoundedRect(-200, rowY, 400, 46, 8);

      const icon = this.add.text(-175, rowY + 23, info.icon, { fontSize: '20px' }).setOrigin(0.5);
      const name = this.add.text(-150, rowY + 14, t(info.nameKey as any), {
        fontSize: '13px',
        fontStyle: 'bold',
        color: info.colorHex
      }).setOrigin(0, 0.5);

      const dTxt = this.add.text(-150, rowY + 32, t(info.descKey as any), {
        fontSize: '10.5px',
        color: '#d6d3d1'
      }).setOrigin(0, 0.5);

      items.push(mBg, icon, name, dTxt);
    });

    // Botão Iniciar Batalha (Hitbox 210x48px)
    const playBtn = this.add.container(0, 118);
    const pBg = this.add.graphics();
    pBg.fillStyle(isCompleted ? 0x064e3b : 0x047857, 1);
    pBg.fillRoundedRect(-105, -22, 210, 44, 8);
    pBg.lineStyle(2, 0x6ee7b7, 1);
    pBg.strokeRoundedRect(-105, -22, 210, 44, 8);

    const pTxt = this.add.text(0, 0, isCompleted ? `✓ ${t('dailyCompleted')}` : `⚔️ ${t('play')}`, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#064e3b',
      strokeThickness: 2
    }).setOrigin(0.5);

    playBtn.add([pBg, pTxt]);
    playBtn.setSize(210, 48);
    playBtn.setInteractive(SafeArea.createTouchHitbox(210, 48), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(playBtn, this, {
      rippleColor: 0x34d399,
      onClick: () => {
        modal.destroy();
        this.dailyModal = null;
        this.scene.start('GameScene', { isDailyChallenge: true, dailyDate: daily.dateStr, modifiers: daily.modifiers });
      }
    });

    // Fechar (Selo Vermelho de Fechar 48x48px)
    const closeBtn = this.add.container(218, -158);
    const closeG = this.add.graphics();
    this.drawWaxSeal(closeG, 0, 0, 16);
    const closeTxt = this.add.text(0, 0, '✕', { fontSize: '15px', fontStyle: 'bold', color: '#fef08a' }).setOrigin(0.5);
    closeBtn.add([closeG, closeTxt]);
    closeBtn.setSize(48, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(48, 48), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xef4444,
      onClick: () => {
        modal.destroy();
        this.dailyModal = null;
      }
    });

    items.push(playBtn, closeBtn);
    modal.add(items);
    this.dailyModal = modal;
  }

  // ==========================================
  // MODAL: DECRETOS REAIS (CONFIGURAÇÕES)
  // ==========================================
  private showSettingsModal(): void {
    if (this.settingsModal) this.settingsModal.destroy();

    const { width, height } = this.scale;
    const save = SaveManager.getInstance();
    const data = save.getData();

    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-245, -205, 490, 410, 16);
    box.lineStyle(3, 0xd97706, 1);
    box.strokeRoundedRect(-245, -205, 490, 410, 16);
    box.lineStyle(1.5, 0xfacc15, 0.8);
    box.strokeRoundedRect(-239, -199, 478, 398, 12);

    this.drawWaxSeal(box, -210, -170, 18);

    const title = this.add.text(10, -168, `⚙️ ${t('settings')}`, {
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#fde047',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    // 1. Idioma Real
    const langBtn = this.createParchmentToggle(0, -118, `🌐 ${t('language')}: ${getLanguage().toUpperCase()}`, () => {
      const nextLang = getLanguage() === 'pt' ? 'en' : 'pt';
      setLanguage(nextLang);
      data.settings.language = nextLang;
      save.save();
      this.scene.restart();
    });

    // 2. Efeitos Sonoros
    const sfxBtn = this.createParchmentToggle(0, -62, `🔊 ${t('sound')}: ${data.settings.sfxEnabled ? 'ON' : 'OFF'}`, () => {
      data.settings.sfxEnabled = !data.settings.sfxEnabled;
      save.save();
      AudioManager.getInstance().updateVolumes();
      this.showSettingsModal();
    });

    // 3. Alto Contraste Real
    const isHC = save.isHighContrast();
    const hcBtn = this.createParchmentToggle(0, -6, `👁️ ${t('highContrast')}: ${isHC ? t('highContrastOn') : t('highContrastOff')}`, () => {
      save.setHighContrast(!isHC);
      this.showSettingsModal();
    });

    // 4. Vibração Tátil
    const hapBtn = this.createParchmentToggle(0, 50, `📳 ${t('haptics')}: ${data.settings.hapticsEnabled ? 'ON' : 'OFF'}`, () => {
      data.settings.hapticsEnabled = !data.settings.hapticsEnabled;
      save.save();
      this.showSettingsModal();
    });

    // 5. Botão Voltar (Hitbox 160x48px)
    const closeBtn = this.add.container(0, 134);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x7f1d1d, 0.95);
    closeBg.fillRoundedRect(-80, -22, 160, 44, 8);
    closeBg.lineStyle(2, 0xfca5a5, 1);
    closeBg.strokeRoundedRect(-80, -22, 160, 44, 8);
    const closeTxt = this.add.text(0, 0, t('back'), { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setSize(160, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(160, 48), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xef4444,
      onClick: () => {
        modal.destroy();
        this.settingsModal = null;
      }
    });

    items.push(langBtn, sfxBtn, hcBtn, hapBtn, closeBtn);
    modal.add(items);
    this.settingsModal = modal;
  }

  // ==========================================
  // MODAL: TÍTULOS DE HONRA (CONQUISTAS)
  // ==========================================
  private showAchievementsModal(): void {
    if (this.achievementsModal) this.achievementsModal.destroy();

    const { width, height } = this.scale;
    const save = SaveManager.getInstance().getData();

    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(999);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.82);
    overlay.setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a120b, 0.98);
    box.fillRoundedRect(-305, -225, 610, 450, 16);
    box.lineStyle(3, 0xd97706, 1);
    box.strokeRoundedRect(-305, -225, 610, 450, 16);
    box.lineStyle(1.5, 0xfacc15, 0.8);
    box.strokeRoundedRect(-299, -219, 598, 438, 12);

    this.drawWaxSeal(box, -265, -185, 20);

    const title = this.add.text(10, -182, `🏆 ${t('achievements')}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 3
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [overlay, box, title];

    const sampleAchievements = [
      { id: 'first_kill', name: 'Primeiro Sangue Real', desc: 'Elimine o seu primeiro invasor das trevas.', icon: '🎯' },
      { id: 'perfect_defense', name: 'Defesa Inabalável', desc: 'Vença uma batalha sem perder nenhuma vida do reino.', icon: '🛡️' },
      { id: 'max_tower', name: 'Mestria Arcana', desc: 'Evolua uma torre defensiva até o Grau 3 ou Superior.', icon: '⭐' },
      { id: 'daily_master', name: 'Estrategista Real', desc: 'Cumpra um Decreto Diário com glória.', icon: '📜' },
      { id: 'boss_rush_champion', name: 'Caçador de Titãs', desc: 'Sobreviva a ondas na Arena dos Chefes Colossais.', icon: '👑' }
    ];

    sampleAchievements.forEach((ach, index) => {
      const isUnlocked = save.achievements.includes(ach.id);
      const rowY = -132 + index * 57;

      const rowBg = this.add.graphics();
      rowBg.fillStyle(isUnlocked ? 0x2d180a : 0x160f08, 0.95);
      rowBg.fillRoundedRect(-265, rowY, 530, 48, 8);
      rowBg.lineStyle(1.5, isUnlocked ? 0xfacc15 : 0x44403c, 0.8);
      rowBg.strokeRoundedRect(-265, rowY, 530, 48, 8);

      const iconTxt = this.add.text(-235, rowY + 24, ach.icon, { fontSize: '22px' }).setOrigin(0.5);
      const nameTxt = this.add.text(-205, rowY + 14, ach.name, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: isUnlocked ? '#facc15' : '#a8a29e'
      }).setOrigin(0, 0.5);
      const descTxt = this.add.text(-205, rowY + 32, ach.desc, {
        fontSize: '11px',
        color: '#d6d3d1'
      }).setOrigin(0, 0.5);

      const statusTxt = this.add.text(235, rowY + 24, isUnlocked ? '✓ HONRA' : '🔒', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: isUnlocked ? '#22c55e' : '#78716c'
      }).setOrigin(0.5);

      items.push(rowBg, iconTxt, nameTxt, descTxt, statusTxt);
    });

    const closeBtn = this.add.container(0, 180);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x7f1d1d, 0.92);
    closeBg.fillRoundedRect(-80, -22, 160, 44, 8);
    closeBg.lineStyle(2, 0xfca5a5, 1);
    closeBg.strokeRoundedRect(-80, -22, 160, 44, 8);
    const closeTxt = this.add.text(0, 0, t('back'), { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setSize(160, 48);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(160, 48), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xef4444,
      onClick: () => {
        modal.destroy();
        this.achievementsModal = null;
      }
    });

    items.push(closeBtn);
    modal.add(items);
    this.achievementsModal = modal;
  }

  // ==========================================
  // COMPONENTE: TOGGLE EM PERGAMINHO
  // ==========================================
  private createParchmentToggle(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x29180e, 1);
    bg.fillRoundedRect(-165, -22, 330, 44, 8);
    bg.lineStyle(1.5, 0xd97706, 0.8);
    bg.strokeRoundedRect(-165, -22, 330, 44, 8);

    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(330, 48);
    container.setInteractive(SafeArea.createTouchHitbox(330, 48), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(container, this, {
      rippleColor: 0xfacc15,
      onClick
    });

    return container;
  }
}
