import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyLocal, mergeFeed, SQUARE_STORAGE_KEY } from "./logic.ts";
import { SEED_POSTS } from "./seed.ts";
import lockCards from "./maydan-min-alalam-cards-v1.json" with { type: "json" };
import {
  MIN_WORLD_CARDS,
  WORLD_CARDS,
  WORLD_LANE,
  WORLD_LOCK_CARDS,
  WORLD_SEED,
  WORLD_STAMP,
  WORLD_STORAGE_KEY,
  worldCards,
} from "./world.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

describe("world seed lock", () => {
  it("ships the king-approved twenty marked cards", () => {
    assert.equal(WORLD_SEED.status, "king-approved-texts");
    assert.equal(WORLD_SEED.implementationLock.cardCount, 20);
    assert.equal(WORLD_SEED.meta.cardCount, 20);
    assert.equal(WORLD_CARDS.length, 20);
    assert.ok(WORLD_CARDS.length >= MIN_WORLD_CARDS);
    assert.equal(WORLD_CARDS[0]?.id, "world-001");
    assert.equal(WORLD_CARDS[19]?.id, "world-020");
  });

  it("keeps the cards lock identical to the full approved seed", () => {
    const lock = lockCards as typeof WORLD_LOCK_CARDS;
    assert.deepEqual(
      WORLD_CARDS.map((c) => c.titleOrHook),
      lock.map((c) => c.titleOrHook),
    );
    assert.deepEqual(
      WORLD_CARDS.map((c) => c.summary),
      WORLD_SEED.cards.map((c) => c.summary),
    );
    assert.deepEqual(
      WORLD_CARDS.map((c) => c.sourceUrl),
      lock.map((c) => c.sourceUrl),
    );
  });

  it("marks every card with a visible source — no anonymous rows", () => {
    assert.ok(WORLD_CARDS.length > 0);
    for (const card of WORLD_CARDS) {
      assert.equal(card.lane, WORLD_LANE);
      assert.equal(card.stamp, WORLD_STAMP);
      assert.equal(card.trusted, true);
      assert.equal(card.sourceKind, "rss");
      assert.ok(card.sourceLabel.trim().length > 0, card.id);
      assert.match(card.sourceUrl, /^https:\/\//, card.id);
      assert.ok(card.titleOrHook.trim().length > 0, card.id);
      assert.ok(card.summary.trim().length > 0, card.id);
    }
    assert.equal(worldCards().some((c) => !c.sourceUrl || !c.sourceLabel), false);
  });

  it("locks the five king-approved RSS sources and drops live X", () => {
    assert.equal(WORLD_SEED.rules.rssOnlyWave1, true);
    assert.equal(WORLD_SEED.rules.noXScrapingWave1, true);
    assert.equal(WORLD_SEED.implementationLock.noLiveFetch, true);
    assert.equal(WORLD_SEED.implementationLock.noX, true);
    const ids = WORLD_SEED.sourcesProposed.map((s) => s.id);
    assert.deepEqual(ids, ["bbc-ar", "aj-ar", "aitnews", "techwd", "sciencedaily"]);
    assert.ok(WORLD_SEED.sourcesProposed.every((s) => s.kingApproved && s.kind === "rss"));
    assert.ok(WORLD_CARDS.every((c) => ids.includes(c.sourceId)));
    assert.equal(WORLD_CARDS.some((c) => c.sourceKind === "x"), false);
  });
});

describe("world stays off the house seed of 48", () => {
  it("uses a separate storage key from the guest/house square", () => {
    assert.equal(WORLD_STORAGE_KEY, "waha:square:world:v1");
    assert.equal(SQUARE_STORAGE_KEY, "waha:square:v1");
    assert.notEqual(WORLD_STORAGE_KEY, SQUARE_STORAGE_KEY);
    assert.equal(WORLD_SEED.rules.separateFromHouseSeed48, true);
    assert.equal(WORLD_SEED.rules.noMixIntoSeedCount, true);
  });

  it("never leaks world cards into mergeFeed or the forty-eight", () => {
    assert.equal(SEED_POSTS.length, 48);
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(feed.length, 48);
    assert.equal(feed.some((item) => item.id.startsWith("world-")), false);
    assert.equal(SEED_POSTS.some((post) => post.id.startsWith("world-")), false);
    assert.equal(WORLD_CARDS.some((card) => card.id.startsWith("seed-")), false);
  });

  it("does not scrape or fetch — static seed module only", () => {
    const world = src("./world.ts");
    const store = src("./store.ts");
    const logic = src("./logic.ts");
    const page = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    for (const [name, text] of [
      ["world.ts", world],
      ["store.ts", store],
      ["logic.ts", logic],
      ["square-page.tsx", page],
    ] as const) {
      assert.equal(/\bfetch\s*\(/.test(text), false, name);
      assert.equal(/XMLHttpRequest/.test(text), false, name);
      assert.equal(/new\s+WebSocket/.test(text), false, name);
    }
    assert.doesNotMatch(world, /from "\.\/seed\.ts"/);
    assert.doesNotMatch(world, /maydan-seed-v1/);
    assert.doesNotMatch(store, /world:v1/);
    assert.doesNotMatch(logic, /WORLD_CARDS|world-/);
  });
});

describe("world square chrome", () => {
  it("adds a top strip and a من العالم tab without mixing guest compose into that lane", () => {
    const page = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    assert.match(page, /WorldStrip/);
    assert.match(page, /data-world-tab/);
    assert.match(page, /من العالم/);
    assert.match(page, /WorldCard/);
    assert.match(page, /لا جديد من العالم/);
    assert.match(page, /tab === "world"/);
    assert.match(WORLD_SEED.rules.display, /شريط أعلى الخط/);
    assert.match(WORLD_SEED.rules.display, /تبويب\/فلتر من العالم/);
  });
});
