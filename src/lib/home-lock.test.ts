import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOME_ABOVE_FOLD,
  HOME_FORBIDDEN_COPY,
  HOME_SHADOW_KEYS,
  forSeriousHome,
  homeHouseDoorIds,
  homeShowsCityPicker,
  isPlayItem,
} from "./home-lock.ts";
import { primaryLauncherDoors } from "./doors.ts";

describe("serious home lock", () => {
  it("drops games and Luma from the first-screen list", () => {
    const kept = forSeriousHome([
      { id: "salah", category: "life", lane: "worship" },
      { id: "baloot", category: "games", lane: "play" },
      { id: "luma", category: "life", lane: "house" },
      { id: "midad", category: "life", lane: "house" },
    ]);
    assert.deepEqual(
      kept.map((item) => item.id),
      ["salah", "midad"],
    );
    assert.equal(isPlayItem({ id: "tetris", category: "games", lane: "play" }), true);
  });

  it("does not put Luma or games in the home door strip", () => {
    const ids = primaryLauncherDoors().map((d) => d.id);
    assert.deepEqual(ids, ["tahajjud", "midad", "sites"]);
    assert.equal(ids.includes("luma"), false);
  });

  it("binds / to the Maydan timeline — catalog stays under doors", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    assert.match(home, /SquarePage/);
    assert.equal(/Hub/.test(home), false);
    assert.equal(/byCategory|featuredFor/.test(home), false);
    assert.equal(/maydan/.test(home), false);
  });

  it("keeps a thin live shadow on SquarePage — not a DayShadow-only home", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
    const shadow = readFileSync(new URL("../components/square/day-shadow.tsx", import.meta.url), "utf8");
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /DayShadow/);
    assert.match(square, /DayShadow/);
    assert.match(square, /data-home-sections="day-shadow house-doors square"/);
    assert.match(shadow, /data-shadow="thin"/);
    assert.match(shadow, /data-hero="next-prayer"/);
    assert.match(shadow, /data-live="remain-hms"/);
    assert.match(shadow, /data-live="countdown"/);
    assert.doesNotMatch(shadow, /t\(lang, "loading"\)/);
  });
});

describe("king lock — `/` after #8", () => {
  it("keeps above the fold to thin shadow + house doors + the square", () => {
    assert.deepEqual([...HOME_ABOVE_FOLD], ["day-shadow", "house-doors", "square"]);
    assert.deepEqual([...HOME_SHADOW_KEYS], ["now", "prayer", "weather"]);
    assert.equal(homeShowsCityPicker(), false);
    assert.deepEqual([...HOME_FORBIDDEN_COPY], ["ابدأ من هنا", "جديد في واحة"]);
  });

  it("keeps quiet doors to تهجد · مداد · مواقعنا", () => {
    assert.deepEqual(homeHouseDoorIds(), ["tahajjud", "midad", "sites"]);
    assert.deepEqual(
      primaryLauncherDoors().map((d) => d.title.ar),
      ["تهجد · عبادة", "مداد · قراءة", "مواقعنا"],
    );
  });
});
