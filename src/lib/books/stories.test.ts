import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { chapterForAnchor, curatedReading, searchCuratedBook, type CuratedBook } from "./curated.ts";
import { STORIES, STORY_LOADERS, storyBySlug } from "./stories.ts";

const load = (slug: string): CuratedBook =>
  JSON.parse(readFileSync(new URL(`./stories/${slug}.json`, import.meta.url), "utf8"));
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

test("قصص غموض: every story is signed «فريق الهجدة» and has a lazy loader", () => {
  assert.ok(STORIES.length >= 2);
  for (const story of STORIES) {
    assert.equal(story.author, "فريق الهجدة");
    assert.ok(STORY_LOADERS[story.slug], story.slug);
    assert.equal(storyBySlug(story.slug), story);
    assert.equal(load(story.slug).chapters.length, story.chapters);
  }
  assert.equal(storyBySlug("../secret"), undefined);
});

test("الدلّة الغائبة: 6 chapters, ~4,000-5,000 words, clues before the reveal", () => {
  const book = load("al-dalla");
  assert.equal(book.chapters.length, 6);
  const n = words(book.chapters.map((c) => c.plainText).join(" "));
  assert.ok(n >= 3900 && n <= 5200, String(n));
  const early = book.chapters.slice(0, 4).map((c) => c.plainText).join(" ");
  for (const clue of ["المفصّلة", "ليمون", "شبّاك القهوة", "الجصّة", "النحّاس", "11:05", "دبس"])
    assert.ok(early.includes(clue), clue);
  assert.ok(searchCuratedBook(book, "الجصّة").length > 0);
  assert.equal(curatedReading({ chapter: 99 }, book).chapter, 5);
});

test("flash stories: five chapters of 100-400 words", () => {
  const book = load("flash-1");
  assert.equal(book.chapters.length, 5);
  for (const c of book.chapters) {
    const n = words(c.plainText) - words(c.title);
    assert.ok(n >= 100 && n <= 400, `${c.title}: ${n}`);
  }
});

test("story HTML is inert, anchors unique and resolvable, Western digits only", () => {
  for (const story of STORIES) {
    const book = load(story.slug);
    const html = book.chapters.map((c) => c.html).join("\n");
    assert.doesNotMatch(html, /<(script|iframe|form|object|embed|img)\b|\bon\w+\s*=/i);
    assert.doesNotMatch(JSON.stringify(book), /إلياس|[٠-٩]/);
    const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (m) => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.notEqual(chapterForAnchor(book, id), null);
  }
});
