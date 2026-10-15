import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { chapterForAnchor, curatedReading, searchCuratedBook, type CuratedBook } from "./curated.ts";

const book: CuratedBook = JSON.parse(readFileSync(new URL("./alhajda/book.json", import.meta.url), "utf8"));

test("all shipped chapter anchors resolve and survive reading-state restoration", () => {
  for (const [chapter, content] of book.chapters.entries()) {
    assert.ok(content.html.length > 0);
    for (const image of content.html.matchAll(/<img\b[^>]*>/g)) {
      const width = image[0].match(/\bwidth="(\d+)"/)?.[1];
      assert.ok(width);
      assert.ok(image[0].includes(`style="width:${width}px;max-width:100%;height:auto"`));
    }
    for (const anchor of content.anchorIds) {
      assert.equal(chapterForAnchor(book, anchor), chapter);
      assert.deepEqual(curatedReading({ chapter, anchor }, book).anchor, anchor);
    }
  }
  assert.equal(chapterForAnchor(book, "__proto__"), null);
});

test("damaged saved positions are bounded and duplicate bookmarks collapse", () => {
  const state = curatedReading({ chapter: Infinity, anchor: "missing", fontSize: 100,
    theme: "invalid", bookmarks: [{ chapter: 0 }, { chapter: 0 }] }, book);
  assert.equal(state.chapter, 0);
  assert.equal(state.anchor, null);
  assert.equal(state.fontSize, 40);
  assert.equal(state.theme, "paper");
  assert.equal(state.bookmarks.length, 1);
  assert.deepEqual(searchCuratedBook(book, " "), []);
});
