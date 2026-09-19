import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guestMaydanKeepsSeed48, guestReadsWithoutAccount } from "./home-lock.ts";
import { GUEST_SLICE, guestSeesFullSeed, resolveStoredSlice } from "./prefs.ts";
import { mergeFeed, emptyLocal } from "./square/logic.ts";
import { SEED_POSTS } from "./square/seed.ts";

describe("prefs — ignore stale audience", () => {
  it("treats a guest as personal/all so the Square keeps seed 48", () => {
    assert.deepEqual(GUEST_SLICE, { audience: "personal", segment: "all", sliceChosen: false });
    assert.equal(guestSeesFullSeed(), true);
    assert.equal(guestReadsWithoutAccount(), true);
    assert.equal(guestMaydanKeepsSeed48(), true);
    assert.deepEqual(resolveStoredSlice(null), GUEST_SLICE);
    assert.deepEqual(resolveStoredSlice({}), GUEST_SLICE);
  });

  it("clears leftover chrome audience — child/work/family without sliceChosen", () => {
    assert.deepEqual(
      resolveStoredSlice({ audience: "work", segment: "child", sliceChosen: false }),
      GUEST_SLICE,
    );
    assert.deepEqual(
      resolveStoredSlice({ audience: "personal", segment: "child" }),
      GUEST_SLICE,
    );
    assert.deepEqual(
      resolveStoredSlice({ audience: "work", segment: "all" }),
      GUEST_SLICE,
    );
    assert.deepEqual(
      resolveStoredSlice({ audience: "personal", segment: "family" }),
      GUEST_SLICE,
    );
  });

  it("keeps a slice only after onboarding chose it", () => {
    assert.deepEqual(resolveStoredSlice({ audience: "work", segment: "all", sliceChosen: true }), {
      audience: "work",
      segment: "all",
      sliceChosen: true,
    });
    assert.deepEqual(resolveStoredSlice({ audience: "personal", segment: "child", sliceChosen: true }), {
      audience: "personal",
      segment: "child",
      sliceChosen: true,
    });
    assert.deepEqual(resolveStoredSlice({ audience: "work", segment: "family", sliceChosen: true }), {
      audience: "personal",
      segment: "family",
      sliceChosen: true,
    });
  });

  it("does not empty the Maydan line for a leftover child slice", () => {
    const ignored = resolveStoredSlice({ segment: "child" });
    assert.equal(ignored.segment, "all");
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(feed.length, 48);
    assert.equal(feed.length, SEED_POSTS.length);
  });
});
