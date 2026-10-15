/** Waha daylight — pearl canvas, deep ink, and botanical emerald. */

export const PALETTE_ID = "waha-daylight" as const;

export const PALETTE = {
  bg: "#f6f5f0",
  surface: "#ffffff",
  "surface-2": "#e9eee8",
  fg: "#192c2a",
  muted: "#4d625f",
  subtle: "#526761",
  primary: "#146455",
  "primary-fg": "#ffffff",
  border: "#d7e0d9",
  danger: "#ac4035",
  success: "#27724e",
  warn: "#896319",
} as const;

export type PaletteToken = keyof typeof PALETTE;

/** Text that must stay readable on every daylight surface. */
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

export function isSage(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return g >= r && g >= b;
}

export function themeColor(name: PaletteToken, raw?: string): string {
  const fromArg = raw?.trim();
  if (fromArg) return fromArg;
  if (typeof document !== "undefined") {
    const live = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${name}`)
      .trim();
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
