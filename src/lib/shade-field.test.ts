import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SHADE_FIELD_CROSSING,
  SHADE_FIELD_HEADER_MARGIN,
  SHADE_FIELD_LANES,
  laneFromHeroVisibility,
  shadeFieldAllowsBounce,
  shadeFieldAllowsRainbow,
  shadeFieldCrossing,
  shadeKeepsThinBarInField,
} from "./shade-field.ts";

const NOISY = ["rainbow", "hue-rotate", "confetti", "sparkle", "linear-gradient(90deg", "animate-bounce", "animate-spin"];

describe("quiet shade↔field crossing", () => {
  it("keeps the crossing quiet — no rainbow, no bounce", () => {
    assert.equal(SHADE_FIELD_CROSSING, "quiet");
    assert.equal(shadeFieldCrossing(), "quiet");
    assert.deepEqual([...SHADE_FIELD_LANES], ["shade", "field"]);
    assert.equal(shadeFieldAllowsRainbow(), false);
    assert.equal(shadeFieldAllowsBounce(), false);
    assert.equal(shadeKeepsThinBarInField(), true);
    assert.equal(SHADE_FIELD_HEADER_MARGIN, "-56px 0px 0px 0px");
    assert.match(SHADE_FIELD_HEADER_MARGIN, /^-?\d+px /);
    assert.doesNotMatch(SHADE_FIELD_HEADER_MARGIN, /rem|em/);
  });

  it("enters the field only after the prayer hero leaves the chrome", () => {
    assert.equal(laneFromHeroVisibility(true), "shade");
    assert.equal(laneFromHeroVisibility(false), "field");
  });

  it("wires a quiet attach+return on `/` without slides or a books shelf", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
    const shadow = readFileSync(new URL("../components/square/day-shadow.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    const hook = readFileSync(new URL("../hooks/use-shade-field.ts", import.meta.url), "utf8");

    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /DailySlides|BooksPage|lib\/books/);
    assert.match(square, /data-shade-field="quiet"/);
    assert.match(square, /data-lane=\{lane\}/);
    assert.match(square, /data-home-sections="day-shadow house-doors square"/);
    assert.match(square, /data-guest-read="open"/);
    assert.doesNotMatch(square, /DailySlides|BooksPage|kutub-shelf|lib\/books/);
    assert.match(shadow, /data-shadow="thin"/);
    assert.match(shadow, /data-hero="next-prayer"/);
    assert.match(shadow, /data-shade-return/);
    assert.match(shadow, /scrollToShade/);
    assert.match(shadow, /sticky top-14/);
    assert.match(shadow, /return \(\s*<>/);
    assert.match(hook, /IntersectionObserver/);
    assert.match(css, /data-shade-field="quiet"/);
    assert.doesNotMatch(css, /hue-rotate|rainbow|animate-bounce/);

    const blob = `${square}\n${shadow}\n${css}\n${hook}`;
    for (const banned of NOISY) {
      assert.equal(blob.toLowerCase().includes(banned.toLowerCase()), false, banned);
    }
  });
});
