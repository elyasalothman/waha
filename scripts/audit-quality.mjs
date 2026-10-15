/** Mobile production checks: auth, lazy apps, SEO, keyboard dialog, RTL and offline privacy. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:8081";
const output = process.argv[3] || "/tmp/waha-quality";
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
const report = { base, viewport: "390×844", seo: [], checks: [] };
await mkdir(output, { recursive: true });
try {
  const page = await context.newPage();
  const session = await context.request.get(`${base}/api/auth/get-session`);
  assert.equal(session.status(), 200);
  assert.equal(await session.json(), null);
  assert.match(session.headers()["cache-control"], /no-store/);
  report.checks.push("Guest session: real endpoint returns 200 null, no-store");
  if (process.env.AUDIT_EXPECT_AUTH_UNCONFIGURED === "1") {
    const blocked = await context.request.get(`${base}/api/auth/get-session`, {
      headers: { Authorization: "Bearer invalid-test-token" },
    });
    assert.equal(blocked.status(), 503);
    assert.equal((await blocked.json()).code, "AUTH_NOT_CONFIGURED");
    report.checks.push(
      "Unconfigured production rejects session tokens with explicit 503, no preview identity",
    );
  }

  for (const path of [
    "/",
    "/books",
    "/games",
    "/life",
    "/money",
    "/tools",
    "/more",
    "/workspace",
    "/studio",
    "/madar",
    "/clips",
    "/forum",
    "/onboarding",
    "/admin",
    "/app/calc",
    "/app/vat",
    "/app/snake",
  ]) {
    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    assert.equal(response.status(), 200, path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    assert.ok(title.includes("واحة"), path);
    assert.ok(description?.length > 15, path);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, path);
    report.seo.push({ path, title, description });
    console.log(`SEO + 390px: ${path}`);
  }
  await page.goto(`${base}/clips`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  assert.equal(await page.locator("iframe").count(), 0);
  await page.getByRole("button", { name: /شغّل:/ }).first().click();
  await page.locator("iframe").first().waitFor({ state: "attached" });
  assert.equal(await page.locator("iframe").count(), 1);
  report.checks.push("Clips: no third-party iframe before explicit play");
  await page.goto(base, { waitUntil: "networkidle" });
  const search = page.getByRole("button", { name: /ابحث|بحث|search/i }).first();
  await search.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.keyboard.press("Shift+Tab");
  assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)));
  await page.keyboard.press("Tab");
  assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  report.checks.push("Search dialog: accessible name, trapped focus, Escape closes");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dir === "ltr");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dir === "rtl");
  report.checks.push("Arabic RTL / English LTR fit 390px");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.goto(`${base}/life`, { waitUntil: "networkidle" });
  await page.goto(`${base}/books`, { waitUntil: "networkidle" });
  await context.setOffline(true);
  await page.goto(`${base}/life`, { waitUntil: "networkidle" });
  assert.ok(await page.locator("h1").count());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.screenshot({ path: `${output}/offline-cached.png`, fullPage: true });
  await page.goto(`${base}/books`, { waitUntil: "load" });
  assert.match(await page.title(), /دون اتصال/);
  await page.screenshot({ path: `${output}/offline-fallback.png`, fullPage: true });
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls = [];
    for (const key of keys.filter((key) => key.startsWith("waha-public-"))) {
      const cache = await caches.open(key);
      urls.push(...(await cache.keys()).map((r) => new URL(r.url).pathname));
    }
    return urls;
  });
  assert.ok(
    !cached.some((p) => p.startsWith("/api/") || p.startsWith("/books") || p.startsWith("/auth")),
  );
  report.checks.push(
    "Offline: visited public page works; private book navigation uses fallback; no auth/API/private pages in cache",
  );
  report.cachedPaths = cached;
  await context.setOffline(false);
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${output}/quality.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
