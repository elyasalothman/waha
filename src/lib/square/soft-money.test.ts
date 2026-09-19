import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOORS, HOUSE_ACCOUNTS } from "./accounts.ts";
import { SEED_POSTS } from "./seed.ts";
import { emptyLocal, mergeFeed } from "./logic.ts";
import {
  HOUSE_SUPPORT_CONTACT_HREF,
  HOUSE_SUPPORT_EMAIL,
  LIVE_TIP_HREF,
  claimsLivePayment,
  houseProductDoors,
  isHouseValueDoorItem,
  resolveSupportPath,
  seedCopyIsCalm,
  seedHouseValueDoorCount,
} from "./soft-money.ts";

describe("soft money path", () => {
  it("has no live tip checkout — coming soon is honest", () => {
    assert.equal(LIVE_TIP_HREF, null);
    const path = resolveSupportPath();
    assert.equal(path.kind, "coming-soon");
    assert.equal(claimsLivePayment(path), false);
    if (path.kind === "coming-soon") {
      assert.equal(path.contactHref, HOUSE_SUPPORT_CONTACT_HREF);
      assert.equal(path.email, HOUSE_SUPPORT_EMAIL);
    }
  });

  it("uses a live https tip only when one is actually provided", () => {
    const live = resolveSupportPath("https://tahajjud.alhajda.com/tip");
    assert.equal(live.kind, "live");
    if (live.kind === "live") assert.equal(live.href, "https://tahajjud.alhajda.com/tip");
    assert.equal(resolveSupportPath("").kind, "coming-soon");
    assert.equal(resolveSupportPath("  ").kind, "coming-soon");
  });

  it("does not invent a payment endpoint or ad network", () => {
    const path = resolveSupportPath();
    const blob = JSON.stringify(path).toLowerCase();
    for (const banned of ["stripe", "paypal", "adsense", "doubleclick", "ko-fi", "patreon"]) {
      assert.equal(blob.includes(banned), false, banned);
    }
    assert.match(HOUSE_SUPPORT_CONTACT_HREF, /^https:\/\/alhajda\.com\/support$/);
  });

  it("lists the three quiet house products — not a catalog dump", () => {
    const doors = houseProductDoors();
    assert.deepEqual(
      doors.map((d) => d.id),
      ["tahajjud", "midad", "sites"],
    );
    assert.equal(doors[0]?.href, "https://tahajjud.alhajda.com");
    assert.equal(doors[1]?.href, "https://midad.alhajda.com/library");
    assert.equal(doors[2]?.href, "https://alhajda.com/sites");
  });
});

describe("house value doors after #16", () => {
  it("points تهجد/مداد at the live products via account href — never a feed chip", () => {
    assert.equal(DOORS.tahajjud.href, "https://tahajjud.alhajda.com");
    assert.equal(DOORS.midad.href, "https://midad.alhajda.com/library");
    const tahajjud = HOUSE_ACCOUNTS.find((a) => a.handle === "@tahajjud");
    const midad = HOUSE_ACCOUNTS.find((a) => a.handle === "@midad");
    assert.equal(tahajjud?.href, DOORS.tahajjud.href);
    assert.equal(midad?.href, DOORS.midad.href);
  });

  it("keeps king seed intact — no door-thinning of the forty-eight", () => {
    assert.ok(seedHouseValueDoorCount(SEED_POSTS, HOUSE_ACCOUNTS) >= 1);
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(feed.length, SEED_POSTS.length);
    assert.ok(feed.some(isHouseValueDoorItem));
  });

  it("keeps seed copy as value, not a sales shout", () => {
    assert.equal(seedCopyIsCalm(SEED_POSTS), true);
  });
});
