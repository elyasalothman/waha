import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOORS, HOUSE_ACCOUNTS, SAMPLE_ACCOUNTS } from "./accounts.ts";
import { MIN_SEED_POSTS, SEED_POSTS } from "./seed.ts";
import { addPost, addReply, emptyLocal, mergeFeed, toggleEcho, toggleLike, updateProfile } from "./logic.ts";
import { formatAgeMinutes, seedCreatedAt } from "./time.ts";

describe("square seed", () => {
  it("ships the king-approved forty-eight posts so the square is never empty", () => {
    assert.equal(SEED_POSTS.length, 48);
    assert.ok(SEED_POSTS.length >= MIN_SEED_POSTS);
  });

  it("covers every official house handle from the king file", () => {
    const handles = new Set(SEED_POSTS.map((p) => p.handle));
    for (const house of HOUSE_ACCOUNTS) {
      assert.ok(handles.has(house.handle), `missing posts from ${house.nameAr}`);
    }
  });

  it("keeps بيت and عيّنة badges exactly as shipped", () => {
    assert.ok(SEED_POSTS.every((p) => p.badge === "بيت" || p.badge === "عيّنة"));
    const samples = SEED_POSTS.filter((p) => p.badge === "عيّنة");
    assert.ok(samples.length >= 16);
    for (const post of samples) {
      assert.ok(post.handle.startsWith("@sample."));
    }
  });

  it("does not edit king texts — opening line stays as shipped", () => {
    assert.equal(SEED_POSTS[0]?.id, "seed-001");
    assert.match(SEED_POSTS[0]?.text ?? "", /^أهلاً بك في الميدان\./);
    assert.equal(SEED_POSTS[0]?.relativeTime, "منذ ساعة");
    assert.ok(SEED_POSTS.every((p) => p.text.length > 0 && p.relativeTime.length > 0));
  });

  it("keeps seed copy calm — no celebrity handles, no sharp politics", () => {
    const blob = SEED_POSTS.map((p) => `${p.text} ${p.author} ${p.handle}`).join(" ");
    for (const banned of ["تويتر", "twitter", "إكس", "x.com", "trump", "netanyahu"]) {
      assert.equal(blob.toLowerCase().includes(banned.toLowerCase()), false, banned);
    }
  });
});

describe("square doors", () => {
  it("points house doors at the locked live products — never fake /life or /app clones", () => {
    assert.equal(DOORS.madar.href, "/madar");
    assert.equal(DOORS.tahajjud.href, "https://tahajjud.alhajda.com");
    assert.equal(DOORS.midad.href, "https://midad.alhajda.com/library");
    assert.equal(DOORS.sites.href, "https://alhajda.com/sites");
    const hrefs = Object.values(DOORS).map((d) => d.href).join(" ");
    assert.equal(/\/life\b/.test(hrefs), false);
    assert.equal(/\/app\/salah/.test(hrefs), false);
    assert.equal(/\/app\/khatma/.test(hrefs), false);
  });

  it("lists the marked sample voices from the king file", () => {
    assert.equal(SAMPLE_ACCOUNTS.length, 6);
    assert.ok(SAMPLE_ACCOUNTS.every((a) => a.kind === "sample"));
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
    assert.ok(feed.every((item) => item.text.length > 0));
    assert.ok(feed.some((item) => item.badge === "عيّنة"));
    assert.ok(feed.some((item) => item.badge === "بيت"));
  });

  it("places a newly written post at the top with no fake counts", () => {
    const now = 1_800_000_000_000;
    const next = addPost(emptyLocal(), "صباح الخير من الميدان", now);
    const feed = mergeFeed(next, "forYou", now, "ar");
    assert.equal(feed[0]?.source, "you");
    assert.equal(feed[0]?.text, "صباح الخير من الميدان");
    assert.equal(feed[0]?.likes, 0);
  });

  it("ignores empty compose and trims to 280", () => {
    assert.equal(addPost(emptyLocal(), "   ").posts.length, 0);
    const long = "أ".repeat(400);
    const next = addPost(emptyLocal(), long, 10);
    assert.equal(next.posts[0]?.text.length, 280);
  });

  it("toggles like and echo locally", () => {
    const liked = toggleLike(emptyLocal(), "seed-001");
    assert.deepEqual(liked.likes, ["seed-001"]);
    const unliked = toggleLike(liked, "seed-001");
    assert.deepEqual(unliked.likes, []);
    const echoed = toggleEcho(emptyLocal(), "seed-002");
    assert.deepEqual(echoed.echoes, ["seed-002"]);
  });

  it("stores a local reply under the post", () => {
    const next = addReply(emptyLocal(), "seed-001", "بارك الله فيكم", "ضيف الواحة", 99);
    assert.equal(next.replies["seed-001"]?.[0]?.text, "بارك الله فيكم");
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
