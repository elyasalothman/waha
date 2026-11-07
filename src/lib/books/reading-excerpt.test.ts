import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { readingExcerpt } from "./reading-excerpt.ts";

test("today's reading skips a placeholder lead and keeps the author's next paragraph", () => {
  const book = JSON.parse(
    readFileSync(new URL("../../../public/books/midad/midad-robot-does-not-know-heat.json", import.meta.url), "utf8"),
  ) as { chapters: { paragraphs: string[] }[] };
  const paragraphs = book.chapters[0]?.paragraphs ?? [];
  assert.match(paragraphs[0] ?? "", /\(مثال\)/);
  const chosen = readingExcerpt(paragraphs);
  assert.equal(chosen?.paragraph, 1);
  assert.match(chosen?.text ?? "", /لا تملك جلداً/);
  assert.equal(chosen?.text.includes("مثال"), false);
  assert.equal(chosen?.text, paragraphs[1]);
});

test("a book whose every paragraph is marked as an example is not quoted", () => {
  assert.equal(readingExcerpt(["رقم (مثال) قصير.", "جملة أطول وفيها (مثال) حتى لا تُعرض كحقيقة."]), null);
});
