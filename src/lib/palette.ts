/** Waha hearth-night — warm dark, washed coral fields, solid coral only on small active. */

export const PALETTE_ID = "waha-hearth-night" as const;

/** Feeling refs — locked because they hold contrast on this hearth. */
export const CORAL_FEEL = "#d97757";
export const MUTED_FEEL = "#a1a1a1";
export const DANGER_LOCK = "#c45c4a";
/** Wash of primary onto bg — 25–40% lock (king). */
export const PRIMARY_WASH_PCT = 32;

export const PALETTE = {
  bg: "#141311",
  surface: "#1c1b18",
  "surface-2": "#262421",
  fg: "#ecece8",
  muted: MUTED_FEEL,
  subtle: "#8f8f8f",
  primary: CORAL_FEEL,
  "primary-fg": "#141311",
  border: "#3a3834",
  danger: DANGER_LOCK,
  success: "#a39274",
  warn: "#c4a572",
} as const;

export type PaletteToken = keyof typeof PALETTE;

/** Large active field: washed primary + solid coral type/icon. */
export const ACTIVE_WASH = "bg-primary-wash text-primary" as const;
/** Small active only: tab label, dot, icon. */
export const ACTIVE_MARK = "text-primary" as const;

/** Text that must stay readable on the warm night. */
export const TEXT_ON_GROUNDS = [
  ["fg", "bg"],
  ["fg", "surface"],
  ["fg", "surface-2"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["muted", "surface-2"],
  ["subtle", "bg"],
  ["subtle", "surface"],
  ["subtle", "surface-2"],
  ["primary", "bg"],
  ["primary", "surface"],
  ["primary", "surface-2"],
  ["primary-fg", "primary"],
] as const satisfies ReadonlyArray<readonly [PaletteToken, PaletteToken]>;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const left = relativeLuminance(a);
  const right = relativeLuminance(b);
  const hi = Math.max(left, right);
  const lo = Math.min(left, right);
  return (hi + 0.05) / (lo + 0.05);
}

export function hslSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const light = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (1 - Math.abs(2 * light - 1));
}

/** Sage / well-green: G is the dominant channel. */
export function isSage(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return g >= r && g >= b;
}

/** Warm dark ground — brown/stone, not green. */
export function isWarmGround(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return r >= g && g >= b;
}

/** Coral / warm orange — R leads, not a logo mark. */
export function isCoralFeel(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return r > g && g >= b && r - b > 80;
}

export function hexDistance(a: string, b: string): number {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b);
}

export function themeColor(name: PaletteToken, raw?: string): string {
  const fromArg = raw?.trim();
  if (fromArg) return fromArg;
  if (typeof document !== "undefined") {
    const live = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
    if (live) return live;
  }
  return PALETTE[name];
}

export function parseThemeFromCss(css: string): Record<PaletteToken, string> {
  const out = { ...PALETTE } as Record<PaletteToken, string>;
  for (const name of Object.keys(PALETTE) as PaletteToken[]) {
    const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
    if (match?.[1]) out[name] = match[1].toLowerCase();
  }
  return out;
}

export function parsePrimaryWashPct(css: string): number | null {
  const match = css.match(/--color-primary-wash:\s*color-mix\([^)]*?var\(--color-primary\)\s+(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : null;
}
