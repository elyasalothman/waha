/**
 * Build a static Arabic PDF of كتاب الهجدة with Chrome's text shaper.
 * The file is committed so iPhone Safari and the app WebView download it
 * without generating type on the device.
 */
import { readFile, writeFile, mkdir, stat, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const book = JSON.parse(await readFile(resolve(root, "src/lib/books/alhajda/book.json"), "utf8"));
const css = await readFile(resolve(root, "public/books/alhajda/alhajda-mobile.css"), "utf8");
const fontDir = resolve(root, "public/books/alhajda/assets/fonts");
const assetRoot = resolve(root, "public");

function fileUrl(path) {
  return `file://${path}`;
}

const previewIds = ["front", "past", "present"];
const body = book.chapters
  .filter((chapter) => previewIds.includes(chapter.id))
  .map((chapter) => chapter.html)
  .join("\n")
  .replaceAll("/books/alhajda/assets/front-earth.jpg", "/books/alhajda/assets/front-earth.webp")
  .replaceAll('src="/books/alhajda/', `src="${fileUrl(resolve(assetRoot, "books/alhajda"))}/`);

const printCss = `
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
${css.replaceAll("url('/books/alhajda/", `url('${fileUrl(resolve(assetRoot, "books/alhajda"))}/`).replaceAll('url("/books/alhajda/', `url("${fileUrl(resolve(assetRoot, "books/alhajda"))}/`)}
@font-face {
  font-family: "Noto Naskh Arabic";
  src: url("${fileUrl(resolve(fontDir, "NotoNaskhArabic-Regular.ttf"))}") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Noto Naskh Arabic";
  src: url("${fileUrl(resolve(fontDir, "NotoNaskhArabic-Bold.ttf"))}") format("truetype");
  font-weight: 700;
}
@page {
  size: A4;
  margin: 16mm 14mm 18mm;
  @bottom-center {
    content: counter(page);
    font-family: "Noto Naskh Arabic", AlhajdaNaskh, serif;
    font-size: 11pt;
    color: #3b2f1e;
  }
}
html, body { margin: 0; background: #fffef9; color: #242b28; }
body { font-family: "Noto Naskh Arabic", AlhajdaNaskh, serif; }
.alhajda-book { font-family: "Noto Naskh Arabic", AlhajdaNaskh, serif; line-height: 1.9; }
.alhajda-book h1, .alhajda-book h2, .alhajda-book h3, .alhajda-book h4,
.alhajda-book .chapter-label, .alhajda-book .opening-question, .alhajda-book .eyebrow {
  font-family: "Noto Naskh Arabic", AlhajdaKufi, serif;
}
section.page { break-after: page; page-break-after: always; break-inside: auto; }
section.page.cover { break-before: page; page-break-before: always; }
section.edition-direction { background: #fffef9; }
section.page:last-child { break-after: auto; }
img { max-width: 100% !important; height: auto !important; }
.cover { min-height: 250mm; }
.chapter-guide, .notebar, .content-box { break-inside: avoid; }
a { color: inherit; text-decoration: none; }
`;

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>الهجدة</title>
  <style>${printCss}</style>
</head>
<body>
  ${body}
</body>
</html>`;

const tmp = "/tmp/alhajda-print.html";
const out = resolve(root, "public/books/alhajda/alhajda.pdf");
await mkdir(dirname(out), { recursive: true });
await rm(out, { force: true });
await writeFile(tmp, html);
await new Promise((resolvePromise, reject) => {
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--user-data-dir=/tmp/chrome-alhajda-pdf",
      "--no-pdf-header-footer",
      "--hide-scrollbars",
      `--print-to-pdf=${out}`,
      `file://${tmp}`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  let settled = false;
  let lastSize = 0;
  let stable = 0;
  const finish = (error) => {
    if (settled) return;
    settled = true;
    clearInterval(watch);
    chrome.kill("SIGKILL");
    if (error) reject(error);
    else resolvePromise();
  };
  const watch = setInterval(async () => {
    try {
      const info = await stat(out);
      if (info.size > 20000 && info.size === lastSize) stable += 1;
      else stable = 0;
      lastSize = info.size;
      if (stable >= 2) {
        const bytes = await readFile(out);
        if (bytes.includes(Buffer.from("%%EOF"))) finish();
      }
    } catch {
      /* file not written yet */
    }
  }, 1000);
  setTimeout(() => finish(new Error(`chrome timed out\n${log.slice(-1500)}`)), 90000);
  chrome.stdout.on("data", (chunk) => {
    log += chunk;
  });
  chrome.stderr.on("data", (chunk) => {
    log += chunk;
  });
  chrome.on("error", (error) => finish(error));
  chrome.on("close", (code) => {
    if (code === 0) finish();
  });
});
const bytes = (await readFile(out)).length;
console.log(`wrote ${out} (${bytes} bytes)`);
