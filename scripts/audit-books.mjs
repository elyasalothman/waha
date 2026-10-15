import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
const base = process.argv[2] || "http://localhost:8080";
const output = process.argv[3] || "/tmp/waha-books-audit";
await mkdir(output, { recursive: true });
function archive(entries) {
  const local = [],
    central = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const n = Buffer.from(name),
      data = Buffer.from(content),
      compressed = deflateRawSync(data);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50);
    l.writeUInt16LE(20, 4);
    l.writeUInt16LE(8, 8);
    l.writeUInt32LE(compressed.length, 18);
    l.writeUInt32LE(data.length, 22);
    l.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50);
    c.writeUInt16LE(8, 10);
    c.writeUInt32LE(compressed.length, 20);
    c.writeUInt32LE(data.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    local.push(l, n, compressed);
    central.push(c, n);
    offset += l.length + n.length + compressed.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  ...(proxy
    ? {
        proxy: {
          server: proxy.origin,
          username: decodeURIComponent(proxy.username),
          password: decodeURIComponent(proxy.password),
          bypass: "localhost,127.0.0.1",
        },
      }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
});
const page = await context.newPage();
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = (name, details = {}) => {
  checks.push({ name, ...details });
  console.log(name);
};
async function width(name) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.equal(w, 390, `${name}: overflow ${w}`);
  check(name, { width: w });
}
async function studio(title) {
  assert.equal((await page.goto(`${base}/studio`)).status(), 200);
  await page.getByLabel("عنوان الكتاب", { exact: true }).fill(title);
  await page.getByLabel("المؤلف", { exact: true }).fill("مالك الكتاب التجريبي");
}
async function preview() {
  await page.getByRole("button", { name: "حفظ مسودة ومعاينة" }).click();
  await page.getByRole("link", { name: "معاينة المسودة", exact: true }).click();
  await page.locator("[data-platform-reader]").waitFor();
  await width("draft-reader");
}
try {
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/books")),
    page.goto(`${base}/books`),
  ]);
  await page.locator("[data-platform-book]").first().waitFor();
  assert.equal(await page.locator('[data-platform-book^="midad-"]').count(), 12);
  await width("shelf");
  await page.getByRole("combobox", { name: /^العمر/ }).selectOption("أطفال");
  await page.waitForFunction(
    () => document.querySelectorAll('[data-platform-book^="midad-"]').length === 3,
  );
  assert.equal(await page.locator('[data-platform-book^="midad-"]').count(), 3);
  await page.getByRole("combobox", { name: /^العمر/ }).selectOption("الكل");
  await page
    .locator('[data-platform-book^="midad-"]')
    .first()
    .getByRole("button", { name: "أضف إلى رفّي" })
    .click();
  await page.getByRole("button", { name: "رفّي", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll("[data-platform-book]").length === 1);
  assert.equal(await page.locator("[data-platform-book]").count(), 1);
  check("midad-import-age-filter-and-shelf");
  await studio("كتاب تجريبي أصلي للجوال");
  const text =
    "# الفصل الأول\n" +
    Array.from({ length: 20 }, (_, i) =>
      `فقرة ${i}: نص عربي أصلي لاختبار القراءة وحفظ الموضع على الجوال. `.repeat(5),
    ).join("\n\n") +
    "\n# الفصل الثاني\nنهاية الكتاب التجريبي.";
  await page.getByLabel("أو الصق النص").fill(text);
  await width("studio");
  await preview();
  const draftUrl = page.url();
  await page.getByRole("button", { name: "تكبير الخط" }).click();
  await page.getByRole("button", { name: "الوضع الليلي" }).click();
  await page.locator('[data-paragraph="10"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("waha:reading:draft-"));
    return JSON.parse(localStorage.getItem(key));
  });
  assert.ok(before.paragraph > 0);
  await page.reload();
  await page.locator("[data-platform-reader]").waitFor();
  await page.waitForTimeout(500);
  assert.equal(
    await page.getByRole("button", { name: "الوضع الليلي" }).getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.getByLabel("حجم الخط").textContent(), "24");
  assert.ok(await page.evaluate(() => window.scrollY > 200));
  await page.getByRole("combobox", { name: /^الفهرس/ }).selectOption("1");
  await page.getByRole("heading", { name: "الفصل الثاني", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "الفصل الثاني", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/reader-night.png`, fullPage: true });
  check("paste-draft-font-night-chapter-and-position-restoration", { draftUrl, before });
  await page.goto(`${base}/books`);
  await page.getByRole("heading", { name: "كتاب تجريبي أصلي للجوال", exact: true }).waitFor();
  check("draft-appears-on-shelf");
  const documents = [
    {
      name: "اختبار.txt",
      buffer: Buffer.from("# عنوان TXT\nنص عربي من ملف تجريبي."),
      mimeType: "text/plain",
    },
    {
      name: "اختبار.docx",
      buffer: archive([
        [
          "word/document.xml",
          '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>عنوان DOCX</w:t></w:r></w:p><w:p><w:r><w:t>نص عربي من ملف تجريبي.</w:t></w:r></w:p></w:body></w:document>',
        ],
      ]),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    {
      name: "اختبار.epub",
      buffer: archive([
        [
          "META-INF/container.xml",
          '<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
        ],
        [
          "OPS/book.opf",
          '<package><manifest><item id="two" href="two.xhtml"/><item id="one" href="one.xhtml"/></manifest><spine><itemref idref="one"/><itemref idref="two"/></spine></package>',
        ],
        [
          "OPS/one.xhtml",
          "<html><body><h1>عنوان EPUB الأول</h1><p>نص عربي من ملف تجريبي.</p><script>window.BAD_IMPORT=true</script></body></html>",
        ],
        ["OPS/two.xhtml", "<html><body><h1>عنوان EPUB الثاني</h1><p>النهاية.</p></body></html>"],
      ]),
      mimeType: "application/epub+zip",
    },
  ];
  // Minimal valid text PDF, generated here; no third-party book content.
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const stream = "BT /F1 14 Tf 20 260 Td (Original mobile reading test.) Tj ET";
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  documents.push({ name: "original.pdf", buffer: Buffer.from(pdf), mimeType: "application/pdf" });
  for (const file of documents) {
    await studio(`تجربة ${file.name}`);
    await page.getByLabel("ملف الكتاب (حتى 20MB)", { exact: true }).setInputFiles(file);
    await page
      .getByRole("status")
      .filter({ hasText: "اكتمل التحويل" })
      .waitFor({ timeout: 120000 });
    await preview();
    if (file.name.endsWith("epub")) {
      assert.equal(await page.locator("article h2").textContent(), "عنوان EPUB الأول");
      assert.equal(await page.evaluate(() => window.BAD_IMPORT), undefined);
    }
    assert.ok((await page.locator("article p").allTextContents()).join("").length > 10);
    check(`import-${file.name}`);
  }
  await studio("اختبار رفض النشر");
  await page.getByLabel("أو الصق النص").fill("نص تجريبي أصلي.");
  await page.getByRole("checkbox").check();
  const publishResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/books") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "نشر للعامة", exact: true }).click();
  const rejected = await publishResponse;
  assert.ok([401, 403, 503].includes(rejected.status()));
  check("anonymous-publication-rejected", { status: rejected.status() });
  await page.goto(`${base}/books/library/midad-elevator-key`);
  await page.locator("[data-platform-reader]").waitFor();
  await width("midad-reader");
  await page.screenshot({ path: `${output}/midad-reader.png`, fullPage: true });
  await page.goto(`${base}/books/alhajda`);
  assert.equal((await page.locator("h1").count()) > 0, true);
  await width("existing-alhajda-reader");
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        base,
        viewport: "390x844",
        checks,
        errors,
        publicPublishEndToEnd:
          "Blocked: production database/auth/admin configuration is absent; only rejection was tested.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, output }));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  await writeFile(`${output}/failure.html`, await page.content());
  console.log({ errors, url: page.url() });
  throw error;
} finally {
  await browser.close();
}
