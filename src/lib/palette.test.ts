import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PALETTE,
  PALETTE_ID,
  TEXT_ON_GROUNDS,
  contrastRatio,
  hslSaturation,
  isSage,
  parseThemeFromCss,
  relativeLuminance,
  themeColor,
} from "./palette.ts";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../routes/__root.tsx", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8");
const favicon = readFileSync(new URL("../../public/favicon.svg", import.meta.url), "utf8");
const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
const shadow = readFileSync(new URL("../components/square/day-shadow.tsx", import.meta.url), "utf8");
const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
const madar = readFileSync(new URL("../apps/madar/portal.tsx", import.meta.url), "utf8");
const games = readFileSync(new URL("../routes/games.tsx", import.meta.url), "utf8");
const clips = readFileSync(new URL("../apps/clips/page.tsx", import.meta.url), "utf8");
const accounts = readFileSync(new URL("./square/accounts.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../routeTree.gen.ts", import.meta.url), "utf8");
const nav = readFileSync(new URL("./nav.ts", import.meta.url), "utf8");
const pwa = readFileSync(new URL("../../scripts/grok-pwa-shared.mjs", import.meta.url), "utf8");
const install = readFileSync(new URL("../../scripts/install-page.html", import.meta.url), "utf8");

const OLD_NIGHT = ["#0c0d0c", "#eceee9", "#c5d0c4", "#6a7069"];

describe("waha well-night palette", () => {
  it("keeps a calm sage well — distinctive, not a carnival", () => {
    assert.equal(PALETTE_ID, "waha-well-night");
    assert.equal(isSage(PALETTE.primary), true);
    assert.equal(isSage(PALETTE.bg), true);
    assert.ok(relativeLuminance(PALETTE.bg) < 0.02, "night stays deep");
    assert.ok(hslSaturation(PALETTE.primary) < 0.22, "primary stays dusty");
    assert.ok(hslSaturation(PALETTE.danger) < 0.55, "status colors stay clay, not neon");
  });

  it("keeps CSS tokens, chrome, and the mark on the same well", () => {
    const theme = parseThemeFromCss(css);
    for (const name of Object.keys(PALETTE) as (keyof typeof PALETTE)[]) {
      assert.equal(theme[name], PALETTE[name], name);
    }
    assert.match(css, /color-scheme:\s*dark/);
    assert.match(root, new RegExp(`data-palette="${PALETTE_ID}"`));
    assert.match(root, new RegExp(`theme-color", content: "${PALETTE.bg}"`));
    assert.match(manifest, new RegExp(`"theme_color": "${PALETTE.bg}"`));
    assert.match(manifest, new RegExp(`"background_color": "${PALETTE.bg}"`));
    assert.match(favicon, new RegExp(`fill="${PALETTE.bg}"`));
    assert.match(favicon, new RegExp(`stroke="${PALETTE.primary}"`));
    assert.match(pwa, new RegExp(`theme_color: "${PALETTE.bg}"`));
    assert.match(pwa, new RegExp(`background_color: "${PALETTE.bg}"`));
    assert.match(install, new RegExp(`theme-color" content="${PALETTE.bg}"`));
  });

  it("lifts text contrast on bg, surface, and surface-2", () => {
    for (const [fg, bg] of TEXT_ON_GROUNDS) {
      const ratio = contrastRatio(PALETTE[fg], PALETTE[bg]);
      const floor = fg === "fg" ? 7 : 4.5;
      assert.ok(ratio >= floor, `${fg} on ${bg} is ${ratio.toFixed(2)}, need ${floor}`);
    }
    assert.ok(contrastRatio(PALETTE.subtle, PALETTE.bg) > contrastRatio("#6a7069", "#0c0d0c"));
  });

  it("applies the shared tokens to shadow, square, madar, clips, and games — no product-scope change", () => {
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /ClipsPage|\/clips/);
    assert.match(shadow, /text-muted|text-subtle|text-fg|text-primary/);
    assert.match(square, /PALETTE\.primary/);
    assert.match(madar, /border-border/);
    assert.match(madar, /text-muted/);
    assert.match(games, /Hub category="games"/);
    assert.match(routes, /\/clips/);
    assert.match(clips, /data-clips-lane="mufida-v1"/);
    assert.match(clips, /data-on-maydan="false"/);
    assert.match(clips, /text-muted/);
    assert.match(clips, /bg-surface/);
    assert.match(nav, /to: "\/clips"/);
    for (const file of [shadow, square, madar, games, clips]) {
      for (const hex of OLD_NIGHT) {
        assert.equal(file.toLowerCase().includes(hex), false, hex);
      }
    }
  });

  it("does not paint separators with the border token", () => {
    assert.doesNotMatch(shadow, /text-border/);
    const post = readFileSync(new URL("../components/square/post-card.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(post, /text-border/);
  });

  it("keeps house and guest tones on the shared primary", () => {
    assert.match(accounts, /tone: PALETTE\.primary/);
    assert.equal(themeColor("primary"), PALETTE.primary);
    assert.equal(themeColor("bg", "  #abcabc  "), "#abcabc");
  });
});
