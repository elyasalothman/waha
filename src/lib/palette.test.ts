import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_MARK,
  ACTIVE_WASH,
  CORAL_FEEL,
  DANGER_LOCK,
  MUTED_FEEL,
  PALETTE,
  PALETTE_ID,
  PRIMARY_WASH_PCT,
  TEXT_ON_GROUNDS,
  contrastRatio,
  hexDistance,
  hslSaturation,
  isCoralFeel,
  isSage,
  isWarmGround,
  parsePrimaryWashPct,
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
const ask = readFileSync(new URL("../apps/studio/chat.tsx", import.meta.url), "utf8");
const studio = readFileSync(new URL("../routes/studio.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/layout/shell.tsx", import.meta.url), "utf8");
const audience = readFileSync(new URL("../components/audience-switch.tsx", import.meta.url), "utf8");
const cmdk = readFileSync(new URL("../components/command-palette.tsx", import.meta.url), "utf8");
const accounts = readFileSync(new URL("./square/accounts.ts", import.meta.url), "utf8");
const world = readFileSync(new URL("./square/world.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../routeTree.gen.ts", import.meta.url), "utf8");
const nav = readFileSync(new URL("./nav.ts", import.meta.url), "utf8");
const pwa = readFileSync(new URL("../../scripts/grok-pwa-shared.mjs", import.meta.url), "utf8");
const install = readFileSync(new URL("../../scripts/install-page.html", import.meta.url), "utf8");

const OLD_SAGE = ["#0a120f", "#141c19", "#1b2521", "#e7eee6", "#a3b0a4", "#8f9c91", "#9eb4a2", "#2d3a35"];
const OLD_NIGHT = ["#0c0d0c", "#eceee9", "#c5d0c4", "#6a7069"];
const SAGE_COPY = /بئر|مريم|well-night|sage/i;

describe("waha hearth-night palette", () => {
  it("keeps a warm dark hearth and coral feel — not a sage well", () => {
    assert.equal(PALETTE_ID, "waha-hearth-night");
    assert.equal(isSage(PALETTE.bg), false);
    assert.equal(isSage(PALETTE.surface), false);
    assert.equal(isSage(PALETTE["surface-2"]), false);
    assert.equal(isSage(PALETTE.primary), false);
    assert.equal(isSage(PALETTE.success), false);
    assert.equal(isWarmGround(PALETTE.bg), true);
    assert.equal(isWarmGround(PALETTE.surface), true);
    assert.equal(isCoralFeel(PALETTE.primary), true);
    assert.ok(hexDistance(PALETTE.primary, CORAL_FEEL) < 24, "primary stays near the coral feel");
    assert.ok(hexDistance(PALETTE.muted, MUTED_FEEL) < 8, "muted stays near #A1A1A1");
    assert.equal(PALETTE.danger, DANGER_LOCK);
    assert.notEqual(PALETTE.danger, PALETTE.primary);
    assert.ok(relativeLuminance(PALETTE.bg) < 0.02, "night stays deep");
    assert.ok(hslSaturation(PALETTE.bg) < 0.16, "ground stays quiet, not creamy");
    assert.ok(hslSaturation(PALETTE.primary) > 0.4 && hslSaturation(PALETTE.primary) < 0.75, "coral, not neon");
    assert.doesNotMatch(PALETTE_ID, SAGE_COPY);
  });

  it("washes primary 25–40% on large fields; solid coral stays a small active mark", () => {
    const pct = parsePrimaryWashPct(css);
    assert.equal(pct, PRIMARY_WASH_PCT);
    assert.ok(pct !== null && pct >= 25 && pct <= 40);
    assert.match(css, /--color-primary-wash:\s*color-mix\(in oklab, var\(--color-primary\) 32%, var\(--color-bg\)\)/);
    assert.match(shell, new RegExp(`active \\? "${ACTIVE_WASH}"`));
    assert.match(shell, new RegExp(`active \\? "${ACTIVE_MARK}"`));
    assert.match(shell, /pathname === "\/clips" && "bg-primary-wash text-primary"/);
    assert.match(shell, /pathname === "\/madar" && "bg-primary-wash text-primary"/);
    assert.match(audience, new RegExp(`active === slice.id \\? "${ACTIVE_WASH}"`));
    assert.match(square, new RegExp(`tab === item.id \\? "${ACTIVE_WASH}"`));
    assert.match(ask, new RegExp(`mode === m.id \\? "${ACTIVE_WASH}"`));
    assert.match(cmdk, /data-\[selected=true\]:bg-primary-wash/);
    assert.doesNotMatch(shell, /active \? "bg-primary text-primary-fg"/);
    assert.doesNotMatch(cmdk, /data-\[selected=true\]:bg-primary[^-]/);
    assert.doesNotMatch(square, /tab === item.id \? "bg-primary /);
  });

  it("keeps CSS tokens, chrome, and the mark on the same hearth", () => {
    const theme = parseThemeFromCss(css);
    for (const name of Object.keys(PALETTE) as (keyof typeof PALETTE)[]) {
      assert.equal(theme[name], PALETTE[name].toLowerCase(), name);
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
    for (const hex of OLD_SAGE) {
      assert.equal(css.toLowerCase().includes(hex), false, hex);
      assert.equal(root.toLowerCase().includes(hex), false, hex);
    }
    assert.doesNotMatch(css, SAGE_COPY);
    assert.doesNotMatch(root, SAGE_COPY);
  });

  it("lifts text contrast on bg, surface, and surface-2", () => {
    for (const [fg, bg] of TEXT_ON_GROUNDS) {
      const ratio = contrastRatio(PALETTE[fg], PALETTE[bg]);
      const floor = fg === "fg" ? 7 : 4.5;
      assert.ok(ratio >= floor, `${fg} on ${bg} is ${ratio.toFixed(2)}, need ${floor}`);
    }
    assert.ok(contrastRatio(PALETTE.muted, PALETTE.bg) >= contrastRatio(MUTED_FEEL, PALETTE.bg) - 0.05);
    assert.ok(contrastRatio(PALETTE.subtle, PALETTE.bg) > contrastRatio("#6a7069", "#0c0d0c"));
  });

  it("applies the shared tokens to shadow, square, madar, clips, games, and ask — no product-scope change", () => {
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /ClipsPage|\/clips/);
    assert.match(shadow, /text-muted|text-subtle|text-fg|text-primary/);
    assert.match(square, /PALETTE\.primary/);
    assert.match(madar, /border-border/);
    assert.match(madar, /text-muted/);
    assert.match(games, /GamesHub/);
    assert.match(routes, /\/clips/);
    assert.match(clips, /data-clips-lane="mufida-v1"/);
    assert.match(clips, /data-on-maydan="false"/);
    assert.match(clips, /text-muted/);
    assert.match(clips, /bg-surface/);
    assert.match(nav, /to: "\/clips"/);
    assert.match(studio, /ChatApp/);
    assert.match(ask, /text-muted/);
    for (const file of [shadow, square, madar, games, clips, ask, studio]) {
      for (const hex of [...OLD_NIGHT, ...OLD_SAGE]) {
        assert.equal(file.toLowerCase().includes(hex), false, hex);
      }
    }
  });

  it("keeps one house background for every slice", () => {
    assert.match(shell, /min-h-dvh bg-bg text-fg/);
    assert.match(shell, /aside className="[^"]*bg-bg/);
    assert.doesNotMatch(shell, /audience === .*(bg-|background)/);
    assert.match(root, /body className="bg-bg text-fg"/);
    assert.match(css, /background:\s*var\(--color-bg\)/);
  });

  it("does not paint separators with the border token", () => {
    assert.doesNotMatch(shadow, /text-border/);
    const post = readFileSync(new URL("../components/square/post-card.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(post, /text-border/);
  });

  it("keeps house, guest, and sample tones on two shared weights — no rainbow", () => {
    assert.match(accounts, /tone: PALETTE\.primary/);
    assert.match(accounts, /tone: PALETTE\.muted/);
    assert.doesNotMatch(accounts, /tone: "#[0-9a-fA-F]{6}"/);
    assert.match(world, /PALETTE\.muted/);
    assert.doesNotMatch(world, /SOURCE_TONE/);
    assert.equal(themeColor("primary"), PALETTE.primary);
    assert.equal(themeColor("bg", "  #abcabc  "), "#abcabc");
  });
});
