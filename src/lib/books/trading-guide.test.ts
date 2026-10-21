import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  ALHAJDA_READING_KEY,
  chapterForAnchor,
  curatedReading,
  searchCuratedBook,
  type CuratedBook,
} from "./curated.ts";

const book: CuratedBook = JSON.parse(
  readFileSync(new URL("./trading-guide/book.json", import.meta.url), "utf8"),
);
const html = book.chapters.map((chapter) => chapter.html).join("\n");

test("trading guide retains all reviewed sections and source paragraphs", () => {
  assert.equal(book.chapters.length, 23);
  const paragraphs = book.chapters
    .flatMap((chapter) => chapter.searchBlocks?.map((block) => block.text) ?? [])
    .filter(Boolean);
  assert.equal(paragraphs.length, 1250);
  // Audited public source: only the private dedication was removed.
  assert.equal(
    createHash("sha256").update(JSON.stringify(paragraphs)).digest("hex"),
    "41dea162f8f8930b089a338be89d3d54bdc2d740e5244fd430ffef0a8b30c384",
  );
  assert.equal((html.match(/<table>/g) ?? []).length, 19);
  assert.equal((html.match(/<a /g) ?? []).length, 194);
  assert.equal((html.match(/<img /g) ?? []).length, 1);
});

test("trading guide public HTML contains no executable elements or private dedication", () => {
  assert.doesNotMatch(html, /<(script|iframe|form|object|embed)\b|\bon\w+\s*=/i);
  assert.doesNotMatch(html, /(?:href|src)=["'](?:javascript|data):/i);
  assert.doesNotMatch(JSON.stringify(book), /إلياس|أُعد لإلياس/);
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.notEqual(chapterForAnchor(book, match[1]), null);
  }
});

test("trading guide preserves search, malformed-state bounds and bookmarks", () => {
  assert.equal(curatedReading(null, book).fontSize, 24);
  assert.equal(curatedReading({ chapter: Infinity, fontSize: NaN }, book).chapter, 0);
  assert.equal(curatedReading({ chapter: 999, fontSize: -1 }, book).chapter, 22);
  assert.equal(curatedReading({ chapter: 999, fontSize: -1 }, book).fontSize, 18);
  assert.ok(searchCuratedBook(book, "إدارة المخاطر").length > 0);
  assert.equal(searchCuratedBook(book, "zzzznotpresent").length, 0);
  const position = { chapter: 6, anchor: book.chapters[6].anchorIds[4] };
  const state = curatedReading(
    { ...position, bookmarks: [position, position], theme: "night", fontSize: 32 },
    book,
  );
  assert.equal(state.bookmarks.length, 1);
  assert.deepEqual(curatedReading(JSON.parse(JSON.stringify(state)), book), state);
  assert.equal(ALHAJDA_READING_KEY, "waha:curated:alhajda:edition1");
});
