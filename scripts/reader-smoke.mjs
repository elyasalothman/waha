import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";
import assert from "node:assert/strict";
const base = checkedUrl(process.argv[2] || "http://localhost:8080");
const proxyUrl =
  process.env.READER_SMOKE_USE_PROXY === "1" && process.env.HTTPS_PROXY
    ? new URL(process.env.HTTPS_PROXY)
    : null;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
  ...(proxyUrl
    ? {
        proxy: {
          server: proxyUrl.origin,
          username: decodeURIComponent(proxyUrl.username),
          password: decodeURIComponent(proxyUrl.password),
        },
      }
    : {}),
});
const results = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    // Delay local fonts to exercise cold-cache reading-position restoration.
    await page.route("**/books/alhajda/assets/fonts/**", async (r) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await r.continue();
    });
    await page.route("https://fonts.googleapis.com/**", (r) =>
      r.fulfill({ status: 200, contentType: "text/css", body: "" }),
    );

    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/books", { waitUntil: "networkidle" });
    assert.equal(await page.locator('[data-curated-book-card="alhajda"]').count(), 1);
    await page.locator('a[href="/books/alhajda"]').click();
    await page.locator("article.alhajda-content").waitFor();
    await page.getByRole("button", { name: "القسم التالي", exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const anchors = page.locator("article [data-reader-anchor], article p[id], article h2[id]");
    const count = await anchors.count();
    assert.ok(count > 2);
    const anchor = anchors.nth(Math.min(10, count - 1));
    await anchor.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("waha:curated:alhajda:edition1")),
    );
    assert.equal(saved.chapter, 1);
    assert.ok(saved.anchor);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const restored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("waha:curated:alhajda:edition1")),
    );
    assert.equal(restored.chapter, saved.chapter);
    assert.equal(restored.anchor, saved.anchor);
    const geometry = await page.evaluate((id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      const t = document.querySelector(".reader-toolbar").getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        toolbar: t.bottom,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    }, saved.anchor);
    assert.ok(Math.abs(geometry.top - (geometry.toolbar + 16)) < 5, JSON.stringify(geometry));
    assert.ok(geometry.bottom > geometry.toolbar);
    assert.ok(geometry.top < 844);
    assert.ok(geometry.overflow <= 1);
    await page.getByRole("button", { name: "تكبير الخط", exact: true }).click();
    await page.locator("#alhajda-search").fill("العقل");
    await page.waitForTimeout(300);
    assert.ok((await page.locator('[aria-label="نتائج البحث"] button').count()) > 0);
    results.push({ width, saved, geometry, pageErrors: errors });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(JSON.stringify({ ok: true, base, results }, null, 2));
} finally {
  await browser.close();
}
