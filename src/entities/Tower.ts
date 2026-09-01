import Phaser from 'phaser';
import { DamageType, ModChipType, TargetPriority, TowerType, GAME_CONSTANTS, TacticalModifier, TowerBranchId } from '../core/Constants';
import { TOWERS_CONFIG, TowerConfigData, TowerLevelData, Tier4BranchData } from '../config/gameConfig';
import { Enemy, pickNearestEnemy } from './Enemy';
import { Projectile } from './Projectile';
import { ModChip } from './ModChip';
import { AudioManager } from '../managers/AudioManager';
import { SaveManager } from '../managers/SaveManager';
import { EventBus, GameEvents } from '../core/EventBus';
import { towerDamageModifierMultiplier } from '../config/modifierEffects';
import { TowerCombatStats } from '../ui/towerStatText';
import { laserFireKind, LaserFireKind } from './laserFireKind';

export class Tower extends Phaser.GameObjects.Container {
  public towerType: TowerType;
  public config: TowerConfigData;
  public level = 1;
  public tier4Branch: Tier4BranchData | null = null;
  public equippedChip: ModChip | null = null;
  public targetPriority: TargetPriority = TargetPriority.FIRST;
  public totalInvested: number;

  private baseSprite: Phaser.GameObjects.Sprite;
  private turretSprite: Phaser.GameObjects.Sprite;
  private rangeGraphics: Phaser.GameObjects.Graphics;
  private upgradeRangeGraphics: Phaser.GameObjects.Graphics;
  private upgradePulseTween: Phaser.Tweens.Tween | null = null;
  private laserGraphics: Phaser.GameObjects.Graphics;
  private teslaGraphics: Phaser.GameObjects.Graphics;
  private chipBadgeGraphics: Phaser.GameObjects.Graphics;
  private levelBadgeText: Phaser.GameObjects.Text;
  private chipIconText: Phaser.GameObjects.Text;
  private hasteAuraGraphics: Phaser.GameObjects.Graphics;

  public hasteBuffTimerMs = 0;
  public hasteMultiplier = 1.0;

  private fireCooldownMs = 0;
  public stunTimerMs = 0;
  private cryoStunCooldownMs = 0;
  private currentTarget: Enemy | null = null;
  private isSelected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, towerType: TowerType) {
    super(scene, x, y);

    this.towerType = towerType;
    this.config = TOWERS_CONFIG[towerType];
    this.totalInvested = this.config.cost;

    // Haste Aura Graphics
    this.hasteAuraGraphics = scene.add.graphics();
    this.add(this.hasteAuraGraphics);

    // Base e Canhão
    this.baseSprite = scene.add.sprite(0, 0, 'tower_base');
    this.add(this.baseSprite);

    const turretTexture = `turret_${towerType.toLowerCase()}`;
    this.turretSprite = scene.add.sprite(0, 0, turretTexture);
    this.add(this.turretSprite);

    // Badge de Chip Socketed
    this.chipBadgeGraphics = scene.add.graphics();
    this.add(this.chipBadgeGraphics);

    this.chipIconText = scene.add.text(-14, 14, '', {
      fontSize: '11px',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.chipIconText);

    // Badge de Nível (estrelas / num)
    this.levelBadgeText = scene.add.text(14, 14, '★1', {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fde047',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.levelBadgeText);

    // Anéis Duplos de Alcance (Atual em Azul + Pós-Upgrade em Dourado)
    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);
    this.rangeGraphics.setVisible(false);

    this.upgradeRangeGraphics = scene.add.graphics();
    this.add(this.upgradeRangeGraphics);
    this.upgradeRangeGraphics.setVisible(false);

    // Gráficos de Raio Contínuo (Laser) e Arco (Tesla)
    this.laserGraphics = scene.add.graphics();
    this.teslaGraphics = scene.add.graphics();
    scene.add.existing(this.laserGraphics);
    scene.add.existing(this.teslaGraphics);

    // Interatividade Touch
    this.setSize(64, 64);
    this.setInteractive(new Phaser.Geom.Rectangle(-32, -32, 64, 64), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', () => {
      EventBus.emit(GameEvents.TOWER_SELECTED, this);
    });

    scene.add.existing(this);
    this.updateStats();
  }

  public getLevelData(): TowerLevelData {
    if (this.level === 4 && this.tier4Branch) {
      return this.tier4Branch;
    }
    return this.config.levels[Math.min(this.level, this.config.levels.length) - 1];
  }

  public getCombatStats(): TowerCombatStats {
    const lvl = this.getLevelData();
    return {
      damage: this.getEffectiveDamage(),
      fireRate: lvl.fireRate,
      laserDPS: lvl.laserDPS ? lvl.laserDPS * this.getModifierDamageMultiplier() : undefined,
      slowFactor: lvl.slowFactor,
      slowDuration: lvl.slowDuration,
      splashRadius: lvl.splashRadius,
      chainCount: lvl.chainCount,
      ignoreArmor: this.tier4Branch?.branchId === TowerBranchId.GATLING_SNIPER,
      revealsStealth: this.towerType === TowerType.WITCH
    };
  }

  public getEffectiveRange(): number {
    const baseRange = this.getLevelData().range;
    const save = SaveManager.getInstance();
    let multiplier = save.hasTech('range_all') ? 1.15 : 1.0;
    if (save.isRelicEquipped('elven_brooch')) {
      multiplier *= 1.15;
    }
    return baseRange * multiplier;
  }

  public getProjectedUpgradeRange(): number {
    const save = SaveManager.getInstance();
    let multiplier = save.hasTech('range_all') ? 1.15 : 1.0;
    if (save.isRelicEquipped('elven_brooch')) {
      multiplier *= 1.15;
    }
    if (this.canUpgrade()) {
      const nextLevelData = this.config.levels[this.level];
      if (nextLevelData) {
        return nextLevelData.range * multiplier;
      }
    } else if (this.canEvolveTier4() && this.config.tier4Branches && this.config.tier4Branches.length > 0) {
      const maxBranchRange = Math.max(...this.config.tier4Branches.map(b => b.range));
      return maxBranchRange * multiplier;
    }
    return 0;
  }

  public getEffectiveDamage(): number {
    const baseDamage = this.getLevelData().damage;
    const save = SaveManager.getInstance();
    let multiplier = save.hasTech('damage_all') ? 1.2 : 1.0;
    if (save.isRelicEquipped('kings_crown')) {
      multiplier *= 1.10;
    }
    multiplier *= this.getModifierDamageMultiplier();
    return baseDamage * multiplier;
  }

  private getModifierDamageMultiplier(): number {
    return towerDamageModifierMultiplier(
      (this.scene as Phaser.Scene & { modifiers?: TacticalModifier[] }).modifiers,
      this.config.damageType
    );
  }

  public updateStats(): void {
    if (this.level === 4 && this.tier4Branch) {
      this.levelBadgeText.setText('★4');
      this.levelBadgeText.setColor('#f97316');
    } else {
      this.levelBadgeText.setText(`★${this.level}`);
      this.levelBadgeText.setColor('#fde047');
    }

    this.drawChipBadge();
    if (this.isSelected) {
      this.drawRangeCircles();
    }
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.rangeGraphics.setVisible(selected);
    this.upgradeRangeGraphics.setVisible(selected);
    if (selected) {
      this.drawRangeCircles();
    } else {
      if (this.upgradePulseTween) {
        this.upgradePulseTween.stop();
        this.upgradePulseTween = null;
      }
      this.rangeGraphics.clear();
      this.upgradeRangeGraphics.clear();
    }
  }

  private drawRangeCircles(): void {
    this.rangeGraphics.clear();
    this.upgradeRangeGraphics.clear();
    if (this.upgradePulseTween) {
      this.upgradePulseTween.stop();
      this.upgradePulseTween = null;
    }

    const currentRange = this.getEffectiveRange();
    const projectedRange = this.getProjectedUpgradeRange();

    // 1. Anel de Alcance Atual (Azul Translúcido de Alta Visibilidade)
    const currentColor = 0x38bdf8;
    this.rangeGraphics.lineStyle(2.5, currentColor, 0.9);
    this.rangeGraphics.strokeCircle(0, 0, currentRange);
    this.rangeGraphics.fillStyle(currentColor, 0.14);
    this.rangeGraphics.fillCircle(0, 0, currentRange);

    // 2. Anel de Alcance Pós-Upgrade (Dourado Pulsante de Comparação)
    if (projectedRange > 0) {
      this.upgradeRangeGraphics.lineStyle(3, 0xfacc15, 0.95);
      this.upgradeRangeGraphics.strokeCircle(0, 0, projectedRange);
      this.upgradeRangeGraphics.fillStyle(0xfde047, 0.08);
      this.upgradeRangeGraphics.fillCircle(0, 0, projectedRange);

      this.upgradeRangeGraphics.setAlpha(0.6);
      this.upgradePulseTween = this.scene.tweens.add({
        targets: this.upgradeRangeGraphics,
        alpha: { from: 0.45, to: 1.0 },
        yoyo: true,
        duration: 750,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  private drawChipBadge(): void {
    this.chipBadgeGraphics.clear();
    if (this.equippedChip) {
      this.chipBadgeGraphics.fillStyle(this.equippedChip.data.color, 0.95);
      this.chipBadgeGraphics.fillCircle(-14, 14, 9);
      this.chipBadgeGraphics.lineStyle(1.5, 0xffffff, 1);
      this.chipBadgeGraphics.strokeCircle(-14, 14, 9);

      this.chipIconText.setText(this.equippedChip.data.icon);
      this.chipIconText.setVisible(true);
    } else if (this.canEquipChip()) {
      // Slot vazio disponível (círculo pontilhado / cinza)
      this.chipBadgeGraphics.fillStyle(0x1e293b, 0.8);
      this.chipBadgeGraphics.fillCircle(-14, 14, 8);
      this.chipBadgeGraphics.lineStyle(1, 0x94a3b8, 0.8);
      this.chipBadgeGraphics.strokeCircle(-14, 14, 8);
      this.chipIconText.setText('+');
      this.chipIconText.setColor('#94a3b8');
      this.chipIconText.setVisible(true);
    } else {
      this.chipIconText.setVisible(false);
    }
  }

  public cycleTargetPriority(): TargetPriority {
    const priorities = [
      TargetPriority.FIRST,
      TargetPriority.STRONGEST,
      TargetPriority.FASTEST,
      TargetPriority.CLOSEST,
      TargetPriority.LAST
    ];
    const currentIndex = priorities.indexOf(this.targetPriority);
    this.targetPriority = priorities[(currentIndex + 1) % priorities.length];
    return this.targetPriority;
  }

  public canUpgrade(): boolean {
    return this.level < 3;
  }

  public canEvolveTier4(): boolean {
    return this.level === 3 && this.tier4Branch === null && !!this.config.tier4Branches;
  }

  public getTier4Branches(): [Tier4BranchData, Tier4BranchData] | undefined {
    return this.config.tier4Branches;
  }

  public getUpgradeCost(): number {
    if (!this.canUpgrade()) return 0;
    const cost = this.getLevelData().upgradeCost;
    const save = SaveManager.getInstance();
    return save.hasTech('cost_discount') ? Math.round(cost * 0.9) : cost;
  }

  public getTier4Cost(branch: Tier4BranchData): number {
    const cost = branch.upgradeCost;
    const save = SaveManager.getInstance();
    return save.hasTech('cost_discount') ? Math.round(cost * 0.9) : cost;
  }

  public upgrade(): boolean {
    if (!this.canUpgrade()) return false;
    this.totalInvested += this.getUpgradeCost();
    this.level++;
    this.updateStats();

    // Efeito visual de upgrade
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 150
    });

    return true;
  }

  public evolveTier4(branchId: TowerBranchId): boolean {
    if (!this.canEvolveTier4()) return false;
    const branches = this.config.tier4Branches;
    if (!branches) return false;

    const branch = branches.find(b => b.branchId === branchId);
    if (!branch) return false;

    this.tier4Branch = branch;
    this.level = 4;
    this.totalInvested += this.getTier4Cost(branch);

    // Troca textura da torre para o sprite customizado do Tier 4
    this.turretSprite.setTexture(branch.turretTextureKey);
    this.updateStats();

    // Efeito visual de super evolução Tier 4
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.35,
      scaleY: 1.35,
      yoyo: true,
      duration: 250
    });

    EventBus.emit(GameEvents.TOWER_EVOLVED, this);
    return true;
  }

  public canEquipChip(): boolean {
    return this.level >= 3;
  }

  public equipChip(chipType: ModChipType | null): boolean {
    if (!this.canEquipChip()) return false;
    this.equippedChip = chipType ? new ModChip(chipType) : null;
    this.updateStats();
    EventBus.emit(GameEvents.CHIP_EQUIPPED, { tower: this, chip: this.equippedChip });
    return true;
  }

  public getSellValue(): number {
    return Math.round(this.totalInvested * GAME_CONSTANTS.SELL_RATIO);
  }

  public stun(durationMs: number): void {
    const wasStunned = this.stunTimerMs > 0;
    this.stunTimerMs = Math.max(this.stunTimerMs, durationMs);
    if (!wasStunned && this.scene) {
      const stunTxt = this.scene.add.text(this.x, this.y - 32, '💫 ATORDOADA!', {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fde047',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.scene.tweens.add({
        targets: stunTxt,
        y: stunTxt.y - 20,
        alpha: 0,
        duration: 900,
        onComplete: () => stunTxt.destroy()
      });
    }
  }

  public applyHaste(multiplier = 1.4, durationMs = 8000): void {
    this.hasteMultiplier = multiplier;
    this.hasteBuffTimerMs = durationMs;
    this.drawHasteAura();

    // Floating text feedback on the tower
    if (this.scene) {
      const txt = this.scene.add.text(this.x, this.y - 28, '⚡ +40% VEL!', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#38bdf8',
        stroke: '#0369a1',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.scene.tweens.add({
        targets: txt,
        y: txt.y - 26,
        alpha: 0,
        duration: 900,
        onComplete: () => txt.destroy()
      });
    }
  }

  private drawHasteAura(): void {
    if (!this.hasteAuraGraphics) return;
    this.hasteAuraGraphics.clear();
    if (this.hasteBuffTimerMs <= 0) return;

    // Glowing cyan/golden runic rings underneath tower
    this.hasteAuraGraphics.fillStyle(0x38bdf8, 0.22);
    this.hasteAuraGraphics.fillCircle(0, 0, 36);
    this.hasteAuraGraphics.lineStyle(2.5, 0x7dd3fc, 0.95);
    this.hasteAuraGraphics.strokeCircle(0, 0, 36);

    // Inner pulsing ring
    this.hasteAuraGraphics.lineStyle(1.5, 0xfde047, 0.8);
    this.hasteAuraGraphics.strokeCircle(0, 0, 24);

    // Rotating 4-point glyph spikes
    const angle = (this.scene ? this.scene.time.now : 0) * 0.003;
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2;
      const rx = Math.cos(a) * 36;
      const ry = Math.sin(a) * 36;
      this.hasteAuraGraphics.fillStyle(0xfde047, 0.9);
      this.hasteAuraGraphics.fillCircle(rx, ry, 3.5);
    }
  }

  public updateTower(
    deltaMs: number,
    speedMultiplier: number,
    enemies: Enemy[],
    projectilesPool: { get: () => Projectile }
  ): void {
    const effectiveDelta = deltaMs * speedMultiplier;

    // Atualiza Buff de Pressa Arcana
    if (this.hasteBuffTimerMs > 0) {
      this.hasteBuffTimerMs = Math.max(0, this.hasteBuffTimerMs - effectiveDelta);
      if (this.hasteBuffTimerMs <= 0) {
        this.hasteMultiplier = 1.0;
        this.hasteAuraGraphics.clear();
      } else {
        this.drawHasteAura();
      }
    }

    if (this.stunTimerMs > 0) {
      this.stunTimerMs -= effectiveDelta;
      this.laserGraphics.clear();
      this.teslaGraphics.clear();
      this.turretSprite.setTint(0xfde047);
      return;
    } else {
      this.turretSprite.clearTint();
    }

    this.fireCooldownMs = Math.max(0, this.fireCooldownMs - effectiveDelta);
    this.cryoStunCooldownMs = Math.max(0, this.cryoStunCooldownMs - effectiveDelta);

    const range = this.getEffectiveRange();
    const inRangeEnemies = enemies.filter(e => e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= range);

    // A Bruxa Oracular é a resposta estratégica contra inimigos camuflados.
    // Mantém a revelação enquanto eles permanecem no seu círculo de vigília.
    if (this.towerType === TowerType.WITCH) {
      inRangeEnemies.forEach(enemy => enemy.reveal(1500));
    }

    this.currentTarget = this.selectTarget(inRangeEnemies);

    if (this.currentTarget) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
      this.turretSprite.rotation = angle + Math.PI / 2;

      // Executa lógica de disparo de acordo com o tipo
      if (this.towerType === TowerType.LASER) {
        this.fireLaser(effectiveDelta, inRangeEnemies);
      } else if (this.fireCooldownMs <= 0) {
        this.fireAttack(this.currentTarget, projectilesPool, enemies);
      }
    } else {
      this.laserGraphics.clear();
      this.teslaGraphics.clear();
    }
  }

  private selectTarget(inRange: Enemy[]): Enemy | null {
    if (inRange.length === 0) return null;

    switch (this.targetPriority) {
      case TargetPriority.FIRST:
        return inRange.reduce((prev, curr) => curr.getDistanceTravelled() > prev.getDistanceTravelled() ? curr : prev);
      case TargetPriority.LAST:
        return inRange.reduce((prev, curr) => curr.getDistanceTravelled() < prev.getDistanceTravelled() ? curr : prev);
      case TargetPriority.STRONGEST:
        return inRange.reduce((prev, curr) => curr.currentHp > prev.currentHp ? curr : prev);
      case TargetPriority.FASTEST:
        return inRange.reduce((prev, curr) => curr.config.speed > prev.config.speed ? curr : prev);
      case TargetPriority.CLOSEST:
      default:
        return inRange.reduce((prev, curr) => {
          const dPrev = Phaser.Math.Distance.Between(this.x, this.y, prev.x, prev.y);
          const dCurr = Phaser.Math.Distance.Between(this.x, this.y, curr.x, curr.y);
          return dCurr < dPrev ? curr : prev;
        });
    }
  }

  private fireAttack(target: Enemy, projectilesPool: { get: () => Projectile }, allEnemies: Enemy[]): void {
    const lvl = this.getLevelData();
    const damage = this.getEffectiveDamage();
    const effectiveFireRate = lvl.fireRate * (this.hasteBuffTimerMs > 0 ? this.hasteMultiplier : 1.0);
    this.fireCooldownMs = 1000 / effectiveFireRate;

    const attacks: Partial<Record<TowerType, () => void>> = {
      [TowerType.GATLING]: () => this.fireGatling(target, projectilesPool, allEnemies, damage),
      [TowerType.CANNON]: () => this.fireCannon(target, projectilesPool, allEnemies, damage, lvl),
      [TowerType.CRYO]: () => this.fireCryo(target, projectilesPool, allEnemies, damage, lvl),
      [TowerType.TESLA]: () => this.fireTesla(target, damage, allEnemies, lvl),
      [TowerType.WITCH]: () => this.fireWitch(target, projectilesPool, allEnemies, damage, lvl)
    };
    attacks[this.towerType]?.();
  }

  private fireGatling(target: Enemy, projectilesPool: { get: () => Projectile }, allEnemies: Enemy[], damage: number): void {
    AudioManager.getInstance().playGatling();
    const proj = projectilesPool.get();
    if (this.tier4Branch?.branchId === TowerBranchId.GATLING_SNIPER) {
      proj.fire(this.x, this.y, target, damage, DamageType.PHYSICAL, 'proj_sniper', 1100, 0, undefined, undefined, allEnemies, this.equippedChip, false, undefined, undefined, true);
    } else {
      const speed = this.tier4Branch?.branchId === TowerBranchId.GATLING_VULCAN ? 850 : 750;
      proj.fire(this.x, this.y, target, damage, DamageType.PHYSICAL, 'proj_bullet', speed, 0, undefined, undefined, allEnemies, this.equippedChip);
    }
  }

  private fireCannon(
    target: Enemy,
    projectilesPool: { get: () => Projectile },
    allEnemies: Enemy[],
    damage: number,
    lvl: { splashRadius?: number }
  ): void {
    AudioManager.getInstance().playCannon();
    const proj = projectilesPool.get();
    if (this.tier4Branch?.branchId === TowerBranchId.CANNON_MISSILES) {
      proj.fire(this.x, this.y, target, damage, DamageType.PHYSICAL, 'proj_missile', 550, lvl.splashRadius || 90, undefined, undefined, allEnemies, this.equippedChip, true);
    } else if (this.tier4Branch?.branchId === TowerBranchId.CANNON_NUCLEAR) {
      proj.fire(this.x, this.y, target, damage, DamageType.PHYSICAL, 'proj_nuke', 400, lvl.splashRadius || 160, undefined, undefined, allEnemies, this.equippedChip, false, 80, 4000);
    } else {
      proj.fire(this.x, this.y, target, damage, DamageType.PHYSICAL, 'proj_cannon', 450, lvl.splashRadius || 80, undefined, undefined, allEnemies, this.equippedChip);
    }
  }

  private fireCryo(
    target: Enemy,
    projectilesPool: { get: () => Projectile },
    allEnemies: Enemy[],
    damage: number,
    lvl: { slowFactor?: number; slowDuration?: number; splashRadius?: number }
  ): void {
    AudioManager.getInstance().playFreeze();
    const proj = projectilesPool.get();
    if (this.tier4Branch?.branchId === TowerBranchId.CRYO_ZERO) {
      proj.fire(this.x, this.y, target, damage, DamageType.FROST, 'proj_cryo', 550, 80, lvl.slowFactor, lvl.slowDuration, allEnemies, this.equippedChip);
      if (this.cryoStunCooldownMs <= 0) {
        target.applyStatus('STUN', 700);
        this.cryoStunCooldownMs = 2200;
      }
    } else {
      proj.fire(this.x, this.y, target, damage, DamageType.FROST, 'proj_cryo', 500, lvl.splashRadius || 100, lvl.slowFactor, lvl.slowDuration, allEnemies, this.equippedChip);
    }
  }

  private fireTesla(target: Enemy, damage: number, allEnemies: Enemy[], lvl: { chainCount?: number; splashRadius?: number }): void {
    if (this.tier4Branch?.branchId === TowerBranchId.TESLA_PLASMA) {
      this.firePlasmaDischarge(target, damage, lvl.splashRadius || 80, allEnemies);
    } else {
      this.fireTeslaArc(target, damage, lvl.chainCount || 3, allEnemies);
    }
  }

  private fireWitch(
    target: Enemy,
    projectilesPool: { get: () => Projectile },
    allEnemies: Enemy[],
    damage: number,
    lvl: { splashRadius?: number }
  ): void {
    AudioManager.getInstance().playTesla();
    const proj = projectilesPool.get();
    proj.fire(
      this.x,
      this.y,
      target,
      damage,
      DamageType.ELECTRIC,
      'proj_witch_orb',
      520,
      lvl.splashRadius || 46,
      undefined,
      undefined,
      allEnemies,
      this.equippedChip
    );
  }

  private fireLaser(effectiveDelta: number, inRangeEnemies: Enemy[]): void {
    const lvl = this.getLevelData();
    const baseDps = lvl.laserDPS || 60;
    const dps = baseDps * (this.hasteBuffTimerMs > 0 ? this.hasteMultiplier : 1.0) * this.getModifierDamageMultiplier();
    AudioManager.getInstance().playLaser();
    this.laserGraphics.clear();

    const beams: Record<LaserFireKind, () => void> = {
      prism: () => this.firePrismLasers(dps * (effectiveDelta / 1000), inRangeEnemies),
      orbital: () => this.fireFocusedLaser(dps * (effectiveDelta / 1000), inRangeEnemies, 8, 0xe11d48),
      beam: () => this.fireFocusedLaser(dps * (effectiveDelta / 1000), inRangeEnemies, 4, 0xa855f7)
    };
    beams[laserFireKind(this.tier4Branch?.branchId)]();
  }

  private applyLaserTick(target: Enemy, frameDamage: number, inRangeEnemies: Enemy[]): void {
    let finalDamage = frameDamage;
    let ignoreArmor = false;
    let isCrit = false;
    if (this.equippedChip) {
      const hit = this.equippedChip.applyToHit(frameDamage, target);
      finalDamage = hit.damage;
      ignoreArmor = hit.ignoreArmor;
      isCrit = hit.isCrit;
    }
    target.takeDamage(finalDamage, DamageType.LASER, false, inRangeEnemies, ignoreArmor, isCrit);
  }

  private strokeLaserBeam(targetX: number, targetY: number, width: number, color: number): void {
    this.laserGraphics.lineStyle(width, color, 0.9);
    this.laserGraphics.lineBetween(this.x, this.y, targetX, targetY);
    this.laserGraphics.lineStyle(Math.max(1.5, width / 2), 0xffffff, 1);
    this.laserGraphics.lineBetween(this.x, this.y, targetX, targetY);
  }

  private firePrismLasers(frameDamage: number, inRangeEnemies: Enemy[]): void {
    const targets = [...inRangeEnemies]
      .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))
      .slice(0, 4);
    targets.forEach(target => {
      this.applyLaserTick(target, frameDamage, inRangeEnemies);
      this.strokeLaserBeam(target.x, target.y, 3, 0xa855f7);
    });
  }

  private fireFocusedLaser(frameDamage: number, inRangeEnemies: Enemy[], width: number, color: number): void {
    if (!this.currentTarget) return;
    this.applyLaserTick(this.currentTarget, frameDamage, inRangeEnemies);
    this.strokeLaserBeam(this.currentTarget.x, this.currentTarget.y, width, color);
  }

  private fireTeslaArc(initialTarget: Enemy, damage: number, maxChains: number, allEnemies: Enemy[]): void {
    AudioManager.getInstance().playTesla();
    const hitList: Enemy[] = [initialTarget];

    let currentDmg = damage;
    let isCrit = false;
    let ignoreArmor = false;

    if (this.equippedChip) {
      const hit = this.equippedChip.applyToHit(currentDmg, initialTarget);
      currentDmg = hit.damage;
      isCrit = hit.isCrit;
      ignoreArmor = hit.ignoreArmor;
    }

    initialTarget.takeDamage(currentDmg, DamageType.ELECTRIC, true, allEnemies, ignoreArmor, isCrit);

    let current = initialTarget;
    for (let c = 1; c < maxChains; c++) {
      const candidates = allEnemies.filter(e => e.isAlive && !hitList.includes(e) && Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y) <= 130);
      if (candidates.length === 0) break;
      const nextTarget = pickNearestEnemy(current.x, current.y, candidates);
      if (!nextTarget) break;
      hitList.push(nextTarget);
      currentDmg *= 0.5;
      nextTarget.takeDamage(currentDmg, DamageType.ELECTRIC, true, allEnemies, ignoreArmor, isCrit);
      current = nextTarget;
    }

    // Desenha arco elétrico em zigue-zague
    this.teslaGraphics.clear();
    const arcColor = this.tier4Branch?.branchId === TowerBranchId.TESLA_STORM ? 0x38bdf8 : 0xfacc15;
    this.teslaGraphics.lineStyle(3, arcColor, 1);
    let prevX = this.x;
    let prevY = this.y;
    hitList.forEach(node => {
      this.teslaGraphics.lineBetween(prevX, prevY, node.x, node.y);
      prevX = node.x;
      prevY = node.y;
    });

    this.scene.time.delayedCall(120, () => {
      this.teslaGraphics.clear();
    });

    if (this.equippedChip) {
      this.equippedChip.applyOnHitEffects(this.scene, initialTarget.x, initialTarget.y, initialTarget, currentDmg, DamageType.ELECTRIC, allEnemies);
    }
  }

  private firePlasmaDischarge(target: Enemy, damage: number, splashRadius: number, allEnemies: Enemy[]): void {
    AudioManager.getInstance().playTesla();
    let finalDmg = damage;
    let isCrit = false;
    let ignoreArmor = false;

    if (this.equippedChip) {
      const hit = this.equippedChip.applyToHit(finalDmg, target);
      finalDmg = hit.damage;
      isCrit = hit.isCrit;
      ignoreArmor = hit.ignoreArmor;
    }

    target.takeDamage(finalDmg, DamageType.ELECTRIC, true, allEnemies, ignoreArmor, isCrit);

    // Splash shockwave
    allEnemies.forEach(e => {
      if (e.isAlive && e !== target) {
        const d = Phaser.Math.Distance.Between(target.x, target.y, e.x, e.y);
        if (d <= splashRadius) {
          e.takeDamage(finalDmg * 0.5, DamageType.ELECTRIC, true, allEnemies, ignoreArmor, isCrit);
        }
      }
    });

    // Plasma blast circle
    const circle = this.scene.add.circle(target.x, target.y, 10, 0xfacc15, 0.85);
    this.scene.tweens.add({
      targets: circle,
      radius: splashRadius,
      alpha: 0,
      duration: 250,
      onComplete: () => circle.destroy()
    });

    // Lightning bolt line
    this.teslaGraphics.clear();
    this.teslaGraphics.lineStyle(5, 0xfef08a, 1);
    this.teslaGraphics.lineBetween(this.x, this.y, target.x, target.y);
    this.scene.time.delayedCall(140, () => {
      this.teslaGraphics.clear();
    });

    if (this.equippedChip) {
      this.equippedChip.applyOnHitEffects(this.scene, target.x, target.y, target, finalDmg, DamageType.ELECTRIC, allEnemies);
    }
  }

  public destroy(fromScene?: boolean): void {
    if (this.upgradePulseTween) {
      this.upgradePulseTween.stop();
      this.upgradePulseTween = null;
    }
    this.hasteAuraGraphics.destroy();
    this.laserGraphics.destroy();
    this.teslaGraphics.destroy();
    this.upgradeRangeGraphics.destroy();
    super.destroy(fromScene);
  }
}
