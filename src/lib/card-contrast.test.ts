import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function channel(hex: string, index: number) {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: string, background: string) {
  const lum = (hex: string) =>
    0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
  const [hi, lo] = [lum(foreground), lum(background)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

test("home card text meets AA on light fills and on both dark appearances", () => {
  const pairs: [string, string][] = [
    ["#1a1a1a", "#fafafa"],
    ["#595959", "#fafafa"],
    ["#b55238", "#fafafa"],
    ["#ffffff", "#b55238"],
    ["#1a1a1a", "#fbf6ea"],
    ["#7a4e0d", "#fbf6ea"],
    ["#f5f5f5", "#1e1e1e"],
    ["#d0d0d0", "#1e1e1e"],
    ["#e7a08a", "#1e1e1e"],
    ["#f5f5f5", "#1c2430"],
    ["#f5f5f5", "#2a1e22"],
    ["#f5f5f5", "#241e2e"],
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${foreground} on ${background} is ${contrast(foreground, background).toFixed(2)}`,
    );
  }
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /html\.native-ios\.native-dark \.waha-card/);
  assert.match(css, /html\.native-ios\.native-dark \.tint-sand/);
  assert.match(css, /\.waha-card :is\(\.text-muted, \.text-subtle\)/);
});
