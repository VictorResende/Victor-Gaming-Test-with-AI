import Phaser from 'phaser';

/**
 * AssetGenerator - Gerador Procedural de Texturas 100% Medieval & Fantasia Mágica.
 * Transforma todas as torres, heróis, inimigos, projéteis, cenários e UI
 * em um estilo visual Kingdom Rush / Fantasia Medieval épica.
 */
export class AssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    this.createTileAndDecoTextures(scene);
    this.createKingdomTowers(scene);
    this.createTier4Towers(scene);
    this.createKingdomEnemies(scene);
    this.createKingdomProjectiles(scene);
    this.createKingdomParticles(scene);
    this.createKingdomUI(scene);
    this.createKingdomHeroes(scene);
    this.createKingdomHeroPortraits(scene);
    this.createKingdomHeroAbilities(scene);
    this.createHeroFXTextures(scene);
    this.createBiomeTextures(scene);
    this.createObstacleTextures(scene);
    this.createEnvironmentalTextures(scene);
    this.createCombatAndCinematicFXTextures(scene);
  }

  // ==========================================
  // 1. TERRENO, TRILHAS E ELEMENTOS DE CENÁRIO
  // ==========================================
  private static createTileAndDecoTextures(scene: Phaser.Scene): void {
    // 1. Chão de Terra e Grama Medieval (kr_ground) - 128x128
    const gGround = scene.make.graphics({ x: 0, y: 0 });
    // Fundo de terra fértil e relva
    gGround.fillStyle(0x3e522d, 1); // Verde musgo florestal base
    gGround.fillRect(0, 0, 128, 128);

    // Manchas de grama mais clara e relevo
    gGround.fillStyle(0x4d6637, 0.85);
    gGround.fillCircle(32, 36, 26);
    gGround.fillCircle(96, 88, 30);
    gGround.fillCircle(84, 30, 20);
    gGround.fillCircle(28, 98, 18);

    // Trilha de terra batida e pedrinhas
    gGround.fillStyle(0x5c442c, 0.7);
    gGround.fillCircle(64, 64, 28);
    gGround.fillCircle(50, 48, 16);
    gGround.fillCircle(78, 80, 18);

    // Paralelepípedos / Pedras de calçamento antigo
    const cobbles = [
      { x: 38, y: 52, r: 6 },
      { x: 54, y: 44, r: 8 },
      { x: 70, y: 58, r: 7 },
      { x: 58, y: 76, r: 9 },
      { x: 86, y: 72, r: 6 },
      { x: 104, y: 24, r: 5 },
      { x: 20, y: 82, r: 5 }
    ];
    cobbles.forEach(c => {
      gGround.fillStyle(0x292524, 0.7); // Sombra da pedra
      gGround.fillCircle(c.x + 1, c.y + 2, c.r);
      gGround.fillStyle(0x78716c, 0.95); // Corpo da pedra
      gGround.fillCircle(c.x, c.y, c.r);
      gGround.fillStyle(0xa8a29e, 0.9); // Brilho de topo
      gGround.fillCircle(c.x - 1, c.y - 1, c.r * 0.5);
    });

    // Florezinhas silvestres (vermelhas e azuis com centro dourado)
    gGround.fillStyle(0xe11d48, 0.9);
    gGround.fillCircle(18, 22, 3);
    gGround.fillCircle(112, 102, 3);
    gGround.fillStyle(0x38bdf8, 0.9);
    gGround.fillCircle(108, 48, 3);
    gGround.fillCircle(40, 110, 3);
    gGround.fillStyle(0xfde047, 1);
    gGround.fillCircle(18, 22, 1.2);
    gGround.fillCircle(112, 102, 1.2);
    gGround.fillCircle(108, 48, 1.2);
    gGround.fillCircle(40, 110, 1.2);

    gGround.generateTexture('kr_ground', 128, 128);
    gGround.destroy();

    // 2. Slot de Construção: Círculo de Invocação Rúnico (kr_build_slot) - 72x72
    const gSlot = scene.make.graphics({ x: 0, y: 0 });
    // Sombra profunda do pedestal
    gSlot.fillStyle(0x14100c, 0.65);
    gSlot.fillEllipse(36, 44, 34, 16);

    // Dais de pedra entalhada
    gSlot.fillStyle(0x2e261f, 1);
    gSlot.fillCircle(36, 36, 30);
    gSlot.lineStyle(3, 0x18120c, 1);
    gSlot.strokeCircle(36, 36, 30);

    // Laje central de pedra rúnica
    gSlot.fillStyle(0x4a3d31, 1);
    gSlot.fillCircle(36, 34, 24);
    gSlot.lineStyle(2, 0x6e5c4c, 1);
    gSlot.strokeCircle(36, 34, 24);

    // Círculo Rúnico Dourado e Mágico
    gSlot.lineStyle(2, 0xf59e0b, 0.9);
    gSlot.strokeCircle(36, 34, 18);
    gSlot.lineStyle(1, 0xfde047, 0.7);
    gSlot.strokeCircle(36, 34, 13);

    // Estrela de 4 pontas / Glifos arcanos
    gSlot.fillStyle(0xf59e0b, 0.85);
    gSlot.beginPath();
    gSlot.moveTo(36, 19);
    gSlot.lineTo(39, 31);
    gSlot.lineTo(51, 34);
    gSlot.lineTo(39, 37);
    gSlot.lineTo(36, 49);
    gSlot.lineTo(33, 37);
    gSlot.lineTo(21, 34);
    gSlot.lineTo(33, 31);
    gSlot.closePath();
    gSlot.fillPath();

    // Núcleo de Mana Brilhante
    gSlot.fillStyle(0x06b6d4, 0.9);
    gSlot.fillCircle(36, 34, 5);
    gSlot.fillStyle(0xffffff, 1);
    gSlot.fillCircle(36, 34, 2);

    gSlot.generateTexture('kr_build_slot', 72, 72);
    gSlot.destroy();

    // 3. Forja / Caldeirão Alquímico de Latão (deco_boiler) - 90x90
    const gBoiler = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gBoiler.fillStyle(0x18110b, 0.7);
    gBoiler.fillEllipse(45, 80, 40, 14);

    // Suporte e base de ferro forjado
    gBoiler.fillStyle(0x1f2937, 1);
    gBoiler.fillRect(20, 68, 10, 14);
    gBoiler.fillRect(60, 68, 10, 14);
    gBoiler.fillRect(40, 70, 10, 12);

    // Caldeirão de Bronze / Cobre Arcano
    gBoiler.fillStyle(0x78350f, 1);
    gBoiler.fillCircle(45, 50, 32);
    gBoiler.fillStyle(0x9a3412, 1);
    gBoiler.fillCircle(43, 47, 27);
    gBoiler.fillStyle(0xc2410c, 1);
    gBoiler.fillCircle(40, 44, 18);
    gBoiler.lineStyle(3, 0x451a03, 1);
    gBoiler.strokeCircle(45, 50, 32);

    // Aro de boca do caldeirão com rebites de ouro
    gBoiler.fillStyle(0xd97706, 1);
    gBoiler.fillEllipse(45, 26, 28, 10);
    gBoiler.lineStyle(2, 0x78350f, 1);
    gBoiler.strokeEllipse(45, 26, 28, 10);

    // Poção mágica borbulhante violeta / verde esmeralda
    gBoiler.fillStyle(0x8b5cf6, 1);
    gBoiler.fillEllipse(45, 26, 22, 7);
    gBoiler.fillStyle(0xd8b4fe, 0.9);
    gBoiler.fillCircle(40, 25, 4);
    gBoiler.fillCircle(50, 27, 3);
    gBoiler.fillCircle(45, 24, 2);

    // Rebites de ouro no corpo
    gBoiler.fillStyle(0xfde047, 1);
    gBoiler.fillCircle(24, 52, 3);
    gBoiler.fillCircle(45, 68, 3);
    gBoiler.fillCircle(66, 52, 3);

    gBoiler.generateTexture('deco_boiler', 90, 90);
    gBoiler.destroy();

    // 4. Barril de Carvalho com Hidromel (deco_barrel) - 32x32
    const gBarrel = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gBarrel.fillStyle(0x18110b, 0.6);
    gBarrel.fillEllipse(16, 28, 14, 6);

    // Corpo do barril de madeira de carvalho
    gBarrel.fillStyle(0x78350f, 1);
    gBarrel.fillRoundedRect(4, 4, 24, 24, 6);
    gBarrel.fillStyle(0x92400e, 1);
    gBarrel.fillRect(7, 4, 18, 24);
    gBarrel.lineStyle(2, 0x451a03, 1);
    gBarrel.strokeRoundedRect(4, 4, 24, 24, 6);

    // Aros de ferro negro forjado
    gBarrel.fillStyle(0x27272a, 1);
    gBarrel.fillRect(4, 8, 24, 3);
    gBarrel.fillRect(4, 20, 24, 3);
    gBarrel.lineStyle(1, 0x09090b, 1);
    gBarrel.strokeRect(4, 8, 24, 3);
    gBarrel.strokeRect(4, 20, 24, 3);

    // Torneira de latão / rolha
    gBarrel.fillStyle(0xd97706, 1);
    gBarrel.fillRect(14, 14, 4, 4);
    gBarrel.fillStyle(0xfde047, 1);
    gBarrel.fillCircle(16, 16, 1.5);

    gBarrel.generateTexture('deco_barrel', 32, 32);
    gBarrel.destroy();

    // 5. Tocha de Castelo de Ferro Forjado com Chamas Vivas (deco_torch) - 32x36
    const gTorch = scene.make.graphics({ x: 0, y: 0 });
    // Haste de madeira escura
    gTorch.fillStyle(0x451a03, 1);
    gTorch.fillRect(13, 16, 6, 18);
    gTorch.lineStyle(1, 0x1c1917, 1);
    gTorch.strokeRect(13, 16, 6, 18);

    // Cesta de ferro forjado / braçadeira
    gTorch.fillStyle(0x27272a, 1);
    gTorch.fillRect(9, 12, 14, 6);
    gTorch.fillStyle(0x52525b, 1);
    gTorch.fillRect(10, 13, 12, 2);
    gTorch.lineStyle(1, 0x09090b, 1);
    gTorch.strokeRect(9, 12, 14, 6);

    // Chamas vivas em camadas (Laranja -> Amarelo -> Branco incandescente)
    gTorch.fillStyle(0xea580c, 0.95);
    gTorch.beginPath();
    gTorch.moveTo(16, 1);
    gTorch.lineTo(24, 10);
    gTorch.lineTo(21, 14);
    gTorch.lineTo(11, 14);
    gTorch.lineTo(8, 10);
    gTorch.closePath();
    gTorch.fillPath();

    gTorch.fillStyle(0xf97316, 1);
    gTorch.fillCircle(16, 9, 6);
    gTorch.fillStyle(0xfde047, 1);
    gTorch.fillCircle(16, 8, 4);
    gTorch.fillStyle(0xffffff, 1);
    gTorch.fillCircle(16, 7, 2);

    gTorch.generateTexture('deco_torch', 32, 36);
    gTorch.destroy();

    // 6. Plinto de Caveira Rúnica (deco_skull_marker) - 48x48
    const gSkullMarker = scene.make.graphics({ x: 0, y: 0 });
    gSkullMarker.fillStyle(0x18110b, 0.6);
    gSkullMarker.fillCircle(24, 26, 21);

    // Laje de pedra escura
    gSkullMarker.fillStyle(0x292524, 1);
    gSkullMarker.fillCircle(24, 24, 20);
    gSkullMarker.lineStyle(2, 0x57534e, 0.9);
    gSkullMarker.strokeCircle(24, 24, 20);

    // Runa de sangue / magia negra
    gSkullMarker.lineStyle(2, 0xb91c1c, 0.85);
    gSkullMarker.strokeCircle(24, 24, 15);

    // Caveira talhada em marfim antigo
    gSkullMarker.fillStyle(0xd6d3d1, 1);
    gSkullMarker.fillCircle(24, 20, 10);
    gSkullMarker.fillRect(19, 24, 10, 8);
    // Olhos e mandíbula com brilho vermelho maligno
    gSkullMarker.fillStyle(0x7f1d1d, 1);
    gSkullMarker.fillCircle(21, 19, 3);
    gSkullMarker.fillCircle(27, 19, 3);
    gSkullMarker.fillRect(20, 28, 8, 3);
    gSkullMarker.fillStyle(0xef4444, 1);
    gSkullMarker.fillCircle(21, 19, 1.5);
    gSkullMarker.fillCircle(27, 19, 1.5);

    gSkullMarker.generateTexture('deco_skull_marker', 48, 48);
    gSkullMarker.destroy();
  }

  // ==========================================
  // 2. TORRES ESTILO KINGDOM RUSH / FANTASY
  // ==========================================
  private static createKingdomTowers(scene: Phaser.Scene): void {
    // 1. Base Universal de Alvenaria Medieval (tower_base) - 72x72
    const gBase = scene.make.graphics({ x: 0, y: 0 });
    // Sombra profunda
    gBase.fillStyle(0x14100c, 0.65);
    gBase.fillEllipse(36, 46, 33, 15);

    // Fundação de rocha granítica
    gBase.fillStyle(0x38332e, 1);
    gBase.fillCircle(36, 36, 31);
    gBase.lineStyle(3, 0x1c1917, 1);
    gBase.strokeCircle(36, 36, 31);

    // Parapeito com blocos de pedra
    gBase.fillStyle(0x574f46, 1);
    gBase.fillCircle(36, 33, 25);
    gBase.lineStyle(2, 0x786f63, 1);
    gBase.strokeCircle(36, 33, 25);

    // Divisões dos blocos de cantaria
    gBase.lineStyle(1.5, 0x27221c, 0.9);
    gBase.lineBetween(18, 25, 26, 33);
    gBase.lineBetween(46, 41, 54, 49);
    gBase.lineBetween(36, 12, 36, 22);

    // Musgo antigo nos cantos
    gBase.fillStyle(0x4d6637, 0.8);
    gBase.fillCircle(20, 42, 4);
    gBase.fillCircle(50, 22, 3.5);

    gBase.generateTexture('tower_base', 72, 72);
    gBase.destroy();

    // 2. Torre Balista Élfica / Arbaleste (GATLING -> turret_gatling) - 72x72
    const gGatling = scene.make.graphics({ x: 0, y: 0 });
    // Parapeito de carvalho reforçado com ferro
    gGatling.fillStyle(0x54361c, 1);
    gGatling.fillRoundedRect(16, 16, 40, 40, 8);
    gGatling.fillStyle(0x784a27, 1);
    gGatling.fillRoundedRect(18, 18, 36, 36, 6);
    gGatling.lineStyle(3, 0x2d1a0e, 1);
    gGatling.strokeRoundedRect(16, 16, 40, 40, 8);

    // Placas de ferro dos cantos com rebites dourados
    gGatling.fillStyle(0x27272a, 1);
    gGatling.fillRect(16, 16, 8, 8);
    gGatling.fillRect(48, 16, 8, 8);
    gGatling.fillRect(16, 48, 8, 8);
    gGatling.fillRect(48, 48, 8, 8);
    gGatling.fillStyle(0xfde047, 1);
    gGatling.fillCircle(20, 20, 2);
    gGatling.fillCircle(52, 20, 2);
    gGatling.fillCircle(20, 52, 2);
    gGatling.fillCircle(52, 52, 2);

    // Dupla Balista / Arbaleste Pesado de Guerra
    // Arco esquerdo
    gGatling.fillStyle(0x92400e, 1);
    gGatling.fillRect(23, 2, 7, 26);
    gGatling.lineStyle(2, 0x2d1a0e, 1);
    gGatling.strokeRect(23, 2, 7, 26);
    // Arco direito
    gGatling.fillStyle(0x92400e, 1);
    gGatling.fillRect(42, 2, 7, 26);
    gGatling.lineStyle(2, 0x2d1a0e, 1);
    gGatling.strokeRect(42, 2, 7, 26);

    // Hastes curvas de teixo / aço
    gGatling.lineStyle(3, 0x71717a, 1);
    gGatling.beginPath();
    gGatling.moveTo(13, 10);
    gGatling.lineTo(26, 6);
    gGatling.lineTo(33, 10);
    gGatling.strokePath();

    gGatling.beginPath();
    gGatling.moveTo(39, 10);
    gGatling.lineTo(46, 6);
    gGatling.lineTo(59, 10);
    gGatling.strokePath();

    // Dardos / Virolotes de ferro carregados
    gGatling.fillStyle(0xe2e8f0, 1);
    gGatling.fillRect(25, -2, 3, 12);
    gGatling.fillRect(44, -2, 3, 12);
    gGatling.fillStyle(0x38bdf8, 1);
    gGatling.fillCircle(26.5, -1, 2.5);
    gGatling.fillCircle(45.5, -1, 2.5);

    // Emblema Élfico central
    gGatling.fillStyle(0x10b981, 1);
    gGatling.fillCircle(36, 36, 8);
    gGatling.fillStyle(0xfde047, 1);
    gGatling.fillCircle(36, 36, 4);

    gGatling.generateTexture('turret_gatling', 72, 72);
    gGatling.destroy();

    // 3. Bombarda / Catapulta Anã de Fogo (CANNON -> turret_cannon) - 72x72
    const gCannon = scene.make.graphics({ x: 0, y: 0 });
    // Cúpula / Forja de Bronze e Ferro fundido
    gCannon.fillStyle(0x451a03, 1);
    gCannon.fillCircle(36, 38, 25);
    gCannon.fillStyle(0x78350f, 1);
    gCannon.fillCircle(34, 35, 20);
    gCannon.fillStyle(0x9a3412, 1);
    gCannon.fillCircle(32, 33, 14);
    gCannon.lineStyle(3, 0x1f1207, 1);
    gCannon.strokeCircle(36, 38, 25);

    // Cano Pesado de Artilharia de Ferro Escuro
    gCannon.fillStyle(0x27272a, 1);
    gCannon.fillRect(27, 2, 18, 34);
    gCannon.fillStyle(0x3f3f46, 1);
    gCannon.fillRect(29, 4, 14, 30);
    gCannon.lineStyle(3, 0x09090b, 1);
    gCannon.strokeRect(27, 2, 18, 34);

    // Bocal Reforçado com Anel de Latão e Runas Anãs
    gCannon.fillStyle(0xd97706, 1);
    gCannon.fillRect(24, 0, 24, 8);
    gCannon.lineStyle(2, 0x78350f, 1);
    gCannon.strokeRect(24, 0, 24, 8);

    // Boca do canhão com brasas ardentes
    gCannon.fillStyle(0x18110b, 1);
    gCannon.fillEllipse(36, 3, 9, 3);
    gCannon.fillStyle(0xea580c, 1);
    gCannon.fillCircle(36, 3, 2.5);

    // Rebites dourados no corpo da forja
    gCannon.fillStyle(0xfde047, 1);
    gCannon.fillCircle(20, 42, 3);
    gCannon.fillCircle(52, 42, 3);
    gCannon.fillCircle(36, 54, 3);

    gCannon.generateTexture('turret_cannon', 72, 72);
    gCannon.destroy();

    // 4. Pináculo / Santuário do Mago de Gelo (CRYO -> turret_cryo) - 72x72
    const gCryo = scene.make.graphics({ x: 0, y: 0 });
    // Pedestal de rocha gélida
    gCryo.fillStyle(0x1e293b, 1);
    gCryo.fillCircle(36, 38, 25);
    gCryo.lineStyle(3, 0x0f172a, 1);
    gCryo.strokeCircle(36, 38, 25);

    // Círculo rúnico de gelo ciano
    gCryo.lineStyle(2, 0x06b6d4, 0.9);
    gCryo.strokeCircle(36, 38, 19);

    // Obelisco de Cristal de Gelo Eterno
    gCryo.fillStyle(0x0284c7, 1);
    gCryo.beginPath();
    gCryo.moveTo(36, 6);
    gCryo.lineTo(49, 28);
    gCryo.lineTo(36, 48);
    gCryo.lineTo(23, 28);
    gCryo.closePath();
    gCryo.fillPath();

    // Facetas iluminadas do cristal
    gCryo.fillStyle(0x38bdf8, 1);
    gCryo.beginPath();
    gCryo.moveTo(36, 6);
    gCryo.lineTo(49, 28);
    gCryo.lineTo(36, 28);
    gCryo.closePath();
    gCryo.fillPath();

    gCryo.fillStyle(0xe0f2fe, 0.9);
    gCryo.fillCircle(36, 26, 6);
    gCryo.lineStyle(2, 0xffffff, 1);
    gCryo.strokePath();

    // Fragmentos de gelo flutuantes ao redor
    gCryo.fillStyle(0x38bdf8, 1);
    gCryo.fillCircle(14, 22, 4);
    gCryo.fillCircle(58, 22, 4);
    gCryo.fillCircle(36, 56, 3.5);
    gCryo.fillStyle(0xffffff, 1);
    gCryo.fillCircle(14, 22, 1.5);
    gCryo.fillCircle(58, 22, 1.5);

    gCryo.generateTexture('turret_cryo', 72, 72);
    gCryo.destroy();

    // 5. Pináculo Arcano do Arquimago (LASER -> turret_laser) - 72x72
    const gLaser = scene.make.graphics({ x: 0, y: 0 });
    // Torre de obsidiana púrpura com detalhes em ouro
    gLaser.fillStyle(0x2e1065, 1);
    gLaser.fillRoundedRect(18, 18, 36, 38, 10);
    gLaser.fillStyle(0x4c1d95, 1);
    gLaser.fillRoundedRect(22, 22, 28, 30, 8);
    gLaser.lineStyle(3, 0x0f051d, 1);
    gLaser.strokeRoundedRect(18, 18, 36, 38, 10);

    // Pilares de sustentação de ouro arcano
    gLaser.fillStyle(0xd97706, 1);
    gLaser.fillRect(18, 26, 4, 24);
    gLaser.fillRect(50, 26, 4, 24);
    gLaser.fillStyle(0xfde047, 1);
    gLaser.fillCircle(20, 26, 3);
    gLaser.fillCircle(52, 26, 3);

    // Runa do Olho do Vazio
    gLaser.fillStyle(0xa855f7, 1);
    gLaser.fillCircle(36, 36, 9);
    gLaser.fillStyle(0xf3e8ff, 1);
    gLaser.fillCircle(36, 36, 4);

    // Cristal de Mana Violeta Flutuante no Topo
    gLaser.fillStyle(0xc084fc, 1);
    gLaser.beginPath();
    gLaser.moveTo(36, 2);
    gLaser.lineTo(46, 16);
    gLaser.lineTo(36, 26);
    gLaser.lineTo(26, 16);
    gLaser.closePath();
    gLaser.fillPath();

    gLaser.fillStyle(0xffffff, 0.95);
    gLaser.fillCircle(36, 16, 4);
    gLaser.lineStyle(2, 0xf3e8ff, 1);
    gLaser.strokePath();

    gLaser.generateTexture('turret_laser', 72, 72);
    gLaser.destroy();

    // 6. Templo do Trovão e Tempestade (TESLA -> turret_tesla) - 72x72
    const gTesla = scene.make.graphics({ x: 0, y: 0 });
    // Dais de latão sagrado e rocha
    gTesla.fillStyle(0x713f12, 1);
    gTesla.fillCircle(36, 38, 24);
    gTesla.fillStyle(0xa16207, 1);
    gTesla.fillCircle(36, 35, 18);
    gTesla.lineStyle(3, 0x422006, 1);
    gTesla.strokeCircle(36, 38, 24);

    // Hastes de para-raios de ouro com runas de tempestade
    gTesla.fillStyle(0xca8a04, 1);
    gTesla.fillRect(16, 16, 6, 26);
    gTesla.fillRect(50, 16, 6, 26);
    gTesla.fillStyle(0xfde047, 1);
    gTesla.fillCircle(19, 14, 4);
    gTesla.fillCircle(53, 14, 4);

    // Orbe da Tempestade / Eletricidade Divina
    gTesla.fillStyle(0x0284c7, 0.85);
    gTesla.fillCircle(36, 20, 15);
    gTesla.fillStyle(0x38bdf8, 1);
    gTesla.fillCircle(36, 19, 10);
    gTesla.fillStyle(0xfef08a, 1);
    gTesla.fillCircle(36, 18, 6);
    gTesla.fillStyle(0xffffff, 1);
    gTesla.fillCircle(36, 17, 3);
    gTesla.lineStyle(2, 0xfffbeb, 1);
    gTesla.strokeCircle(36, 20, 15);

    gTesla.generateTexture('turret_tesla', 72, 72);
    gTesla.destroy();

    // 7. Torre da Bruxa Oracular (WITCH -> turret_witch) - 72x72
    // Inspirada na referência: maga de capuz violeta canalizando um orbe azul elétrico.
    const gWitch = scene.make.graphics({ x: 0, y: 0 });
    // Plataforma de pedra e magia runica
    gWitch.fillStyle(0x1e1b4b, 1);
    gWitch.fillCircle(36, 44, 24);
    gWitch.lineStyle(3, 0x6d28d9, 1);
    gWitch.strokeCircle(36, 44, 24);
    gWitch.lineStyle(1.5, 0x38bdf8, 0.85);
    gWitch.strokeCircle(36, 44, 17);

    // Manto azul e chapéu violeta da oráculo
    gWitch.fillStyle(0x1d4ed8, 1);
    gWitch.fillRoundedRect(25, 34, 19, 24, 6);
    gWitch.fillStyle(0xfacc15, 1);
    gWitch.fillRect(26, 43, 17, 3);
    gWitch.fillStyle(0xa855f7, 1);
    gWitch.beginPath();
    gWitch.moveTo(22, 36);
    gWitch.lineTo(35, 4);
    gWitch.lineTo(48, 36);
    gWitch.closePath();
    gWitch.fillPath();
    gWitch.fillStyle(0xc084fc, 1);
    gWitch.fillCircle(35, 32, 11);
    gWitch.fillStyle(0xf3c6a5, 1);
    gWitch.fillCircle(35, 34, 7);

    // Cajado e orbe de tempestade em levitação
    gWitch.lineStyle(4, 0x7c4a24, 1);
    gWitch.lineBetween(45, 51, 55, 18);
    gWitch.fillStyle(0x0284c7, 0.9);
    gWitch.fillCircle(57, 14, 11);
    gWitch.fillStyle(0x38bdf8, 1);
    gWitch.fillCircle(55, 12, 7);
    gWitch.fillStyle(0xffffff, 1);
    gWitch.fillCircle(53, 10, 3);
    gWitch.lineStyle(2, 0xe0f2fe, 0.9);
    gWitch.strokeCircle(57, 14, 11);
    gWitch.generateTexture('turret_witch', 72, 72);
    gWitch.destroy();
  }

  // ==========================================
  // 2.5 TORRES TIER 4 (EVOLUÇÃO RAMIFICADA)
  // ==========================================
  private static createTier4Towers(scene: Phaser.Scene): void {
    // 1. Multi-Balista Repetidora Élfica (turret_gatling_vulcan) - 72x72
    const gVulcan = scene.make.graphics({ x: 0, y: 0 });
    gVulcan.fillStyle(0x14532d, 1); // Madeira de floresta sagrada
    gVulcan.fillRoundedRect(14, 14, 44, 44, 10);
    gVulcan.lineStyle(3, 0x16a34a, 1);
    gVulcan.strokeRoundedRect(14, 14, 44, 44, 10);

    // Tambor de engrenagens élficas douradas
    gVulcan.fillStyle(0xd97706, 1);
    gVulcan.fillCircle(36, 36, 16);
    gVulcan.fillStyle(0xfde047, 1);
    gVulcan.fillCircle(36, 36, 7);

    // 4 Balistas / Arcos Quádruplos de Repetição
    for (let i = 0; i < 4; i++) {
      const bx = 22 + i * 9;
      gVulcan.fillStyle(0x78350f, 1);
      gVulcan.fillRect(bx - 2, 2, 5, 24);
      gVulcan.fillStyle(0x22c55e, 1);
      gVulcan.fillCircle(bx + 0.5, 2, 3);
      gVulcan.fillStyle(0xffffff, 1);
      gVulcan.fillCircle(bx + 0.5, 2, 1);
    }
    gVulcan.generateTexture('turret_gatling_vulcan', 72, 72);
    gVulcan.destroy();

    // 2. Grande Arbaleste de Precisão (turret_gatling_sniper) - 72x72
    const gSniper = scene.make.graphics({ x: 0, y: 0 });
    gSniper.fillStyle(0x064e3b, 1);
    gSniper.fillRoundedRect(16, 20, 40, 36, 8);
    gSniper.lineStyle(3, 0x10b981, 1);
    gSniper.strokeRoundedRect(16, 20, 40, 36, 8);

    // Haste de lança-virolote longo de mithril
    gSniper.fillStyle(0x1e293b, 1);
    gSniper.fillRect(32, -8, 8, 44);
    gSniper.fillStyle(0x38bdf8, 1);
    gSniper.fillRect(34, -12, 4, 10);

    // Mira mágica de cristal de esmeralda
    gSniper.fillStyle(0x10b981, 0.9);
    gSniper.fillCircle(24, 28, 7);
    gSniper.fillStyle(0xffffff, 1);
    gSniper.fillCircle(24, 28, 2.5);
    gSniper.generateTexture('turret_gatling_sniper', 72, 72);
    gSniper.destroy();

    // 3. Bateria de Foguetes de Fogo de Dragão (turret_cannon_missiles) - 72x72
    const gMissiles = scene.make.graphics({ x: 0, y: 0 });
    gMissiles.fillStyle(0x451a03, 1);
    gMissiles.fillRoundedRect(12, 14, 48, 44, 8);
    gMissiles.lineStyle(3, 0xd97706, 1);
    gMissiles.strokeRoundedRect(12, 14, 48, 44, 8);

    // 4 Canos de disparo de projéteis de dragão
    const pods = [{ x: 20, y: 20 }, { x: 38, y: 20 }, { x: 20, y: 38 }, { x: 38, y: 38 }];
    pods.forEach(p => {
      gMissiles.fillStyle(0x27272a, 1);
      gMissiles.fillCircle(p.x + 7, p.y + 7, 8);
      gMissiles.fillStyle(0xef4444, 1);
      gMissiles.fillCircle(p.x + 7, p.y + 5, 5);
      gMissiles.fillStyle(0xfde047, 1);
      gMissiles.fillCircle(p.x + 7, p.y + 4, 2.5);
    });
    gMissiles.generateTexture('turret_cannon_missiles', 72, 72);
    gMissiles.destroy();

    // 4. Caldeirão do Cataclismo / Bombarda Titânica (turret_cannon_nuclear) - 72x72
    const gNuke = scene.make.graphics({ x: 0, y: 0 });
    gNuke.fillStyle(0x271206, 1);
    gNuke.fillCircle(36, 40, 25);
    gNuke.lineStyle(3, 0xef4444, 1);
    gNuke.strokeCircle(36, 40, 25);

    // Morteiro colossal de latão e rocha vulcânica
    gNuke.fillStyle(0x18181b, 1);
    gNuke.fillRect(22, 0, 28, 38);
    gNuke.fillStyle(0xf97316, 1);
    gNuke.fillRect(20, -3, 32, 9);

    // Núcleo de lava incandescente apocalíptica
    gNuke.fillStyle(0xea580c, 1);
    gNuke.fillCircle(36, 42, 9);
    gNuke.fillStyle(0xfde047, 1);
    gNuke.fillCircle(36, 42, 4);
    gNuke.generateTexture('turret_cannon_nuclear', 72, 72);
    gNuke.destroy();

    // 5. Monólito do Arquonte Glacial (turret_cryo_blizzard) - 72x72
    const gBlizzard = scene.make.graphics({ x: 0, y: 0 });
    gBlizzard.fillStyle(0x0c4a6e, 1);
    gBlizzard.fillCircle(36, 36, 27);
    gBlizzard.lineStyle(3, 0x38bdf8, 1);
    gBlizzard.strokeCircle(36, 36, 27);

    // 4 Cristais de gelo perene giratórios
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const cx = 36 + Math.cos(angle) * 16;
      const cy = 36 + Math.sin(angle) * 16;
      gBlizzard.fillStyle(0x06b6d4, 1);
      gBlizzard.fillCircle(cx, cy, 7);
      gBlizzard.fillStyle(0xffffff, 1);
      gBlizzard.fillCircle(cx, cy, 2.5);
    }
    // Olho da Nevasca
    gBlizzard.fillStyle(0xe0f2fe, 0.95);
    gBlizzard.fillCircle(36, 36, 11);
    gBlizzard.generateTexture('turret_cryo_blizzard', 72, 72);
    gBlizzard.destroy();

    // 6. Câmara do Zero Absoluto (turret_cryo_zero) - 72x72
    const gZero = scene.make.graphics({ x: 0, y: 0 });
    gZero.fillStyle(0x164e63, 1);
    gZero.fillRoundedRect(14, 16, 44, 40, 10);
    gZero.lineStyle(3, 0x22d3ee, 1);
    gZero.strokeRoundedRect(14, 16, 44, 40, 10);

    // Prismas criogênicos duplos de geada estelar
    gZero.fillStyle(0x0891b2, 1);
    gZero.fillRect(22, 2, 10, 24);
    gZero.fillRect(40, 2, 10, 24);
    gZero.fillStyle(0xffffff, 1);
    gZero.fillCircle(27, 4, 3.5);
    gZero.fillCircle(45, 4, 3.5);
    gZero.generateTexture('turret_cryo_zero', 72, 72);
    gZero.destroy();

    // 7. Pináculo do Fogo Solar (turret_laser_orbital) - 72x72
    const gOrbital = scene.make.graphics({ x: 0, y: 0 });
    gOrbital.fillStyle(0x451a03, 1);
    gOrbital.fillCircle(36, 36, 27);
    gOrbital.lineStyle(3, 0xf59e0b, 1);
    gOrbital.strokeCircle(36, 36, 27);

    // Disco solar dourado de feixe flamejante
    gOrbital.fillStyle(0xf97316, 1);
    gOrbital.fillCircle(36, 36, 16);
    gOrbital.fillStyle(0xfde047, 1);
    gOrbital.fillCircle(36, 36, 8);
    gOrbital.fillStyle(0xffffff, 1);
    gOrbital.fillCircle(36, 36, 3.5);
    gOrbital.generateTexture('turret_laser_orbital', 72, 72);
    gOrbital.destroy();

    // 8. Prisma do Vazio / Grimoire Prism (turret_laser_prism) - 72x72
    const gPrism = scene.make.graphics({ x: 0, y: 0 });
    gPrism.fillStyle(0x3b0764, 1);
    gPrism.fillRoundedRect(16, 16, 40, 40, 8);
    gPrism.lineStyle(3, 0xc084fc, 1);
    gPrism.strokeRoundedRect(16, 16, 40, 40, 8);

    // Prisma arcano multifacetado
    gPrism.fillStyle(0xa855f7, 1);
    gPrism.beginPath();
    gPrism.moveTo(36, 4);
    gPrism.lineTo(50, 24);
    gPrism.lineTo(36, 44);
    gPrism.lineTo(22, 24);
    gPrism.closePath();
    gPrism.fillPath();
    gPrism.fillStyle(0xffffff, 1);
    gPrism.fillCircle(36, 24, 5.5);
    gPrism.generateTexture('turret_laser_prism', 72, 72);
    gPrism.destroy();

    // 9. Cidadela da Tempestade Celestial (turret_tesla_storm) - 72x72
    const gStorm = scene.make.graphics({ x: 0, y: 0 });
    gStorm.fillStyle(0x082f49, 1);
    gStorm.fillCircle(36, 38, 25);
    gStorm.lineStyle(3, 0x38bdf8, 1);
    gStorm.strokeCircle(36, 38, 25);

    // Torres triplas de latão e tempestade
    gStorm.fillStyle(0x0284c7, 1);
    gStorm.fillRect(20, 8, 6, 28);
    gStorm.fillRect(33, 2, 6, 34);
    gStorm.fillRect(46, 8, 6, 28);
    // Orbe de relâmpagos
    gStorm.fillStyle(0xbae6fd, 1);
    gStorm.fillCircle(36, 14, 13);
    gStorm.fillStyle(0xffffff, 1);
    gStorm.fillCircle(36, 14, 6);
    gStorm.generateTexture('turret_tesla_storm', 72, 72);
    gStorm.destroy();

    // 10. Obelisco da Fúria de Thor (turret_tesla_plasma) - 72x72
    const gPlasma = scene.make.graphics({ x: 0, y: 0 });
    gPlasma.fillStyle(0x422006, 1);
    gPlasma.fillRoundedRect(14, 16, 44, 40, 10);
    gPlasma.lineStyle(3, 0xfacc15, 1);
    gPlasma.strokeRoundedRect(14, 16, 44, 40, 10);

    // Pilares condutores de ouro rúnico
    gPlasma.fillStyle(0x713f12, 1);
    gPlasma.fillRect(24, 0, 8, 30);
    gPlasma.fillRect(40, 0, 8, 30);
    gPlasma.fillStyle(0xfde047, 1);
    gPlasma.fillCircle(28, 2, 4.5);
    gPlasma.fillCircle(44, 2, 4.5);
    gPlasma.generateTexture('turret_tesla_plasma', 72, 72);
    gPlasma.destroy();
  }

  // ==========================================
  // 3. INIMIGOS ESTILO MEDIEVAL FANTASIA
  // ==========================================
  private static createKingdomEnemies(scene: Phaser.Scene): void {
    // 1. Goblin Batedor Ladino (SCOUT -> enemy_scout) - 36x36
    const gScout = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gScout.fillStyle(0x18110b, 0.5);
    gScout.fillEllipse(18, 30, 14, 6);

    // Orelhas pontudas de Goblin
    gScout.fillStyle(0x4d7c0f, 1);
    gScout.beginPath();
    gScout.moveTo(8, 14);
    gScout.lineTo(2, 10);
    gScout.lineTo(8, 18);
    gScout.closePath();
    gScout.fillPath();

    gScout.beginPath();
    gScout.moveTo(28, 14);
    gScout.lineTo(34, 10);
    gScout.lineTo(28, 18);
    gScout.closePath();
    gScout.fillPath();

    // Rosto verde goblin
    gScout.fillStyle(0x65a30d, 1);
    gScout.fillCircle(18, 18, 11);
    gScout.lineStyle(2, 0x1a2e05, 1);
    gScout.strokeCircle(18, 18, 11);

    // Capuz / Capuz de couro costurado
    gScout.fillStyle(0x78350f, 1);
    gScout.fillRect(11, 9, 14, 7);

    // Olhos amarelos penetrantes
    gScout.fillStyle(0xfacc15, 1);
    gScout.fillCircle(14, 18, 2.5);
    gScout.fillCircle(22, 18, 2.5);
    gScout.fillStyle(0x1c1917, 1);
    gScout.fillCircle(14, 18, 1);
    gScout.fillCircle(22, 18, 1);

    // Adaga curva de ferro na mão
    gScout.fillStyle(0xe2e8f0, 1);
    gScout.fillRect(28, 10, 3, 14);
    gScout.fillStyle(0x78350f, 1);
    gScout.fillRect(27, 20, 5, 4);

    gScout.generateTexture('enemy_scout', 36, 36);
    gScout.destroy();

    // 2. Orc Guerreiro de Armadura de Ferro & Escudo (SOLDIER -> enemy_soldier) - 40x40
    const gSoldier = scene.make.graphics({ x: 0, y: 0 });
    gSoldier.fillStyle(0x18110b, 0.6);
    gSoldier.fillEllipse(20, 34, 18, 7);

    // Cota de malha e armadura de placas de ferro escuro
    gSoldier.fillStyle(0x3f3f46, 1);
    gSoldier.fillRoundedRect(8, 8, 24, 24, 6);
    gSoldier.lineStyle(3, 0x09090b, 1);
    gSoldier.strokeRoundedRect(8, 8, 24, 24, 6);

    // Capacete com chifres pontiagudos de ferro
    gSoldier.fillStyle(0xf8fafc, 1);
    gSoldier.beginPath();
    gSoldier.moveTo(6, 14);
    gSoldier.lineTo(2, 5);
    gSoldier.lineTo(12, 10);
    gSoldier.closePath();
    gSoldier.fillPath();

    gSoldier.beginPath();
    gSoldier.moveTo(34, 14);
    gSoldier.lineTo(38, 5);
    gSoldier.lineTo(28, 10);
    gSoldier.closePath();
    gSoldier.fillPath();

    // Olhos vermelhos no visor de ferro
    gSoldier.fillStyle(0xef4444, 1);
    gSoldier.fillRect(13, 15, 4, 3);
    gSoldier.fillRect(23, 15, 4, 3);

    // Escudo redondo de madeira e rebites de aço
    gSoldier.fillStyle(0x991b1b, 1);
    gSoldier.fillCircle(12, 23, 8);
    gSoldier.lineStyle(2, 0xfde047, 1);
    gSoldier.strokeCircle(12, 23, 8);
    gSoldier.fillStyle(0x27272a, 1);
    gSoldier.fillCircle(12, 23, 3);

    gSoldier.generateTexture('enemy_soldier', 40, 40);
    gSoldier.destroy();

    // 3. Golem de Rocha e Magma (TANK -> enemy_tank) - 52x52
    const gTank = scene.make.graphics({ x: 0, y: 0 });
    gTank.fillStyle(0x18110b, 0.7);
    gTank.fillEllipse(26, 44, 26, 9);

    // Corpo maciço de basalto vulcânico rachado
    gTank.fillStyle(0x271a10, 1);
    gTank.fillCircle(26, 24, 20);
    gTank.lineStyle(3, 0x0c0a09, 1);
    gTank.strokeCircle(26, 24, 20);

    // Fissuras de lava quente
    gTank.lineStyle(2, 0xea580c, 1);
    gTank.lineBetween(16, 16, 26, 24);
    gTank.lineBetween(36, 16, 26, 24);
    gTank.lineBetween(26, 24, 26, 38);

    // Coração pulsante de Magma no Peito
    gTank.fillStyle(0xf97316, 1);
    gTank.fillCircle(26, 24, 9);
    gTank.fillStyle(0xfde047, 1);
    gTank.fillCircle(26, 24, 4.5);

    // Punhos / Ombros de pedra titânica
    gTank.fillStyle(0x44403c, 1);
    gTank.fillCircle(10, 14, 8);
    gTank.fillCircle(42, 14, 8);
    gTank.lineStyle(2, 0x1c1917, 1);
    gTank.strokeCircle(10, 14, 8);
    gTank.strokeCircle(42, 14, 8);

    gTank.generateTexture('enemy_tank', 52, 52);
    gTank.destroy();

    // 4. Gárgula Alada das Trevas (FLYER -> enemy_flyer) - 40x36
    const gFlyer = scene.make.graphics({ x: 0, y: 0 });
    // Asas góticas de morcego / gárgula
    gFlyer.fillStyle(0x4c1d95, 1);
    gFlyer.beginPath();
    gFlyer.moveTo(20, 6);
    gFlyer.lineTo(38, 2);
    gFlyer.lineTo(32, 22);
    gFlyer.lineTo(20, 18);
    gFlyer.lineTo(8, 22);
    gFlyer.lineTo(2, 2);
    gFlyer.closePath();
    gFlyer.fillPath();
    gFlyer.lineStyle(2, 0x2e1065, 1);
    gFlyer.strokePath();

    // Corpo de pedra obsidiana e cabeça com chifres
    gFlyer.fillStyle(0x6b21a8, 1);
    gFlyer.fillCircle(20, 16, 7);
    gFlyer.fillStyle(0xfde047, 1); // Olhos amarelos brilhantes
    gFlyer.fillCircle(18, 15, 2);
    gFlyer.fillCircle(22, 15, 2);

    gFlyer.generateTexture('enemy_flyer', 40, 36);
    gFlyer.destroy();

    // 5. Dragão Ancião / Senhor da Morte (BOSS -> enemy_boss) - 72x72
    const gBoss = scene.make.graphics({ x: 0, y: 0 });
    gBoss.fillStyle(0x18110b, 0.8);
    gBoss.fillEllipse(36, 62, 34, 12);

    // Armadura de Placas Negras e Carmesim
    gBoss.fillStyle(0x450a0a, 1);
    gBoss.fillCircle(36, 34, 28);
    gBoss.fillStyle(0x7f1d1d, 1);
    gBoss.fillCircle(36, 32, 22);
    gBoss.lineStyle(4, 0x1f0707, 1);
    gBoss.strokeCircle(36, 34, 28);

    // Caveira Dourada Flamejante no Peitoral
    gBoss.fillStyle(0xf59e0b, 1);
    gBoss.fillCircle(36, 32, 9);
    gBoss.fillStyle(0x1c1917, 1);
    gBoss.fillCircle(33, 30, 2.5);
    gBoss.fillCircle(39, 30, 2.5);

    // Chifres Dracônicos Colossais
    gBoss.fillStyle(0xf8fafc, 1);
    gBoss.beginPath();
    gBoss.moveTo(16, 20);
    gBoss.lineTo(4, 4);
    gBoss.lineTo(24, 12);
    gBoss.closePath();
    gBoss.fillPath();

    gBoss.beginPath();
    gBoss.moveTo(56, 20);
    gBoss.lineTo(68, 4);
    gBoss.lineTo(48, 12);
    gBoss.closePath();
    gBoss.fillPath();
    gBoss.lineStyle(2, 0x0f172a, 1);
    gBoss.strokePath();

    // Machados Duplos de Batalha nas costas
    gBoss.fillStyle(0x94a3b8, 1);
    gBoss.fillRect(6, 38, 10, 18);
    gBoss.fillRect(56, 38, 10, 18);

    gBoss.generateTexture('enemy_boss', 72, 72);
    gBoss.destroy();

    // 6. Invocador Necromante (CARRIER -> enemy_carrier) - 64x64
    const gCarrier = scene.make.graphics({ x: 0, y: 0 });
    gCarrier.fillStyle(0x18110b, 0.7);
    gCarrier.fillEllipse(32, 54, 30, 10);

    // Manto tétrico com capuz roxo escuro
    gCarrier.fillStyle(0x2e1065, 1);
    gCarrier.fillRoundedRect(12, 10, 40, 44, 12);
    gCarrier.lineStyle(3, 0x0f051d, 1);
    gCarrier.strokeRoundedRect(12, 10, 40, 44, 12);

    // Capuz e olhos espectrais verdes
    gCarrier.fillStyle(0x18181b, 1);
    gCarrier.fillCircle(32, 22, 10);
    gCarrier.fillStyle(0x22c55e, 1);
    gCarrier.fillCircle(29, 21, 2.5);
    gCarrier.fillCircle(35, 21, 2.5);

    // Cajado de osso com crânio necromântico
    gCarrier.fillStyle(0xe2e8f0, 1);
    gCarrier.fillRect(48, 8, 4, 46);
    gCarrier.fillCircle(50, 8, 6);
    gCarrier.fillStyle(0x22c55e, 1);
    gCarrier.fillCircle(50, 8, 3);

    // Círculo de invocação espectral no chão
    gCarrier.lineStyle(2, 0x22c55e, 0.8);
    gCarrier.strokeCircle(32, 38, 12);

    gCarrier.generateTexture('enemy_carrier', 64, 64);
    gCarrier.destroy();

    // 7. Sacerdote Arcano / Clérigo Protetor (SHIELDER -> enemy_shielder) - 48x48
    const gShielder = scene.make.graphics({ x: 0, y: 0 });
    gShielder.fillStyle(0x082f49, 0.6);
    gShielder.fillEllipse(24, 40, 22, 8);

    // Manto cerimonial ciano e dourado
    gShielder.fillStyle(0x0e7490, 1);
    gShielder.fillCircle(24, 24, 18);
    gShielder.lineStyle(3, 0x083344, 1);
    gShielder.strokeCircle(24, 24, 18);

    // Capuz e amuleto sagrado
    gShielder.fillStyle(0xfde047, 1);
    gShielder.fillCircle(24, 24, 7);
    gShielder.fillStyle(0x06b6d4, 1);
    gShielder.fillCircle(24, 24, 3.5);

    // Sigilos de barreira flutuantes
    gShielder.fillStyle(0x38bdf8, 1);
    gShielder.fillCircle(24, 8, 4);
    gShielder.fillCircle(24, 40, 4);
    gShielder.fillCircle(8, 24, 4);
    gShielder.fillCircle(40, 24, 4);

    gShielder.generateTexture('enemy_shielder', 48, 48);
    gShielder.destroy();

    // 8. Assassino das Sombras (STEALTH -> enemy_stealth) - 40x40
    const gStealth = scene.make.graphics({ x: 0, y: 0 });
    gStealth.fillStyle(0x0f172a, 0.5);
    gStealth.fillEllipse(20, 34, 18, 6);

    // Manto de sombras esvoaçante
    gStealth.fillStyle(0x18181b, 1);
    gStealth.beginPath();
    gStealth.moveTo(20, 4);
    gStealth.lineTo(36, 32);
    gStealth.lineTo(20, 26);
    gStealth.lineTo(4, 32);
    gStealth.closePath();
    gStealth.fillPath();
    gStealth.lineStyle(2, 0x3b0764, 1);
    gStealth.strokePath();

    // Máscara e olhos venenosos
    gStealth.fillStyle(0x10b981, 1);
    gStealth.fillCircle(17, 16, 2);
    gStealth.fillCircle(23, 16, 2);

    // Adagas com lâminas envenenadas
    gStealth.fillStyle(0x10b981, 1);
    gStealth.fillRect(4, 20, 3, 10);
    gStealth.fillRect(33, 20, 3, 10);

    gStealth.generateTexture('enemy_stealth', 40, 40);
    gStealth.destroy();

    // 9. Minion Esqueleto Reanimado (MINI_DRONE -> enemy_mini_drone) - 24x24
    const gDrone = scene.make.graphics({ x: 0, y: 0 });
    gDrone.fillStyle(0x0f172a, 0.5);
    gDrone.fillEllipse(12, 20, 10, 4);

    // Caveira de osso
    gDrone.fillStyle(0xf1f5f9, 1);
    gDrone.fillCircle(12, 10, 6);
    gDrone.lineStyle(1.5, 0x334155, 1);
    gDrone.strokeCircle(12, 10, 6);

    // Órbitas oculares vazias
    gDrone.fillStyle(0x0f172a, 1);
    gDrone.fillCircle(10, 10, 1.5);
    gDrone.fillCircle(14, 10, 1.5);

    // Pequena espada enferrujada
    gDrone.fillStyle(0x94a3b8, 1);
    gDrone.fillRect(19, 6, 2, 12);
    gDrone.fillStyle(0x78350f, 1);
    gDrone.fillRect(18, 14, 4, 2);

    gDrone.generateTexture('enemy_mini_drone', 24, 24);
    gDrone.destroy();

    // 10. Bolha de Barreira Sagrada / Arcana (shield_bubble) - 160x160
    const gBubble = scene.make.graphics({ x: 0, y: 0 });
    gBubble.fillStyle(0x06b6d4, 0.18);
    gBubble.fillCircle(80, 80, 72);
    gBubble.lineStyle(3, 0x38bdf8, 0.85);
    gBubble.strokeCircle(80, 80, 72);
    gBubble.lineStyle(1.5, 0xfde047, 0.7);
    gBubble.strokeCircle(80, 80, 65);

    gBubble.generateTexture('shield_bubble', 160, 160);
    gBubble.destroy();

    // 11. Xamã Goblin Curandeiro (SHAMAN -> enemy_shaman) - 44x44
    const gShaman = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gShaman.fillStyle(0x18110b, 0.55);
    gShaman.fillEllipse(22, 36, 18, 6);

    // Orelhas pontudas de Goblin Xamã
    gShaman.fillStyle(0x3f6212, 1);
    gShaman.beginPath();
    gShaman.moveTo(11, 16);
    gShaman.lineTo(3, 11);
    gShaman.lineTo(11, 20);
    gShaman.closePath();
    gShaman.fillPath();

    gShaman.beginPath();
    gShaman.moveTo(33, 16);
    gShaman.lineTo(41, 11);
    gShaman.lineTo(33, 20);
    gShaman.closePath();
    gShaman.fillPath();

    // Brinco de osso na orelha
    gShaman.fillStyle(0xfde047, 1);
    gShaman.fillCircle(4, 13, 1.5);

    // Manto tribal de folhas e couro druídico
    gShaman.fillStyle(0x14532d, 1);
    gShaman.fillRoundedRect(10, 12, 24, 26, 6);
    gShaman.lineStyle(2, 0x052e16, 1);
    gShaman.strokeRoundedRect(10, 12, 24, 26, 6);

    // Máscara tribal de madeira com pintura ritual
    gShaman.fillStyle(0x78350f, 1);
    gShaman.fillCircle(22, 18, 9);
    gShaman.lineStyle(1.5, 0x451a03, 1);
    gShaman.strokeCircle(22, 18, 9);

    // Olhos com brilho esmeralda místico
    gShaman.fillStyle(0x22c55e, 1);
    gShaman.fillCircle(18, 17, 2.5);
    gShaman.fillCircle(26, 17, 2.5);
    gShaman.fillStyle(0xffffff, 1);
    gShaman.fillCircle(18, 17, 1);
    gShaman.fillCircle(26, 17, 1);

    // Penas xamânicas no topo (turquesa, ouro e carmesim)
    gShaman.fillStyle(0x06b6d4, 1);
    gShaman.fillRect(17, 3, 3, 7);
    gShaman.fillStyle(0xfde047, 1);
    gShaman.fillRect(21, 2, 3, 8);
    gShaman.fillStyle(0xef4444, 1);
    gShaman.fillRect(25, 4, 3, 6);

    // Cajado de cura com gema de esmeralda viva
    gShaman.fillStyle(0x54361c, 1);
    gShaman.fillRect(34, 6, 3, 32);
    // Gema de cura no topo do cajado
    gShaman.fillStyle(0x16a34a, 1);
    gShaman.fillCircle(35.5, 6, 5);
    gShaman.fillStyle(0x4ade80, 1);
    gShaman.fillCircle(35.5, 5.5, 3);
    gShaman.fillStyle(0xffffff, 1);
    gShaman.fillCircle(35.5, 5, 1.2);

    // Frasco de ervas e bálsamo no cinto
    gShaman.fillStyle(0x22c55e, 0.9);
    gShaman.fillCircle(12, 28, 3);
    gShaman.fillStyle(0xfde047, 1);
    gShaman.fillRect(11, 24, 2, 2);

    gShaman.generateTexture('enemy_shaman', 44, 44);
    gShaman.destroy();
  }

  // ==========================================
  // 4. PROJÉTEIS & IMPACTOS
  // ==========================================
  private static createKingdomProjectiles(scene: Phaser.Scene): void {
    // 1. Virolote / Dardo de Balista (proj_bullet) - 16x18
    const gBullet = scene.make.graphics({ x: 0, y: 0 });
    // Haste de madeira de freixo
    gBullet.fillStyle(0x78350f, 1);
    gBullet.fillRect(6, 4, 4, 12);
    // Ponta de aço reforçado
    gBullet.fillStyle(0xe2e8f0, 1);
    gBullet.beginPath();
    gBullet.moveTo(8, 0);
    gBullet.lineTo(14, 6);
    gBullet.lineTo(2, 6);
    gBullet.closePath();
    gBullet.fillPath();
    // Penas de fletching verdes
    gBullet.fillStyle(0x16a34a, 1);
    gBullet.fillRect(4, 12, 2, 4);
    gBullet.fillRect(10, 12, 2, 4);

    gBullet.generateTexture('proj_bullet', 16, 18);
    gBullet.destroy();

    // 2. Rocha Incendiária / Bola de Fogo de Bombarda (proj_cannon) - 20x20
    const gCannonBall = scene.make.graphics({ x: 0, y: 0 });
    gCannonBall.fillStyle(0x271a10, 1);
    gCannonBall.fillCircle(10, 10, 8.5);
    gCannonBall.fillStyle(0xea580c, 1);
    gCannonBall.fillCircle(10, 10, 6);
    gCannonBall.fillStyle(0xfde047, 1);
    gCannonBall.fillCircle(8, 8, 3);
    gCannonBall.lineStyle(2, 0x18110b, 1);
    gCannonBall.strokeCircle(10, 10, 8.5);

    gCannonBall.generateTexture('proj_cannon', 20, 20);
    gCannonBall.destroy();

    // 3. Orbe / Fragmento de Gelo Arcano (proj_cryo) - 24x24
    const gCryoOrb = scene.make.graphics({ x: 0, y: 0 });
    gCryoOrb.fillStyle(0x06b6d4, 0.85);
    gCryoOrb.fillCircle(12, 12, 10);
    gCryoOrb.fillStyle(0xe0f2fe, 1);
    gCryoOrb.fillCircle(10, 10, 5);
    gCryoOrb.lineStyle(2, 0xffffff, 1);
    gCryoOrb.strokeCircle(12, 12, 10);

    gCryoOrb.generateTexture('proj_cryo', 24, 24);
    gCryoOrb.destroy();

    // 4. Lança de Mithril / Dardo Perfurante (proj_sniper) - 16x24
    const gSniperBullet = scene.make.graphics({ x: 0, y: 0 });
    gSniperBullet.fillStyle(0x10b981, 1);
    gSniperBullet.fillRect(6, 0, 4, 22);
    gSniperBullet.fillStyle(0x6ee7b7, 1);
    gSniperBullet.fillRect(7, 2, 2, 18);

    gSniperBullet.generateTexture('proj_sniper', 16, 24);
    gSniperBullet.destroy();

    // 5. Foguete de Fogo de Dragão Alquímico (proj_missile) - 18x22
    const gMissile = scene.make.graphics({ x: 0, y: 0 });
    gMissile.fillStyle(0x9a3412, 1);
    gMissile.fillRect(6, 4, 6, 16);
    gMissile.fillStyle(0xef4444, 1);
    gMissile.beginPath();
    gMissile.moveTo(9, 0);
    gMissile.lineTo(14, 6);
    gMissile.lineTo(4, 6);
    gMissile.closePath();
    gMissile.fillPath();
    // Aletas flamejantes
    gMissile.fillStyle(0xf59e0b, 1);
    gMissile.fillRect(3, 16, 3, 5);
    gMissile.fillRect(12, 16, 3, 5);

    gMissile.generateTexture('proj_missile', 18, 22);
    gMissile.destroy();

    // 6. Meteoro do Cataclismo (proj_nuke) - 24x26
    const gNukeProj = scene.make.graphics({ x: 0, y: 0 });
    gNukeProj.fillStyle(0x450a0a, 1);
    gNukeProj.fillRoundedRect(4, 2, 16, 22, 6);
    gNukeProj.fillStyle(0xf97316, 1);
    gNukeProj.fillCircle(12, 12, 6);
    gNukeProj.fillStyle(0xfde047, 1);
    gNukeProj.fillCircle(12, 12, 3);

    gNukeProj.generateTexture('proj_nuke', 24, 26);
    gNukeProj.destroy();

    // 7. Esfera de Relâmpagos Divinos (proj_plasma) - 20x20
    const gPlasmaProj = scene.make.graphics({ x: 0, y: 0 });
    gPlasmaProj.fillStyle(0x0284c7, 0.9);
    gPlasmaProj.fillCircle(10, 10, 9);
    gPlasmaProj.fillStyle(0xfde047, 1);
    gPlasmaProj.fillCircle(10, 10, 5);
    gPlasmaProj.fillStyle(0xffffff, 1);
    gPlasmaProj.fillCircle(10, 10, 2);

    gPlasmaProj.generateTexture('proj_plasma', 20, 20);
    gPlasmaProj.destroy();

    // 8. Orbe da Bruxa Oracular (proj_witch_orb) - 24x24
    const gWitchOrb = scene.make.graphics({ x: 0, y: 0 });
    gWitchOrb.fillStyle(0x312e81, 0.9);
    gWitchOrb.fillCircle(12, 12, 11);
    gWitchOrb.fillStyle(0x0284c7, 1);
    gWitchOrb.fillCircle(12, 12, 8);
    gWitchOrb.fillStyle(0x67e8f9, 1);
    gWitchOrb.fillCircle(10, 9, 4);
    gWitchOrb.lineStyle(2, 0xfef08a, 0.9);
    gWitchOrb.beginPath();
    gWitchOrb.moveTo(5, 13);
    gWitchOrb.lineTo(10, 16);
    gWitchOrb.lineTo(13, 11);
    gWitchOrb.lineTo(19, 13);
    gWitchOrb.strokePath();
    gWitchOrb.generateTexture('proj_witch_orb', 24, 24);
    gWitchOrb.destroy();
  }

  // ==========================================
  // 5. PARTÍCULAS DE AMBIENTE & IMPACTO
  // ==========================================
  private static createKingdomParticles(scene: Phaser.Scene): void {
    const gSpark = scene.make.graphics({ x: 0, y: 0 });
    gSpark.fillStyle(0xfacc15, 1);
    gSpark.fillCircle(4, 4, 4);
    gSpark.fillStyle(0xffffff, 1);
    gSpark.fillCircle(4, 4, 2);
    gSpark.generateTexture('particle_spark', 8, 8);
    gSpark.destroy();

    const gSmoke = scene.make.graphics({ x: 0, y: 0 });
    gSmoke.fillStyle(0x78716c, 0.7);
    gSmoke.fillCircle(10, 10, 9);
    gSmoke.fillStyle(0xa8a29e, 0.5);
    gSmoke.fillCircle(9, 9, 6);
    gSmoke.generateTexture('particle_smoke', 20, 20);
    gSmoke.destroy();
  }

  // ==========================================
  // 6. UI COM ESTILO PERGAMINHO, FERRO & OURO
  // ==========================================
  private static createKingdomUI(scene: Phaser.Scene): void {
    // 1. Botão de Menu com Moldura Dourada e Pergaminho (btn_bg) - 160x50
    const gBtn = scene.make.graphics({ x: 0, y: 0 });
    // Fundo de ferro forjado e pergaminho nobre
    gBtn.fillStyle(0x271e16, 0.96);
    gBtn.fillRoundedRect(0, 0, 160, 50, 10);

    // Moldura entalhada em ouro nobre
    gBtn.lineStyle(3, 0xf59e0b, 1);
    gBtn.strokeRoundedRect(0, 0, 160, 50, 10);
    gBtn.lineStyle(1.5, 0xfde047, 0.9);
    gBtn.strokeRoundedRect(3, 3, 154, 44, 8);

    // Rebites de canto de ouro
    gBtn.fillStyle(0xfde047, 1);
    gBtn.fillCircle(6, 6, 2.5);
    gBtn.fillCircle(154, 6, 2.5);
    gBtn.fillCircle(6, 44, 2.5);
    gBtn.fillCircle(154, 44, 2.5);

    gBtn.generateTexture('btn_bg', 160, 50);
    gBtn.destroy();

    // 2. Card de Torre / Grimoire (tower_card_bg) - 90x80
    const gCard = scene.make.graphics({ x: 0, y: 0 });
    gCard.fillStyle(0x2e241c, 0.96);
    gCard.fillRoundedRect(0, 0, 90, 80, 10);
    gCard.lineStyle(2, 0xd97706, 0.9);
    gCard.strokeRoundedRect(0, 0, 90, 80, 10);

    // Cantoneiras medievais de ferro e ouro
    gCard.fillStyle(0xfacc15, 1);
    gCard.fillRect(4, 4, 6, 6);
    gCard.fillRect(80, 4, 6, 6);
    gCard.fillRect(4, 70, 6, 6);
    gCard.fillRect(80, 70, 6, 6);

    gCard.generateTexture('tower_card_bg', 90, 80);
    gCard.destroy();

    // 3. Selo Real / Grimoire de Feitiços (spell_btn_bg) - 72x72
    const gSpellBg = scene.make.graphics({ x: 0, y: 0 });
    gSpellBg.fillStyle(0x1c140e, 1);
    gSpellBg.fillCircle(36, 36, 34);
    gSpellBg.lineStyle(3, 0xf59e0b, 1);
    gSpellBg.strokeCircle(36, 36, 34);
    gSpellBg.lineStyle(1.5, 0xfde047, 0.85);
    gSpellBg.strokeCircle(36, 36, 29);

    // Selo de cera real no centro
    gSpellBg.fillStyle(0x991b1b, 0.9);
    gSpellBg.fillCircle(36, 36, 22);

    gSpellBg.generateTexture('spell_btn_bg', 72, 72);
    gSpellBg.destroy();

    // Mod Chips / Gemas Rúnicas (48x48)
    // 1. Gema de Rubi do Dragão (chip_crit)
    const gChipCrit = scene.make.graphics({ x: 0, y: 0 });
    gChipCrit.fillStyle(0x450a0a, 1);
    gChipCrit.fillRoundedRect(4, 4, 40, 40, 8);
    gChipCrit.lineStyle(2, 0xf59e0b, 1);
    gChipCrit.strokeRoundedRect(4, 4, 40, 40, 8);
    gChipCrit.fillStyle(0xef4444, 1);
    gChipCrit.fillCircle(24, 24, 10);
    gChipCrit.fillStyle(0xffffff, 1);
    gChipCrit.fillCircle(24, 24, 4);
    gChipCrit.generateTexture('chip_crit', 48, 48);
    gChipCrit.destroy();

    // 2. Gema de Topázio do Falcão (chip_ricochet)
    const gChipRico = scene.make.graphics({ x: 0, y: 0 });
    gChipRico.fillStyle(0x422006, 1);
    gChipRico.fillRoundedRect(4, 4, 40, 40, 8);
    gChipRico.lineStyle(2, 0xf59e0b, 1);
    gChipRico.strokeRoundedRect(4, 4, 40, 40, 8);
    gChipRico.fillStyle(0xfde047, 1);
    gChipRico.fillCircle(24, 24, 10);
    gChipRico.fillStyle(0xffffff, 1);
    gChipRico.fillCircle(24, 24, 4);
    gChipRico.generateTexture('chip_ricochet', 48, 48);
    gChipRico.destroy();

    // 3. Gema de Âmbar Perfuradora (chip_pierce)
    const gChipPierce = scene.make.graphics({ x: 0, y: 0 });
    gChipPierce.fillStyle(0x431407, 1);
    gChipPierce.fillRoundedRect(4, 4, 40, 40, 8);
    gChipPierce.lineStyle(2, 0xf59e0b, 1);
    gChipPierce.strokeRoundedRect(4, 4, 40, 40, 8);
    gChipPierce.fillStyle(0xfb923c, 1);
    gChipPierce.fillCircle(24, 24, 10);
    gChipPierce.fillStyle(0xffffff, 1);
    gChipPierce.fillCircle(24, 24, 4);
    gChipPierce.generateTexture('chip_pierce', 48, 48);
    gChipPierce.destroy();

    // 4. Gema de Safira Glacial (chip_cryo)
    const gChipCryo = scene.make.graphics({ x: 0, y: 0 });
    gChipCryo.fillStyle(0x083344, 1);
    gChipCryo.fillRoundedRect(4, 4, 40, 40, 8);
    gChipCryo.lineStyle(2, 0x38bdf8, 1);
    gChipCryo.strokeRoundedRect(4, 4, 40, 40, 8);
    gChipCryo.fillStyle(0x38bdf8, 1);
    gChipCryo.fillCircle(24, 24, 10);
    gChipCryo.fillStyle(0xffffff, 1);
    gChipCryo.fillCircle(24, 24, 4);
    gChipCryo.generateTexture('chip_cryo', 48, 48);
    gChipCryo.destroy();
  }

  // ==========================================
  // 7. HERÓIS JOGÁVEIS & COMPANHEIROS
  // ==========================================
  private static createKingdomHeroes(scene: Phaser.Scene): void {
    // 1. Sir Galahad (Paladino da Luz / Holy Paladin) (hero_mecha_defender) - 72x72
    const gMecha = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gMecha.fillStyle(0x14100c, 0.65);
    gMecha.fillEllipse(36, 58, 34, 14);

    // Manto Real Azul nas costas
    gMecha.fillStyle(0x1d4ed8, 1);
    gMecha.fillRoundedRect(16, 18, 40, 40, 8);

    // Armadura de Placas Douradas Sagradas
    gMecha.fillStyle(0xd97706, 1);
    gMecha.fillRoundedRect(18, 16, 36, 38, 10);
    gMecha.fillStyle(0xf59e0b, 1);
    gMecha.fillRoundedRect(22, 20, 28, 28, 6);
    gMecha.lineStyle(3, 0x78350f, 1);
    gMecha.strokeRoundedRect(18, 16, 36, 38, 10);

    // Ombreiras com golas de aço e ouro
    gMecha.fillStyle(0xfde047, 1);
    gMecha.fillCircle(16, 26, 8);
    gMecha.fillCircle(56, 26, 8);

    // Escudo com Brasão do Leão
    gMecha.fillStyle(0x991b1b, 1);
    gMecha.fillRoundedRect(10, 22, 14, 24, 4);
    gMecha.lineStyle(2, 0xfde047, 1);
    gMecha.strokeRoundedRect(10, 22, 14, 24, 4);
    gMecha.fillStyle(0xfde047, 1);
    gMecha.fillCircle(17, 34, 4);

    // Espada Sagrada / Lâmina de Luz Radiante
    gMecha.fillStyle(0xe2e8f0, 1);
    gMecha.fillRect(52, 6, 5, 36);
    gMecha.fillStyle(0xfde047, 1);
    gMecha.fillRect(48, 24, 13, 4); // Guarda da espada
    gMecha.fillStyle(0xffffff, 1);
    gMecha.fillRect(53, 8, 3, 28); // Brilho da lâmina

    // Elmo de Cavaleiro com Pluma Azul
    gMecha.fillStyle(0x3b82f6, 1);
    gMecha.fillEllipse(36, 10, 8, 5); // Pluma
    gMecha.fillStyle(0xfde047, 1);
    gMecha.fillCircle(36, 18, 10);
    gMecha.fillStyle(0x1e293b, 1);
    gMecha.fillRect(30, 18, 12, 3); // Fenda do visor

    gMecha.generateTexture('hero_mecha_defender', 72, 72);
    gMecha.destroy();

    // 2. Alleria (Arqueira Élfica / Elf Ranger) (hero_cyber_sniper) - 64x64
    const gSniper = scene.make.graphics({ x: 0, y: 0 });
    gSniper.fillStyle(0x14100c, 0.5);
    gSniper.fillEllipse(32, 52, 26, 10);

    // Manto verde florestal
    gSniper.fillStyle(0x15803d, 1);
    gSniper.fillRoundedRect(18, 14, 28, 38, 10);
    gSniper.lineStyle(2, 0x14532d, 1);
    gSniper.strokeRoundedRect(18, 14, 28, 38, 10);

    // Capuz e Cabelos Élficos Dourados
    gSniper.fillStyle(0xfde047, 1);
    gSniper.fillCircle(32, 22, 11);
    gSniper.fillStyle(0x166534, 1);
    gSniper.fillCircle(32, 20, 10);

    // Rosto e olhos esmeralda
    gSniper.fillStyle(0xfcd34d, 1);
    gSniper.fillCircle(32, 22, 6);
    gSniper.fillStyle(0x10b981, 1);
    gSniper.fillCircle(30, 22, 1.5);
    gSniper.fillCircle(34, 22, 1.5);

    // Arco Longo de Prata e Madeira
    gSniper.lineStyle(3, 0xe2e8f0, 1);
    gSniper.beginPath();
    gSniper.arc(46, 32, 16, -Math.PI / 2, Math.PI / 2);
    gSniper.strokePath();

    // Flecha de penas e ponta de cristal
    gSniper.fillStyle(0x78350f, 1);
    gSniper.fillRect(32, 30, 18, 3);
    gSniper.fillStyle(0x38bdf8, 1);
    gSniper.fillCircle(50, 31.5, 3);

    // Aljava com penas às costas
    gSniper.fillStyle(0x78350f, 1);
    gSniper.fillRect(16, 20, 6, 16);
    gSniper.fillStyle(0x10b981, 1);
    gSniper.fillCircle(19, 18, 3);

    gSniper.generateTexture('hero_cyber_sniper', 64, 64);
    gSniper.destroy();

    // 3. Arquimago Ignis (Archmage) (hero_drone_engineer) - 64x64
    const gEngineer = scene.make.graphics({ x: 0, y: 0 });
    gEngineer.fillStyle(0x14100c, 0.5);
    gEngineer.fillEllipse(32, 52, 28, 11);

    // Manto Carmesim com Bordados de Ouro
    gEngineer.fillStyle(0x7f1d1d, 1);
    gEngineer.fillRoundedRect(16, 16, 32, 36, 8);
    gEngineer.lineStyle(2, 0xf59e0b, 1);
    gEngineer.strokeRoundedRect(16, 16, 32, 36, 8);

    // Chapéu de Bruxo / Capuz Arcano
    gEngineer.fillStyle(0x991b1b, 1);
    gEngineer.beginPath();
    gEngineer.moveTo(32, 4);
    gEngineer.lineTo(46, 22);
    gEngineer.lineTo(18, 22);
    gEngineer.closePath();
    gEngineer.fillPath();

    // Barba Branca do Arquimago
    gEngineer.fillStyle(0xf8fafc, 1);
    gEngineer.beginPath();
    gEngineer.moveTo(25, 24);
    gEngineer.lineTo(39, 24);
    gEngineer.lineTo(32, 34);
    gEngineer.closePath();
    gEngineer.fillPath();

    // Cajado Rúnico com Orbe de Fogo Flutuante
    gEngineer.fillStyle(0x78350f, 1);
    gEngineer.fillRect(48, 12, 4, 38);
    // Chifres de latão no topo do cajado
    gEngineer.fillStyle(0xd97706, 1);
    gEngineer.fillCircle(50, 12, 5);
    // Orbe de Fogo ardente
    gEngineer.fillStyle(0xf97316, 1);
    gEngineer.fillCircle(50, 6, 6);
    gEngineer.fillStyle(0xfde047, 1);
    gEngineer.fillCircle(50, 6, 3);
    gEngineer.fillStyle(0xffffff, 1);
    gEngineer.fillCircle(50, 6, 1.2);

    gEngineer.generateTexture('hero_drone_engineer', 64, 64);
    gEngineer.destroy();

    // 4. Sentinela Mágico / Familiar Arcano (turret_mini_drone) - 48x48
    const gMiniTurret = scene.make.graphics({ x: 0, y: 0 });
    gMiniTurret.fillStyle(0x14100c, 0.6);
    gMiniTurret.fillEllipse(24, 40, 20, 8);

    // Pedestal de pedra flutuante
    gMiniTurret.fillStyle(0x2e1065, 1);
    gMiniTurret.fillCircle(24, 24, 16);
    gMiniTurret.lineStyle(2, 0xa855f7, 1);
    gMiniTurret.strokeCircle(24, 24, 16);

    // Cristal de Mana Flutuante
    gMiniTurret.fillStyle(0xec4899, 1);
    gMiniTurret.fillCircle(24, 24, 7);
    gMiniTurret.fillStyle(0xffffff, 1);
    gMiniTurret.fillCircle(24, 24, 3);

    gMiniTurret.generateTexture('turret_mini_drone', 48, 48);
    gMiniTurret.destroy();
  }

  // ==========================================
  // 8. RETRATOS DE HERÓIS (HUD)
  // ==========================================
  private static createKingdomHeroPortraits(scene: Phaser.Scene): void {
    // 1. Retrato Sir Galahad (hero_portrait_mecha_defender) - 80x80
    const gP1 = scene.make.graphics({ x: 0, y: 0 });
    // Moldura Real Dourada
    gP1.fillStyle(0x271e16, 1);
    gP1.fillRoundedRect(0, 0, 80, 80, 14);
    gP1.lineStyle(3, 0xf59e0b, 1);
    gP1.strokeRoundedRect(0, 0, 80, 80, 14);

    // Fundo de Luz Sagrada
    gP1.fillStyle(0x78350f, 0.9);
    gP1.fillCircle(40, 40, 32);

    // Elmo Dourado com Pluma Azul
    gP1.fillStyle(0x3b82f6, 1);
    gP1.fillEllipse(40, 16, 14, 8); // Pluma real
    gP1.fillStyle(0xd97706, 1);
    gP1.fillRoundedRect(22, 22, 36, 40, 10);
    gP1.fillStyle(0xfde047, 1);
    gP1.fillRoundedRect(26, 26, 28, 24, 6);

    // Visor do Elmo e Brasão
    gP1.fillStyle(0x1e293b, 1);
    gP1.fillRect(26, 32, 28, 5);
    gP1.fillStyle(0x991b1b, 1);
    gP1.fillCircle(40, 48, 6); // Joia do peitoral

    gP1.generateTexture('hero_portrait_mecha_defender', 80, 80);
    gP1.destroy();

    // 2. Retrato Alleria (hero_portrait_cyber_sniper) - 80x80
    const gP2 = scene.make.graphics({ x: 0, y: 0 });
    gP2.fillStyle(0x064e3b, 1);
    gP2.fillRoundedRect(0, 0, 80, 80, 14);
    gP2.lineStyle(3, 0x10b981, 1);
    gP2.strokeRoundedRect(0, 0, 80, 80, 14);

    // Fundo da Floresta Élfica
    gP2.fillStyle(0x14532d, 0.9);
    gP2.fillCircle(40, 40, 32);

    // Capuz e Cabelos Dourados
    gP2.fillStyle(0xfde047, 1);
    gP2.fillCircle(40, 36, 22);
    gP2.fillStyle(0x15803d, 1);
    gP2.fillCircle(40, 32, 20);

    // Rosto e olhos brilhantes
    gP2.fillStyle(0xfcd34d, 1);
    gP2.fillCircle(40, 38, 12);
    gP2.fillStyle(0x10b981, 1);
    gP2.fillCircle(36, 37, 2.5);
    gP2.fillCircle(44, 37, 2.5);

    // Tiara de prata élfica
    gP2.lineStyle(2, 0xe2e8f0, 1);
    gP2.strokeCircle(40, 30, 8);

    gP2.generateTexture('hero_portrait_cyber_sniper', 80, 80);
    gP2.destroy();

    // 3. Retrato Arquimago Ignis (hero_portrait_drone_engineer) - 80x80
    const gP3 = scene.make.graphics({ x: 0, y: 0 });
    gP3.fillStyle(0x450a0a, 1);
    gP3.fillRoundedRect(0, 0, 80, 80, 14);
    gP3.lineStyle(3, 0xf97316, 1);
    gP3.strokeRoundedRect(0, 0, 80, 80, 14);

    // Fundo de Fogo Arcano
    gP3.fillStyle(0x7f1d1d, 0.9);
    gP3.fillCircle(40, 40, 32);

    // Chapéu de Bruxo Carmesim
    gP3.fillStyle(0x991b1b, 1);
    gP3.beginPath();
    gP3.moveTo(40, 10);
    gP3.lineTo(60, 36);
    gP3.lineTo(20, 36);
    gP3.closePath();
    gP3.fillPath();

    // Rosto e Barba Branca Majestosa
    gP3.fillStyle(0xfcd34d, 1);
    gP3.fillCircle(40, 40, 12);
    gP3.fillStyle(0xf8fafc, 1);
    gP3.beginPath();
    gP3.moveTo(30, 44);
    gP3.lineTo(50, 44);
    gP3.lineTo(40, 60);
    gP3.closePath();
    gP3.fillPath();

    // Olhos flamejantes
    gP3.fillStyle(0xfde047, 1);
    gP3.fillCircle(36, 39, 2.5);
    gP3.fillCircle(44, 39, 2.5);

    gP3.generateTexture('hero_portrait_drone_engineer', 80, 80);
    gP3.destroy();
  }

  // ==========================================
  // 9. ÍCONES DE HABILIDADES DE HERÓIS
  // ==========================================
  private static createKingdomHeroAbilities(scene: Phaser.Scene): void {
    // 1. Impacto Divino / Ground Slam (ability_ground_slam) - 64x64
    const gA1 = scene.make.graphics({ x: 0, y: 0 });
    gA1.fillStyle(0x271e16, 1);
    gA1.fillCircle(32, 32, 30);
    gA1.lineStyle(3, 0xf59e0b, 1);
    gA1.strokeCircle(32, 32, 30);

    // Martelo de Guerra Sagrado caindo
    gA1.fillStyle(0xd97706, 1);
    gA1.fillRect(28, 8, 8, 26);
    gA1.fillStyle(0xfde047, 1);
    gA1.fillRoundedRect(18, 24, 28, 16, 4);

    // Rachaduras e ondas de choque douradas
    gA1.lineStyle(2, 0xfde047, 1);
    gA1.strokeCircle(32, 46, 10);
    gA1.strokeCircle(32, 46, 18);

    gA1.generateTexture('ability_ground_slam', 64, 64);
    gA1.destroy();

    // 2. Égide da Luz / Energy Shield (ability_energy_shield) - 64x64
    const gA2 = scene.make.graphics({ x: 0, y: 0 });
    gA2.fillStyle(0x1e3a8a, 1);
    gA2.fillCircle(32, 32, 30);
    gA2.lineStyle(3, 0x60a5fa, 1);
    gA2.strokeCircle(32, 32, 30);

    // Escudo Heptagonal de Luz Sagrada com Brasão
    gA2.fillStyle(0x3b82f6, 0.85);
    gA2.beginPath();
    gA2.moveTo(32, 12);
    gA2.lineTo(48, 20);
    gA2.lineTo(48, 42);
    gA2.lineTo(32, 52);
    gA2.lineTo(16, 42);
    gA2.lineTo(16, 20);
    gA2.closePath();
    gA2.fillPath();
    gA2.lineStyle(2, 0xfde047, 1);
    gA2.strokePath();

    gA2.fillStyle(0xfde047, 1);
    gA2.fillCircle(32, 32, 6);

    gA2.generateTexture('ability_energy_shield', 64, 64);
    gA2.destroy();

    // 3. Tiro de Precisão / Headshot (ability_headshot) - 64x64
    const gA3 = scene.make.graphics({ x: 0, y: 0 });
    gA3.fillStyle(0x064e3b, 1);
    gA3.fillCircle(32, 32, 30);
    gA3.lineStyle(3, 0x10b981, 1);
    gA3.strokeCircle(32, 32, 30);

    // Alvo rúnico com flecha mágica
    gA3.lineStyle(2, 0x10b981, 1);
    gA3.strokeCircle(32, 32, 18);
    gA3.lineBetween(32, 8, 32, 56);
    gA3.lineBetween(8, 32, 56, 32);

    gA3.fillStyle(0x38bdf8, 1);
    gA3.fillCircle(32, 32, 6);
    gA3.fillStyle(0xffffff, 1);
    gA3.fillCircle(32, 32, 2.5);

    gA3.generateTexture('ability_headshot', 64, 64);
    gA3.destroy();

    // 4. Chuva de Flechas Estelares / Orbital Strike (ability_orbital_strike) - 64x64
    const gA4 = scene.make.graphics({ x: 0, y: 0 });
    gA4.fillStyle(0x3b0764, 1);
    gA4.fillCircle(32, 32, 30);
    gA4.lineStyle(3, 0xc084fc, 1);
    gA4.strokeCircle(32, 32, 30);

    // Feixes estelares caindo dos céus
    gA4.fillStyle(0xa855f7, 0.9);
    gA4.fillRect(28, 8, 8, 36);
    gA4.fillStyle(0xffffff, 1);
    gA4.fillRect(30, 8, 4, 36);

    // Explosão estelar
    gA4.fillStyle(0xfde047, 1);
    gA4.fillCircle(32, 44, 12);
    gA4.fillStyle(0xffffff, 1);
    gA4.fillCircle(32, 44, 5);

    gA4.generateTexture('ability_orbital_strike', 64, 64);
    gA4.destroy();

    // 5. Invocar Sentinela / Combat Turret (ability_combat_turret) - 64x64
    const gA5 = scene.make.graphics({ x: 0, y: 0 });
    gA5.fillStyle(0x450a0a, 1);
    gA5.fillCircle(32, 32, 30);
    gA5.lineStyle(3, 0xf97316, 1);
    gA5.strokeCircle(32, 32, 30);

    // Sentinela de fogo arcano
    gA5.fillStyle(0xea580c, 1);
    gA5.fillCircle(32, 32, 14);
    gA5.fillStyle(0xfde047, 1);
    gA5.fillCircle(32, 32, 6);
    gA5.fillStyle(0xffffff, 1);
    gA5.fillCircle(32, 32, 2.5);

    gA5.generateTexture('ability_combat_turret', 64, 64);
    gA5.destroy();

    // 6. Tempestade de Fogo Arcano / Overcharge (ability_overcharge) - 64x64
    const gA6 = scene.make.graphics({ x: 0, y: 0 });
    gA6.fillStyle(0x422006, 1);
    gA6.fillCircle(32, 32, 30);
    gA6.lineStyle(3, 0xfacc15, 1);
    gA6.strokeCircle(32, 32, 30);

    // Relâmpago de fogo arcano
    gA6.fillStyle(0xfde047, 1);
    gA6.beginPath();
    gA6.moveTo(34, 8);
    gA6.lineTo(20, 28);
    gA6.lineTo(32, 28);
    gA6.lineTo(26, 56);
    gA6.lineTo(44, 28);
    gA6.lineTo(34, 28);
    gA6.closePath();
    gA6.fillPath();

    gA6.generateTexture('ability_overcharge', 64, 64);
    gA6.destroy();
  }

  // ==========================================
  // 10. FX & WAYPOINTS DE GAMEPLAY
  // ==========================================
  private static createHeroFXTextures(scene: Phaser.Scene): void {
    // Marcador de Movimentação Rúnico / Rosa dos Ventos Dourada (hero_move_target) - 48x48
    const gTarget = scene.make.graphics({ x: 0, y: 0 });
    gTarget.lineStyle(2, 0xf59e0b, 1);
    gTarget.strokeCircle(24, 24, 18);
    gTarget.lineStyle(1.5, 0xfde047, 0.85);
    gTarget.strokeCircle(24, 24, 12);

    // Pontas de bússola douradas
    gTarget.fillStyle(0xf59e0b, 1);
    gTarget.fillCircle(24, 24, 4.5);
    gTarget.lineStyle(2, 0xfde047, 1);
    gTarget.lineBetween(24, 4, 24, 8);
    gTarget.lineBetween(24, 40, 24, 44);
    gTarget.lineBetween(4, 24, 8, 24);
    gTarget.lineBetween(40, 24, 44, 24);

    gTarget.generateTexture('hero_move_target', 48, 48);
    gTarget.destroy();

    // Anel de Onda de Choque Sagrada (fx_shockwave) - 128x128
    const gWave = scene.make.graphics({ x: 0, y: 0 });
    gWave.lineStyle(4, 0xf59e0b, 0.9);
    gWave.strokeCircle(64, 64, 56);
    gWave.lineStyle(2, 0xfde047, 0.7);
    gWave.strokeCircle(64, 64, 48);
    gWave.generateTexture('fx_shockwave', 128, 128);
    gWave.destroy();

    // Santuário da Luz Aura (fx_shield) - 96x96
    const gShield = scene.make.graphics({ x: 0, y: 0 });
    gShield.fillStyle(0x38bdf8, 0.22);
    gShield.fillCircle(48, 48, 42);
    gShield.lineStyle(3, 0xfde047, 0.9);
    gShield.strokeCircle(48, 48, 42);
    gShield.lineStyle(1.5, 0xffffff, 0.9);
    gShield.strokeCircle(48, 48, 37);
    gShield.generateTexture('fx_shield', 96, 96);
    gShield.destroy();

    // Aura de Fúria Vermelha Flamejante do Chefe (fury_aura) - 96x96
    const gFury = scene.make.graphics({ x: 0, y: 0 });
    // Halo externo carmesim suave
    gFury.fillStyle(0x7f1d1d, 0.25);
    gFury.fillCircle(48, 48, 46);

    // Línguas de fogo radiantes da fúria (8 pontas)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spikeX = 48 + Math.cos(angle) * 44;
      const spikeY = 48 + Math.sin(angle) * 44;
      const mid1X = 48 + Math.cos(angle - 0.22) * 28;
      const mid1Y = 48 + Math.sin(angle - 0.22) * 28;
      const mid2X = 48 + Math.cos(angle + 0.22) * 28;
      const mid2Y = 48 + Math.sin(angle + 0.22) * 28;

      gFury.fillStyle(0xdc2626, 0.85);
      gFury.beginPath();
      gFury.moveTo(mid1X, mid1Y);
      gFury.lineTo(spikeX, spikeY);
      gFury.lineTo(mid2X, mid2Y);
      gFury.closePath();
      gFury.fillPath();

      // Pontas internas alaranjadas
      const innerSpikeX = 48 + Math.cos(angle) * 36;
      const innerSpikeY = 48 + Math.sin(angle) * 36;
      gFury.fillStyle(0xf97316, 0.95);
      gFury.beginPath();
      gFury.moveTo(mid1X, mid1Y);
      gFury.lineTo(innerSpikeX, innerSpikeY);
      gFury.lineTo(mid2X, mid2Y);
      gFury.closePath();
      gFury.fillPath();
    }

    // Anel de Chamas Carmesim
    gFury.fillStyle(0xef4444, 0.6);
    gFury.fillCircle(48, 48, 32);
    gFury.lineStyle(3, 0xf97316, 0.95);
    gFury.strokeCircle(48, 48, 32);

    // Núcleo incandescente de pura ira
    gFury.fillStyle(0xfde047, 0.85);
    gFury.fillCircle(48, 48, 18);
    gFury.fillStyle(0xffffff, 0.9);
    gFury.fillCircle(48, 48, 8);

    gFury.generateTexture('fury_aura', 96, 96);
    gFury.destroy();

    // Círculo de Rejuvenescimento e Cura Xamânica (healing_circle) - 128x128
    const gHealCircle = scene.make.graphics({ x: 0, y: 0 });
    // Brilho suave esmeralda de fundo
    gHealCircle.fillStyle(0x22c55e, 0.16);
    gHealCircle.fillCircle(64, 64, 60);

    // Anel Rúnico Druídico Externo
    gHealCircle.lineStyle(3, 0x16a34a, 0.9);
    gHealCircle.strokeCircle(64, 64, 56);
    gHealCircle.lineStyle(1.5, 0x4ade80, 0.95);
    gHealCircle.strokeCircle(64, 64, 50);

    // Círculo interno de Mana da Natureza
    gHealCircle.lineStyle(2, 0x86efac, 0.85);
    gHealCircle.strokeCircle(64, 64, 36);

    // 4 Cruzes / Folhas Druídicas nos pontos cardeais
    const cardinalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    cardinalAngles.forEach(ang => {
      const cx = 64 + Math.cos(ang) * 50;
      const cy = 64 + Math.sin(ang) * 50;

      gHealCircle.fillStyle(0x4ade80, 1);
      gHealCircle.fillCircle(cx, cy, 6);
      gHealCircle.fillStyle(0xfde047, 1);
      gHealCircle.fillCircle(cx, cy, 3);
      gHealCircle.fillStyle(0xffffff, 1);
      gHealCircle.fillCircle(cx, cy, 1.2);
    });

    // 4 Runas intermediárias (pontos colaterais)
    const interAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    interAngles.forEach(ang => {
      const cx = 64 + Math.cos(ang) * 36;
      const cy = 64 + Math.sin(ang) * 36;

      gHealCircle.fillStyle(0x22c55e, 0.9);
      gHealCircle.fillCircle(cx, cy, 4);
      gHealCircle.fillStyle(0xffffff, 1);
      gHealCircle.fillCircle(cx, cy, 1.5);
    });

    // Centro radiante de cura
    gHealCircle.fillStyle(0x4ade80, 0.7);
    gHealCircle.fillCircle(64, 64, 16);
    gHealCircle.fillStyle(0xfef08a, 0.9);
    gHealCircle.fillCircle(64, 64, 8);
    gHealCircle.fillStyle(0xffffff, 1);
    gHealCircle.fillCircle(64, 64, 3.5);

    gHealCircle.generateTexture('healing_circle', 128, 128);
    gHealCircle.destroy();
  }

  // ==========================================
  // 11. TEXTURAS DE BIOMAS (MAGMA, RUÍNAS, CASTELO)
  // ==========================================
  private static createBiomeTextures(scene: Phaser.Scene): void {
    // 1. Chão de Basalto e Magma (magma_ground) - 128x128
    const gMagma = scene.make.graphics({ x: 0, y: 0 });
    gMagma.fillStyle(0x18110b, 1);
    gMagma.fillRect(0, 0, 128, 128);

    // Placas de rocha vulcânica
    gMagma.fillStyle(0x271a10, 0.9);
    gMagma.fillCircle(35, 45, 28);
    gMagma.fillCircle(95, 85, 34);
    gMagma.fillCircle(80, 30, 22);

    // Fendas de lava ardente
    gMagma.lineStyle(4, 0x9a3412, 0.9);
    gMagma.lineBetween(0, 60, 45, 75);
    gMagma.lineBetween(45, 75, 85, 50);
    gMagma.lineBetween(85, 50, 128, 70);

    gMagma.lineStyle(2, 0xea580c, 1);
    gMagma.lineBetween(0, 60, 45, 75);
    gMagma.lineBetween(45, 75, 85, 50);
    gMagma.lineBetween(85, 50, 128, 70);

    gMagma.lineStyle(1, 0xfde047, 1);
    gMagma.lineBetween(10, 62, 45, 75);
    gMagma.lineBetween(45, 75, 80, 52);

    gMagma.generateTexture('magma_ground', 128, 128);
    gMagma.destroy();

    // 2. Chão de Ruínas do Templo Élfico (ruins_ground) - 128x128
    const gRuins = scene.make.graphics({ x: 0, y: 0 });
    gRuins.fillStyle(0x142018, 1);
    gRuins.fillRect(0, 0, 128, 128);

    // Lajes de pedra antiga com musgo
    gRuins.fillStyle(0x1e3a2b, 0.9);
    gRuins.fillRoundedRect(4, 4, 56, 56, 6);
    gRuins.fillRoundedRect(68, 4, 56, 56, 6);
    gRuins.fillRoundedRect(4, 68, 56, 56, 6);
    gRuins.fillRoundedRect(68, 68, 56, 56, 6);

    // Glifos élficos brilhantes
    gRuins.lineStyle(2, 0x10b981, 0.7);
    gRuins.strokeCircle(32, 32, 10);
    gRuins.lineBetween(32, 18, 32, 46);
    gRuins.strokeCircle(96, 96, 10);
    gRuins.lineBetween(82, 96, 110, 96);

    gRuins.generateTexture('ruins_ground', 128, 128);
    gRuins.destroy();

    // 3. Pátio do Castelo Real / Mármore e Ouro (orbital_ground) - 128x128
    const gOrbital = scene.make.graphics({ x: 0, y: 0 });
    gOrbital.fillStyle(0x1c1917, 1);
    gOrbital.fillRect(0, 0, 128, 128);

    // Lajes de mármore real
    gOrbital.fillStyle(0x292524, 0.95);
    gOrbital.fillRoundedRect(8, 8, 112, 112, 8);
    gOrbital.lineStyle(2, 0x78716c, 1);
    gOrbital.strokeRoundedRect(8, 8, 112, 112, 8);

    // Detalhes em ouro e tapete carmesim
    gOrbital.lineStyle(2, 0xf59e0b, 0.8);
    gOrbital.strokeCircle(64, 64, 30);
    gOrbital.fillStyle(0x991b1b, 0.85);
    gOrbital.fillRect(52, 8, 24, 112);

    gOrbital.generateTexture('orbital_ground', 128, 128);
    gOrbital.destroy();

    // 4. Fenda de Lava Ativa (deco_lava_fissure) - 64x64
    const gFissure = scene.make.graphics({ x: 0, y: 0 });
    gFissure.fillStyle(0x451a03, 1);
    gFissure.fillEllipse(32, 32, 30, 14);
    gFissure.fillStyle(0xea580c, 1);
    gFissure.fillEllipse(32, 32, 24, 9);
    gFissure.fillStyle(0xfde047, 1);
    gFissure.fillEllipse(32, 32, 16, 4);
    gFissure.generateTexture('deco_lava_fissure', 64, 64);
    gFissure.destroy();

    // 5. Cratera / Ninho do Dragão (deco_magma_crater) - 80x80
    const gCrater = scene.make.graphics({ x: 0, y: 0 });
    gCrater.fillStyle(0x1c1917, 0.9);
    gCrater.fillCircle(40, 40, 36);
    gCrater.fillStyle(0x7c2d12, 1);
    gCrater.fillCircle(40, 40, 26);
    gCrater.fillStyle(0xf97316, 1);
    gCrater.fillCircle(40, 40, 16);
    gCrater.fillStyle(0xfde047, 1);
    gCrater.fillCircle(40, 40, 8);
    gCrater.generateTexture('deco_magma_crater', 80, 80);
    gCrater.destroy();

    // 6. Portal Abissal / Entrada do Vazio (deco_teleporter_in) - 64x64
    const gTeleIn = scene.make.graphics({ x: 0, y: 0 });
    gTeleIn.fillStyle(0x1e1b4b, 0.85);
    gTeleIn.fillCircle(32, 32, 28);
    gTeleIn.lineStyle(3, 0xa855f7, 1);
    gTeleIn.strokeCircle(32, 32, 28);
    gTeleIn.fillStyle(0x7c3aed, 0.85);
    gTeleIn.fillCircle(32, 32, 18);
    gTeleIn.fillStyle(0xe879f9, 1);
    gTeleIn.fillCircle(32, 32, 8);
    gTeleIn.fillStyle(0xffffff, 1);
    gTeleIn.fillCircle(32, 32, 3);
    gTeleIn.generateTexture('deco_teleporter_in', 64, 64);
    gTeleIn.destroy();

    // 7. Portal Celestial / Saída da Luz (deco_teleporter_out) - 64x64
    const gTeleOut = scene.make.graphics({ x: 0, y: 0 });
    gTeleOut.fillStyle(0x082f49, 0.85);
    gTeleOut.fillCircle(32, 32, 28);
    gTeleOut.lineStyle(3, 0x06b6d4, 1);
    gTeleOut.strokeCircle(32, 32, 28);
    gTeleOut.fillStyle(0x0284c7, 0.85);
    gTeleOut.fillCircle(32, 32, 18);
    gTeleOut.fillStyle(0x38bdf8, 1);
    gTeleOut.fillCircle(32, 32, 8);
    gTeleOut.fillStyle(0xffffff, 1);
    gTeleOut.fillCircle(32, 32, 3);
    gTeleOut.generateTexture('deco_teleporter_out', 64, 64);
    gTeleOut.destroy();

    // 8. Menir / Monólito Rúnico Sagrado (deco_alien_pillar) - 48x80
    const gPillar = scene.make.graphics({ x: 0, y: 0 });
    gPillar.fillStyle(0x14100c, 0.7);
    gPillar.fillEllipse(24, 72, 20, 8);
    gPillar.fillStyle(0x3f3f46, 1);
    gPillar.beginPath();
    gPillar.moveTo(24, 8);
    gPillar.lineTo(40, 68);
    gPillar.lineTo(8, 68);
    gPillar.closePath();
    gPillar.fillPath();
    gPillar.lineStyle(2, 0x10b981, 1);
    gPillar.strokePath();

    // Cristais e runas incrustadas
    gPillar.fillStyle(0x10b981, 1);
    gPillar.fillCircle(24, 22, 5);
    gPillar.fillStyle(0xffffff, 1);
    gPillar.fillCircle(24, 22, 2);

    gPillar.generateTexture('deco_alien_pillar', 48, 80);
    gPillar.destroy();

    // 9. Estandarte Real do Reino (deco_solar_panel) - 64x64
    const gSolar = scene.make.graphics({ x: 0, y: 0 });
    // Haste de madeira com ponta dourada
    gSolar.fillStyle(0x78350f, 1);
    gSolar.fillRect(30, 4, 4, 56);
    gSolar.fillStyle(0xfde047, 1);
    gSolar.fillCircle(32, 4, 4);

    // Bandeira de tecido carmesim com borda de ouro
    gSolar.fillStyle(0x991b1b, 1);
    gSolar.fillRect(34, 8, 26, 36);
    gSolar.lineStyle(2, 0xf59e0b, 1);
    gSolar.strokeRect(34, 8, 26, 36);

    // Brasão do Leão em ouro
    gSolar.fillStyle(0xfde047, 1);
    gSolar.fillCircle(47, 26, 6);

    gSolar.generateTexture('deco_solar_panel', 64, 64);
    gSolar.destroy();

    // 10. Orbe de Mana e Grimoire Flutuante (deco_zero_g_satellite) - 50x50
    const gSat = scene.make.graphics({ x: 0, y: 0 });
    gSat.fillStyle(0x581c87, 1);
    gSat.fillCircle(25, 25, 12);
    gSat.lineStyle(2, 0xf59e0b, 1);
    gSat.strokeCircle(25, 25, 12);
    gSat.fillStyle(0xa855f7, 1);
    gSat.fillCircle(25, 25, 7);
    gSat.fillStyle(0xffffff, 1);
    gSat.fillCircle(25, 25, 3);
    gSat.generateTexture('deco_zero_g_satellite', 50, 50);
    gSat.destroy();
  }

  // ==========================================
  // 12. OBSTÁCULOS DESTRUTÍVEIS DE TERRENO
  // ==========================================
  private static createObstacleTextures(scene: Phaser.Scene): void {
    // 1. Pedregulho de Granito Antigo com Musgo (obstacle_rock) - 64x64
    const gRock = scene.make.graphics({ x: 0, y: 0 });
    gRock.fillStyle(0x14100c, 0.6);
    gRock.fillEllipse(32, 50, 28, 10);

    // Corpo da Rocha
    gRock.fillStyle(0x44403c, 1);
    gRock.fillCircle(32, 32, 22);
    gRock.fillStyle(0x57534e, 1);
    gRock.fillCircle(28, 28, 16);
    gRock.lineStyle(3, 0x1c1917, 1);
    gRock.strokeCircle(32, 32, 22);

    // Rachaduras com musgo
    gRock.lineStyle(2, 0x14532d, 0.9);
    gRock.lineBetween(22, 20, 32, 34);
    gRock.lineBetween(32, 34, 42, 28);

    gRock.generateTexture('obstacle_rock', 64, 64);
    gRock.destroy();

    // 2. Rocha Vulcânica Incandescente (obstacle_magma) - 64x64
    const gMagmaRock = scene.make.graphics({ x: 0, y: 0 });
    gMagmaRock.fillStyle(0x18110b, 0.7);
    gMagmaRock.fillEllipse(32, 50, 28, 10);
    gMagmaRock.fillStyle(0x271a10, 1);
    gMagmaRock.fillCircle(32, 32, 22);
    gMagmaRock.lineStyle(3, 0x451a03, 1);
    gMagmaRock.strokeCircle(32, 32, 22);

    // Fissuras de Fogo
    gMagmaRock.lineStyle(3, 0xf97316, 1);
    gMagmaRock.lineBetween(18, 26, 32, 34);
    gMagmaRock.lineBetween(32, 34, 46, 24);
    gMagmaRock.fillStyle(0xfde047, 1);
    gMagmaRock.fillCircle(32, 32, 5);

    gMagmaRock.generateTexture('obstacle_magma', 64, 64);
    gMagmaRock.destroy();

    // 3. Paliçada / Catapulta Quebrada (obstacle_debris) - 64x64
    const gDebris = scene.make.graphics({ x: 0, y: 0 });
    gDebris.fillStyle(0x14100c, 0.6);
    gDebris.fillEllipse(32, 50, 28, 10);

    // Pranchas de carvalho estilhaçadas
    gDebris.fillStyle(0x78350f, 1);
    gDebris.fillRect(14, 16, 36, 32);
    gDebris.lineStyle(3, 0x451a03, 1);
    gDebris.strokeRect(14, 16, 36, 32);

    // Aros de ferro com pregos
    gDebris.fillStyle(0x27272a, 1);
    gDebris.fillRect(18, 22, 8, 20);
    gDebris.fillRect(38, 22, 8, 20);

    gDebris.generateTexture('obstacle_debris', 64, 64);
    gDebris.destroy();
  }

  // ==========================================
  // 13. SANTUÁRIOS ARCANOS, DRAGÃO & CLIMA
  // ==========================================
  private static createEnvironmentalTextures(scene: Phaser.Scene): void {
    // 1. Base Universal de Pedra Sagrada para Santuários (shrine_base) - 72x72
    const gShrineBase = scene.make.graphics({ x: 0, y: 0 });
    gShrineBase.fillStyle(0x14100c, 0.65);
    gShrineBase.fillEllipse(36, 46, 34, 16);

    // Pedestal octogonal de granito sagrado
    gShrineBase.fillStyle(0x292524, 1);
    gShrineBase.fillCircle(36, 36, 32);
    gShrineBase.lineStyle(3, 0x1c1917, 1);
    gShrineBase.strokeCircle(36, 36, 32);

    gShrineBase.fillStyle(0x44403c, 1);
    gShrineBase.fillCircle(36, 34, 26);
    gShrineBase.lineStyle(2, 0x78716c, 1);
    gShrineBase.strokeCircle(36, 34, 26);

    gShrineBase.generateTexture('shrine_base', 72, 72);
    gShrineBase.destroy();

    // 2. Santuário da Pressa Arcana (shrine_haste) - 72x72
    const gHaste = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gHaste.fillStyle(0x14100c, 0.65);
    gHaste.fillEllipse(36, 46, 34, 16);

    // Altar de granito rúnico ciano-prateado
    gHaste.fillStyle(0x1e293b, 1);
    gHaste.fillCircle(36, 36, 30);
    gHaste.lineStyle(3, 0x0f172a, 1);
    gHaste.strokeCircle(36, 36, 30);

    gHaste.fillStyle(0x334155, 1);
    gHaste.fillCircle(36, 34, 24);
    gHaste.lineStyle(2, 0x0284c7, 1);
    gHaste.strokeCircle(36, 34, 24);

    // Círculo rúnico de aceleração e vento
    gHaste.lineStyle(2, 0x38bdf8, 0.9);
    gHaste.strokeCircle(36, 34, 18);
    gHaste.lineStyle(1.5, 0xfde047, 0.85);
    gHaste.strokeCircle(36, 34, 13);

    // Cristal de Mana Ciano Flutuante em forma de Diamante Alado
    gHaste.fillStyle(0x0ea5e9, 1);
    gHaste.beginPath();
    gHaste.moveTo(36, 12);
    gHaste.lineTo(47, 32);
    gHaste.lineTo(36, 48);
    gHaste.lineTo(25, 32);
    gHaste.closePath();
    gHaste.fillPath();

    gHaste.fillStyle(0x7dd3fc, 0.95);
    gHaste.beginPath();
    gHaste.moveTo(36, 12);
    gHaste.lineTo(47, 32);
    gHaste.lineTo(36, 32);
    gHaste.closePath();
    gHaste.fillPath();

    // Asas Místicas de Vento douradas nas laterais
    gHaste.fillStyle(0xfde047, 0.9);
    // Asa esquerda
    gHaste.beginPath();
    gHaste.moveTo(25, 30);
    gHaste.lineTo(13, 20);
    gHaste.lineTo(17, 34);
    gHaste.closePath();
    gHaste.fillPath();
    // Asa direita
    gHaste.beginPath();
    gHaste.moveTo(47, 30);
    gHaste.lineTo(59, 20);
    gHaste.lineTo(55, 34);
    gHaste.closePath();
    gHaste.fillPath();

    // Núcleo brilhante
    gHaste.fillStyle(0xffffff, 1);
    gHaste.fillCircle(36, 30, 4);

    gHaste.generateTexture('shrine_haste', 72, 72);
    gHaste.destroy();

    // 3. Santuário da Onda de Choque (shrine_shockwave) - 72x72
    const gShock = scene.make.graphics({ x: 0, y: 0 });
    // Sombra
    gShock.fillStyle(0x14100c, 0.65);
    gShock.fillEllipse(36, 46, 34, 16);

    // Altar de obsidiana e ouro solar
    gShock.fillStyle(0x2e1065, 1);
    gShock.fillCircle(36, 36, 30);
    gShock.lineStyle(3, 0x1e0842, 1);
    gShock.strokeCircle(36, 36, 30);

    gShock.fillStyle(0x451a03, 1);
    gShock.fillCircle(36, 34, 24);
    gShock.lineStyle(2, 0xd97706, 1);
    gShock.strokeCircle(36, 34, 24);

    // Círculo rúnico solar dourado
    gShock.lineStyle(2.5, 0xf59e0b, 0.95);
    gShock.strokeCircle(36, 34, 18);
    gShock.lineStyle(1.5, 0xfde047, 0.85);
    gShock.strokeCircle(36, 34, 12);

    // Orbe de Choque Solar Dourado Radiante
    gShock.fillStyle(0xd97706, 1);
    gShock.fillCircle(36, 30, 14);
    gShock.fillStyle(0xf59e0b, 1);
    gShock.fillCircle(36, 29, 11);
    gShock.fillStyle(0xfde047, 1);
    gShock.fillCircle(36, 28, 7);
    gShock.fillStyle(0xffffff, 1);
    gShock.fillCircle(36, 27, 3.5);

    // 4 Pontas de Raio / Sigilos de Choque
    const shockPoints = [
      { x: 36, y: 10 }, { x: 54, y: 28 }, { x: 36, y: 46 }, { x: 18, y: 28 }
    ];
    shockPoints.forEach(p => {
      gShock.fillStyle(0xfde047, 0.95);
      gShock.fillCircle(p.x, p.y, 3);
    });

    gShock.generateTexture('shrine_shockwave', 72, 72);
    gShock.destroy();

    // 4. Dragão Ancião Alado (dragon_sprite) - 100x100
    const gDragon = scene.make.graphics({ x: 0, y: 0 });
    // Corpo / Espinhaço do Dragão
    gDragon.fillStyle(0x7f1d1d, 1);
    gDragon.fillEllipse(50, 48, 18, 38);
    gDragon.fillStyle(0x991b1b, 1);
    gDragon.fillEllipse(50, 48, 14, 32);

    // Cauda escamosa longa e pontiaguda
    gDragon.fillStyle(0x991b1b, 1);
    gDragon.beginPath();
    gDragon.moveTo(46, 64);
    gDragon.lineTo(50, 94);
    gDragon.lineTo(54, 64);
    gDragon.closePath();
    gDragon.fillPath();

    // Espigão da cauda em ponta de lança
    gDragon.fillStyle(0xd97706, 1);
    gDragon.beginPath();
    gDragon.moveTo(50, 96);
    gDragon.lineTo(44, 88);
    gDragon.lineTo(56, 88);
    gDragon.closePath();
    gDragon.fillPath();

    // Grandes Asas de Dragão Abertas
    // Asa Esquerda
    gDragon.fillStyle(0xb91c1c, 1);
    gDragon.beginPath();
    gDragon.moveTo(46, 38);
    gDragon.lineTo(4, 20);
    gDragon.lineTo(12, 44);
    gDragon.lineTo(24, 54);
    gDragon.lineTo(44, 48);
    gDragon.closePath();
    gDragon.fillPath();

    // Membranas douradas da asa esquerda
    gDragon.fillStyle(0xd97706, 0.9);
    gDragon.beginPath();
    gDragon.moveTo(42, 40);
    gDragon.lineTo(10, 24);
    gDragon.lineTo(18, 42);
    gDragon.lineTo(28, 48);
    gDragon.closePath();
    gDragon.fillPath();

    // Estrutura óssea da asa esquerda
    gDragon.lineStyle(2, 0x450a0a, 1);
    gDragon.lineBetween(46, 38, 4, 20);
    gDragon.lineBetween(28, 34, 12, 44);
    gDragon.lineBetween(36, 42, 24, 54);

    // Asa Direita
    gDragon.fillStyle(0xb91c1c, 1);
    gDragon.beginPath();
    gDragon.moveTo(54, 38);
    gDragon.lineTo(96, 20);
    gDragon.lineTo(88, 44);
    gDragon.lineTo(76, 54);
    gDragon.lineTo(56, 48);
    gDragon.closePath();
    gDragon.fillPath();

    // Membranas douradas da asa direita
    gDragon.fillStyle(0xd97706, 0.9);
    gDragon.beginPath();
    gDragon.moveTo(58, 40);
    gDragon.lineTo(90, 24);
    gDragon.lineTo(82, 42);
    gDragon.lineTo(72, 48);
    gDragon.closePath();
    gDragon.fillPath();

    // Estrutura óssea da asa direita
    gDragon.lineStyle(2, 0x450a0a, 1);
    gDragon.lineBetween(54, 38, 96, 20);
    gDragon.lineBetween(72, 34, 88, 44);
    gDragon.lineBetween(64, 42, 76, 54);

    // Cabeça do Dragão com Chifres Negros
    gDragon.fillStyle(0xb91c1c, 1);
    gDragon.fillCircle(50, 24, 10);
    gDragon.fillStyle(0xdc2626, 1);
    gDragon.fillRect(45, 14, 10, 14);

    // Chifres
    gDragon.fillStyle(0x18110b, 1);
    // Chifre esquerdo
    gDragon.beginPath();
    gDragon.moveTo(44, 20);
    gDragon.lineTo(34, 6);
    gDragon.lineTo(46, 16);
    gDragon.closePath();
    gDragon.fillPath();
    // Chifre direito
    gDragon.beginPath();
    gDragon.moveTo(56, 20);
    gDragon.lineTo(66, 6);
    gDragon.lineTo(54, 16);
    gDragon.closePath();
    gDragon.fillPath();

    // Olhos Ardentes de Fogo Dourado
    gDragon.fillStyle(0xfde047, 1);
    gDragon.fillCircle(46, 20, 2.5);
    gDragon.fillCircle(54, 20, 2.5);
    gDragon.fillStyle(0x7f1d1d, 1);
    gDragon.fillCircle(46, 20, 1);
    gDragon.fillCircle(54, 20, 1);

    // Focinho com brasas e vapor
    gDragon.fillStyle(0xf97316, 1);
    gDragon.fillCircle(50, 12, 3.5);
    gDragon.fillStyle(0xfde047, 1);
    gDragon.fillCircle(50, 11, 2);

    gDragon.generateTexture('dragon_sprite', 100, 100);
    gDragon.destroy();

    // 5. Sombra do Dragão (dragon_shadow) - 100x100
    const gShadow = scene.make.graphics({ x: 0, y: 0 });
    gShadow.fillStyle(0x050505, 0.42);
    // Corpo
    gShadow.fillEllipse(50, 48, 16, 36);
    // Asas
    gShadow.beginPath();
    gShadow.moveTo(46, 38);
    gShadow.lineTo(4, 20);
    gShadow.lineTo(12, 44);
    gShadow.lineTo(24, 54);
    gShadow.lineTo(44, 48);
    gShadow.closePath();
    gShadow.fillPath();

    gShadow.beginPath();
    gShadow.moveTo(54, 38);
    gShadow.lineTo(96, 20);
    gShadow.lineTo(88, 44);
    gShadow.lineTo(76, 54);
    gShadow.lineTo(56, 48);
    gShadow.closePath();
    gShadow.fillPath();
    // Cabeça
    gShadow.fillCircle(50, 24, 9);
    // Cauda
    gShadow.beginPath();
    gShadow.moveTo(46, 64);
    gShadow.lineTo(50, 94);
    gShadow.lineTo(54, 64);
    gShadow.closePath();
    gShadow.fillPath();

    gShadow.generateTexture('dragon_shadow', 100, 100);
    gShadow.destroy();

    // 6. Sopro de Chamas do Dragão (dragon_fire_breath) - 48x48
    const gBreath = scene.make.graphics({ x: 0, y: 0 });
    gBreath.fillStyle(0xef4444, 0.85);
    gBreath.fillCircle(24, 24, 20);
    gBreath.fillStyle(0xf97316, 0.95);
    gBreath.fillCircle(24, 24, 14);
    gBreath.fillStyle(0xfde047, 1);
    gBreath.fillCircle(24, 24, 8);
    gBreath.fillStyle(0xffffff, 1);
    gBreath.fillCircle(24, 24, 3.5);

    gBreath.generateTexture('dragon_fire_breath', 48, 48);
    gBreath.destroy();

    // 7. Rastro de Estrada Flamejante (fire_trail_patch) - 64x40
    const gFireTrail = scene.make.graphics({ x: 0, y: 0 });
    // Terra chamuscada e brasas
    gFireTrail.fillStyle(0x1c1917, 0.85);
    gFireTrail.fillEllipse(32, 22, 30, 16);

    // Chamas rosnantes na estrada
    gFireTrail.fillStyle(0x9a3412, 0.9);
    gFireTrail.fillEllipse(32, 20, 24, 12);

    gFireTrail.fillStyle(0xea580c, 1);
    gFireTrail.fillCircle(20, 18, 9);
    gFireTrail.fillCircle(32, 16, 11);
    gFireTrail.fillCircle(44, 18, 9);

    gFireTrail.fillStyle(0xfde047, 1);
    gFireTrail.fillCircle(22, 16, 5);
    gFireTrail.fillCircle(32, 14, 7);
    gFireTrail.fillCircle(42, 16, 5);

    gFireTrail.fillStyle(0xffffff, 1);
    gFireTrail.fillCircle(32, 13, 3);

    gFireTrail.generateTexture('fire_trail_patch', 64, 40);
    gFireTrail.destroy();

    // 8. Gota de Chuva Slanted (weather_rain_drop) - 8x24
    const gRain = scene.make.graphics({ x: 0, y: 0 });
    gRain.fillStyle(0xbae6fd, 0.85);
    gRain.beginPath();
    gRain.moveTo(4, 0);
    gRain.lineTo(6, 20);
    gRain.lineTo(4, 24);
    gRain.lineTo(2, 20);
    gRain.closePath();
    gRain.fillPath();

    gRain.fillStyle(0xffffff, 0.95);
    gRain.fillRect(3, 4, 2, 14);

    gRain.generateTexture('weather_rain_drop', 8, 24);
    gRain.destroy();

    // 9. Rastro de Vento Místico (weather_wind_trail) - 64x12
    const gWind = scene.make.graphics({ x: 0, y: 0 });
    gWind.fillStyle(0xe0f2fe, 0.6);
    gWind.fillRoundedRect(0, 3, 64, 6, 3);
    gWind.fillStyle(0xffffff, 0.85);
    gWind.fillRoundedRect(12, 4, 38, 4, 2);

    gWind.generateTexture('weather_wind_trail', 64, 12);
    gWind.destroy();

    // 10. Raio Elétrico Ramificado (weather_lightning_bolt) - 48x128
    const gBolt = scene.make.graphics({ x: 0, y: 0 });
    gBolt.lineStyle(4, 0x38bdf8, 0.7);
    gBolt.beginPath();
    gBolt.moveTo(24, 0);
    gBolt.lineTo(14, 32);
    gBolt.lineTo(32, 54);
    gBolt.lineTo(16, 88);
    gBolt.lineTo(28, 128);
    gBolt.strokePath();

    // Núcleo branco incandescente
    gBolt.lineStyle(2, 0xffffff, 1);
    gBolt.beginPath();
    gBolt.moveTo(24, 0);
    gBolt.lineTo(14, 32);
    gBolt.lineTo(32, 54);
    gBolt.lineTo(16, 88);
    gBolt.lineTo(28, 128);
    gBolt.strokePath();

    // Ramo lateral
    gBolt.lineStyle(1.5, 0xfde047, 0.9);
    gBolt.beginPath();
    gBolt.moveTo(32, 54);
    gBolt.lineTo(44, 76);
    gBolt.strokePath();

    gBolt.generateTexture('weather_lightning_bolt', 48, 128);
    gBolt.destroy();
  }

  // ==========================================
  // 15. EFEITOS VISUAIS DE COMBATE HQ & CINEMÁTICAS (COMIC STARBURST & BOSS SLOW-MO)
  // ==========================================
  private static createCombatAndCinematicFXTextures(scene: Phaser.Scene): void {
    // 1. Starburst de Dano Crítico Estilo HQ / Comic Burst (comic_starburst) - 128x128
    const gBurst = scene.make.graphics({ x: 0, y: 0 });
    const cx = 64;
    const cy = 64;
    const points = 14;

    // Função auxiliar para desenhar estrela pontiaguda
    const drawStarPoly = (outerR: number, innerR: number) => {
      const step = (Math.PI * 2) / (points * 2);
      gBurst.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = i * step - Math.PI / 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) gBurst.moveTo(px, py);
        else gBurst.lineTo(px, py);
      }
      gBurst.closePath();
    };

    // Camada Externa: Carmesim Escuro com Contorno HQ Preto Forte
    gBurst.lineStyle(4, 0x180505, 1);
    gBurst.fillStyle(0xdc2626, 1); // Vermelho rubi carmesim
    drawStarPoly(58, 36);
    gBurst.fillPath();
    gBurst.strokePath();

    // Camada Intermediária: Laranja Flamejante / Fogo
    gBurst.fillStyle(0xf97316, 1);
    drawStarPoly(45, 26);
    gBurst.fillPath();

    // Camada Interna: Dourado / Amarelo Elétrico Brilhante
    gBurst.fillStyle(0xfde047, 1);
    drawStarPoly(32, 17);
    gBurst.fillPath();

    // Centro Branco Incandescente
    gBurst.fillStyle(0xffffff, 1);
    drawStarPoly(16, 8);
    gBurst.fillPath();

    // Pontos de ação e faíscas estilo gibi nos cantos
    const comicSparks = [
      { x: 14, y: 20, r: 2.5 },
      { x: 114, y: 22, r: 3 },
      { x: 110, y: 110, r: 2.5 },
      { x: 18, y: 108, r: 3 },
      { x: 64, y: 4, r: 2 },
      { x: 64, y: 124, r: 2.5 }
    ];
    gBurst.fillStyle(0xfacc15, 1);
    comicSparks.forEach(s => {
      gBurst.fillCircle(s.x, s.y, s.r);
    });

    gBurst.generateTexture('comic_starburst', 128, 128);
    gBurst.destroy();

    // 2. Flash Radiante Dourado de Derrota de Chefe (boss_golden_flash) - 256x256
    const gFlash = scene.make.graphics({ x: 0, y: 0 });
    const fcx = 128;
    const fcy = 128;
    const numRays = 16;
    const rayStep = (Math.PI * 2) / numRays;

    // Raios de Sol Radiantes Dourados
    for (let i = 0; i < numRays; i++) {
      const angle = i * rayStep;
      const widthAngle = rayStep * 0.45;

      gFlash.fillStyle(0xfacc15, 0.45);
      gFlash.beginPath();
      gFlash.moveTo(fcx, fcy);
      gFlash.lineTo(fcx + Math.cos(angle - widthAngle) * 120, fcy + Math.sin(angle - widthAngle) * 120);
      gFlash.lineTo(fcx + Math.cos(angle + widthAngle) * 120, fcy + Math.sin(angle + widthAngle) * 120);
      gFlash.closePath();
      gFlash.fillPath();
    }

    // Halos concêntricos dourados de energia mística
    gFlash.fillStyle(0xd97706, 0.3);
    gFlash.fillCircle(fcx, fcy, 80);

    gFlash.fillStyle(0xf59e0b, 0.5);
    gFlash.fillCircle(fcx, fcy, 55);

    gFlash.fillStyle(0xfde047, 0.75);
    gFlash.fillCircle(fcx, fcy, 35);

    gFlash.fillStyle(0xfef08a, 0.9);
    gFlash.fillCircle(fcx, fcy, 20);

    gFlash.fillStyle(0xffffff, 1);
    gFlash.fillCircle(fcx, fcy, 10);

    gFlash.generateTexture('boss_golden_flash', 256, 256);
    gFlash.destroy();

    // 3. Anel de Onda de Choque Dourada (golden_shockwave_ring) - 128x128
    const gShock = scene.make.graphics({ x: 0, y: 0 });
    gShock.lineStyle(6, 0xf59e0b, 0.4);
    gShock.strokeCircle(64, 64, 48);
    gShock.lineStyle(3.5, 0xfacc15, 0.9);
    gShock.strokeCircle(64, 64, 48);
    gShock.lineStyle(1.5, 0xffffff, 1.0);
    gShock.strokeCircle(64, 64, 48);

    gShock.generateTexture('golden_shockwave_ring', 128, 128);
    gShock.destroy();

    // 4. Faísca de Impacto HQ Diamante (comic_hit_spark) - 48x48
    const gSpark = scene.make.graphics({ x: 0, y: 0 });
    gSpark.fillStyle(0xfde047, 1);
    gSpark.lineStyle(2, 0x180505, 1);

    gSpark.beginPath();
    gSpark.moveTo(24, 2);
    gSpark.lineTo(29, 19);
    gSpark.lineTo(46, 24);
    gSpark.lineTo(29, 29);
    gSpark.lineTo(24, 46);
    gSpark.lineTo(19, 29);
    gSpark.lineTo(2, 24);
    gSpark.lineTo(19, 19);
    gSpark.closePath();
    gSpark.fillPath();
    gSpark.strokePath();

    gSpark.fillStyle(0xffffff, 1);
    gSpark.fillCircle(24, 24, 4.5);

    gSpark.generateTexture('comic_hit_spark', 48, 48);
    gSpark.destroy();
  }
}
