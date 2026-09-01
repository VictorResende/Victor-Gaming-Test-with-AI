import Phaser from 'phaser';
import { GameSpeed, TacticalModifier } from '../core/Constants';
import { MODIFIER_INFO } from '../config/dailyChallengeConfig';
import { weatherIcon, WeatherKind } from '../config/weatherCopy';
import { t } from '../i18n/locales';
import { SafeAreaBounds, SafeAreaInsets } from '../utils/SafeArea';
import { bindControl, fillPanel, hudStyle, paintGlassRect, UI } from './UiKit';

export interface TopMatchHudActions {
  onLeave(): void;
  onCallWave(): void;
  onPause(): void;
  onSpeed(speed: GameSpeed): void;
  onWeather(): void;
  onFullscreen(): void;
}

export class TopMatchHud {
  goldText!: Phaser.GameObjects.Text;
  livesText!: Phaser.GameObjects.Text;
  waveText!: Phaser.GameObjects.Text;
  nextWaveLabel!: Phaser.GameObjects.Text;
  speedButtons = new Map<GameSpeed, Phaser.GameObjects.Container>();
  private weatherLabel!: Phaser.GameObjects.Text;
  private bossRush = false;

  create(
    scene: Phaser.Scene,
    width: number,
    safeInsets: SafeAreaInsets,
    safeBounds: SafeAreaBounds,
    opts: {
      gold: number;
      lives: number;
      bossRush: boolean;
      daily: boolean;
      modifiers: TacticalModifier[];
      speed: GameSpeed;
    },
    actions: TopMatchHudActions
  ): void {
    this.bossRush = opts.bossRush;
    const inset = 12;
    const barH = 52;
    const barY = safeInsets.top + 8;
    const centerY = barY + barH / 2;

    const topBarBg = scene.add.graphics();
    fillPanel(topBarBg, inset, barY, width - inset * 2, barH, 16, { alpha: 0.9 });

    const backBtnX = safeBounds.left + 36;
    const backBtn = scene.add.container(backBtnX, centerY);
    const backBg = scene.add.graphics();
    paintGlassRect(backBg, -20, -18, 40, 36, 10);
    backBtn.add([backBg, scene.add.text(0, 0, '←', hudStyle('18px')).setOrigin(0.5)]);
    bindControl(backBtn, 40, 36, () => actions.onLeave());

    const goldX = backBtnX + 52;
    const goldShield = scene.add.graphics();
    paintGlassRect(goldShield, goldX - 6, centerY - 16, 88, 32, 10);
    this.goldText = scene.add.text(goldX + 8, centerY, `${opts.gold}G`, hudStyle('15px', UI.text.amber)).setOrigin(0, 0.5);

    const livesX = goldX + 100;
    const livesShield = scene.add.graphics();
    paintGlassRect(livesShield, livesX - 6, centerY - 16, 72, 32, 10);
    this.livesText = scene.add.text(livesX + 8, centerY, `♥ ${opts.lives}`, hudStyle('15px', '#f87171')).setOrigin(0, 0.5);

    const waveX = livesX + 86;
    const waveShield = scene.add.graphics();
    paintGlassRect(waveShield, waveX - 6, centerY - 16, 118, 32, 10);
    const waveLabel = opts.bossRush ? t('hudBoss') : t('wave');
    this.waveText = scene.add
      .text(waveX + 8, centerY, `${waveLabel} 0/10`, hudStyle('13px', opts.bossRush ? UI.text.amber : '#93c5fd'))
      .setOrigin(0, 0.5);

    const nextWaveX = waveX + 168;
    const nextWaveBtn = scene.add.container(nextWaveX, centerY);
    const nwBg = scene.add.graphics();
    nwBg.fillStyle(UI.color.amber, 1);
    nwBg.fillRoundedRect(-72, -18, 144, 36, 12);
    this.nextWaveLabel = scene.add.text(0, 0, t('nextWave'), hudStyle('12px', UI.text.ink, { fontStyle: '800' })).setOrigin(0.5);
    nextWaveBtn.add([nwBg, this.nextWaveLabel]);
    bindControl(nextWaveBtn, 144, 36, () => actions.onCallWave());

    if (opts.daily && opts.modifiers.length > 0) {
      let modX = nextWaveX + 130;
      opts.modifiers.forEach(mod => {
        const info = MODIFIER_INFO[mod];
        if (!info) return;
        const modBadge = scene.add.container(modX, centerY);
        const mBg = scene.add.graphics();
        paintGlassRect(mBg, -46, -14, 92, 28, 10);
        modBadge.add([
          mBg,
          scene.add.text(0, 0, `${info.icon} ${t(info.nameKey as 'modDoubleCostName')}`, hudStyle('10px', info.colorHex)).setOrigin(0.5)
        ]);
        modX += 98;
      });
    }

    const speeds = [GameSpeed.PAUSED, GameSpeed.NORMAL, GameSpeed.FAST, GameSpeed.ULTRA];
    const speedLabels = ['Ⅱ', '1×', '2×', '4×'];
    const speedSpacing = 42;
    const fsX = safeBounds.right - 28;
    const weatherX = fsX - speedSpacing;
    const speedStartX = weatherX - speeds.length * speedSpacing;

    speeds.forEach((sp, idx) => {
      const btn = scene.add.container(speedStartX + idx * speedSpacing, centerY);
      const bg = scene.add.graphics();
      paintGlassRect(bg, -18, -18, 36, 36, 10, sp === opts.speed);
      const label = scene.add.text(0, 0, speedLabels[idx], hudStyle('13px', sp === opts.speed ? UI.text.amber : UI.text.muted)).setOrigin(0.5);
      btn.add([bg, label]);
      bindControl(btn, 36, 36, () => {
        if (sp === GameSpeed.PAUSED) actions.onPause();
        else actions.onSpeed(sp);
      });
      this.speedButtons.set(sp, btn);
    });

    const weatherBtn = scene.add.container(weatherX, centerY);
    const weatherBg = scene.add.graphics();
    paintGlassRect(weatherBg, -18, -18, 36, 36, 10);
    this.weatherLabel = scene.add.text(0, 0, '☀️', { fontSize: '16px' }).setOrigin(0.5);
    weatherBtn.add([weatherBg, this.weatherLabel]);
    bindControl(weatherBtn, 36, 36, () => actions.onWeather());

    const fsBtn = scene.add.container(fsX, centerY);
    const fsBg = scene.add.graphics();
    paintGlassRect(fsBg, -18, -18, 36, 36, 10);
    fsBtn.add([fsBg, scene.add.text(0, 0, '⛶', hudStyle('16px')).setOrigin(0.5)]);
    bindControl(fsBtn, 36, 36, () => actions.onFullscreen());
  }

  setGold(amount: number): void {
    this.goldText.setText(`${Math.round(amount)}G`);
  }

  setLives(lives: number): void {
    this.livesText.setText(`♥ ${lives}`);
  }

  setWave(current: number, total: number): void {
    const prefix = this.bossRush ? t('hudBoss') : t('wave');
    this.waveText.setText(`${prefix} ${current}/${total}`);
  }

  setWeather(weather: WeatherKind): void {
    this.weatherLabel.setText(weatherIcon(weather));
  }

  paintSpeed(speed: GameSpeed): void {
    this.speedButtons.forEach((btn, sp) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
      const label = btn.getAt(1) as Phaser.GameObjects.Text;
      const isCurrent = sp === speed;
      paintGlassRect(bg, -18, -18, 36, 36, 10, isCurrent);
      label.setColor(isCurrent ? UI.text.amber : UI.text.muted);
    });
  }
}
