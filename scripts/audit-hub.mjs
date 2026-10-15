/** Round 3: mobile hub directory, full-window game links, and RTL/LTR. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:8081";
const output = process.argv[3] || "/tmp/waha-hub";
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
const report = { base, viewport: "390×844", pages: [], checks: [] };
await mkdir(output, { recursive: true });
try {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of ["/", "/games"]) {
    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    if (path === "/") {
      const sites = page.locator("[data-house-site]");
      assert.equal(await sites.count(), 16);
      for (const host of [
        "alhajda.com",
        "hajdah.com",
        "hissati.alhajda.com",
        "tahajjud.alhajda.com",
        "games.alhajda.com",
        "hayat.alhajda.com",
      ]) {
        assert.equal(
          (await sites.locator(`a[href="https://${host}"]`).count()) +
            (await page.locator(`[data-house-site][href="https://${host}"]`).count()),
          1,
        );
      }
      for (const site of await sites.all()) {
        assert.equal(await site.getAttribute("target"), "_blank");
        const box = await site.boundingBox();
        assert.ok(box.height >= 44);
      }
      report.checks.push("16 shared site cards, required hosts, new-tab targets and touch size");
    }
    if (path !== "/app/sites") {
      const game = page.locator("[data-play-hayat]");
      await game.scrollIntoViewIfNeeded();
      assert.equal(await game.getAttribute("href"), "https://hayat.alhajda.com");
      // Capture the actual navigation without loading a heavy Godot world during the hub audit.
      await context.route("https://hayat.alhajda.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<title>Hayat navigation target</title>" }),
      );
      const popupPromise = page.waitForEvent("popup");
      await game.tap();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded");
      assert.equal(new URL(popup.url()).hostname, "hayat.alhajda.com");
      assert.equal(await popup.evaluate(() => window.opener === null), true);
      await popup.close();
      await context.unroute("https://hayat.alhajda.com/**");
      report.checks.push(
        `${path}: tapping Play Hayat opens a separate full-page context, no iframe`,
      );
    }
    await page.screenshot({
      path: `${output}/${path === "/" ? "home" : path.replaceAll("/", "-").slice(1)}.png`,
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    report.pages.push({ path, status: response.status(), width: 390, ltrWidth: 390 });
  }
  assert.deepEqual(errors, []);
  report.checks.push("No uncaught JavaScript errors; 390px in both document directions");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
