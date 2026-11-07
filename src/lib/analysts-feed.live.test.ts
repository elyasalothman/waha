import test from "node:test";
import assert from "node:assert/strict";
import { parseAnalystFeed } from "./analysts-feed.ts";

test("the public Hudoo analysts feed is readable and dated", async () => {
  const response = await fetch("https://news.alhajda.com/api/analysts", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  const items = parseAnalystFeed(payload);
  assert.ok(items.length >= 1);
  assert.equal(items[0]?.postedAt, [...items].sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))[0]?.postedAt);
  for (const item of items) {
    assert.equal(Number.isFinite(Date.parse(item.postedAt)), true);
    assert.ok(item.url.startsWith("https://"));
    assert.ok(item.analyst.name.length > 1);
    assert.ok(item.title.length > 1);
    assert.equal(item.title.includes("توصية شراء"), false);
  }
  const newest = items[0]!;
  assert.ok(Date.parse(newest.postedAt) <= Date.now() + 5 * 60_000);
  console.log(
    `observed newest opinion id=${newest.id} postedAt=${newest.postedAt} author=${newest.analyst.name} title=${newest.title}`,
  );
});
