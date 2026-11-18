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
    ["#192c2a", "#ffffff"],
    ["#3e534e", "#ffffff"],
    ["#192c2a", "#fff4e0"],
    ["#7a4e0d", "#fff4e0"],
    ["#f4f7f2", "#24302b"],
    ["#d5e2da", "#24302b"],
    ["#fbf6ec", "#3a301c"],
    ["#ead9b8", "#3a301c"],
    ["#f0d7a4", "#3a301c"],
    ["#f3faf6", "#17352c"],
    ["#f3f7ff", "#1a2c44"],
    ["#fff5f6", "#3a2428"],
    ["#f7f4ff", "#2c2440"],
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
