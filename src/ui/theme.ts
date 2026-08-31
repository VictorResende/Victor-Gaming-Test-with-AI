export const UI_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const UI = {
  font: UI_FONT,
  minTouch: 48,
  color: {
    bg0: 0x07080f,
    bg1: 0x0b1020,
    panel: 0x12141c,
    panelHi: 0x18181b,
    stroke: 0x3f3f46,
    strokeHi: 0xf8fafc,
    amber: 0xf59e0b,
    amberHi: 0xfbbf24,
    indigo: 0x6366f1,
    danger: 0x7f1d1d,
    success: 0x059669,
    trackOff: 0x3f3f46
  },
  text: {
    primary: '#fafafa',
    muted: '#a1a1aa',
    faint: '#71717a',
    ink: '#111827',
    amber: '#fbbf24',
    danger: '#fca5a5',
    success: '#6ee7b7'
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18
  }
} as const;
