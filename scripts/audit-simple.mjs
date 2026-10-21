import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, "");
const report = process.argv[3] || "docs/audits/simple-local.json";
const shots = process.env.AUDIT_SCREENSHOTS || "/tmp/waha-simple-audit";
await mkdir(shots, { recursive: true });
await mkdir("docs/audits", { recursive: true });
const proxy =
  base.startsWith("https:") && process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
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
page.setDefaultTimeout(15000);
const debug = [];
const errors = [],
  checks = [],
  failures = [];
page.on("pageerror", (e) => errors.push(e.message));
async function check(name, action) {
  try {
    const detail = await action();
    checks.push({ name, status: "passed", detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error: String(error) });
    console.log(`FAIL ${name}: ${error}`);
    await page.screenshot({ path: `${shots}/failure-${failures.length}.png` });
  }
}
async function overflow() {
  const delta = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(delta <= 1, `horizontal overflow ${delta}px`);
}
async function screenshot(name) {
  await page.screenshot({ path: `${shots}/${name}.png` });
}
async function hidden() {
  await page.waitForFunction(() => document.documentElement.dataset.readerControls === "hidden");
  assert.equal(await page.locator(".waha-shell .native-safe-top").isVisible(), false);
  assert.equal(await page.locator(".waha-shell > nav").isVisible(), false);
  assert.equal(await page.locator(".reader-toolbar").isVisible(), false);
}
async function reveal() {
  const paragraph = page.locator("article p").filter({ hasText: /[أ-ي]/ }).first();
  if (await paragraph.count())
    await paragraph.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.touchscreen.tap(195, 422);
  await page.waitForFunction(() => document.documentElement.dataset.readerControls === "visible");
  assert.equal(await page.locator(".waha-shell .native-safe-top").isVisible(), true);
  assert.equal(await page.locator(".waha-shell > nav").isVisible(), true);
  assert.equal(await page.locator(".reader-toolbar").isVisible(), true);
  const box = await page.locator(".reader-controls-toggle").boundingBox();
  assert.ok(box && box.height >= 44, `reader toggle height ${box?.height}`);
}
try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator("h1").first().waitFor();
  await check("home mobile tabs and overflow", async () => {
    const tabs = page.locator(".waha-shell > nav a");
    assert.ok((await tabs.count()) <= 5);
    const labels = await tabs.allTextContents();
    for (const tab of await tabs.all()) {
      const box = await tab.boundingBox();
      assert.ok(box.height >= 44);
    }
    await overflow();
    await screenshot("home");
    return { labels };
  });
  await check("five mobile tabs navigate", async () => {
    const destinations = await page
      .locator(".waha-shell > nav a")
      .evaluateAll((items) => items.map((el) => el.getAttribute("href")));
    for (const href of destinations) {
      await page.locator(`.waha-shell > nav a[href="${href}"]`).click();
      await page.waitForURL((url) => url.pathname === href.split("?")[0]);
      await overflow();
    }
    await page.goto(base);
  });
  await check("prominent home search and services", async () => {
    const search = page
      .locator(
        "main input[type=search], main input[placeholder*=ابحث], main input[placeholder*=بحث]",
      )
      .first();
    assert.ok(await search.isVisible());
    const box = await search.boundingBox();
    assert.ok(box.y < 500 && box.height >= 44);
    await search.fill("كتب");
    assert.ok(await page.locator("main a[href='/books']").first().isVisible());
    await search.fill("");
    const all = page.getByRole("link", { name: /كل الخدمات/ }).first();
    await all.click();
    await page.waitForURL("**/more");
    await overflow();
    await screenshot("services");
  });
  await page.goto(`${base}/books`);
  await check("trading guide shelf entry opens", async () => {
    const card = page.locator('[data-curated-book-card="trading-guide"]');
    await card.waitFor();
    await card.locator("a[href='/books/trading-guide']").click();
    await page.locator('[data-curated-book="trading-guide"]').waitFor();
    await overflow();
  });
  for (const [id, path, selector] of [
    ["trading", "/books/trading-guide", '[data-curated-book="trading-guide"]'],
    ["alhajda", "/books/alhajda", '[data-curated-book="alhajda"]'],
    [
      "platform",
      "/books/library/midad-elevator-key",
      '[data-platform-reader="midad-elevator-key"]',
    ],
  ]) {
    await check(`${id} immersive tap and night persistence`, async () => {
      await page.goto(base + path);
      await page.locator(selector).waitFor();
      await hidden();
      await overflow();
      await screenshot(`${id}-immersive`);
      await reveal();
      await page.touchscreen.tap(195, 422);
      await hidden();
      await reveal();
      const night = page.getByRole("button", { name: /وضع ليلي|الوضع الليلي/ });
      await night.click();
      assert.equal(await night.getAttribute("aria-pressed"), "true");
      await screenshot(`${id}-night-controls`);
      await page.reload();
      await page.locator(selector).waitFor();
      await hidden();
      await reveal();
      assert.equal(await night.getAttribute("aria-pressed"), "true");
      await overflow();
      const colors = await page.locator(selector).evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
      }));
      const luminance = (rgb) =>
        rgb
          .match(/\d+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          })
          .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
      const values = [luminance(colors.background), luminance(colors.color)].sort((a, b) => a - b);
      const contrast = (values[1] + 0.05) / (values[0] + 0.05);
      assert.ok(contrast >= 4.5, `night contrast ${contrast}`);
      return { ...colors, contrast };
    });
  }
  await check("private book reader immersive and persisted night", async () => {
    await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("waha-private-books-v1", 1);
        r.onupgradeneeded = () => {
          for (const name of ["books", "content", "reading"])
            if (!r.result.objectStoreNames.contains(name))
              r.result.createObjectStore(name, { keyPath: "id" });
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction(["books", "content"], "readwrite");
        tx.objectStore("books").put({
          id: "qa-simple-local",
          contentDigest: "synthetic-qa",
          title: "كتاب اختبار محلي مؤقت",
          addedAt: Date.now(),
          bytes: 1,
          pageCount: 1,
          textPages: 1,
          reviewPages: 0,
          formatVersion: 1,
        });
        tx.objectStore("content").put({
          id: "qa-simple-local",
          original: new Blob(["QA"]),
          pages: [
            {
              number: 1,
              review: false,
              blocks: Array.from({ length: 20 }, (_, i) => ({
                id: `qa-${i}`,
                direction: "rtl",
                text: "نص تجريبي محلي لاختبار القراءة واللمس وحفظ الوضع الليلي على الهاتف. ".repeat(
                  3,
                ),
              })),
            },
          ],
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    });
    await page.goto(`${base}/books/read/qa-simple-local`);
    await page.locator("[data-private-reader]").waitFor();
    await hidden();
    await reveal();
    const night = page.getByRole("button", { name: /وضع ليلي|الوضع الليلي/ });
    assert.equal(await night.getAttribute("aria-pressed"), "false", "initial private theme");
    await night.click();
    assert.equal(await night.getAttribute("aria-pressed"), "true", "private theme after click");
    const deadline = Date.now() + 5000;
    let savedNight = false;
    while (!savedNight && Date.now() < deadline) {
      savedNight = await page.evaluate(async () => {
        const db = await new Promise((resolve) => {
          const r = indexedDB.open("waha-private-books-v1", 1);
          r.onsuccess = () => resolve(r.result);
        });
        const value = await new Promise((resolve) => {
          const tx = db.transaction("reading");
          const r = tx.objectStore("reading").get("qa-simple-local");
          r.onsuccess = () => resolve(r.result);
        });
        db.close();
        return value?.theme === "night";
      });
      if (!savedNight) await page.waitForTimeout(100);
    }
    assert.ok(savedNight, "private night committed to IndexedDB");
    debug.push({ stage: "private-pre-reload", pressed: await night.getAttribute("aria-pressed") });
    await page.reload();
    await page.locator("[data-private-reader]").waitFor();
    debug.push({
      stage: "private-before-reveal",
      pressed: await page
        .locator("button")
        .filter({ hasText: "وضع ليلي" })
        .getAttribute("aria-pressed"),
      htmlTheme: await page.locator("#reader-theme").inputValue(),
      storage: await page.evaluate(async () => {
        const db = await new Promise((resolve) => {
          const r = indexedDB.open("waha-private-books-v1", 1);
          r.onsuccess = () => resolve(r.result);
        });
        const value = await new Promise((resolve) => {
          const r = db.transaction("reading").objectStore("reading").get("qa-simple-local");
          r.onsuccess = () => resolve(r.result);
        });
        db.close();
        return value;
      }),
    });
    await hidden();
    await reveal();
    debug.push({ stage: "private-restored", pressed: await night.getAttribute("aria-pressed") });
    assert.equal(await night.getAttribute("aria-pressed"), "true");
    await overflow();
    await screenshot("private-night");
  });
  await check("browser runtime errors", () => assert.deepEqual(errors, []));
} finally {
  await writeFile(
    report,
    JSON.stringify(
      {
        base,
        at: new Date().toISOString(),
        viewport: { width: 390, height: 844 },
        browser: browser.version(),
        checks,
        failures,
        debug,
        errors,
        screenshots: shots,
        limitations:
          "Chromium mobile emulation; physical iOS, VoiceOver, native safe-area hardware and real PDF import not covered. Private reader uses synthetic isolated local fixture.",
      },
      null,
      2,
    ) + "\n",
  );
  await browser.close();
}
if (failures.length) process.exitCode = 1;
