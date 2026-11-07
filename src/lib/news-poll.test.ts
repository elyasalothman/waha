import test from "node:test";
import assert from "node:assert/strict";
import { newsIsStale, newsPollDelay, NEWS_POLL_MS, NEWS_STALE_MS } from "./news-poll.ts";

test("headlines wait while hidden or offline and back off after failures", () => {
  assert.equal(newsPollDelay(0, false, true), NEWS_POLL_MS);
  assert.equal(newsPollDelay(0, true, true), null);
  assert.equal(newsPollDelay(0, false, false), null);
  assert.equal(newsPollDelay(1, false, true), NEWS_POLL_MS * 2);
  assert.equal(newsPollDelay(8, false, true), 600_000);
});

test("a resume refreshes only when the last good fetch is stale", () => {
  assert.equal(newsIsStale(null, 1_000), true);
  assert.equal(newsIsStale(1_000, 1_000 + NEWS_STALE_MS - 1), false);
  assert.equal(newsIsStale(1_000, 1_000 + NEWS_STALE_MS), true);
});
