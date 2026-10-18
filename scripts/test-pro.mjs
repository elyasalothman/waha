// E2E for «بدائل مجانية لبرامج مدفوعة»: store hero/section and the four pro tools at 393x852.
// Usage: node scripts/test-pro.mjs [baseUrl] [outDir]   (STORE_ENGINE=chromium|webkit)
import { webkit, chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

const base = process.argv[2] || "http://127.0.0.1:8081";
const out = process.argv[3] || "/tmp/waha-pro-qa";
await mkdir(out, { recursive: true });
const engine = process.env.STORE_ENGINE || "webkit";
const proxy = new URL(process.env.HTTPS_PROXY || "http://localhost");
const browser = await (engine === "chromium" ? chromium : webkit).launch({
  headless: true,
  ...(process.env.HTTPS_PROXY
    ? { proxy: { server: proxy.origin, username: decodeURIComponent(proxy.username), password: decodeURIComponent(proxy.password), bypass: "localhost,127.0.0.1" } }
    : {}),
});

async function samplePdf(pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]).drawText(`Page ${i + 1}`, { x: 60, y: 760, size: 36, font });
  return Buffer.from(await doc.save());
}
const pageCount = async (path) => (await PDFDocument.load(await readFile(path))).getPageCount();
const overflow = async (page) => {
  const r = await page.evaluate(() => {
    if (document.documentElement.scrollWidth <= innerWidth + 1) return [];
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.width && (b.right > innerWidth + 1 || b.left < -1)) bad.push(`${el.tagName}.${String(el.className).slice(0, 50)} ${Math.round(b.left)}:${Math.round(b.right)}`);
    }
    return [document.documentElement.scrollWidth, ...bad.slice(0, 8)];
  });
  if (r.length) console.log("OVERFLOW", r);
  return !r.length;
};
async function download(page, click, name) {
  const [d] = await Promise.all([page.waitForEvent("download"), click()]);
  const path = `${out}/${engine}-${name}`;
  await d.saveAs(path);
  return path;
}

const results = [];
try {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: engine === "chromium", hasTouch: true, colorScheme: theme, acceptDownloads: true, ignoreHTTPSErrors: true });
    await context.addInitScript(({ theme }) => {
      if (!localStorage.getItem("waha:prefs"))
        localStorage.setItem("waha:prefs", JSON.stringify({ lang: "ar", audience: "personal", segment: "all", sliceChosen: true }));
      localStorage.setItem("waha:theme", theme);
    }, { theme });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const checks = [];

    // Store: hero + section
    await page.goto(`${base}/store`, { waitUntil: "networkidle" });
    const hero = page.locator('article[aria-label="المنتج المميز"]');
    await hero.getByRole("heading", { name: "منشئ السيرة الذاتية" }).waitFor();
    await hero.getByText("مجانًا لفترة الإطلاق", { exact: true }).waitFor();
    assert.match(await hero.innerText(), /ر\.س/);
    const section = page.locator('section[aria-label="بدائل مجانية لبرامج مدفوعة"]');
    assert.equal(await section.getByRole("button", { name: /^عرض / }).count(), 4);
    assert.ok(await overflow(page), "store overflow");
    await page.screenshot({ path: `${out}/${engine}-${theme}-store.png` });
    checks.push("store hero and pro section");

    // CV builder from hero
    await hero.getByRole("button", { name: "احصل عليه مجانًا" }).click();
    await page.waitForURL(/\/pro\/cv$/);
    await page.getByRole("heading", { name: "منشئ السيرة الذاتية", level: 1 }).waitFor();
    await page.getByRole("button", { name: /املأ بمثال توضيحي/ }).click();
    await page.getByLabel("الاسم الكامل").fill("ريم الاختبار");
    for (const t of ["كلاسيكي", "مختصر بصفحة واحدة", "حديث بعمود جانبي"]) await page.getByRole("button", { name: t }).click();
    await page.getByRole("tab", { name: /معاينة/ }).click();
    await page.locator('[aria-label="معاينة السيرة"]').getByText("ريم الاختبار").waitFor();
    assert.ok(await overflow(page), "cv overflow");
    const sheet = await page.locator('[aria-label="معاينة السيرة"] .cv-sheet').boundingBox();
    assert.ok(sheet.x >= 0 && sheet.x + sheet.width <= 394 && sheet.width > 250, `cv sheet visible ${JSON.stringify(sheet)}`);
    await page.screenshot({ path: `${out}/${engine}-${theme}-cv.png`, fullPage: false });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /معاينة/ }).click();
    await page.locator('[aria-label="معاينة السيرة"]').getByText("ريم الاختبار").waitFor();
    assert.equal(await page.locator("#waha-cv-print .cv-sheet").count(), 1);
    if (engine === "chromium") {
      const cvPdf = `${out}/${engine}-${theme}-cv-print.pdf`;
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: cvPdf, format: "A4", printBackground: true, preferCSSPageSize: true });
      await page.emulateMedia({ media: "screen" });
      const n = await pageCount(cvPdf);
      assert.ok(n >= 1 && n <= 2, `cv print pages ${n}`);
    }
    checks.push("cv sample, templates, preview, autosave after reload, print sheet");

    // PDF studio: 2-page PDF + PNG, rotate, reorder, signature, export, extract
    await page.goto(`${base}/pro/pdf`, { waitUntil: "networkidle" });
    const png = await page.screenshot();
    await page.locator("#pdf-input").setInputFiles([
      { name: "doc.pdf", mimeType: "application/pdf", buffer: await samplePdf(2) },
      { name: "shot.png", mimeType: "image/png", buffer: png },
    ]);
    await page.getByText("3 صفحة من 2 ملف").waitFor();
    await page.getByRole("button", { name: "تدوير" }).first().click();
    await page.getByRole("button", { name: "تحريك للخلف" }).first().click();
    await page.getByRole("button", { name: "صفحة 1", exact: true }).click();
    const pad = page.getByLabel("لوحة التوقيع");
    await pad.scrollIntoViewIfNeeded();
    const b = await pad.boundingBox();
    await page.mouse.move(b.x + 30, b.y + 100);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(b.x + 30 + i * 20, b.y + 100 - (i % 2) * 40);
    await page.mouse.up();
    await page.getByRole("button", { name: "ضع التوقيع" }).click();
    await page.getByLabel(/ختم نصي/).fill("مُعتمد");
    await page.getByRole("button", { name: "ضع الختم" }).click();
    await page.getByText("1 · 2 إضافة").waitFor();
    await page.getByText("أضف أرقام الصفحات").click();
    const merged = await download(page, () => page.getByRole("button", { name: /نزّل الملف المدموج/ }).click(), `${theme}-merged.pdf`);
    assert.equal(await pageCount(merged), 3);
    const extracted = await download(page, () => page.getByRole("button", { name: /استخرج الصفحات المحددة/ }).click(), `${theme}-extract.pdf`);
    assert.equal(await pageCount(extracted), 1);
    assert.ok(await overflow(page), "pdf overflow");
    await page.screenshot({ path: `${out}/${engine}-${theme}-pdf.png` });
    checks.push("pdf merge 3 pages, rotate, reorder, signature, stamp, numbers, extract 1 page");

    // Scanner
    await page.goto(`${base}/pro/scan`, { waitUntil: "networkidle" });
    await page.locator("#scan-gallery").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: png }, { name: "b.png", mimeType: "image/png", buffer: png }]);
    await page.getByRole("tab", { name: "صفحة 2" }).waitFor();
    await page.getByRole("button", { name: "أبيض وأسود" }).click();
    await page.getByAltText(/معاينة الصفحة/).waitFor();
    const scan = await download(page, () => page.getByRole("button", { name: /احفظ PDF/ }).click(), `${theme}-scan.pdf`);
    assert.equal(await pageCount(scan), 2);
    assert.ok(await overflow(page), "scan overflow");
    await page.screenshot({ path: `${out}/${engine}-${theme}-scan.png` });
    checks.push("scanner 2 pages, black-white, PDF");

    // Image studio
    await page.goto(`${base}/pro/image`, { waitUntil: "networkidle" });
    await page.locator("#img-input").setInputFiles([{ name: "p.png", mimeType: "image/png", buffer: png }]);
    await page.getByAltText("معاينة الصورة بعد التعديل").waitFor();
    await page.getByRole("button", { name: "حيوي" }).click();
    await page.getByLabel("نص العلامة المائية").fill("© واحة");
    const img = await download(page, () => page.getByRole("button", { name: /احفظ الصورة/ }).click(), `${theme}-image.jpg`);
    const head = (await readFile(img)).subarray(0, 3);
    assert.deepEqual([...head], [0xff, 0xd8, 0xff]);
    assert.ok(await overflow(page), "image overflow");
    await page.screenshot({ path: `${out}/${engine}-${theme}-image.png` });
    checks.push("image filters, watermark, JPG export");

    // Child mode keeps the pro section
    await page.evaluate(() => localStorage.setItem("waha:prefs", JSON.stringify({ lang: "ar", audience: "personal", segment: "child", sliceChosen: true })));
    await page.goto(`${base}/store`, { waitUntil: "networkidle" });
    await page.locator('section[aria-label="بدائل مجانية لبرامج مدفوعة"]').waitFor();
    checks.push("child mode shows pro tools");

    assert.deepEqual(errors, []);
    results.push({ engine, theme, viewport: "393x852", pass: true, checks });
    await context.close();
  }
  await writeFile(`${out}/${engine}-results.json`, JSON.stringify({ base, results }, null, 2));
  console.log(JSON.stringify({ base, results }, null, 2));
} finally {
  await browser.close();
}
