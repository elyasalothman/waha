import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOUSE_ACCOUNTS, SAMPLE_ACCOUNTS, getAccount } from "./accounts.ts";
import { MIN_SEED_POSTS, SEED_POSTS } from "./seed.ts";
import { addPost, addReply, emptyLocal, mergeFeed, toggleEcho, toggleLike, updateProfile } from "./logic.ts";
import { formatAgeMinutes, seedCreatedAt } from "./time.ts";

describe("square seed", () => {
  it("ships at least forty posts so the square is never empty", () => {
    assert.ok(SEED_POSTS.length >= MIN_SEED_POSTS);
  });

  it("covers every official house account", () => {
    const authors = new Set(SEED_POSTS.map((p) => p.authorId));
    for (const house of HOUSE_ACCOUNTS) {
      assert.ok(authors.has(house.id), `missing posts from ${house.nameAr}`);
    }
  });

  it("marks community posts with sample authors, not house voices", () => {
    const sampleIds = new Set(SAMPLE_ACCOUNTS.map((a) => a.id));
    const samples = SEED_POSTS.filter((p) => sampleIds.has(p.authorId));
    assert.ok(samples.length >= 16);
    for (const post of samples) {
      assert.equal(getAccount(post.authorId).kind, "sample");
    }
  });

  it("varies form: text, quote, door, and calm media", () => {
    const kinds = new Set(SEED_POSTS.map((p) => p.kind));
    assert.ok(kinds.has("text"));
    assert.ok(kinds.has("quote"));
    assert.ok(kinds.has("door"));
    assert.ok(kinds.has("media"));
    assert.ok(SEED_POSTS.some((p) => p.door === "madar"));
    assert.ok(SEED_POSTS.some((p) => p.door === "tahajjud"));
    assert.ok(SEED_POSTS.some((p) => p.door === "midad"));
  });

  it("spreads ages so the line feels alive", () => {
    const ages = SEED_POSTS.map((p) => p.ageMinutes);
    assert.ok(ages.some((m) => m < 15), "needs minutes-ago posts");
    assert.ok(ages.some((m) => m >= 60 && m < 180), "needs about-an-hour posts");
    assert.ok(ages.some((m) => m >= 1440), "needs day-old posts");
  });

  it("keeps seed copy calm — no celebrity handles, no sharp politics", () => {
    const blob = SEED_POSTS.map((p) => `${p.textAr} ${p.textEn} ${p.authorId}`).join(" ");
    for (const banned of ["تويتر", "twitter", "إكس", "x.com", "trump", "netanyahu", "مشهور"]) {
      assert.equal(blob.toLowerCase().includes(banned.toLowerCase()), false, banned);
    }
  });
});

describe("square time", () => {
  it("formats relative Arabic ages from stored minutes", () => {
    assert.equal(formatAgeMinutes(3, "ar"), "منذ دقائق");
    assert.equal(formatAgeMinutes(60, "ar"), "منذ ساعة");
    assert.equal(formatAgeMinutes(120, "ar"), "منذ ساعتين");
    assert.equal(formatAgeMinutes(180, "ar"), "منذ 3 ساعات");
    assert.equal(formatAgeMinutes(660, "ar"), "منذ 11 ساعة");
    assert.equal(formatAgeMinutes(1440, "ar"), "منذ يوم");
    assert.equal(formatAgeMinutes(2880, "ar"), "منذ يومين");
  });

  it("materializes seed timestamps behind now", () => {
    const now = 1_700_000_000_000;
    assert.equal(seedCreatedAt(60, now), now - 60 * 60_000);
  });
});

describe("square store", () => {
  it("always merges the local seed even when storage is empty", () => {
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.ok(feed.length >= MIN_SEED_POSTS);
    assert.ok(feed.every((item) => item.textAr.length > 0));
  });

  it("places a newly written post at the top", () => {
    const now = 1_800_000_000_000;
    const next = addPost(emptyLocal(), "صباح الخير من الميدان", now);
    const feed = mergeFeed(next, "forYou", now, "ar");
    assert.equal(feed[0]?.source, "you");
    assert.equal(feed[0]?.textAr, "صباح الخير من الميدان");
  });

  it("ignores empty compose and trims to 280", () => {
    assert.equal(addPost(emptyLocal(), "   ").posts.length, 0);
    const long = "أ".repeat(400);
    const next = addPost(emptyLocal(), long, 10);
    assert.equal(next.posts[0]?.text.length, 280);
  });

  it("toggles like and echo locally", () => {
    const liked = toggleLike(emptyLocal(), "seed-01");
    assert.deepEqual(liked.likes, ["seed-01"]);
    const unliked = toggleLike(liked, "seed-01");
    assert.deepEqual(unliked.likes, []);
    const echoed = toggleEcho(emptyLocal(), "seed-02");
    assert.deepEqual(echoed.echoes, ["seed-02"]);
  });

  it("stores a local reply under the post", () => {
    const next = addReply(emptyLocal(), "seed-01", "بارك الله فيكم", "ضيف الواحة", 99);
    assert.equal(next.replies["seed-01"]?.[0]?.text, "بارك الله فيكم");
  });

  it("following tab keeps house posts and the visitor’s own", () => {
    const now = Date.now();
    const local = addPost(emptyLocal(), "سطر مني", now);
    const following = mergeFeed(local, "following", now, "ar");
    assert.ok(following.some((i) => i.source === "you"));
    assert.ok(following.every((i) => i.author.kind === "house" || i.source === "you"));
    assert.ok(following.length < mergeFeed(local, "forYou", now, "ar").length);
  });

  it("saves a thin local profile", () => {
    const next = updateProfile(emptyLocal(), { name: "  سالم  ", bio: "أقرأ بعد العشاء" });
    assert.equal(next.profile.name, "سالم");
    assert.equal(next.profile.bio, "أقرأ بعد العشاء");
  });
});
