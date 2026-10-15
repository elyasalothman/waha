import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8080",
  out = process.argv[3] || "/tmp/waha-baloot";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch({
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
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/app/baloot");
    await page.getByRole("button", { name: "أضف الصكّة", exact: true }).waitFor();
    await page.getByLabel("أبناط لنا", { exact: true }).fill("100");
    await page.getByRole("button", { name: "أضف الصكّة", exact: true }).click();
    await page.getByRole("button", { name: "تعديل الصكّة 1", exact: true }).waitFor();
    assert.equal(await page.getByTestId("score-0").innerText(), "10");
    assert.equal(await page.getByTestId("score-1").innerText(), "6");
    await page.reload();
    await page.getByRole("button", { name: "تعديل الصكّة 1", exact: true }).waitFor();
    assert.equal(await page.getByTestId("score-0").innerText(), "10");
    await page.getByRole("button", { name: "تعديل الصكّة 1", exact: true }).click();
    await page.getByLabel("أبناط لنا", { exact: true }).fill("120");
    await page.getByRole("button", { name: "حفظ التعديل", exact: true }).click();
    assert.equal(await page.getByTestId("score-0").innerText(), "12");
    await page.getByRole("button", { name: "تراجع آخر صكّة", exact: true }).click();
    assert.equal(await page.getByTestId("score-0").innerText(), "0");
    await page.getByRole("button", { name: "صن ☀", exact: true }).click();
    await page.getByLabel("أبناط لنا", { exact: true }).fill("80");
    assert.equal((await page.getByTestId("hand-preview").innerText()).trim(), "16 / 10");
    await page.getByRole("button", { name: "أضف الصكّة", exact: true }).click();
    assert.equal(await page.getByTestId("score-0").innerText(), "16");
    await page.getByRole("button", { name: "قهوة", exact: true }).click();
    await page.getByRole("button", { name: "أضف الصكّة", exact: true }).click();
    await page.getByRole("heading", { name: /الفوز لـ/ }).waitFor();
    await page.getByRole("button", { name: "تراجع آخر صكّة", exact: true }).click();
    await page.getByRole("button", { name: "أضف الصكّة", exact: true }).waitFor();
    await page.getByLabel("الكبوت", { exact: true }).selectOption("0");
    assert.equal((await page.getByTestId("hand-preview").innerText()).trim(), "25 / 0");
    await page.getByRole("button", { name: "ملء الشاشة", exact: true }).click();
    await page.getByRole("button", { name: "تصغير", exact: true }).click();
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${out}/${engine}-baloot-${width}.png`, fullPage: true });
      results.push({ engine, width, page: "baloot", pass: true });
    }
    for (const route of ["/", "/today"]) {
      await page.goto(base + route);
      await page.waitForTimeout(1500);
      for (const width of [375, 390, 430]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        results.push({ engine, width, page: route, pass: true });
      }
      await page.screenshot({
        path: `${out}/${engine}-${route === "/" ? "home" : "today"}.png`,
        fullPage: true,
      });
    }
    await page.goto(base + "/today");
    await page.getByRole("link", { name: /افتح نشرة البلوت/ }).waitFor();
    assert.deepEqual(errors, []);
    results.push({
      engine,
      interactions: "add/reload/edit/undo/sun/coffee/kaboot/fullscreen/today",
      pass: true,
    });
  } finally {
    await browser.close();
  }
}
await writeFile(`${out}/report.json`, JSON.stringify({ base, results }, null, 2));
console.log(JSON.stringify({ checks: results.length, passed: true }));
