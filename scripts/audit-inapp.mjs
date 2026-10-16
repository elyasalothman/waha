import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/waha-inapp";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit }).filter(
  ([name]) => !process.env.AUDIT_ENGINE || name === process.env.AUDIT_ENGINE,
)) {
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
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [],
    exits = [],
    popups = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && new URL(frame.url()).origin !== new URL(base).origin)
      exits.push(frame.url());
  });
  context.on("page", (p) => {
    if (p !== page) popups.push(p.url());
  });
  try {
    await page.goto(base + "/app/sites", { waitUntil: "domcontentloaded" });
    await page.locator("[data-house-site]").first().waitFor();
    const cards = await page
      .locator("[data-house-site]")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({ id: n.getAttribute("data-house-site"), href: n.getAttribute("href") })),
      );
    assert.equal(cards.length, 19);
    for (const card of cards.filter(() => process.env.AUDIT_TOOLS_ONLY !== "1")) {
      console.log(engine, "checking", card.id);
      assert.ok(card.href.startsWith("/"), JSON.stringify(card));
      for (let step = 0; new URL(page.url()).pathname !== "/app/sites" && step < 4; step++) {
        await page.goBack({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(150);
      }
      if (new URL(page.url()).pathname !== "/app/sites")
        await page.goto(base + "/app/sites", { waitUntil: "domcontentloaded" });
      await page.locator(`[data-house-site="${card.id}"]`).click();
      await page.waitForURL((url) => url.pathname !== "/app/sites", {
        waitUntil: "domcontentloaded",
      });
      await page.locator("h1").first().waitFor();
      await page.waitForTimeout(500);
      assert.equal(new URL(page.url()).origin, new URL(base).origin);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        card.id + " overflow",
      );
      results.push({ engine, card: card.id, href: new URL(page.url()).pathname, pass: true });
      console.log(engine, card.id, "pass");
      await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
    }
    await page.goto(base + "/app/amlak", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (n) => n.textContent.includes("أضف الوحدة") && !n.disabled,
      ),
    );
    await page.getByLabel("الوحدة", { exact: true }).fill("وحدة اختبار");
    await page.getByLabel("الإيجار المستحق (ريال)").fill("1234");
    await page.getByLabel("تاريخ الاستحقاق").fill("2026-12-01");
    await page.getByRole("button", { name: "أضف الوحدة", exact: true }).click();
    await page.getByRole("button", { name: "حذف وحدة اختبار" }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "حذف وحدة اختبار" }).waitFor();
    await page.getByRole("button", { name: "حذف وحدة اختبار" }).click();
    await page.goto(base + "/app/agent", { waitUntil: "domcontentloaded" });
    await page.getByLabel("المهمة", { exact: true }).fill("اختبار المهمة");
    await page.getByRole("button", { name: "أضف المهمة" }).click();
    await page.getByRole("checkbox").check();
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await page.getByRole("checkbox").isChecked(), true);
    await page.goto(base + "/app/himaya", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "ولّد كلمة مرور" }).click();
    assert.equal((await page.locator("output").innerText()).length, 20);
    await page.goto(base + "/app/manba", { waitUntil: "domcontentloaded" });
    await page.getByLabel("نص البطاقة").fill("بطاقة عربية <آمنة>");
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "تنزيل البطاقة SVG" }).click();
    assert.equal((await downloaded).suggestedFilename(), "waha-card.svg");
    await page.screenshot({ path: `${out}/${engine}-manba.png`, fullPage: true });
    await page.goto(base + "/welcome", { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator('a[href^="https://"]').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/${engine}-welcome.png`, fullPage: true });
    results.push({ engine, localTools: true, exits, popups, errors });
    assert.deepEqual(exits, []);
    assert.deepEqual(popups, []);
    assert.deepEqual(errors, []);
    if (new URL(base).hostname === "waha.hajdah.com" && process.env.AUDIT_SKIP_EMBEDS !== "1") {
      for (const id of ["hissati", "samar", "luma", "hayat"]) {
        await page.goto(base + "/app/" + id, { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /^ابدأ/ }).click();
        const frame = page.locator("iframe");
        await frame.waitFor();
        await page.waitForTimeout(4000);
        const child = await frame.elementHandle().then((n) => n.contentFrame());
        const loaded =
          child && (await child.locator("body").evaluate((n) => n.childElementCount > 0));
        await page.screenshot({ path: `${out}/${engine}-${id}.png`, fullPage: true });
        assert.ok(loaded, id);
        await page.getByRole("button", { name: "ملء الشاشة", exact: true }).click();
        await page.getByRole("button", { name: "رجوع لواحة", exact: true }).click();
        results.push({ engine, embed: id, loaded, errors: errors.slice() });
      }
    }
  } finally {
    await browser.close();
    await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
  }
}
console.log(JSON.stringify(results, null, 2));
