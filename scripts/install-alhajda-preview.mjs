/** Insert the history/present preview without deleting the existing book. */
import { readFile, writeFile } from "node:fs/promises";
import { directionHtml, futureHtml, pastHtml, presentHtml } from "./alhajda-preview-content.mjs";

const bookPath = new URL("../src/lib/books/alhajda/book.json", import.meta.url);
const book = JSON.parse(await readFile(bookPath, "utf8"));

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function blocks(html) {
  const out = [];
  for (const match of html.matchAll(/<(p|h2|h3|li|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const id = match[2].match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    const text = match[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) out.push({ id, text });
  }
  return out;
}

function pack(id, title, html) {
  const plainText = textOf(html);
  return {
    id,
    title,
    type: "chapter",
    sourcePageRange: [0, 0],
    html,
    plainText,
    anchorIds: [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
    searchBlocks: blocks(html),
    paragraphCount: (html.match(/<p\b/g) || []).length,
    words: plainText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0,
  };
}

function rebind(chapter) {
  const index = book.chapters.findIndex((item) => item.id === chapter.id);
  for (const key of Object.keys(book.anchorToChapter)) {
    if (book.anchorToChapter[key] === index && !chapter.anchorIds.includes(key)) {
      delete book.anchorToChapter[key];
    }
  }
  for (const id of chapter.anchorIds) book.anchorToChapter[id] = index;
}

if (!book.chapters.some((chapter) => chapter.id === "past")) {
  for (const key of Object.keys(book.anchorToChapter)) {
    if (book.anchorToChapter[key] >= 1) book.anchorToChapter[key] += 2;
  }
  book.chapters.splice(1, 0, pack("past", "", ""), pack("present", "", ""));
}

book.chapters[book.chapters.findIndex((chapter) => chapter.id === "past")] = pack(
  "past",
  "الماضي · كيف تُورَّث البداية",
  pastHtml,
);
book.chapters[book.chapters.findIndex((chapter) => chapter.id === "present")] = pack(
  "present",
  "الحاضر · مع الأهل ومع المال",
  presentHtml,
);
if (!book.chapters.some((chapter) => chapter.id === "future")) {
  const at = book.chapters.findIndex((chapter) => chapter.id === "present") + 1;
  for (const key of Object.keys(book.anchorToChapter)) {
    if (book.anchorToChapter[key] >= at) book.anchorToChapter[key] += 1;
  }
  book.chapters.splice(at, 0, pack("future", "", ""));
}
book.chapters[book.chapters.findIndex((chapter) => chapter.id === "future")] = pack(
  "future",
  "المستقبل · مسارات الإصلاح",
  futureHtml,
);
rebind(book.chapters.find((chapter) => chapter.id === "future"));
rebind(book.chapters.find((chapter) => chapter.id === "past"));
rebind(book.chapters.find((chapter) => chapter.id === "present"));

const front = book.chapters[0];
if (front.html.includes('id="preview-direction"')) {
  const oldDirection = front.html.match(/<section id="preview-direction"[\s\S]*?<\/section>/)[0];
  front.plainText = front.plainText.replace(textOf(oldDirection), textOf(directionHtml));
  front.html = front.html.replace(oldDirection, directionHtml);
  const directionIds = new Set([...directionHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  front.searchBlocks = front.searchBlocks.filter((block) => !block.id.startsWith("preview-"));
  front.searchBlocks.push(...blocks(directionHtml));
  for (const id of directionIds) {
    if (!front.anchorIds.includes(id)) front.anchorIds.push(id);
    book.anchorToChapter[id] = 0;
  }
} else {
  front.html = front.html.replace(
    '<div class="alhajda-book" lang="ar" dir="rtl">',
    `<div class="alhajda-book" lang="ar" dir="rtl">${directionHtml}`,
  );
  for (const id of [...directionHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])) {
    if (!front.anchorIds.includes(id)) front.anchorIds.push(id);
    book.anchorToChapter[id] = 0;
  }
  front.searchBlocks.push(...blocks(directionHtml));
  front.plainText += `\n${textOf(directionHtml)}`;
  front.words = front.plainText.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

book.pdfUrl = "/books/alhajda/alhajda.pdf";
await writeFile(bookPath, JSON.stringify(book));
console.log(
  book.chapters.map((chapter) => `${chapter.id}:${chapter.words ?? "?"}`).join(" "),
);
