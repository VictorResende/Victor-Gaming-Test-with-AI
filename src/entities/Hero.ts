import Phaser from 'phaser';
import { DamageType, GAME_CONSTANTS, HeroAbilityId, HeroClass } from '../core/Constants';
import { HEROES_CONFIG, HeroAbilityConfigData, HeroConfigData } from '../config/gameConfig';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile } from './Projectile';
import { AudioManager } from '../managers/AudioManager';
import { HapticsManager } from '../managers/HapticsManager';
import { SaveManager } from '../managers/SaveManager';
import { EventBus, GameEvents } from '../core/EventBus';
import { t } from '../i18n/locales';

export class MiniTurret extends Phaser.GameObjects.Container {
  public isAlive = true;
  private lifeTimerMs: number;
  private damage: number;
  private range: number;
  private fireCooldownMs = 0;
  private fireRate = 3.5; // Disparos por segundo
  private baseSprite: Phaser.GameObjects.Sprite;
  private rangeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, durationMs: number, damage: number, range = 160) {
    super(scene, x, y);
    this.lifeTimerMs = durationMs;
    this.damage = damage;
    this.range = range;

    this.baseSprite = scene.add.sprite(0, 0, 'turret_mini_drone');
    this.add(this.baseSprite);

    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);

    scene.add.existing(this);

    // Efeito de spawn
    this.setScale(0.2);
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  public updateTurret(deltaMs: number, speedMultiplier: number, enemies: Enemy[], projectilesPool?: { get: () => Projectile }): void {
    if (!this.isAlive) return;

    const effectiveDelta = deltaMs * speedMultiplier;
    this.lifeTimerMs -= effectiveDelta;
    this.fireCooldownMs = Math.max(0, this.fireCooldownMs - effectiveDelta);

    if (this.lifeTimerMs <= 0) {
      this.destroyTurret();
      return;
    }

    // Procura inimigo no alcance
    const target = enemies.find(e => e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.range);
    if (target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.baseSprite.rotation = angle + Math.PI / 2;

      if (this.fireCooldownMs <= 0) {
        this.fireCooldownMs = 1000 / this.fireRate;
        if (projectilesPool) {
          const proj = projectilesPool.get();
          proj.fire(this.x, this.y, target, this.damage, DamageType.LASER, 'proj_bullet', 800);
        } else {
          target.takeDamage(this.damage, DamageType.LASER);
        }
        AudioManager.getInstance().playGatling();
      }
    }
  }

  public destroyTurret(): void {
    this.isAlive = false;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }
}

export class Hero extends Phaser.GameObjects.Container {
  public heroClass: HeroClass;
  public config: HeroConfigData;
  public level = 1;
  public currentXp = 0;
  public xpToNextLevel = 100;
  public currentHp: number;
  public maxHp: number;
  public isAlive = true;
  public isMoving = false;
  public isSelected = false;

  // Atributos escalonados por nível
  public attackDamage: number;
  public attackSpeed: number; // Ataques por segundo
  public effectiveRange: number;
  public armor: number;
  public moveSpeed: number;
  public hpRegenPerSec: number;

  // Cooldowns de Habilidades (ms restantes)
  public abilityCooldowns: [number, number] = [0, 0];

  // Efeitos Ativos (Escudo / Buffs / Stun)
  public isInvulnerable = false;
  public shieldDurationRemainingMs = 0;
  public shieldAuraTimerMs = 0;
  public overchargeDurationRemainingMs = 0;
  public respawnTimerRemainingMs = 0;
  public totalRespawnDurationMs = GAME_CONSTANTS.HERO_RESPAWN_TIME_MS;
  public stunDurationRemainingMs = 0;

  // Balões de Fala Comic-Book & Altar de Ressurreição
  private activeSpeechBubble: Phaser.GameObjects.Container | null = null;
  private heavyDamageSpeechCooldownMs = 0;
  private resurrectionAltar: Phaser.GameObjects.Container | null = null;
  private altarTimerGraphics: Phaser.GameObjects.Graphics | null = null;
  private altarTimerText: Phaser.GameObjects.Text | null = null;
  private altarRuneCircle: Phaser.GameObjects.Graphics | null = null;

  // Mini-Torretas ativas (Classe Drone Engineer)
  public activeTurrets: MiniTurret[] = [];

  // Componentes Visuais
  private heroSprite: Phaser.GameObjects.Sprite;
  private selectionRing: Phaser.GameObjects.Graphics;
  private rangeGraphics: Phaser.GameObjects.Graphics;
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBarFill: Phaser.GameObjects.Graphics;
  private levelBadgeText: Phaser.GameObjects.Text;
  private shieldSprite: Phaser.GameObjects.Sprite;
  private moveTargetSprite: Phaser.GameObjects.Sprite | null = null;

  // Estado de Combate e Movimento
  private targetPoint: { x: number; y: number } | null = null;
  private attackCooldownMs = 0;
  private currentTarget: Enemy | null = null;
  private outOfCombatTimerMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, heroClass: HeroClass = HeroClass.MECHA_DEFENDER) {
    super(scene, x, y);

    this.heroClass = heroClass;
    this.config = HEROES_CONFIG[heroClass];
    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = this.calculateXpForLevel(1);

    // Aplica bônus de talentos permanentes do SaveManager
    const save = SaveManager.getInstance();
    const hpMult = save.hasHeroPerk('hero_hp_boost') ? 1.20 : 1.0;
    const dmgMult = save.hasHeroPerk('hero_damage_boost') ? 1.15 : 1.0;
    const moveMult = save.hasHeroPerk('hero_move_speed') ? 1.15 : 1.0;

    // Inicializa atributos base com vantagens
    this.maxHp = Math.round(this.config.baseHp * hpMult);
    this.currentHp = this.maxHp;
    this.attackDamage = Math.round(this.config.baseDamage * dmgMult);
    this.attackSpeed = this.config.baseAttackSpeed;
    this.effectiveRange = this.config.baseRange;
    this.armor = this.config.baseArmor;
    this.moveSpeed = Math.round(this.config.moveSpeed * moveMult);
    this.hpRegenPerSec = this.config.hpRegenPerSec;

    // 1. Círculo de Alcance
    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);
    this.rangeGraphics.setVisible(false);

    // 2. Anel de Seleção Tátil
    this.selectionRing = scene.add.graphics();
    this.add(this.selectionRing);
    this.drawSelectionRing();
    this.selectionRing.setVisible(false);

    // 3. Sprite do Herói
    this.heroSprite = scene.add.sprite(0, 0, this.config.textureKey);
    this.add(this.heroSprite);

    // 4. Efeito de Escudo de Força
    this.shieldSprite = scene.add.sprite(0, 0, 'fx_shield').setScale(0.85).setAlpha(0);
    this.add(this.shieldSprite);

    // 5. Barra de Vida Flutuante
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.fillStyle(0x0f172a, 0.85);
    this.hpBarBg.fillRoundedRect(-22, -34, 44, 7, 3);
    this.add(this.hpBarBg);

    this.hpBarFill = scene.add.graphics();
    this.add(this.hpBarFill);
    this.updateHpBar();

    // 6. Badge de Nível (★Nv.1)
    this.levelBadgeText = scene.add.text(0, -42, '★Nv.1', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.levelBadgeText);

    // 7. Interatividade Touch
    this.setSize(64, 64);
    this.setInteractive(new Phaser.Geom.Rectangle(-32, -32, 64, 64), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.toggleSelection();
    });

    scene.add.existing(this);
    this.drawRangeCircle();
  }

  // ==========================================
  // CONTROLE DE SELEÇÃO & INTERFACE
  // ==========================================
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.selectionRing.setVisible(selected);
    this.rangeGraphics.setVisible(selected);

    if (selected) {
      this.drawRangeCircle();
      this.drawSelectionRing();
      AudioManager.getInstance().playClick();
      HapticsManager.getInstance().tap();
      EventBus.emit(GameEvents.HERO_SELECTED, this);
    } else {
      EventBus.emit(GameEvents.HERO_DESELECTED, this);
    }
  }

  public toggleSelection(): void {
    this.setSelected(!this.isSelected);
  }

  private drawSelectionRing(): void {
    this.selectionRing.clear();
    // Anel externo verde esmeralda pulsante
    this.selectionRing.lineStyle(2, 0x22c55e, 0.9);
    this.selectionRing.strokeCircle(0, 0, 36);
    // Cantos decorativos estilo sci-fi reticle
    this.selectionRing.lineStyle(3, 0x86efac, 1);
    this.selectionRing.beginPath();
    this.selectionRing.arc(0, 0, 38, -Math.PI * 0.85, -Math.PI * 0.65, false);
    this.selectionRing.arc(0, 0, 38, -Math.PI * 0.35, -Math.PI * 0.15, false);
    this.selectionRing.arc(0, 0, 38, Math.PI * 0.15, Math.PI * 0.35, false);
    this.selectionRing.arc(0, 0, 38, Math.PI * 0.65, Math.PI * 0.85, false);
    this.selectionRing.strokePath();
  }

  private drawRangeCircle(): void {
    this.rangeGraphics.clear();
    this.rangeGraphics.lineStyle(2, this.config.color, 0.7);
    this.rangeGraphics.strokeCircle(0, 0, this.effectiveRange);
    this.rangeGraphics.fillStyle(this.config.color, 0.08);
    this.rangeGraphics.fillCircle(0, 0, this.effectiveRange);
  }

  // ==========================================
  // MOVIMENTAÇÃO TAP-TO-MOVE
  // ==========================================
  public walkTo(x: number, y: number): void {
    if (!this.isAlive) return;

    this.targetPoint = { x, y };
    this.isMoving = true;

    // Cria ou move o marcador de destino no chão
    if (!this.moveTargetSprite) {
      this.moveTargetSprite = this.scene.add.sprite(x, y, 'hero_move_target');
      this.scene.tweens.add({
        targets: this.moveTargetSprite,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.85,
        yoyo: true,
        duration: 500,
        repeat: -1
      });
    } else {
      this.moveTargetSprite.setPosition(x, y);
      this.moveTargetSprite.setVisible(true);
    }

    AudioManager.getInstance().playHeroMove();
    HapticsManager.getInstance().heroMove();
    EventBus.emit(GameEvents.HERO_MOVED, { x, y });
  }

  public stopMovement(): void {
    this.isMoving = false;
    this.targetPoint = null;
    if (this.moveTargetSprite) {
      this.moveTargetSprite.setVisible(false);
    }
  }

  // ==========================================
  // LOOP PRINCIPAL DE GAMEPLAY (UPDATE)
  // ==========================================
  public updateHero(
    deltaMs: number,
    speedMultiplier: number,
    enemies: Enemy[],
    projectilesPool: { get: () => Projectile },
    towers: Tower[] = []
  ): void {
    const effectiveDelta = deltaMs * speedMultiplier;

    // 1. Herói Morto / Altar de Ressurreição com Medidor Radial
    if (!this.isAlive) {
      this.respawnTimerRemainingMs -= effectiveDelta;

      // Atualiza o Altar de Ressurreição Celestial & Medidor Radial
      if (this.resurrectionAltar && this.altarTimerGraphics && this.altarTimerText) {
        const progress = Math.max(0, this.respawnTimerRemainingMs / this.totalRespawnDurationMs);
        const secondsLeft = Math.max(0, Math.ceil(this.respawnTimerRemainingMs / 1000));
        this.altarTimerText.setText(`${secondsLeft}s`);

        this.altarTimerGraphics.clear();
        // Círculo de fundo escuro
        this.altarTimerGraphics.lineStyle(4, 0x1f2937, 0.85);
        this.altarTimerGraphics.strokeCircle(0, 0, 22);
        // Arco radial de ouro celestial (contador regressivo)
        this.altarTimerGraphics.lineStyle(4, 0xfacc15, 1);
        this.altarTimerGraphics.beginPath();
        this.altarTimerGraphics.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress), false);
        this.altarTimerGraphics.strokePath();

        if (this.altarRuneCircle) {
          this.altarRuneCircle.rotation += 0.015;
        }
      }

      if (this.respawnTimerRemainingMs <= 0) {
        this.respawn();
      }
      return;
    }

    // 1.2. Cooldown do Balão de Fala de Dano Pesado
    this.heavyDamageSpeechCooldownMs = Math.max(0, this.heavyDamageSpeechCooldownMs - effectiveDelta);

    // 1.5. Herói Atordoado (Stun)
    if (this.stunDurationRemainingMs > 0) {
      this.stunDurationRemainingMs -= effectiveDelta;
      this.heroSprite.setTint(0xfde047);
      if (this.stunDurationRemainingMs <= 0) {
        this.heroSprite.clearTint();
      }
      return;
    } else {
      this.heroSprite.clearTint();
    }

    // 2. Atualiza Cooldowns de Habilidades
    this.abilityCooldowns[0] = Math.max(0, this.abilityCooldowns[0] - effectiveDelta);
    this.abilityCooldowns[1] = Math.max(0, this.abilityCooldowns[1] - effectiveDelta);
    this.attackCooldownMs = Math.max(0, this.attackCooldownMs - effectiveDelta);
    this.outOfCombatTimerMs += effectiveDelta;

    // 3. Atualiza Duração de Efeitos (Escudo / Invulnerabilidade)
    if (this.isInvulnerable) {
      this.shieldDurationRemainingMs -= effectiveDelta;
      this.shieldAuraTimerMs += effectiveDelta;

      // Dano de aura de fogo ao redor do Mecha a cada 200ms
      if (this.shieldAuraTimerMs >= 200) {
        this.shieldAuraTimerMs = 0;
        const dps = 40 + this.level * 5;
        enemies.forEach(e => {
          if (e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 120) {
            e.takeDamage(dps * 0.2, DamageType.FIRE, false);
          }
        });
      }

      if (this.shieldDurationRemainingMs <= 0) {
        this.isInvulnerable = false;
        this.shieldSprite.setAlpha(0);
      }
    }

    // 4. Regeneração Passiva de HP fora de combate (> 3s sem levar dano)
    if (this.outOfCombatTimerMs > 3000 && this.currentHp < this.maxHp) {
      const regenAmount = (this.hpRegenPerSec * (effectiveDelta / 1000));
      this.currentHp = Math.min(this.maxHp, this.currentHp + regenAmount);
      this.updateHpBar();
      EventBus.emit(GameEvents.HERO_HP_CHANGED, { current: this.currentHp, max: this.maxHp });
    }

    // 5. Movimentação suave até o destino
    if (this.isMoving && this.targetPoint) {
      const dx = this.targetPoint.x - this.x;
      const dy = this.targetPoint.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = (this.moveSpeed * (effectiveDelta / 1000));

      if (dist <= step || dist < 6) {
        this.x = this.targetPoint.x;
        this.y = this.targetPoint.y;
        this.stopMovement();
      } else {
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * step;
        this.y += Math.sin(angle) * step;
        this.heroSprite.rotation = angle + Math.PI / 2;

        // Wobble de caminhada leve
        this.heroSprite.scaleX = 1.0 + Math.sin(this.scene.time.now * 0.015) * 0.05;
        this.heroSprite.scaleY = 1.0 - Math.sin(this.scene.time.now * 0.015) * 0.05;
      }
    } else {
      this.heroSprite.scaleX = 1.0;
      this.heroSprite.scaleY = 1.0;
    }

    // 6. Atualiza Mini-Torretas ativas
    for (let i = this.activeTurrets.length - 1; i >= 0; i--) {
      const turret = this.activeTurrets[i];
      if (turret.isAlive) {
        turret.updateTurret(deltaMs, speedMultiplier, enemies, projectilesPool);
      } else {
        this.activeTurrets.splice(i, 1);
      }
    }

    // 7. Engajamento em Combate
    this.updateCombat(effectiveDelta, enemies, projectilesPool);
  }

  private updateCombat(
    effectiveDelta: number,
    enemies: Enemy[],
    projectilesPool: { get: () => Projectile }
  ): void {
    // Busca inimigos no alcance de combate
    const inRange = enemies.filter(e => e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.effectiveRange);

    if (inRange.length === 0) {
      this.currentTarget = null;
      return;
    }

    // Escolhe alvo prioritário (mais próximo)
    this.currentTarget = inRange.reduce((prev, curr) => {
      const dPrev = Phaser.Math.Distance.Between(this.x, this.y, prev.x, prev.y);
      const dCurr = Phaser.Math.Distance.Between(this.x, this.y, curr.x, curr.y);
      return dCurr < dPrev ? curr : prev;
    });

    if (!this.currentTarget) return;

    // Vira em direção ao alvo
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
    if (!this.isMoving) {
      this.heroSprite.rotation = angle + Math.PI / 2;
    }

    // Executa ataque se cooldown pronto
    if (this.attackCooldownMs <= 0) {
      this.executeBasicAttack(this.currentTarget, inRange, projectilesPool);
      this.attackCooldownMs = 1000 / this.attackSpeed;
    }
  }

  private executeBasicAttack(
    target: Enemy,
    inRangeEnemies: Enemy[],
    projectilesPool: { get: () => Projectile }
  ): void {
    if (this.heroClass === HeroClass.MECHA_DEFENDER) {
      // Sir Galahad: Golpe Sagrado Melee com Espada / Martelo da Luz
      AudioManager.getInstance().playHeroAttack();
      HapticsManager.getInstance().tap();

      // Animação de golpe heroico
      this.scene.tweens.add({
        targets: this.heroSprite,
        scaleX: 1.25,
        scaleY: 1.25,
        yoyo: true,
        duration: 100
      });

      // Efeito de corte sagrado / lâmina dourada no alvo
      const cleaveWave = this.scene.add.circle(target.x, target.y, 35, 0xf59e0b, 0.6);
      this.scene.tweens.add({
        targets: cleaveWave,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 200,
        onComplete: () => cleaveWave.destroy()
      });

      // Dano ao alvo principal e cleave sagrado em área próxima (60px)
      target.takeDamage(this.attackDamage, this.config.damageType);
      inRangeEnemies.forEach(e => {
        if (e !== target && e.isAlive && Phaser.Math.Distance.Between(target.x, target.y, e.x, e.y) <= 60) {
          e.takeDamage(this.attackDamage * 0.5, this.config.damageType);
        }
      });
    } else if (this.heroClass === HeroClass.CYBER_SNIPER) {
      // Alleria: Disparo Preciso com Flecha Espectral Perfurante
      AudioManager.getInstance().playSniperShot();
      HapticsManager.getInstance().tap();

      const proj = projectilesPool.get();
      proj.fire(this.x, this.y, target, this.attackDamage, this.config.damageType, 'proj_sniper', 900);
    } else if (this.heroClass === HeroClass.DRONE_ENGINEER) {
      // Ignis: Disparo de Centelha de Raio Arcano
      AudioManager.getInstance().playTesla();
      HapticsManager.getInstance().tap();

      target.takeDamage(this.attackDamage, this.config.damageType);

      // Arco mágico para 1 inimigo secundário próximo
      const secondary = inRangeEnemies.find(e => e !== target && e.isAlive && Phaser.Math.Distance.Between(target.x, target.y, e.x, e.y) <= 90);
      if (secondary) {
        secondary.takeDamage(this.attackDamage * 0.6, DamageType.ELECTRIC);
      }
    }
  }

  // ==========================================
  // HABILIDADES ATIVAS DO HERÓI
  // ==========================================
  public canUseAbility(abilityIndex: 1 | 2): boolean {
    if (!this.isAlive) return false;
    const cd = this.abilityCooldowns[abilityIndex - 1];
    return cd <= 0;
  }

  public getAbilityConfig(abilityIndex: 1 | 2): HeroAbilityConfigData {
    return this.config.abilities[abilityIndex - 1];
  }

  public getAbilityCooldownProgress(abilityIndex: 1 | 2): number {
    const config = this.getAbilityConfig(abilityIndex);
    const save = SaveManager.getInstance();
    const cdReduction = save.hasHeroPerk('hero_cooldown_reduct') ? 0.80 : 1.0;
    const totalCd = config.cooldownMs * cdReduction;
    const remaining = this.abilityCooldowns[abilityIndex - 1];
    if (remaining <= 0) return 1.0;
    return Math.max(0, 1.0 - (remaining / totalCd));
  }

  public useAbility(
    abilityIndex: 1 | 2,
    enemies: Enemy[] = [],
    towers: Tower[] = []
  ): boolean {
    if (!this.canUseAbility(abilityIndex)) return false;

    const ability = this.getAbilityConfig(abilityIndex);
    const save = SaveManager.getInstance();
    const cdReduction = save.hasHeroPerk('hero_cooldown_reduct') ? 0.80 : 1.0;
    this.abilityCooldowns[abilityIndex - 1] = Math.round(ability.cooldownMs * cdReduction);

    AudioManager.getInstance().playHeroAttack();
    HapticsManager.getInstance().heroAbility();

    // 1. Balão de Fala em Estilo Comic-Book ao Usar Habilidade
    let speechLine = '';
    if (this.heroClass === HeroClass.MECHA_DEFENDER) {
      speechLine = abilityIndex === 1 ? t('speechAbility1Galahad') : t('speechAbility2Galahad');
    } else if (this.heroClass === HeroClass.CYBER_SNIPER) {
      speechLine = abilityIndex === 1 ? t('speechAbility1Alleria') : t('speechAbility2Alleria');
    } else if (this.heroClass === HeroClass.DRONE_ENGINEER) {
      speechLine = abilityIndex === 1 ? t('speechAbility1Ignis') : t('speechAbility2Ignis');
    }

    if (speechLine) {
      this.showComicSpeechBubble(speechLine, 2500, 'shout');
    }

    // 2. Executa a Lógica da Habilidade Específica
    if (ability.id === HeroAbilityId.GROUND_SLAM) {
      this.executeGroundSlam(enemies);
    } else if (ability.id === HeroAbilityId.ENERGY_SHIELD) {
      this.executeEnergyShield();
    } else if (ability.id === HeroAbilityId.HEADSHOT) {
      this.executeHeadshot(enemies);
    } else if (ability.id === HeroAbilityId.ORBITAL_STRIKE) {
      this.executeOrbitalStrike(enemies);
    } else if (ability.id === HeroAbilityId.COMBAT_TURRET) {
      this.executeCombatTurret();
    } else if (ability.id === HeroAbilityId.OVERCHARGE) {
      this.executeOvercharge(enemies, towers);
    }

    EventBus.emit(GameEvents.HERO_ABILITY_USED, {
      hero: this,
      abilityIndex,
      abilityId: ability.id
    });

    return true;
  }

  // ==========================================
  // BALÕES DE FALA EM ESTILO COMIC-BOOK / HQ
  // ==========================================
  public showComicSpeechBubble(
    message: string,
    durationMs = 2500,
    bubbleType: 'normal' | 'shout' | 'crit' = 'normal'
  ): void {
    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.destroy();
      this.activeSpeechBubble = null;
    }

    const bubbleContainer = this.scene.add.container(0, -68);

    const textColor = bubbleType === 'crit' ? '#991b1b' : (bubbleType === 'shout' ? '#1e3a8a' : '#0f172a');
    const bubbleText = this.scene.add.text(0, -2, message.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, Trebuchet MS, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: textColor,
      align: 'center',
      letterSpacing: 0.5
    }).setOrigin(0.5);

    const padX = 14;
    const padY = 8;
    const bw = Math.max(76, bubbleText.width + padX * 2);
    const bh = Math.max(28, bubbleText.height + padY * 2);

    const bubbleGfx = this.scene.add.graphics();

    // Sombra do balão estilo quadrinhos
    bubbleGfx.fillStyle(0x000000, 0.35);
    bubbleGfx.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 3, bw, bh, 8);
    bubbleGfx.fillTriangle(
      -5 + 2, bh / 2 + 3,
      5 + 2, bh / 2 + 3,
      -1 + 2, bh / 2 + 10 + 3
    );

    // Fundo do balão (Branco / Amarelo HQ)
    const bgColor = bubbleType === 'crit' ? 0xfef9c3 : (bubbleType === 'shout' ? 0xffedd5 : 0xffffff);
    bubbleGfx.fillStyle(bgColor, 1);
    bubbleGfx.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);

    // Ponta do balão apontando para a cabeça do herói
    bubbleGfx.fillTriangle(
      -6, bh / 2 - 1,
      6, bh / 2 - 1,
      -2, bh / 2 + 9
    );

    // Contorno preto grosso estilo Comic Book
    bubbleGfx.lineStyle(2.5, 0x0f172a, 1);
    bubbleGfx.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);

    // Linhas do contorno da ponta
    bubbleGfx.lineBetween(-6, bh / 2 - 1, -2, bh / 2 + 9);
    bubbleGfx.lineBetween(6, bh / 2 - 1, -2, bh / 2 + 9);
    // Mascara a emenda superior da ponta
    bubbleGfx.fillStyle(bgColor, 1);
    bubbleGfx.fillRect(-5, bh / 2 - 2, 10, 3);

    bubbleContainer.add([bubbleGfx, bubbleText]);
    this.add(bubbleContainer);
    this.activeSpeechBubble = bubbleContainer;

    // Animação Pop-in de Cartoon (Scale 0.1 -> 1.18 -> 1.0)
    bubbleContainer.setScale(0.1);
    bubbleContainer.setAlpha(0);

    this.scene.tweens.add({
      targets: bubbleContainer,
      scaleX: 1.18,
      scaleY: 1.18,
      alpha: 1,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (bubbleContainer.active) {
          this.scene.tweens.add({
            targets: bubbleContainer,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
            ease: 'Sine.easeInOut'
          });
        }
      }
    });

    // Flutuação sutil de desenho animado
    this.scene.tweens.add({
      targets: bubbleContainer,
      y: -73,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto Pop-out e destruição no final da duração
    this.scene.time.delayedCall(Math.max(500, durationMs - 250), () => {
      if (bubbleContainer.active) {
        this.scene.tweens.add({
          targets: bubbleContainer,
          scaleX: 0.15,
          scaleY: 0.15,
          alpha: 0,
          duration: 250,
          ease: 'Back.easeIn',
          onComplete: () => {
            if (this.activeSpeechBubble === bubbleContainer) {
              this.activeSpeechBubble = null;
            }
            bubbleContainer.destroy();
          }
        });
      }
    });
  }

  // Notificação de abate de Chefe
  public onBossSlayed(): void {
    if (this.isAlive) {
      this.showComicSpeechBubble(t('speechBossSlayed'), 2500, 'crit');
    }
  }

  private executeGroundSlam(enemies: Enemy[]): void {
    // Sir Galahad: Golpe Sagrado
    AudioManager.getInstance().playHeroSlam();
    this.scene.cameras.main.shake(250, 0.015);

    // Efeito visual de onda de choque sagrada expansiva
    const shockwave = this.scene.add.sprite(this.x, this.y, 'fx_shockwave');
    shockwave.setScale(0.2).setAlpha(0.9);
    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy()
    });

    const damage = 240 + (this.level * 30);
    const radius = 180;

    enemies.forEach(e => {
      if (e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= radius) {
        e.takeDamage(damage, DamageType.PHYSICAL);
        e.applyStatus('STUN', 2500);
      }
    });
  }

  private executeEnergyShield(): void {
    // Sir Galahad: Aura da Luz
    AudioManager.getInstance().playHeroShield();
    this.isInvulnerable = true;
    this.shieldDurationRemainingMs = 6000 + (this.level * 300);
    this.shieldAuraTimerMs = 0;
    this.shieldSprite.setAlpha(0.85);

    // Animação de pulso radiante na aura sagrada
    this.scene.tweens.add({
      targets: this.shieldSprite,
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      duration: 300,
      repeat: 8
    });
  }

  private executeHeadshot(enemies: Enemy[]): void {
    // Alleria: Tiro Preciso
    AudioManager.getInstance().playSniperShot();
    this.scene.cameras.main.shake(150, 0.008);

    // Escolhe o inimigo com maior HP no alcance de 400px
    const inRange = enemies.filter(e => e.isAlive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 400);
    if (inRange.length === 0) return;

    const strongest = inRange.reduce((prev, curr) => curr.currentHp > prev.currentHp ? curr : prev);
    const damage = 600 + (this.level * 65);

    // Efeito de flecha de luz espectral perfurante instantânea
    const beam = this.scene.add.graphics();
    beam.lineStyle(6, 0xef4444, 1);
    beam.lineBetween(this.x, this.y, strongest.x, strongest.y);
    beam.lineStyle(2, 0xffffff, 1);
    beam.lineBetween(this.x, this.y, strongest.x, strongest.y);

    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 300,
      onComplete: () => beam.destroy()
    });

    strongest.takeDamage(damage, DamageType.LASER);
    strongest.applyStatus('STUN', 1500);
  }

  private executeOrbitalStrike(enemies: Enemy[]): void {
    // Alleria: Chuva de Flechas
    AudioManager.getInstance().playHeroSlam();
    this.scene.cameras.main.shake(350, 0.02);

    let targetX = this.x;
    let targetY = this.y;
    const living = enemies.filter(e => e.isAlive);
    if (living.length > 0) {
      targetX = living[0].x;
      targetY = living[0].y;
    }

    const damageTotal = 480 + (this.level * 50);

    // 4 salvas sucessivas de flechas celestiais
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const blastX = targetX + Phaser.Math.Between(-40, 40);
        const blastY = targetY + Phaser.Math.Between(-40, 40);

        const beam = this.scene.add.graphics();
        beam.lineStyle(12, 0xa855f7, 0.85);
        beam.lineBetween(blastX, 0, blastX, blastY);
        beam.lineStyle(4, 0xffffff, 1);
        beam.lineBetween(blastX, 0, blastX, blastY);

        const circle = this.scene.add.circle(blastX, blastY, 50, 0xf43f5e, 0.7);
        this.scene.tweens.add({
          targets: [beam, circle],
          alpha: 0,
          duration: 300,
          onComplete: () => {
            beam.destroy();
            circle.destroy();
          }
        });

        enemies.forEach(e => {
          if (e.isAlive && Phaser.Math.Distance.Between(blastX, blastY, e.x, e.y) <= 120) {
            e.takeDamage(damageTotal * 0.25, DamageType.LASER);
          }
        });
      });
    }
  }

  private executeCombatTurret(): void {
    // Ignis: Obelisco Mágico Elemental
    AudioManager.getInstance().playBuild();
    const duration = 15000 + (this.level * 1000);
    const damage = 35 + (this.level * 5);
    const turret = new MiniTurret(this.scene, this.x, this.y, duration, damage);
    this.activeTurrets.push(turret);
  }

  private executeOvercharge(enemies: Enemy[], towers: Tower[]): void {
    // Ignis: Sobrecarga Arcana
    AudioManager.getInstance().playTesla();

    // Pulso arcano em área: dano e lentidão
    const damage = 140 + (this.level * 20);
    enemies.forEach(e => {
      if (e.isAlive) {
        e.takeDamage(damage, DamageType.ELECTRIC);
        e.applyStatus('SLOW', 6000, 0.4);
      }
    });

    // Efeito visual de choque mágico em anel
    const shock = this.scene.add.graphics();
    shock.lineStyle(6, 0xeab308, 0.9);
    shock.strokeCircle(this.x, this.y, 260);
    this.scene.tweens.add({
      targets: shock,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 500,
      onComplete: () => shock.destroy()
    });

    // Encanta torres próximas (+40% velocidade de conjuração/disparo)
    towers.forEach(t => {
      if (Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y) <= 260) {
        this.scene.tweens.add({
          targets: t,
          scaleX: 1.15,
          scaleY: 1.15,
          yoyo: true,
          duration: 150
        });
      }
    });
  }

  // ==========================================
  // SISTEMA DE XP E LEVELING (1 ATÉ 10)
  // ==========================================
  public gainXp(amount: number): void {
    if (!this.isAlive || this.level >= GAME_CONSTANTS.MAX_HERO_LEVEL) return;

    const save = SaveManager.getInstance();
    const xpMult = save.hasHeroPerk('hero_xp_boost') ? 1.25 : 1.0;
    const finalAmount = Math.round(amount * xpMult);

    this.currentXp += finalAmount;
    this.showFloatingText(`+${finalAmount} XP`, '#38bdf8');

    while (this.currentXp >= this.xpToNextLevel && this.level < GAME_CONSTANTS.MAX_HERO_LEVEL) {
      this.currentXp -= this.xpToNextLevel;
      this.levelUp();
    }

    EventBus.emit(GameEvents.HERO_XP_CHANGED, {
      current: this.currentXp,
      max: this.xpToNextLevel,
      level: this.level
    });
  }

  private calculateXpForLevel(lvl: number): number {
    return Math.round(100 * Math.pow(1.32, lvl - 1));
  }

  public levelUp(): void {
    if (this.level >= GAME_CONSTANTS.MAX_HERO_LEVEL) return;

    this.level++;
    this.xpToNextLevel = this.calculateXpForLevel(this.level);

    const save = SaveManager.getInstance();
    const hpMult = save.hasHeroPerk('hero_hp_boost') ? 1.20 : 1.0;
    const dmgMult = save.hasHeroPerk('hero_damage_boost') ? 1.15 : 1.0;

    // Escala atributos (+15% HP, +15% Dano, +5% Velocidade de Ataque por nível) com bônus de talentos
    this.maxHp = Math.round(this.config.baseHp * (1 + (this.level - 1) * 0.15) * hpMult);
    this.currentHp = this.maxHp; // Cura 100% no level up!
    this.attackDamage = Math.round(this.config.baseDamage * (1 + (this.level - 1) * 0.15) * dmgMult);
    this.attackSpeed = Number((this.config.baseAttackSpeed * (1 + (this.level - 1) * 0.05)).toFixed(2));
    this.effectiveRange = Math.round(this.config.baseRange * (1 + (this.level - 1) * 0.03));

    // Atualiza HUD e textos flutuantes
    this.levelBadgeText.setText(`★Nv.${this.level}`);
    this.updateHpBar();
    this.drawRangeCircle();

    // Feedback audiovisual
    AudioManager.getInstance().playHeroLevelUp();
    HapticsManager.getInstance().heroLevelUp();

    this.showFloatingText(t('heroLevelUp', { lvl: this.level }), '#facc15', 20);

    // Balão de fala HQ ao subir de nível!
    this.showComicSpeechBubble(t('speechLevelUp'), 2500, 'crit');

    // Anel de partículas douradas no level up
    const ring = this.scene.add.circle(this.x, this.y, 20, 0xfacc15, 0.8);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 600,
      onComplete: () => ring.destroy()
    });

    EventBus.emit(GameEvents.HERO_LEVEL_UP, {
      level: this.level,
      maxHp: this.maxHp,
      damage: this.attackDamage
    });

    EventBus.emit(GameEvents.HERO_HP_CHANGED, {
      current: this.currentHp,
      max: this.maxHp
    });
  }

  // ==========================================
  // DANO, VIDA E RESPAWN COM ALTAR CELESTIAL
  // ==========================================
  public applyStun(durationMs: number): void {
    if (!this.isAlive || this.isInvulnerable) return;
    const wasStunned = this.stunDurationRemainingMs > 0;
    this.stunDurationRemainingMs = Math.max(this.stunDurationRemainingMs, durationMs);
    this.stopMovement();
    if (!wasStunned) {
      this.showFloatingText('💫 ATORDOADO!', '#fde047', 15);
    }
  }

  public takeDamage(amount: number, damageType: DamageType): void {
    if (!this.isAlive || this.isInvulnerable) return;

    this.outOfCombatTimerMs = 0;
    let finalDamage = amount;
    if (damageType === DamageType.PHYSICAL && this.armor > 0) {
      finalDamage *= (1.0 - this.armor);
    }

    this.currentHp = Math.max(0, this.currentHp - finalDamage);
    this.updateHpBar();
    this.showFloatingText(`-${Math.round(finalDamage)}`, '#ef4444');

    // Balão de Fala Comic ao receber dano crítico pesado (>25% maxHp ou HP < 35%)
    if (
      this.currentHp > 0 &&
      (finalDamage >= this.maxHp * 0.25 || this.currentHp <= this.maxHp * 0.35) &&
      this.heavyDamageSpeechCooldownMs <= 0
    ) {
      this.showComicSpeechBubble(t('speechHeavyDamage'), 2200, 'shout');
      this.heavyDamageSpeechCooldownMs = 6000;
    }

    EventBus.emit(GameEvents.HERO_HP_CHANGED, { current: this.currentHp, max: this.maxHp });

    if (this.currentHp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isAlive = false;
    this.stopMovement();

    // Tempo de ressurreição no Altar (15s base, 10s se desbloqueou talento)
    const save = SaveManager.getInstance();
    const hasFastRevive = save.hasHeroPerk('hero_revive_speed');
    this.totalRespawnDurationMs = hasFastRevive ? 10000 : GAME_CONSTANTS.HERO_RESPAWN_TIME_MS;
    this.respawnTimerRemainingMs = this.totalRespawnDurationMs;

    AudioManager.getInstance().playDefeat();
    HapticsManager.getInstance().defeat();

    // Fade out no corpo do herói
    this.scene.tweens.add({
      targets: [this.heroSprite, this.hpBarBg, this.hpBarFill, this.levelBadgeText],
      alpha: 0.15,
      duration: 300
    });

    // Cria o Altar de Ressurreição Celestial com Contador Radial
    this.createResurrectionAltar();

    EventBus.emit(GameEvents.HERO_HP_CHANGED, { current: 0, max: this.maxHp, isDead: true });
  }

  // ==========================================
  // CRIAÇÃO DO ALTAR DE RESSURREIÇÃO CELESTIAL
  // ==========================================
  private createResurrectionAltar(): void {
    if (this.resurrectionAltar) {
      this.resurrectionAltar.destroy();
      this.resurrectionAltar = null;
    }

    const altar = this.scene.add.container(this.x, this.y);

    // 1. Dais de Pedra Sagrada & Runas no Chão
    const dais = this.scene.add.graphics();
    dais.fillStyle(0x0f172a, 0.7);
    dais.fillEllipse(0, 16, 68, 28);

    dais.fillStyle(0x1e1b4b, 0.95);
    dais.fillCircle(0, 0, 34);
    dais.lineStyle(2.5, 0xfacc15, 1);
    dais.strokeCircle(0, 0, 34);
    dais.lineStyle(1.5, 0x38bdf8, 0.8);
    dais.strokeCircle(0, 0, 26);

    // 2. Círculo Rúnico Giratório
    this.altarRuneCircle = this.scene.add.graphics();
    this.altarRuneCircle.lineStyle(1.5, 0xfde047, 0.85);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rx = Math.cos(angle) * 26;
      const ry = Math.sin(angle) * 26;
      this.altarRuneCircle.strokeCircle(rx, ry, 3.5);
      this.altarRuneCircle.lineBetween(0, 0, rx, ry);
    }

    // 3. Feixe / Farol de Luz Celestial Vertical
    const beacon = this.scene.add.graphics();
    beacon.fillStyle(0x38bdf8, 0.18);
    beacon.fillRect(-22, -180, 44, 180);
    beacon.fillStyle(0xfde047, 0.25);
    beacon.fillRect(-10, -180, 20, 180);
    beacon.fillStyle(0xffffff, 0.4);
    beacon.fillRect(-3, -180, 6, 180);

    // Pulso celestial no feixe
    this.scene.tweens.add({
      targets: beacon,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Medidor Radial Flutuante de Contagem Regressiva
    const timerContainer = this.scene.add.container(0, -48);

    const timerBg = this.scene.add.graphics();
    timerBg.fillStyle(0x0f172a, 0.95);
    timerBg.fillCircle(0, 0, 24);
    timerBg.lineStyle(2, 0x334155, 1);
    timerBg.strokeCircle(0, 0, 24);

    this.altarTimerGraphics = this.scene.add.graphics();

    const secondsLeft = Math.ceil(this.respawnTimerRemainingMs / 1000);
    this.altarTimerText = this.scene.add.text(0, 0, `${secondsLeft}s`, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(0.5);

    const altarLabel = this.scene.add.text(0, -32, `✨ ${t('altarResurrection')} ✨`, {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(0.5);

    timerContainer.add([timerBg, this.altarTimerGraphics, this.altarTimerText, altarLabel]);

    altar.add([dais, this.altarRuneCircle, beacon, timerContainer]);

    // Pop-in do Altar
    altar.setScale(0.2);
    altar.setAlpha(0);
    this.scene.tweens.add({
      targets: altar,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.resurrectionAltar = altar;
  }

  // ==========================================
  // RESSURREIÇÃO: FEIXE DE LUZ RADIANTE & CHEER
  // ==========================================
  private respawn(): void {
    this.isAlive = true;
    this.currentHp = this.maxHp;
    this.updateHpBar();

    AudioManager.getInstance().playHeroRespawn();
    HapticsManager.getInstance().heroLevelUp();

    // 1. Feixe de Luz Celestial Radiante descendo dos céus
    const lightBeam = this.scene.add.graphics();
    lightBeam.fillStyle(0x38bdf8, 0.4);
    lightBeam.fillRect(this.x - 30, 0, 60, this.y);
    lightBeam.fillStyle(0xfef08a, 0.85);
    lightBeam.fillRect(this.x - 14, 0, 28, this.y);
    lightBeam.fillStyle(0xffffff, 1.0);
    lightBeam.fillRect(this.x - 4, 0, 8, this.y);

    this.scene.tweens.add({
      targets: lightBeam,
      alpha: 0,
      scaleX: 1.6,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => lightBeam.destroy()
    });

    // 2. Onda de choque sagrada expansiva
    const burst = this.scene.add.circle(this.x, this.y, 20, 0xfde047, 0.95);
    this.scene.tweens.add({
      targets: burst,
      scaleX: 4.5,
      scaleY: 4.5,
      alpha: 0,
      duration: 550,
      ease: 'Sine.easeOut',
      onComplete: () => burst.destroy()
    });

    // 3. Remove e destrói o Altar de Ressurreição
    if (this.resurrectionAltar) {
      this.scene.tweens.add({
        targets: this.resurrectionAltar,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300,
        onComplete: () => {
          if (this.resurrectionAltar) {
            this.resurrectionAltar.destroy();
            this.resurrectionAltar = null;
          }
        }
      });
    }

    // 4. Restaura a opacidade dos elementos do herói
    this.scene.tweens.add({
      targets: [this.heroSprite, this.hpBarBg, this.hpBarFill, this.levelBadgeText],
      alpha: 1.0,
      duration: 350
    });

    // 5. Balão de Fala Comic de Comemoração / Retorno Triunfal!
    this.showComicSpeechBubble(t('speechRevived'), 2500, 'crit');

    EventBus.emit(GameEvents.HERO_RESPAWNED, this);
    EventBus.emit(GameEvents.HERO_HP_CHANGED, { current: this.currentHp, max: this.maxHp, isDead: false });
  }

  private updateHpBar(): void {
    this.hpBarFill.clear();
    const ratio = Math.max(0, this.currentHp / this.maxHp);
    const width = 42 * ratio;

    let color = 0x22c55e;
    if (ratio < 0.3) color = 0xef4444;
    else if (ratio < 0.6) color = 0xf59e0b;

    this.hpBarFill.fillStyle(color, 0.95);
    this.hpBarFill.fillRoundedRect(-21, -33, width, 5, 2);
  }

  private showFloatingText(text: string, color: string, fontSize = 13): void {
    const txt = this.scene.add.text(this.x + Phaser.Math.Between(-12, 12), this.y - 35, text, {
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy()
    });
  }

  public destroy(fromScene?: boolean): void {
    if (this.moveTargetSprite) {
      this.moveTargetSprite.destroy();
    }
    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.destroy();
      this.activeSpeechBubble = null;
    }
    if (this.resurrectionAltar) {
      this.resurrectionAltar.destroy();
      this.resurrectionAltar = null;
    }
    this.activeTurrets.forEach(t => t.destroy());
    super.destroy(fromScene);
  }
}

