import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SEED_POSTS } from "../square/seed.ts";
import { SQUARE_STORAGE_KEY, mergeFeed, emptyLocal } from "../square/logic.ts";
import { CLIP_CARDS, CLIP_IDS, CLIPS_SEED, CLIPS_SEED_COUNT, nocookieEmbedUrl, watchUrl } from "./seed.ts";
import { hydrateClipsState, listClips, markSeen } from "./logic.ts";
import { CLIP_TOPICS, CLIPS_STORAGE_KEY } from "./types.ts";
import cards from "./maydan-muaqata-mufida-cards-v1.json" with { type: "json" };
import lock from "./maydan-muaqata-mufida-seed-v1.json" with { type: "json" };

const FORBIDDEN_LANES = ["سياسة", "مشاهير استعراض", "رياضة صاخبة", "طب تشخيصي", "من العالم"];

describe("clips seed lock", () => {
  it("ships the king-approved twelve clips with fixed watch ids", () => {
    assert.equal(CLIPS_SEED.status, "king-approved");
    assert.equal(CLIP_CARDS.length, CLIPS_SEED_COUNT);
    assert.equal(CLIPS_SEED.clips.length, 12);
    assert.equal((cards as { id: string }[]).length, 12);
    assert.equal(CLIPS_SEED.meta.clipCount, 12);
    assert.equal(CLIPS_SEED.implementationLock.clipCount, 12);
    assert.deepEqual(
      CLIP_CARDS.map((c) => c.id),
      CLIPS_SEED.clips.map((c) => c.id),
    );
    assert.deepEqual(
      CLIP_CARDS.map((c) => c.youtubeId),
      (lock as typeof CLIPS_SEED).clips.map((c) => c.youtubeId),
    );
  });

  it("keeps every embed on youtube-nocookie and every original on watch", () => {
    for (const clip of CLIP_CARDS) {
      assert.equal(clip.embedUrl, nocookieEmbedUrl(clip.youtubeId));
      assert.equal(clip.youtubeUrl, watchUrl(clip.youtubeId));
      assert.match(clip.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
      assert.match(clip.youtubeUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
      assert.equal(clip.embedUrl.includes("youtube.com/embed"), false);
    }
  });

  it("allows only علم / تعليم / عادة and refuses forbidden lanes", () => {
    assert.deepEqual([...CLIP_TOPICS], ["علم", "تعليم", "عادة"]);
    const blob = CLIP_CARDS.map((c) => `${c.titleAr} ${c.benefitAr} ${c.topic} ${c.channel}`).join("\n");
    for (const clip of CLIP_CARDS) {
      assert.equal((CLIP_TOPICS as readonly string[]).includes(clip.topic), true, clip.id);
    }
    assert.ok(CLIPS_SEED.clips.every((clip) => clip.onMaydanTimeline === false));
    for (const banned of FORBIDDEN_LANES) {
      assert.equal(blob.includes(banned), false, banned);
    }
  });

  it("locks the council: /clips, chrome like مدار, no algorithm, no search", () => {
    assert.equal(CLIPS_SEED.councilLock.route, "/clips");
    assert.equal(CLIPS_SEED.implementationLock.route, "/clips");
    assert.equal(CLIPS_SEED.councilLock.chromeTabLikeMadar, true);
    assert.equal(CLIPS_SEED.councilLock.notOnMaydanFeed, true);
    assert.equal(CLIPS_SEED.councilLock.noAlgorithm, true);
    assert.equal(CLIPS_SEED.councilLock.noSearchInProduction, true);
    assert.equal(CLIPS_SEED.implementationLock.embed, "youtube-nocookie");
    assert.equal(CLIPS_SEED.implementationLock.originalLinkVisible, true);
    assert.equal(CLIPS_SEED.rules.separateStore, CLIPS_STORAGE_KEY);
  });
});

describe("clips store isolation", () => {
  it("uses waha:clips:v1 and never the Maydan square key", () => {
    assert.equal(CLIPS_STORAGE_KEY, "waha:clips:v1");
    assert.equal(SQUARE_STORAGE_KEY, "waha:square:v1");
    assert.notEqual(CLIPS_STORAGE_KEY, SQUARE_STORAGE_KEY);
  });

  it("lists seed order only — no shuffle and no ranking", () => {
    assert.deepEqual(
      listClips().map((c) => c.id),
      CLIP_IDS,
    );
    assert.deepEqual(listClips()[0]?.id, "clip-001");
    assert.deepEqual(listClips()[11]?.id, "clip-012");
  });

  it("hydrates seen ids against the locked seed and ignores strangers", () => {
    const next = hydrateClipsState(
      { version: 1, seededIds: ["old"], seen: ["clip-001", "clip-999", "seed-001"] },
      CLIP_IDS,
    );
    assert.deepEqual(next.seededIds, CLIP_IDS);
    assert.deepEqual(next.seen, ["clip-001"]);
    const marked = markSeen(next, "clip-002");
    assert.deepEqual(marked.seen, ["clip-001", "clip-002"]);
    assert.deepEqual(markSeen(marked, "seed-001").seen, marked.seen);
  });
});

describe("clips stay off the Maydan line", () => {
  it("does not mix clip ids or YouTube into the 48-post seed", () => {
    assert.equal(SEED_POSTS.length, 48);
    const ids = new Set(SEED_POSTS.map((p) => p.id));
    for (const id of CLIP_IDS) assert.equal(ids.has(id), false, id);
    const blob = SEED_POSTS.map((p) => p.text).join("\n");
    assert.equal(/youtube/i.test(blob), false);
    assert.equal(blob.includes("مقاطع مفيدة"), false);
    assert.equal(blob.includes("من العالم"), false);
  });

  it("keeps mergeFeed free of clip rows", () => {
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(
      feed.some((item) => item.id.startsWith("clip-") || /youtube/i.test(item.text)),
      false,
    );
  });

  it("keeps SquarePage and the clips page from importing each other", () => {
    const square = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../../apps/clips/page.tsx", import.meta.url), "utf8");
    const route = readFileSync(new URL("../../routes/clips.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(square, /clips|youtube-nocookie|waha:clips/);
    assert.doesNotMatch(page, /square\/|maydan-seed|waha:square|من العالم/);
    assert.match(route, /createFileRoute\("\/clips"\)/);
    assert.match(page, /youtube-nocookie/);
    assert.match(page, /clipsOriginal/);
    assert.doesNotMatch(page, /<(input|form)\b/);
    assert.doesNotMatch(page, /square\/|maydan-seed/);
  });

  it("puts clips on the chrome like مدار — not inside SquarePage", () => {
    const shell = readFileSync(new URL("../../components/layout/shell.tsx", import.meta.url), "utf8");
    const nav = readFileSync(new URL("../nav.ts", import.meta.url), "utf8");
    assert.match(shell, /to="\/clips"/);
    assert.match(shell, /to="\/madar"/);
    assert.match(nav, /to: "\/clips"/);
    const catalog = readFileSync(new URL("../catalog.ts", import.meta.url), "utf8");
    assert.match(catalog, /id: "clips".*portal: true/);
    assert.doesNotMatch(catalog, /id: "clips"[\s\S]{0,200}featured: true/);
  });
});
