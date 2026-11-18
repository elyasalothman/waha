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
    ["#2c241c", "#faf9f5"],
    ["#5c5348", "#faf9f5"],
    ["#b55238", "#faf9f5"],
    ["#ffffff", "#b55238"],
    ["#2c241c", "#fbf6ea"],
    ["#7a4e0d", "#fbf6ea"],
    ["#faf6f0", "#3a342e"],
    ["#e6dccf", "#3a342e"],
    ["#fbf6ec", "#4a3c2c"],
    ["#ead9b8", "#4a3c2c"],
    ["#f0d7a4", "#4a3c2c"],
    ["#fbf4ee", "#4a382e"],
    ["#f3f7ff", "#2e3a48"],
    ["#fff5f6", "#4a3330"],
    ["#f7f4ff", "#3c3348"],
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
