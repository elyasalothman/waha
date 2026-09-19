import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SEED_POSTS } from "../square/seed.ts";
import { SQUARE_STORAGE_KEY, mergeFeed, emptyLocal } from "../square/logic.ts";
import { WORLD_CARDS, WORLD_STORAGE_KEY } from "../square/world.ts";
import lockCards from "./maydan-x-cards-v1.json" with { type: "json" };
import {
  X_CARDS,
  X_IDS,
  X_LOCK_CARDS,
  X_SEED,
  xCards,
  xStripCards,
} from "./seed.ts";
import { hydrateXState, listXCards } from "./logic.ts";
import { X_LANE, X_SEED_COUNT, X_STAMP, X_STORAGE_KEY, X_STRIP_CAP } from "./types.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

describe("x seed lock", () => {
  it("ships the king-approved ten marked cards", () => {
    assert.equal(X_SEED.status, "approved-king-9of10-x007-replaced-ready-builder");
    assert.equal(X_SEED.cardCount, 10);
    assert.equal(X_CARDS.length, X_SEED_COUNT);
    assert.equal(X_IDS.length, 10);
    assert.equal(X_CARDS[0]?.id, "x-001");
    assert.equal(X_CARDS[9]?.id, "x-010");
    assert.equal(
      X_CARDS.some((c) => /^x-0(1[1-9]|[2-9]\d)/.test(c.id) || c.id.includes("batch2")),
      false,
    );
    assert.deepEqual(
      X_CARDS.map((c) => c.id),
      X_SEED.cards.map((c) => c.id),
    );
  });

  it("keeps the cards lock identical to the full approved seed", () => {
    const lock = lockCards as typeof X_LOCK_CARDS;
    assert.deepEqual(
      X_CARDS.map((c) => c.text),
      lock.map((c) => c.text),
    );
    assert.deepEqual(
      X_CARDS.map((c) => c.sourceUrl),
      lock.map((c) => c.sourceUrl),
    );
    assert.deepEqual(
      X_CARDS.map((c) => c.authorHandle),
      X_SEED.cards.map((c) => c.authorHandle),
    );
  });

  it("replaces x-007 with @techwd تقنية — not the joint SDAIA statement", () => {
    const card = X_CARDS.find((c) => c.id === "x-007");
    assert.ok(card);
    assert.equal(card.authorHandle, "@techwd");
    assert.equal(card.authorName, "عالم التقنية");
    assert.equal(card.topic, "تقنية");
    assert.equal(card.whitelistId, "techwd");
    assert.equal(card.sourceUrl, "https://x.com/techwd/status/2100700793888272477");
    assert.match(card.text, /OpenAI/);
    assert.equal(X_SEED.kingLock.replaced.id, "x-007");
    assert.equal(X_SEED.kingLock.replaced.new, "techwd سلوك نماذج OpenAI المقلق");
    assert.equal(X_CARDS.some((c) => c.id === "x-007" && c.whitelistId === "SDAIA_SA"), false);
  });

  it("marks every card with stamp, text, author, and original x.com link — no counters", () => {
    assert.ok(X_CARDS.length > 0);
    for (const card of X_CARDS) {
      assert.equal(card.lane, X_LANE);
      assert.equal(card.stamp, X_STAMP);
      assert.equal(card.trusted, true);
      assert.equal(card.notHouseSeed, true);
      assert.equal(card.counters, null);
      assert.equal(card.sourceKind, "x-public-oembed");
      assert.ok(card.text.trim().length > 0, card.id);
      assert.ok(card.authorName.trim().length > 0, card.id);
      assert.match(card.authorHandle, /^@/, card.id);
      assert.match(card.sourceUrl, /^https:\/\/x\.com\//, card.id);
    }
    assert.equal(xCards().some((c) => !c.sourceUrl || !c.text), false);
    assert.deepEqual(X_SEED.displayLock.show, ["text", "sourceUrl", "authorName", "authorHandle"]);
    assert.deepEqual(X_SEED.displayLock.forbid, ["counters", "cloneXUI", "fakeEngagement"]);
    assert.equal(src("./maydan-x-seed-v1.json").includes("batch2"), false);
    assert.equal(src("./maydan-x-cards-v1.json").includes("batch2"), false);
  });
});

describe("x stays off the house seed of 48 and من العالم", () => {
  it("uses a separate storage key from square and world", () => {
    assert.equal(X_STORAGE_KEY, "waha:x:v1");
    assert.equal(SQUARE_STORAGE_KEY, "waha:square:v1");
    assert.equal(WORLD_STORAGE_KEY, "waha:square:world:v1");
    assert.notEqual(X_STORAGE_KEY, SQUARE_STORAGE_KEY);
    assert.notEqual(X_STORAGE_KEY, WORLD_STORAGE_KEY);
  });

  it("never leaks x cards into mergeFeed, the forty-eight, or world", () => {
    assert.equal(SEED_POSTS.length, 48);
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(feed.length, 48);
    assert.equal(feed.some((item) => item.id.startsWith("x-")), false);
    assert.equal(SEED_POSTS.some((post) => post.id.startsWith("x-")), false);
    assert.equal(X_CARDS.some((card) => card.id.startsWith("seed-") || card.id.startsWith("world-")), false);
    assert.equal(WORLD_CARDS.some((card) => card.id.startsWith("x-")), false);
    const house = SEED_POSTS.map((p) => `${p.text} ${p.author} ${p.handle}`).join(" ");
    assert.equal(house.includes("من إكس"), false);
  });

  it("lists seed order only and hydrates ids against the locked ten", () => {
    assert.deepEqual(
      listXCards().map((c) => c.id),
      X_IDS,
    );
    assert.equal(xStripCards().length, 10);
    assert.ok(xStripCards().length <= X_STRIP_CAP);
    const next = hydrateXState({ version: 1, seededIds: ["old"] }, X_IDS);
    assert.deepEqual(next.seededIds, X_IDS);
    assert.deepEqual(hydrateXState(null).seededIds, X_IDS);
  });

  it("does not scrape or fetch — static seed module only", () => {
    const x = src("./seed.ts");
    const logic = src("./logic.ts");
    const store = src("./store.ts");
    const page = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    for (const [name, text] of [
      ["seed.ts", x],
      ["logic.ts", logic],
      ["store.ts", store],
      ["square-page.tsx", page],
    ] as const) {
      assert.equal(/\bfetch\s*\(/.test(text), false, name);
      assert.equal(/XMLHttpRequest/.test(text), false, name);
      assert.equal(/new\s+WebSocket/.test(text), false, name);
    }
    assert.doesNotMatch(x, /from "\.\.\/square\/seed\.ts"/);
    assert.doesNotMatch(x, /maydan-seed-v1/);
    assert.doesNotMatch(x, /maydan-min-alalam/);
    assert.doesNotMatch(src("./store.ts"), /waha:square/);
  });
});

describe("x square chrome", () => {
  it("adds a top strip only — no Wave 1 tab and no clone of X", () => {
    const page = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    const strip = readFileSync(new URL("../../components/square/x-strip.tsx", import.meta.url), "utf8");
    const card = readFileSync(new URL("../../components/square/x-card.tsx", import.meta.url), "utf8");
    const badge = readFileSync(new URL("../../components/square/x-badge.tsx", import.meta.url), "utf8");
    assert.match(page, /XStrip/);
    assert.match(strip, /data-x-strip/);
    assert.match(strip, /data-x-tamyiz="quiet-v1"/);
    assert.match(strip, /data-x-live="seed-v1"/);
    assert.match(strip, /من إكس/);
    assert.match(card, /data-x-tamyiz="slip"/);
    assert.match(card, /الأصل/);
    assert.doesNotMatch(card, /AvatarMark|rounded-full|Heart|MessageCircle/);
    assert.doesNotMatch(strip + card + badge, /#1d9bf0|#1DA1F2|twitter-blue|widgets\.js/i);
    assert.match(card, /card\.text/);
    assert.match(card, /card\.sourceUrl/);
    assert.match(card, /card\.authorName/);
    assert.match(card, /card\.authorHandle/);
    assert.match(badge, /X_STAMP/);
    assert.equal(X_SEED.displayLock.separateTabWave1, false);
    assert.match(X_SEED.displayLock.place, /شريط «من إكس» أعلى خط الميدان/);
    assert.doesNotMatch(page, /data-x-tab/);
    assert.doesNotMatch(page, /id: "x"/);
    assert.doesNotMatch(page, /موجة ١|موجة 1/);
    assert.doesNotMatch(strip, /role="tab"/);
    assert.doesNotMatch(card, /likes|retweet|bookmark|impression|viewCount|quoteTweet/i);
    assert.doesNotMatch(strip, /likes|retweet|bookmark|fakeEngagement/i);
    assert.doesNotMatch(card, /twitter\.com\/i\/oembed|platform\.twitter|widgets\.js/);
  });

  it("keeps `/` as Maydan + thin shadow — books stay on /books, no WebView on the home line", () => {
    const home = readFileSync(new URL("../../routes/index.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    const shadow = readFileSync(new URL("../../components/square/day-shadow.tsx", import.meta.url), "utf8");
    const strip = readFileSync(new URL("../../components/square/x-strip.tsx", import.meta.url), "utf8");
    const card = readFileSync(new URL("../../components/square/x-card.tsx", import.meta.url), "utf8");
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /DayShadow|Hub|BooksPage|WebView|<iframe/);
    assert.match(page, /DayShadow/);
    assert.match(page, /data-home-sections="day-shadow house-doors square"/);
    assert.match(shadow, /data-shadow="thin"/);
    assert.doesNotMatch(page, /BooksPage|lib\/books|waha:books|WebView|<iframe/);
    assert.doesNotMatch(strip, /<iframe|WebView|widgets\.js|batch2/);
    assert.doesNotMatch(card, /<iframe|WebView|widgets\.js|batch2/);
  });
});
