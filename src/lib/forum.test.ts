import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FORUM_BOARD_IDS, FORUM_BOARDS } from "./forum/boards.ts";
import { FORUM_SEED_TOPICS, forumSeedTopicCount } from "./forum/seed.ts";
import { allTopics, topicsForBoard } from "./forum/store.ts";
import { hidePost, parseHiddenPosts, pinMatches, unhidePost } from "./admin.ts";
import { SEED_POSTS } from "./square/seed.ts";

describe("forum boards", () => {
  it("has علم دين حياة برمجة عام (and أفكار) with seed topics", () => {
    const titles = FORUM_BOARDS.map((b) => b.title.ar);
    for (const name of ["عام", "علم", "دين", "حياة", "برمجة"]) {
      assert.ok(titles.includes(name), name);
    }
    assert.equal(forumSeedTopicCount() >= 12, true);
    for (const id of FORUM_BOARD_IDS) {
      assert.ok(topicsForBoard(id).length >= 2, `${id} needs two seeds`);
    }
    assert.equal(
      allTopics().every((topic) => FORUM_BOARD_IDS.includes(topic.board)),
      true,
    );
  });

  it("does not mix forum topics into the Maydan line", () => {
    const forumIds = new Set(FORUM_SEED_TOPICS.map((topic) => topic.id));
    assert.equal(
      SEED_POSTS.some((post) => forumIds.has(post.id) || /^ft-/.test(post.id)),
      false,
    );
  });
});

describe("admin hide (local)", () => {
  it("honors a stored PIN and hides a forum topic locally", () => {
    const storage = new Map<string, string>([["waha:pin", "4242"]]);
    const bag = {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
    };
    assert.equal(pinMatches("4242", bag), true);
    assert.equal(pinMatches("1370", bag), false);

    const hidden = hidePost("forum", "ft-g1", parseHiddenPosts(null));
    assert.deepEqual(hidden.forum, ["ft-g1"]);
    assert.equal(
      allTopics({ extras: [], replies: [] }, hidden.forum).some((topic) => topic.id === "ft-g1"),
      false,
    );
    assert.equal(unhidePost("forum", "ft-g1", hidden).forum.includes("ft-g1"), false);
  });
});
