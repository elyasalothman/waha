/**
 * Idempotent edition pass for كتاب الهجدة.
 * Keeps sourced claims, anchors and search blocks, and adds a reading guide per chapter.
 */
import { readFile, writeFile } from "node:fs/promises";

const bookPath = new URL("../src/lib/books/alhajda/book.json", import.meta.url);
const edition = JSON.parse(
  await readFile(new URL("../src/lib/books/alhajda/edition.json", import.meta.url), "utf8"),
);
const book = JSON.parse(await readFile(bookPath, "utf8"));

const replacements = [
  [
    "لا تتحول أي منهما إلى حقيقة علمية لمجرد مجاورتها رسمًا بيانيًا.",
    "لا يتحول أي منهما إلى حقيقة علمية لمجرد مجاورته رسمًا بيانيًا.",
  ],
  ["أبولو 8،1968", "أبولو 8، 1968"],
  ["2013 ،", "2013،"],
  [
    "إذا لم أختر نقطة البداية فهل أملك خط النهاية؟",
    "إذا لم أختر نقطة البداية، فهل أملك خط النهاية؟",
  ],
  [
    "متى يصبح التذكر ظلمًا ومتى يصبح النسيان خيانة للحقيقة؟",
    "متى يصبح التذكر ظلمًا، ومتى يصبح النسيان خيانة للحقيقة؟",
  ],
  [
    "هل نحمي الطبيعة بإبعاد الإنسان عنها أم بتغيير طريقة وجوده فيها؟",
    "هل نحمي الطبيعة بإبعاد الإنسان، أم بتغيير طريقة وجوده فيها؟",
  ],
  [
    "ماذا تعني المسؤولية إذا كان قرارنا نتاج أسباب لم نخترها؟",
    "ما معنى المسؤولية إذا نشأ قرارنا من أسباب لم نخترها؟",
  ],
  [
    "من صفحات المتن 228 صفحة:114 يغلب عليها بناء المعرفة و 114 يغلب عليها النقاش والحلول المقترحة.",
    "من صفحات المتن 228 صفحة: 114 يغلب عليها بناء المعرفة، و114 يغلب عليها النقاش والحلول المقترحة.",
  ],
  ["ما الذي يجعل القرار قرار صاحبه", "ما الذي يجعل القرار قرارَ صاحبه"],
  [">ستة أبواب<", ">فهرس الفصول<"],
  [
    "وفي الصفحات التالية ستجد ما قد يجعلنا نعدل ذلك الجواب، لا ما يؤيده وحده.",
    "وفي الصفحات التالية ستجد ما قد يجعلنا نعدل ذلك الجواب، لا ما يؤيده وحده. ويُفتح كل فصل بخلاصة وما يُستفاد، وكلاهما مصوغ من حجة الفصل لا من مصدر خارجها.",
  ],
  ["إنما قاعدة نستطيع استعمالها", "بل قاعدة نستطيع استعمالها"],
];

function replaceText(value) {
  let next = value;
  for (const [from, to] of replacements) next = next.replaceAll(from, to);
  return next;
}

function wordsOf(text) {
  return text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function guideHtml(chapter) {
  const id = `alhajda-${chapter.id}-guide`;
  const items = chapter.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return (
    `<aside class="chapter-guide" id="${id}" data-reader-anchor="true">` +
    `<p class="guide-kicker">دليل القراءة</p>` +
    `<h3>خلاصة الفصل</h3><p>${escapeHtml(chapter.summary)}</p>` +
    `<h3>ما يُستفاد</h3><ul>${items}</ul>` +
    `<p class="guide-note">${escapeHtml(edition.guideNote)}</p></aside>`
  );
}

function guidePlain(chapter) {
  return ["دليل القراءة", "خلاصة الفصل", chapter.summary, "ما يُستفاد", ...chapter.takeaways, edition.guideNote].join(
    "\n",
  );
}

for (const chapter of book.chapters) {
  chapter.html = replaceText(chapter.html);
  chapter.plainText = replaceText(chapter.plainText);
  if (Array.isArray(chapter.searchBlocks)) {
    for (const block of chapter.searchBlocks) block.text = replaceText(block.text);
  }
}

const tocNote =
  '<p class="guide-note" id="alhajda-toc-note">ستة فصول، ثم المراجع وحقوق الصور والفهارس. الخلاصة في صدر كل فصل معين قراءة، والمتن هو الحجة.</p>';
const front = book.chapters[0];
if (!front.html.includes("alhajda-toc-note")) {
  front.html = front.html.replace(
    '<h2 id="alhajda-p004-h2-01" data-reader-anchor="true">فهرس الفصول</h2>',
    `<h2 id="alhajda-p004-h2-01" data-reader-anchor="true">فهرس الفصول</h2>${tocNote}`,
  );
  front.anchorIds.push("alhajda-toc-note");
  book.anchorToChapter["alhajda-toc-note"] = 0;
  front.plainText += "\nفهرس الفصول\nستة فصول، ثم المراجع وحقوق الصور والفهارس. الخلاصة في صدر كل فصل معين قراءة، والمتن هو الحجة.";
  front.searchBlocks.push({
    id: "alhajda-toc-note",
    text: "فهرس الفصول. ستة فصول، ثم المراجع وحقوق الصور والفهارس.",
  });
}

for (const guide of edition.chapters) {
  const index = book.chapters.findIndex((chapter) => chapter.id === guide.id);
  const chapter = book.chapters[index];
  const id = `alhajda-${guide.id}-guide`;
  if (!chapter.html.includes(id)) {
    const html = guideHtml(guide);
    const opening = chapter.html.match(/<div class="opening-question">[\s\S]*?<\/div>/);
    if (!opening) throw new Error(`No opening question in ${guide.id}`);
    const at = opening.index + opening[0].length;
    chapter.html = chapter.html.slice(0, at) + html + chapter.html.slice(at);
    chapter.anchorIds.push(id);
    book.anchorToChapter[id] = index;
    const plain = guidePlain(guide);
    chapter.plainText += `\n${plain}`;
    chapter.searchBlocks.push({ id, text: plain });
    chapter.paragraphCount += 2;
  }
}

for (const chapter of book.chapters) chapter.words = wordsOf(chapter.plainText);
book.pdfUrl = edition.pdfUrl;

await writeFile(bookPath, JSON.stringify(book));
const total = book.chapters.reduce((sum, chapter) => sum + chapter.words, 0);
console.log(
  `polished ${book.chapters.length} chapters, ${total} words, pdf ${book.pdfUrl}`,
);
