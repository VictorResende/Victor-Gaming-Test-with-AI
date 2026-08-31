import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SaveManager } from './SaveManager';

export class HapticsManager {
  private static instance: HapticsManager;

  public static getInstance(): HapticsManager {
    if (!HapticsManager.instance) {
      HapticsManager.instance = new HapticsManager();
    }
    return HapticsManager.instance;
  }

  private isEnabled(): boolean {
    return SaveManager.getInstance().getData().settings.hapticsEnabled;
  }

  public async tap(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }

  public async build(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (navigator.vibrate) navigator.vibrate(35);
    }
  }

  public async cannonShot(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }

  public async lifeLost(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    }
  }

  public async victory(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (navigator.vibrate) navigator.vibrate([60, 80, 100]);
    }
  }

  public async defeat(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
    }
  }

  public async heroLevelUp(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 120]);
    }
  }

  public async heroAbility(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (navigator.vibrate) navigator.vibrate([40, 30, 70]);
    }
  }

  public async heroMove(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }
}

