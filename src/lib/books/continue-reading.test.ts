import test from "node:test";
import assert from "node:assert/strict";
import { continueReading } from "./continue-reading.ts";

test("continue reading uses a saved chapter and ignores a book still on the first page", () => {
  const values = new Map<string, string>([
    ["waha:curated:story:al-dalla", JSON.stringify({ chapter: 2, anchor: null, savedAt: "2026-11-07T10:00:00.000Z" })],
    ["waha:reading:midad-elevator-key", JSON.stringify({ chapter: 0, paragraph: 0 })],
    ["waha:curated:alhajda:edition1", JSON.stringify({ chapter: 1, savedAt: "2026-11-06T10:00:00.000Z" })],
    ["waha:reading:not-a-book", JSON.stringify({ chapter: 4, paragraph: 2, savedAt: "2026-11-08T10:00:00.000Z" })],
  ]);
  const hits = continueReading({ getItem: (key) => values.get(key) ?? null });
  assert.deepEqual(
    hits.map((item) => item.href),
    ["/books/stories/al-dalla", "/books/alhajda"],
  );
  assert.equal(hits[0]?.detail, "الفصل 3 من 6");
  assert.equal(hits[1]?.title, "الهجدة");
});

test("opening the first chapter does not count as continue-reading", () => {
  const hits = continueReading({
    getItem: () => JSON.stringify({ chapter: 0, anchor: "tg-p-0", bookmarks: [] }),
  });
  assert.deepEqual(hits, []);
});

test("damaged continue records are skipped", () => {
  const hits = continueReading({
    getItem: (key) => (key.endsWith("al-dalla") ? "{chapter:2}" : "null"),
  });
  assert.deepEqual(hits, []);
});
