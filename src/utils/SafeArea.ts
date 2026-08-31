import Phaser from 'phaser';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeAreaBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  safeWidth: number;
  safeHeight: number;
  centerX: number;
  centerY: number;
}

/**
 * Utilitário de Ergonomia Mobile e Safe Area para entalhes (iPhone Dynamic Island,
 * entalhes de câmeras Android punch-hole, barras de status e gestos inferiores).
 */
export class SafeArea {
  private static readonly MIN_TOUCH_SIZE = 48; // Padrão Apple HIG & Material Design

  /**
   * Obtém os insets de área segura calculados dinamicamente para o viewport atual.
   */
  public static getInsets(scene: Phaser.Scene): SafeAreaInsets {
    const { width, height } = scene.scale;
    const aspect = width / height;

    // Detecta se há variáveis de ambiente CSS de Safe Area injetadas pelo Capacitor / WebKit
    let cssTop = 0;
    let cssBottom = 0;
    let cssLeft = 0;
    let cssRight = 0;

    if (typeof window !== 'undefined' && window.getComputedStyle) {
      try {
        const style = window.getComputedStyle(document.documentElement);
        cssTop = parseFloat(style.getPropertyValue('--sat') || '0');
        cssBottom = parseFloat(style.getPropertyValue('--sab') || '0');
        cssLeft = parseFloat(style.getPropertyValue('--sal') || '0');
        cssRight = parseFloat(style.getPropertyValue('--sar') || '0');
      } catch (e) {
        // Fallback seguro silencioso
      }
    }

    // Insets padrão inteligentes para jogos em orientação paisagem (Landscape)
    // Em telas mais largas que 16:9 (aspect > 1.78), adiciona margens para entalhes/Dynamic Island
    let safeLeft = cssLeft > 0 ? cssLeft : (aspect > 1.85 ? 44 : (aspect > 1.77 ? 24 : 16));
    let safeRight = cssRight > 0 ? cssRight : (aspect > 1.85 ? 44 : (aspect > 1.77 ? 24 : 16));
    let safeTop = cssTop > 0 ? cssTop : 8;
    let safeBottom = cssBottom > 0 ? cssBottom : 12;

    return {
      top: Math.round(safeTop),
      bottom: Math.round(safeBottom),
      left: Math.round(safeLeft),
      right: Math.round(safeRight)
    };
  }

  /**
   * Retorna os limites utilizáveis dentro da Safe Area para a cena especificada.
   */
  public static getBounds(scene: Phaser.Scene): SafeAreaBounds {
    const { width, height } = scene.scale;
    const insets = this.getInsets(scene);

    const left = insets.left;
    const right = width - insets.right;
    const top = insets.top;
    const bottom = height - insets.bottom;
    const safeWidth = right - left;
    const safeHeight = bottom - top;

    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
      safeWidth,
      safeHeight,
      centerX: left + safeWidth / 2,
      centerY: top + safeHeight / 2
    };
  }

  /**
   * Cria um retângulo de hitbox de toque garantindo tamanho mínimo de 48x48px
   * com preenchimento invisível em torno do centro do elemento.
   */
  public static createTouchHitbox(
    visualWidth: number,
    visualHeight: number,
    minSize: number = SafeArea.MIN_TOUCH_SIZE
  ): Phaser.Geom.Rectangle {
    const touchW = Math.max(visualWidth, minSize);
    const touchH = Math.max(visualHeight, minSize);
    return new Phaser.Geom.Rectangle(-touchW / 2, -touchH / 2, touchW, touchH);
  }

  /**
   * Cria um círculo de hitbox de toque garantindo diâmetro mínimo de 48px (raio 24px).
   */
  public static createTouchCircle(visualRadius: number, minRadius: number = 24): Phaser.Geom.Circle {
    const radius = Math.max(visualRadius, minRadius);
    return new Phaser.Geom.Circle(0, 0, radius);
  }
}
