import Phaser from 'phaser';
import { LEVELS_CONFIG } from '../config/levelsConfig';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SafeArea, SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { attachSpringFeedback } from '../utils/UIFeedback';
import { t } from '../i18n/locales';
import { RELICS_CONFIG } from '../config/relicsConfig';

export class LevelSelectScene extends Phaser.Scene {
  private safeBounds!: SafeAreaBounds;
  private safeInsets!: SafeAreaInsets;

  constructor() {
    super('LevelSelectScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.safeInsets = SafeArea.getInsets(this);
    this.safeBounds = SafeArea.getBounds(this);
    const save = SaveManager.getInstance().getData();

    // 1. Fundo do Mapa Mundi Medieval em Pergaminho com Rosa dos Ventos
    this.createMedievalMapBackground(width, height);

    // 2. Cabeçalho Real Ancorado
    const headerY = this.safeInsets.top + 34;

    // Fita de Pergaminho do Título
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(0x2d180a, 0.95);
    ribbonG.fillRoundedRect(width / 2 - 170, headerY - 20, 340, 40, 8);
    ribbonG.lineStyle(2, 0xfacc15, 1);
    ribbonG.strokeRoundedRect(width / 2 - 170, headerY - 20, 340, 40, 8);
    ribbonG.lineStyle(1, 0x78350f, 0.8);
    ribbonG.strokeRoundedRect(width / 2 - 166, headerY - 16, 332, 32, 6);

    this.add.text(width / 2, headerY, `🗺️ ${t('level')}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#451a03',
      strokeThickness: 4,
      letterSpacing: 2
    }).setOrigin(0.5);

    // Botão Voltar (Estilo Escudo de Ferro e Ouro, Hitbox 105x48px)
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

    // Botão Desafio Diário (Top Center-Left, Hitbox 170x48px)
    const topModesY = headerY + 44;
    const dailyBtn = this.add.container(width / 2 - 130, topModesY);
    const dailyBg = this.add.graphics();
    dailyBg.fillStyle(0x064e3b, 0.96);
    dailyBg.fillRoundedRect(-85, -18, 170, 36, 8);
    dailyBg.lineStyle(1.5, 0x6ee7b7, 1);
    dailyBg.strokeRoundedRect(-85, -18, 170, 36, 8);
    const dailyTxt = this.add.text(0, 0, `📜 ${t('dailyChallenge')}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#064e3b',
      strokeThickness: 2
    }).setOrigin(0.5);
    dailyBtn.add([dailyBg, dailyTxt]);
    dailyBtn.setSize(170, 48);
    dailyBtn.setInteractive(SafeArea.createTouchHitbox(170, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(dailyBtn, this, {
      rippleColor: 0x6ee7b7,
      onClick: () => {
        this.scene.start('GameScene', { isDailyChallenge: true });
      }
    });

    // Botão Arena dos Chefes (Top Center-Right, Hitbox 170x48px)
    const bossRushBtn = this.add.container(width / 2 + 130, topModesY);
    const brBg = this.add.graphics();
    brBg.fillStyle(0x78350f, 0.96);
    brBg.fillRoundedRect(-85, -18, 170, 36, 8);
    brBg.lineStyle(1.5, 0xfde047, 1);
    brBg.strokeRoundedRect(-85, -18, 170, 36, 8);
    const brTxt = this.add.text(0, 0, `👑 ${t('bossRush')}`, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    bossRushBtn.add([brBg, brTxt]);
    bossRushBtn.setSize(170, 48);
    bossRushBtn.setInteractive(SafeArea.createTouchHitbox(170, 48), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(bossRushBtn, this, {
      rippleColor: 0xfde047,
      onClick: () => {
        this.scene.start('GameScene', { isBossRush: true });
      }
    });

    // Botão Relíquias Ancestrais (Abaixo dos outros modos, span full width)
    const relicsY = topModesY + 44;
    const relicsBtn = this.add.container(width / 2, relicsY);
    const relicsBg = this.add.graphics();
    relicsBg.fillStyle(0x3b0764, 0.96);
    relicsBg.fillRoundedRect(-160, -17, 320, 34, 8);
    relicsBg.lineStyle(1.5, 0xa78bfa, 1);
    relicsBg.strokeRoundedRect(-160, -17, 320, 34, 8);
    const relicsTxt = this.add.text(0, 0, '💎 Relíquias Ancestrais — Equipar (3 slots)', {
      fontSize: '12px', fontStyle: 'bold',
      color: '#e9d5ff', stroke: '#1e1b4b', strokeThickness: 2
    }).setOrigin(0.5);
    relicsBtn.add([relicsBg, relicsTxt]);
    relicsBtn.setSize(320, 44);
    relicsBtn.setInteractive(SafeArea.createTouchHitbox(320, 44), Phaser.Geom.Rectangle.Contains);

    attachSpringFeedback(relicsBtn, this, {
      rippleColor: 0xa78bfa,
      onClick: () => {
        this.openRelicsModal();
      }
    });

    // Contador de Estrelas Totais (Top Right Seguro, Hitbox 105x48px)
    const starCardX = this.safeBounds.right - 55;
    const starCard = this.add.container(starCardX, headerY);
    const starBg = this.add.graphics();
    starBg.fillStyle(0x1c140e, 0.95);
    starBg.fillRoundedRect(-48, -19, 96, 38, 8);
    starBg.lineStyle(2, 0xfacc15, 1);
    starBg.strokeRoundedRect(-48, -19, 96, 38, 8);
    const starTxt = this.add.text(0, 0, `⭐ ${save.availableStars}`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#451a03',
      strokeThickness: 2
    }).setOrigin(0.5);
    starCard.add([starBg, starTxt]);
    starCard.setSize(105, 48);
    starCard.setInteractive(SafeArea.createTouchHitbox(105, 48), Phaser.Geom.Rectangle.Contains);

    // 3. Grid 2x3 de Fases (6 Biomas/Fases Medievais) calculado com base na Safe Area
    const cardWidth = Math.min(360, (this.safeBounds.safeWidth - 40) / 3);
    const cardHeight = 240;
    const colSpacing = (this.safeBounds.safeWidth - cardWidth * 3) / 2;
    const startX = this.safeBounds.left + cardWidth / 2;
    const startY = topModesY + 170;
    const rowSpacing = cardHeight + 25;

    const biomeIcons: Record<number, string> = {
      1: '🌲', // Floresta dos Sussurros
      2: '🪓', // Ravina dos Orcs
      3: '❄️', // Cidadela Congelada
      4: '🌋', // Forjas de Magma dos Anões
      5: '🔮', // Ruínas Arcanas
      6: '🐉'  // Pináculo do Dragão
    };

    LEVELS_CONFIG.forEach((level, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const cardX = startX + col * (cardWidth + colSpacing);
      const cardY = startY + row * rowSpacing;

      const isUnlocked = save.unlockedLevels.includes(level.id);
      const starsEarned = save.levelStars[level.id] || 0;
      const bIcon = biomeIcons[level.id] || '🏰';

      this.createMedievalLevelCard(cardX, cardY, cardWidth, cardHeight, level, isUnlocked, starsEarned, bIcon);
    });
  }

  // ==========================================
  // MAPA MUNDI MEDIEVAL CARTOGRÁFICO
  // ==========================================
  private createMedievalMapBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    // Fundo de Pergaminho Envelhecido & Oceano Antigo
    bg.fillGradientStyle(0x1a120b, 0x1a120b, 0x2e1d11, 0x120c07, 1);
    bg.fillRect(0, 0, width, height);

    // Linhas Cartográficas de Navegação e Rotas Pontilhadas
    const mapLines = this.add.graphics();
    mapLines.lineStyle(1.5, 0x78350f, 0.4);
    // Linha de rota ligando os territórios
    mapLines.beginPath();
    mapLines.moveTo(width * 0.15, height * 0.45);
    mapLines.lineTo(width * 0.35, height * 0.52);
    mapLines.lineTo(width * 0.50, height * 0.38);
    mapLines.lineTo(width * 0.65, height * 0.58);
    mapLines.lineTo(width * 0.85, height * 0.42);
    mapLines.strokePath();

    // Rosa dos Ventos Heráldica Sutil no Fundo
    const compassX = width * 0.88;
    const compassY = height * 0.22;
    mapLines.lineStyle(1.5, 0xd97706, 0.25);
    mapLines.strokeCircle(compassX, compassY, 44);
    mapLines.strokeCircle(compassX, compassY, 20);
    // Pontas da Rosa dos Ventos
    mapLines.lineBetween(compassX, compassY - 50, compassX, compassY + 50);
    mapLines.lineBetween(compassX - 50, compassY, compassX + 50, compassY);
    mapLines.lineBetween(compassX - 35, compassY - 35, compassX + 35, compassY + 35);
    mapLines.lineBetween(compassX - 35, compassY + 35, compassX + 35, compassY - 35);

    // Partículas de Poeira Dourada & Bruma do Reino
    for (let i = 0; i < 35; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2.5),
        0xfacc15,
        Phaser.Math.FloatBetween(0.15, 0.55)
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(20, 50),
        alpha: { from: p.alpha, to: 0.05 },
        duration: Phaser.Math.Between(4000, 7500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // ==========================================
  // CARD DE FASE ESTILO PERGAMINHO & SELO REAL
  // ==========================================
  private createMedievalLevelCard(
    x: number,
    y: number,
    w: number,
    h: number,
    level: typeof LEVELS_CONFIG[0],
    isUnlocked: boolean,
    stars: number,
    biomeIcon: string
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    // Fundo do Card em Couro Nobre / Pergaminho Escuro
    bg.fillStyle(isUnlocked ? 0x24160c : 0x140e09, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    // Borda dupla em ouro imperial (ou ferro forjado se bloqueado)
    bg.lineStyle(2.5, isUnlocked ? 0xfacc15 : 0x44403c, isUnlocked ? 1.0 : 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(1, isUnlocked ? 0x92400e : 0x292524, 0.8);
    bg.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 12);

    // Fita de Pergaminho do Título no Topo
    const ribBg = this.add.graphics();
    ribBg.fillStyle(isUnlocked ? 0x3d2010 : 0x1c140e, 1);
    ribBg.fillRoundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, 36, 6);
    ribBg.lineStyle(1, isUnlocked ? 0xd97706 : 0x44403c, 0.8);
    ribBg.strokeRoundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, 36, 6);

    // Título da Fase com Ícone do Bioma
    const title = this.add.text(0, -h / 2 + 28, `${biomeIcon} ${level.name}`, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: isUnlocked ? '#fef08a' : '#78716c',
      stroke: '#29180e',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Descrição Cartográfica
    const desc = this.add.text(0, -h / 2 + 82, level.description, {
      fontSize: '11px',
      color: isUnlocked ? '#e7e5e4' : '#57534e',
      wordWrap: { width: w - 28 },
      align: 'center'
    }).setOrigin(0.5);

    // Selos de Estrelas Douradas da Vitória
    const starsContainer = this.add.container(0, 32);
    if (isUnlocked) {
      for (let s = 0; s < 3; s++) {
        const starX = (s - 1) * 32;
        const earned = s < stars;
        const sTxt = this.add.text(starX, 0, earned ? '⭐' : '☆', {
          fontSize: earned ? '22px' : '18px',
          color: earned ? '#facc15' : '#78716c'
        }).setOrigin(0.5);
        starsContainer.add(sTxt);
      }
    } else {
      const lockSeal = this.add.graphics();
      // Selo de cera vermelho escuro trancado
      lockSeal.fillStyle(0x7f1d1d, 1);
      lockSeal.fillCircle(0, 0, 16);
      const lockTxt = this.add.text(0, 0, '🔒', { fontSize: '16px' }).setOrigin(0.5);
      starsContainer.add([lockSeal, lockTxt]);
    }

    // Botão Jogar / Bloqueado (Hitbox 160x48px)
    const btnBg = this.add.graphics();
    btnBg.fillStyle(isUnlocked ? 0x1e3a8a : 0x1c140e, 1);
    btnBg.fillRoundedRect(-80, h / 2 - 48, 160, 38, 8);
    btnBg.lineStyle(2, isUnlocked ? 0x60a5fa : 0x44403c, 1);
    btnBg.strokeRoundedRect(-80, h / 2 - 48, 160, 38, 8);

    const btnLabel = this.add.text(0, h / 2 - 29, isUnlocked ? `⚔️ ${t('play')}` : t('locked'), {
      fontSize: '14px',
      fontStyle: 'bold',
      color: isUnlocked ? '#ffffff' : '#78716c',
      stroke: '#1e3a8a',
      strokeThickness: isUnlocked ? 2 : 0
    }).setOrigin(0.5);

    container.add([bg, ribBg, title, desc, starsContainer, btnBg, btnLabel]);

    if (isUnlocked) {
      container.setSize(w, h);
      container.setInteractive(SafeArea.createTouchHitbox(w, h), Phaser.Geom.Rectangle.Contains);
      attachSpringFeedback(container, this, {
        rippleColor: 0xfacc15,
        onClick: () => {
          this.scene.start('GameScene', { levelId: level.id, isEndless: false });
        }
      });
    }
  }

  /** 💎 Abre o modal de Relíquias Ancestrais em estilo pergaminho */
  private openRelicsModal(): void {
    const { width, height } = this.scale;
    const save = SaveManager.getInstance();
    const modalGroup: Phaser.GameObjects.GameObject[] = [];

    // Fundo escuro semi-transparente
    const overlay = this.add.graphics().setDepth(800);
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    modalGroup.push(overlay);

    // Painel de pergaminho
    const panelW = Math.min(520, width - 40);
    const panelH = 470;
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2;

    const panel = this.add.graphics().setDepth(801);
    panel.fillStyle(0x2d180a, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(3, 0xfacc15, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(1.5, 0x78350f, 0.6);
    panel.strokeRoundedRect(panelX + 6, panelY + 6, panelW - 12, panelH - 12, 12);
    modalGroup.push(panel);

    // Título
    const titleTxt = this.add.text(width / 2, panelY + 28, '💎 Relíquias Ancestrais', {
      fontSize: '20px', fontStyle: 'bold',
      color: '#fef08a', stroke: '#451a03', strokeThickness: 4
    }).setOrigin(0.5).setDepth(802);
    modalGroup.push(titleTxt);

    const subtitleTxt = this.add.text(width / 2, panelY + 54, '⚡ Equipe até 3 Relíquias — bônus passivos ativados no início da batalha', {
      fontSize: '11px', color: '#d6d3d1', stroke: '#1c1917', strokeThickness: 2
    }).setOrigin(0.5).setDepth(802);
    modalGroup.push(subtitleTxt);

    // Grade de relíquias (5 cards em 2+3 layout)
    const relicEntries = Object.values(RELICS_CONFIG);
    const cardW = (panelW - 48) / 2;
    const cardH = 78;
    const startX = panelX + 16;
    const startY = panelY + 76;
    const relicCards: Phaser.GameObjects.Container[] = [];

    relicEntries.forEach((relic, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = startX + col * (cardW + 12) + cardW / 2;
      const cy = startY + row * (cardH + 10) + cardH / 2;

      const isEquipped = save.isRelicEquipped(relic.id.toLowerCase());
      const isUnlocked = save.hasRelic(relic.id.toLowerCase());

      const card = this.add.container(cx, cy).setDepth(803);
      const bg = this.add.graphics();
      bg.fillStyle(isEquipped ? 0x1e1b4b : 0x1c0a02, isEquipped ? 0.95 : 0.8);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
      bg.lineStyle(2, isEquipped ? 0xa78bfa : 0x44403c, 1);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);

      const iconTxt = this.add.text(-cardW / 2 + 20, 0, relic.icon, { fontSize: '24px' }).setOrigin(0.5);
      const nameTxt = this.add.text(-cardW / 2 + 44, -14, relic.nameDefault, {
        fontSize: '11px', fontStyle: 'bold', color: relic.colorHex || '#ffffff',
        stroke: '#000', strokeThickness: 2, wordWrap: { width: cardW - 56 }
      });
      const descTxt = this.add.text(-cardW / 2 + 44, 2, relic.descDefault, {
        fontSize: '9px', color: '#a8a29e', wordWrap: { width: cardW - 56 }
      });
      const statusTxt = this.add.text(cardW / 2 - 4, -cardH / 2 + 6, isEquipped ? '✅ EQUIPADO' : (isUnlocked ? 'Toque p/ equipar' : '🔒'), {
        fontSize: '9px', fontStyle: 'bold',
        color: isEquipped ? '#4ade80' : '#78716c'
      }).setOrigin(1, 0);

      card.add([bg, iconTxt, nameTxt, descTxt, statusTxt]);
      card.setSize(cardW, cardH);
      card.setInteractive(SafeArea.createTouchHitbox(cardW, cardH), Phaser.Geom.Rectangle.Contains);

      if (isUnlocked) {
        attachSpringFeedback(card, this, {
          rippleColor: isEquipped ? 0xa78bfa : 0xfacc15,
          onClick: () => {
            save.toggleRelic(relic.id.toLowerCase());
            // Destroi e reabre modal atualizado
            modalGroup.forEach(o => (o as any).destroy?.());
            relicCards.forEach(c => c.destroy());
            this.openRelicsModal();
          }
        });
      }

      relicCards.push(card);
      modalGroup.push(card);
    });

    // Barra de slots equipados
    const slotBarY = panelY + panelH - 72;
    const equippedNow = save.getEquippedRelics();
    const slotTxt = this.add.text(width / 2, slotBarY, `SLOTS USADOS: ${equippedNow.length}/3`, {
      fontSize: '13px', fontStyle: 'bold',
      color: equippedNow.length >= 3 ? '#4ade80' : '#facc15',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(803);
    modalGroup.push(slotTxt);

    // Botão Fechar
    const closeBtn = this.add.container(width / 2, panelY + panelH - 30).setDepth(803);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x7f1d1d, 0.95);
    closeBg.fillRoundedRect(-70, -16, 140, 32, 8);
    closeBg.lineStyle(1.5, 0xfca5a5, 1);
    closeBg.strokeRoundedRect(-70, -16, 140, 32, 8);
    const closeTxt = this.add.text(0, 0, '✖ Fechar', {
      fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#450a0a', strokeThickness: 2
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setSize(140, 40);
    closeBtn.setInteractive(SafeArea.createTouchHitbox(140, 40), Phaser.Geom.Rectangle.Contains);
    attachSpringFeedback(closeBtn, this, {
      rippleColor: 0xfca5a5,
      onClick: () => {
        modalGroup.forEach(o => (o as any).destroy?.());
        relicCards.forEach(c => c.destroy());
        closeBtn.destroy();
      }
    });
  }
}
