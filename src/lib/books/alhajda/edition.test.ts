import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { curatedReading, type CuratedBook } from "../curated.ts";
import edition from "./edition.json" with { type: "json" };
import { pageForAnchor, readingMinutes, sectionIds } from "./reading.ts";

const book: CuratedBook = JSON.parse(
  readFileSync(new URL("./book.json", import.meta.url), "utf8"),
);

test("the preview develops the existing chapters and keeps their text", () => {
  assert.equal(book.pdfUrl, edition.pdfUrl);
  assert.equal(book.chapters[0].html.includes("فهرس الفصول"), true);
  assert.equal(book.chapters[0].html.includes("preview-direction"), true);
  const past = book.chapters.find((item) => item.id === "past");
  const present = book.chapters.find((item) => item.id === "present");
  const consent = book.chapters.find((item) => item.id === "C1");
  const desert = book.chapters.find((item) => item.id === "C5");
  assert.ok(past && present && consent && desert);
  assert.equal(past.html.includes(edition.chapters[0].summary), true);
  assert.equal(present.html.includes(edition.chapters[1].summary), true);
  assert.equal(past.html.includes("يحتاج مصدر"), true);
  assert.equal(present.html.includes("يحتاج مصدر"), true);
  assert.equal(past.html.includes("في مثال متخيّل"), true);
  assert.equal(desert.html.includes("في مثال متخيّل"), true);
  assert.equal(
    consent.html.includes("أما ما أُذن به فعلًا فلا نستطيع قراءته من النقرة وحدها"),
    true,
  );
  assert.equal(present.html.includes("أما ما أُذن به فعلًا فلا نستطيع قراءته من النقرة وحدها"), true);
  assert.equal(past.html.includes("فيكتور فرانكل"), false);
  assert.equal(book.chapters.filter((item) => item.id === "C1").length, 1);
  assert.equal(readingMinutes(180), 1);
  assert.equal(readingMinutes(270), 2);
  assert.equal(readingMinutes(0), null);
});

test("the future part gathers the six chapters without inventing numbers", () => {
  const ids = book.chapters.map((item) => item.id);
  assert.deepEqual(ids.slice(1, 4), ["past", "present", "future"]);
  const future = book.chapters.find((item) => item.id === "future");
  assert.ok(future);
  assert.equal(future.html.includes(edition.chapters[2].summary), true);
  assert.equal(future.html.includes("يحتاج مصدر"), true);
  for (const n of [1, 2, 3, 4, 5, 6]) assert.equal(future.html.includes(`id="future-h-${n}"`), true);
  assert.equal(/[0-9٠-٩]+\s*[٪%]/.test(future.plainText ?? ""), false);
  assert.equal(book.chapters[0].html.includes("بانتظار الاعتماد"), false);
  for (const [anchor, index] of Object.entries(book.anchorToChapter)) {
    assert.equal(book.chapters[index].anchorIds.includes(anchor), true, anchor);
  }
});

test("reading preferences survive a reload and stay inside bounds", () => {
  const saved = curatedReading(
    {
      chapter: book.chapters.findIndex((item) => item.id === "C1"),
      anchor: "alhajda-C1-guide",
      fontSize: 28,
      theme: "warm",
      lineHeight: "relaxed",
      flow: "page",
      focus: true,
    },
    book,
  );
  assert.equal(saved.anchor, "alhajda-C1-guide");
  assert.equal(saved.lineHeight, "relaxed");
  assert.equal(saved.flow, "page");
  assert.equal(saved.focus, true);
  assert.equal(saved.theme, "warm");
  assert.deepEqual(curatedReading(saved, book), saved);
  const broken = curatedReading({ lineHeight: "huge", flow: "columns", focus: "yes" }, book);
  assert.equal(broken.lineHeight, "comfortable");
  assert.equal(broken.flow, "scroll");
  assert.equal(broken.focus, false);
});

test("pagination follows the authored page that holds an anchor", () => {
  const chapter = book.chapters.find((item) => item.id === "C1");
  assert.ok(chapter);
  const pages = sectionIds(chapter.html);
  assert.equal(pages[0], "page-7");
  assert.equal(pageForAnchor(chapter.html, "page-7"), "page-7");
  assert.equal(pageForAnchor(chapter.html, "alhajda-C1-guide"), "page-7");
  assert.equal(pageForAnchor(chapter.html, null), "page-7");
});
