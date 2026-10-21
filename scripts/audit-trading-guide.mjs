import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, "");
const output = process.argv[3] || "/tmp/waha-trading-guide-audit";
const book = JSON.parse(
  await readFile(new URL("../src/lib/books/trading-guide/book.json", import.meta.url), "utf8"),
);
const key = "waha:curated:trading-guide:20261007";
const originalKey = "waha:curated:alhajda:edition1";
const originalProgress = JSON.stringify({
  version: 1,
  chapter: 0,
  anchor: null,
  fontSize: 30,
  theme: "warm",
  bookmarks: [],
});
const checks = [];
const errors = [];
await mkdir(output, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
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
function check(name, details = {}) {
  checks.push({ name, ...details });
  console.log(`PASS ${name}`);
}
async function state(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
}
async function ready(page) {
  await page.locator(".trading-guide-content").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.keyboard.press("Escape");
}
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert.ok(
    sizes.page <= sizes.viewport + 1,
    `${label}: horizontal page overflow ${JSON.stringify(sizes)}`,
  );
  check(label, sizes);
}
async function chapter(page, index) {
  const nav = page.getByRole("navigation", { name: "فهرس الكتاب", exact: true });
  if (!(await nav.isVisible()))
    await page.getByRole("button", { name: "فهرس الكتاب", exact: true }).click();
  assert.equal(await nav.getByRole("button").count(), 23);
  await nav.getByRole("button").nth(index).click();
  await page.waitForFunction(
    ({ k, index }) => JSON.parse(localStorage.getItem(k) || "null")?.chapter === index,
    { k: key, index },
  );
  assert.equal(await nav.count(), 0);
  await ready(page);
}
async function screenshot(page, label) {
  await page.screenshot({ path: `${output}/${label}.png`, fullPage: false });
}

try {
  for (const [width, height] of [
    [320, 740],
    [360, 800],
    [390, 844],
    [768, 1024],
    [844, 390],
  ]) {
    const label = `${width}x${height}`;
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push({ label, message: error.message }));
    assert.equal((await page.goto(`${base}/books`)).status(), 200);
    await page.locator('[data-curated-book-card="trading-guide"]').waitFor();
    await page.evaluate(
      ({ originalKey, originalProgress }) => localStorage.setItem(originalKey, originalProgress),
      { originalKey, originalProgress },
    );
    await noOverflow(page, `${label} shelf`);
    await page
      .locator('[data-curated-book-card="trading-guide"]')
      .getByRole("link", { name: "اقرأ الدليل" })
      .click();
    await ready(page);
    assert.ok(page.url().endsWith("/books/trading-guide"));
    const typography = await page.locator(".trading-guide-content").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        family: style.fontFamily,
        size: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
        direction: style.direction,
        fontLoaded: document.fonts.check("24px AlhajdaNaskh"),
        viewport: document.querySelector('meta[name="viewport"]')?.content,
      };
    });
    assert.equal(typography.size, 24);
    assert.match(typography.family, /AlhajdaNaskh/);
    assert.equal(typography.direction, "rtl");
    assert.ok(typography.lineHeight >= 46);
    assert.ok(typography.fontLoaded);
    assert.doesNotMatch(typography.viewport || "", /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
    check(`${label} Arabic font and unrestricted viewport`, typography);
    await noOverflow(page, `${label} cover`);
    await screenshot(page, `${label}-cover`);
    await chapter(page, 3);
    await noOverflow(page, `${label} chapter and tables`);
    const table = page.locator(".trading-table-scroll").first();
    assert.ok(await table.isVisible());
    const dimensions = await table.evaluate((element) => ({
      scroll: element.scrollWidth,
      visible: element.clientWidth,
    }));
    if (width < 768) assert.ok(dimensions.scroll > dimensions.visible);
    await table.scrollIntoViewIfNeeded();
    await screenshot(page, `${label}-table`);
    check(`${label} contained keyboard-focusable table`, {
      ...dimensions,
      tabindex: await table.getAttribute("tabindex"),
    });
    assert.equal(await table.getAttribute("tabindex"), "0");
    await page.getByRole("button", { name: "تكبير الخط", exact: true }).click();
    await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k))?.fontSize === 26, key);
    await noOverflow(page, `${label} enlarged text`);
    if (width === 390) {
      const larger = page.getByRole("button", { name: "تكبير الخط", exact: true });
      const smaller = page.getByRole("button", { name: "تصغير الخط", exact: true });
      while (await larger.isEnabled()) await larger.click();
      assert.equal(
        await page
          .locator(".trading-guide-content")
          .evaluate((element) => getComputedStyle(element).fontSize),
        "40px",
      );
      await noOverflow(page, "maximum font size");
      while (await smaller.isEnabled()) await smaller.click();
      assert.equal(
        await page
          .locator(".trading-guide-content")
          .evaluate((element) => getComputedStyle(element).fontSize),
        "18px",
      );
      for (let step = 0; step < 4; step++) await larger.click();
      check("font size bounds 18–40 px");
    }
    await page.getByRole("combobox", { name: "خلفية القراءة", exact: true }).selectOption("night");
    await page.waitForFunction(
      () => document.querySelector('[data-reader-theme="night"]') !== null,
    );
    await page.locator(".trading-guide-content p").nth(10).scrollIntoViewIfNeeded();
    await page.waitForFunction((k) => Boolean(JSON.parse(localStorage.getItem(k))?.anchor), key);
    await page.getByRole("button", { name: "حفظ موضع", exact: true }).click();
    await page.waitForFunction(
      (k) => JSON.parse(localStorage.getItem(k))?.bookmarks?.length === 1,
      key,
    );
    const beforeReload = await state(page);
    await page.reload();
    await ready(page);
    await page.waitForFunction(
      ({ k, anchor }) => JSON.parse(localStorage.getItem(k))?.anchor === anchor,
      { k: key, anchor: beforeReload.anchor },
    );
    const restored = await state(page);
    assert.equal(restored.chapter, beforeReload.chapter);
    assert.equal(restored.fontSize, 26);
    assert.equal(restored.theme, "night");
    assert.deepEqual(restored.bookmarks, beforeReload.bookmarks);
    const anchorBox = await page.locator(`[id="${beforeReload.anchor}"]`).boundingBox();
    assert.ok(
      anchorBox && anchorBox.y >= 0 && anchorBox.y < height,
      `restored anchor outside screen: ${JSON.stringify(anchorBox)}`,
    );
    check(`${label} progress, theme, size and bookmark restored`, {
      anchor: restored.anchor,
      anchorY: anchorBox.y,
    });
    await screenshot(page, `${label}-night-restored`);
    await page.getByRole("combobox", { name: "خلفية القراءة", exact: true }).selectOption("warm");
    await page.getByLabel("بحث في الكتاب", { exact: true }).fill("إدارة المخاطر");
    const results = page.locator('[aria-label="نتائج البحث"]');
    assert.ok((await results.getByRole("button").count()) > 0);
    await results.getByRole("button").first().click();
    assert.equal(await page.getByLabel("بحث في الكتاب", { exact: true }).inputValue(), "");
    assert.equal(await results.count(), 0);
    await noOverflow(page, `${label} search jump`);
    check(`${label} search jumps to source anchor`);
    await page.getByLabel("بحث في الكتاب", { exact: true }).fill("zzzznotpresent");
    assert.equal(await page.locator('[aria-label="نتائج البحث"]').getByRole("button").count(), 0);
    await page.getByLabel("بحث في الكتاب", { exact: true }).fill("");
    await chapter(page, 3);
    await page.locator('.trading-guide-content a[href^="#"]').first().click();
    await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k))?.chapter !== 3, key);
    check(`${label} cross-chapter source link`);
    await chapter(page, 3);
    await page.getByRole("button", { name: "القسم التالي", exact: true }).click();
    await page.getByRole("button", { name: "القسم التالي", exact: true }).click();
    await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k))?.chapter === 5, key);
    await page.getByRole("button", { name: "القسم السابق", exact: true }).click();
    await page.getByRole("button", { name: "القسم السابق", exact: true }).click();
    await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k))?.chapter === 3, key);
    check(`${label} repeated next and previous controls`);
    // This is an explicit 200% text-size stress test, not a claim of physical pinch testing.
    await page.locator(".trading-guide-content").evaluate((element) => {
      element.style.fontSize = "48px";
    });
    await noOverflow(page, `${label} 200 percent text reflow`);
    await page.locator(".trading-guide-content p").nth(2).scrollIntoViewIfNeeded();
    await screenshot(page, `${label}-200-percent-text`);
    await page.locator(".trading-guide-content").evaluate((element) => {
      element.style.removeProperty("font-size");
    });
    await page.reload();
    await ready(page);
    assert.equal(
      await page.evaluate((k) => localStorage.getItem(k), originalKey),
      originalProgress,
    );
    check(`${label} Alhajda saved progress untouched`);
    if (book.pdfUrl) {
      const download = page.getByRole("link", { name: "تنزيل PDF", exact: true });
      assert.equal(await download.getAttribute("href"), book.pdfUrl);
      if (width === 390) {
        const response = await context.request.get(new URL(book.pdfUrl, base).href);
        assert.equal(response.status(), 200);
        assert.match(response.headers()["content-type"], /application\/pdf/);
        const bytes = await response.body();
        assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
        check("public PDF status, content type and bytes", { bytes: bytes.length });
      }
    }
    await page.getByRole("link", { name: "العودة إلى المكتبة", exact: true }).click();
    await page.locator('[data-curated-book-card="alhajda"]').waitFor();
    await page.goBack();
    await ready(page);
    assert.equal((await state(page)).chapter, 3);
    await page.goForward();
    await page.locator('[data-curated-book-card="trading-guide"]').waitFor();
    check(`${label} library return and browser back/forward`);
    await context.close();
  }
  const broken = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
  });
  await broken.addInitScript((key) => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (name) {
      if (name === key) return "{broken-json";
      return get.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Storage unavailable", "QuotaExceededError");
      return set.call(this, name, value);
    };
  }, key);
  const page = await broken.newPage();
  await page.goto(`${base}/books/trading-guide`);
  await ready(page);
  await page.getByRole("alert").filter({ hasText: "تعذّر حفظ موضع القراءة" }).waitFor();
  await page.getByRole("button", { name: "تكبير الخط", exact: true }).click();
  assert.equal(
    await page
      .locator(".trading-guide-content")
      .evaluate((element) => getComputedStyle(element).fontSize),
    "26px",
  );
  await noOverflow(page, "blocked storage remains readable");
  await screenshot(page, "storage-unavailable");
  check("corrupt progress and blocked storage fail safely");
  await broken.close();
  assert.deepEqual(errors, [], "browser runtime errors");
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        base,
        checkedAt: new Date().toISOString(),
        checks,
        errors,
        note: "Browser emulator coverage; 200% text-size stress tested. Physical iOS/VoiceOver and native pinch zoom were not tested.",
      },
      null,
      2,
    ),
  );
  console.log(`PASS ${checks.length} checks; report ${output}/report.json`);
} catch (error) {
  await writeFile(
    `${output}/failure.json`,
    JSON.stringify({ message: String(error), checks, errors }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
}
