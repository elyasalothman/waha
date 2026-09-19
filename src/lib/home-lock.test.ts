import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOME_ABOVE_FOLD,
  HOME_FORBIDDEN_COPY,
  HOME_ONBOARDING_PATH,
  HOME_SHADOW_KEYS,
  WAHA_FOR_YOU_SLICES,
  forSeriousHome,
  guestMaydanKeepsSeed48,
  guestReadsWithoutAccount,
  homeChromeShowsAudienceSwitch,
  homeHouseDoorIds,
  homeShowsCityPicker,
  identityOnlyAtOnboarding,
  isPlayItem,
  slicesLiveOnOnboarding,
  slicesLiveOnSettings,
} from "./home-lock.ts";
import { getDoor, primaryLauncherDoors } from "./doors.ts";

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

  it("keeps games heroines and doors off `/` — they live on /games", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /\/games|GamesHub|gamesDoor|ألعاب واحة|abiar|majra|kutl|kalima/i);
    assert.doesNotMatch(square, /\/games|GamesHub|luma|kalima|abiar|majra|kutl/i);
  });

  it("keeps a games-catalog Luma door off the serious home list", () => {
    const door = getDoor("luma");
    assert.equal(door?.href, "https://games.alhajda.com");
    assert.equal(door?.launcher, false);
    const luma = { id: "luma", category: "games", lane: "play" };
    assert.equal(isPlayItem(luma), true);
    assert.equal(forSeriousHome([luma]).length, 0);
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

  it("keeps واحة من أجلك slices on account creation only — never `/` or settings", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
    const shell = readFileSync(new URL("../components/layout/shell.tsx", import.meta.url), "utf8");
    const onboarding = readFileSync(new URL("../routes/onboarding.tsx", import.meta.url), "utf8");
    const switcher = readFileSync(new URL("../components/audience-switch.tsx", import.meta.url), "utf8");
    assert.equal(homeChromeShowsAudienceSwitch(), false);
    assert.equal(slicesLiveOnSettings(), false);
    assert.equal(slicesLiveOnOnboarding(), true);
    assert.equal(HOME_ONBOARDING_PATH, "/onboarding");
    assert.deepEqual([...WAHA_FOR_YOU_SLICES], ["personal", "child", "family", "work"]);
    assert.doesNotMatch(home, /AudienceSwitch|audience-switch|واحة من أجلك|أفراد|طفل|أسرة/);
    assert.doesNotMatch(square, /AudienceSwitch|audience-switch|واحة من أجلك/);
    assert.doesNotMatch(shell, /AudienceSwitch|audience-switch|data-settings-icon|to="\/settings"/);
    assert.doesNotMatch(shell, /Settings/);
    assert.match(onboarding, /AudienceSwitch/);
    assert.match(onboarding, /createAccount/);
    assert.match(onboarding, /wahaForYou/);
    assert.match(onboarding, /data-onboarding="waha-for-you"/);
    assert.match(switcher, /id: "family"/);
    assert.match(switcher, /slice-\$\{slice\.id\}/);
    assert.match(switcher, /wahaForYou/);
    assert.equal(existsSync(new URL("../routes/settings.tsx", import.meta.url)), false);
  });

  it("keeps روح الواحة — guest reads with no account; identity only at onboarding", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const square = readFileSync(new URL("../components/square/square-page.tsx", import.meta.url), "utf8");
    const shell = readFileSync(new URL("../components/layout/shell.tsx", import.meta.url), "utf8");
    const profile = readFileSync(new URL("../components/square/profile-panel.tsx", import.meta.url), "utf8");
    const onboarding = readFileSync(new URL("../routes/onboarding.tsx", import.meta.url), "utf8");
    const logic = readFileSync(new URL("./square/logic.ts", import.meta.url), "utf8");
    assert.equal(guestReadsWithoutAccount(), true);
    assert.equal(identityOnlyAtOnboarding(), true);
    assert.equal(guestMaydanKeepsSeed48(), true);
    assert.doesNotMatch(home, /SignInGate|RedirectToSignIn|SignInButtons/);
    assert.doesNotMatch(square, /SignInGate|RedirectToSignIn|SignInButtons/);
    assert.match(square, /data-guest-read="open"/);
    assert.doesNotMatch(square, /mergeFeed\([^)]*audience|mergeFeed\([^)]*segment/);
    assert.doesNotMatch(shell, /SignInButtons|AudienceSwitch/);
    assert.doesNotMatch(profile, /SignInButtons/);
    assert.match(profile, /createAccount/);
    assert.match(onboarding, /SignInButtons/);
    assert.match(onboarding, /data-identity="onboarding"/);
    assert.match(onboarding, /guestReadsFree/);
    assert.match(logic, /export function mergeFeed\(local: SquareLocalState, tab: SquareTab/);
  });
});
