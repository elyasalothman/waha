import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import test from "node:test";
import assert from "node:assert/strict";
import { READING_COUNTS, booksBlurb } from "./reading-counts.ts";

test("reading copy counts distinct shelves instead of calling everything twelve books", () => {
  assert.equal(READING_COUNTS.stampedShelf, 12);
  assert.equal(READING_COUNTS.midadOriginals, 12);
  assert.equal(READING_COUNTS.mysteryEntries, 2);
  const ar = booksBlurb("ar");
  assert.match(ar, /12 كتاب/);
  assert.match(ar, /12 نص/);
  assert.match(ar, /2 من قصص/);
  assert.match(ar, /دليل التداول/);
  assert.doesNotMatch(ar, /اثنا عشر كتاباً معلَّم المصدر —/);
});

test("story and trading-guide JSON parse in milliseconds here; the slow path is transfer", () => {
  for (const file of ["stories/al-dalla.json", "trading-guide/book.json"]) {
    const raw = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    const started = performance.now();
    const book = JSON.parse(raw) as { chapters: unknown[] };
    const ms = performance.now() - started;
    assert.ok(book.chapters.length > 0, file);
    assert.ok(ms < 1000, `${file} parsed in ${ms.toFixed(1)}ms`);
  }
});
