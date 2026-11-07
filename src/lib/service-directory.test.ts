import test from "node:test";
import assert from "node:assert/strict";
import { SERVICE_DIRECTORY, directoryItems, filterDirectory } from "./service-directory.ts";

const REMOVED = ["dallah", "hayat", "hayat-world", "luma", "mamalik", "market-bot", "tetris", "studio", "workspace"];

test("the services directory leads with books and research and drops unused doors", () => {
  assert.deepEqual(
    SERVICE_DIRECTORY.map((section) => section.id),
    ["reading", "news", "play", "tools", "outside"],
  );
  const items = directoryItems();
  assert.deepEqual(items.slice(0, 2).map((item) => item.id), ["books", "research"]);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const id of REMOVED) assert.equal(items.some((item) => item.id === id), false, id);
  assert.match(items.find((item) => item.id === "games")?.blurb.ar ?? "", /جيش الواحة/);
  assert.equal(items.find((item) => item.id === "market")?.external, true);
  for (const item of items) {
    assert.ok(item.blurb.ar.length > 12, item.id);
    if (item.external) assert.ok(item.href.startsWith("https://"));
    else assert.ok(item.href.startsWith("/") && !item.href.startsWith("//"), item.id);
  }
});

test("search stays inside the short directory", () => {
  assert.equal(filterDirectory("دلّة").length, 0);
  assert.equal(filterDirectory("المكتبة")[0]?.items[0]?.href, "/books");
});
