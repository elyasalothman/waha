import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchCuratedBook, curatedReading } from "./curated.ts";
const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const source = read("./alhajda/book.json");
const metadata = read("./alhajda/manifest.json");
const search = read("../../../public/books/alhajda/chapters/search.json");
test("split reader retains every chapter, anchor, search result and saved position", () => {
  assert.deepEqual(metadata.anchorToChapter, source.anchorToChapter);
  assert.equal(metadata.chapters.length, source.chapters.length);
  for (const [index, chapter] of source.chapters.entries()) {
    const asset = read(`../../../public/books/alhajda/chapters/${chapter.id}.json`);
    assert.equal(
      asset.html,
      chapter.html
        .replaceAll(
          "/books/alhajda/assets/front-earth.jpg",
          "/books/alhajda/assets/front-earth.webp",
        )
        .replace(
          'loading="lazy" decoding="async" data-asset-id="FRONT-EARTH"',
          'loading="eager" fetchpriority="high" decoding="async" data-asset-id="FRONT-EARTH"',
        ),
    );
    assert.deepEqual(metadata.chapters[index].anchorIds, chapter.anchorIds);
    const saved = { chapter: index, anchor: chapter.anchorIds[0], fontSize: 32, theme: "night" };
    assert.deepEqual(curatedReading(saved, metadata), curatedReading(saved, source));
  }
  const indexed = {
    ...metadata,
    chapters: metadata.chapters.map((c: object, i: number) => ({ ...c, ...search.chapters[i] })),
  };
  for (const query of ["العدالة", "ذاكرة", "الاختيار", "الطبيعة", "اليقين", "Apollo", "حجة"])
    assert.deepEqual(searchCuratedBook(indexed, query), searchCuratedBook(source, query));
  assert.ok(JSON.stringify(metadata).length < JSON.stringify(source).length / 5);
});
