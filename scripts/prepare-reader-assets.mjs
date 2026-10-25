/** Split the reviewed source without changing text, anchors or search semantics. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
const source = JSON.parse(
  await readFile(new URL("../src/lib/books/alhajda/book.json", import.meta.url), "utf8"),
);
const dir = new URL("../public/books/alhajda/chapters/", import.meta.url);
await mkdir(dir, { recursive: true });
const chapters = source.chapters.map((chapter, index) => {
  const html = chapter.html
    .replaceAll("/books/alhajda/assets/front-earth.jpg", "/books/alhajda/assets/front-earth.webp")
    .replace(
      'loading="lazy" decoding="async" data-asset-id="FRONT-EARTH"',
      'loading="eager" fetchpriority="high" decoding="async" data-asset-id="FRONT-EARTH"',
    );
  return { ...chapter, html, index };
});
for (const chapter of chapters)
  await writeFile(
    new URL(chapter.id + ".json", dir),
    JSON.stringify({ id: chapter.id, html: chapter.html }),
  );
const metadata = {
  ...source,
  coverUrl: "/books/alhajda/assets/front-earth.webp",
  chapters: chapters.map((c, i) => ({
    ...c,
    html: i === 0 ? c.html : "",
    plainText: "",
    searchBlocks: [],
  })),
};
await writeFile(
  new URL("../src/lib/books/alhajda/manifest.json", import.meta.url),
  JSON.stringify(metadata),
);
await writeFile(
  new URL("search.json", dir),
  JSON.stringify({
    chapters: chapters.map((c) => ({ plainText: c.plainText, searchBlocks: c.searchBlocks })),
  }),
);
