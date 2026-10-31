/** Local mobile regression checks. Usage: node scripts/audit-daily-2026-10-31.mjs [base] [output] */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:8081";
const output = process.argv[3] || "/tmp/waha-daily/local";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "ar-SA",
      colorScheme: theme,
    });
    await context.addInitScript((value) => localStorage.setItem("waha:theme", value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/services`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => Boolean(document.documentElement.dataset.density));
    const search = page.getByRole("searchbox");
    await search.fill("  حِصّتي  ");
    await page.getByRole("link", { name: "حصتي · المسارات والدروس", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelectorAll("main section").length === 1);
    await search.fill("الدروس   حصتي");
    await page.getByRole("link", { name: "حصتي · المسارات والدروس", exact: true }).waitFor();
    await search.fill("خدمةغيرموجودة");
    await page.getByText("ما وجدنا خدمة بهذا الاسم؛ جرّب كلمة أخرى.", { exact: true }).waitFor();
    assert.equal(await page.locator("main section").count(), 0);
    await search.fill("");
    await page.waitForFunction(() => document.querySelectorAll("main section").length === 5);
    const favorite = page.getByRole("button", {
      name: "مفضلة حصتي · المسارات والدروس",
      exact: true,
    });
    await favorite.click();
    assert.equal(await favorite.getAttribute("aria-pressed"), "true");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[aria-label="مفضلة حصتي · المسارات والدروس"]')
          ?.getAttribute("aria-pressed") === "true",
    );
    await checkLayout("services");

    let reachable = false;
    await page.route("https://shield-test.alhajda.com/**", async (route) => {
      if (reachable)
        await route.fulfill({
          status: 200,
          body: "ok",
          headers: { "access-control-allow-origin": "*" },
        });
      // Leave the request pending: the application must abort it itself.
    });
    let domainCalls = 0;
    await page.route("https://dns.alhajda.com/check?**", async (route) => {
      domainCalls++;
      if (domainCalls > 1)
        await route.fulfill({
          json: { verdict: "allow" },
          headers: { "access-control-allow-origin": "*" },
        });
    });
    await page.goto(`${base}/app/shield`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator('[data-shield-status="unknown"]').waitFor({ timeout: 12000 });
    reachable = true;
    await page.getByRole("button", { name: "أعد الفحص", exact: true }).click();
    await page.locator('[data-shield-status="inactive"]').waitFor();
    const check = page.getByRole("button", { name: "افحص", exact: true });
    await check.click();
    assert.equal(
      await page.getByRole("button", { name: "جارٍ الفحص…", exact: true }).isDisabled(),
      true,
    );
    await page
      .getByText("تعذّر فحص النطاق. تحقق من اتصالك وحاول مرة أخرى.", { exact: true })
      .waitFor({ timeout: 12000 });
    assert.equal(domainCalls, 1);
    await check.click();
    await page.getByText("✅ مسموح: googleads.g.doubleclick.net", { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "النطاق", exact: true }).fill("ليس نطاقًا");
    await check.click();
    await page.getByText("اكتب نطاقًا صحيحًا مثل ads.example.com", { exact: true }).waitFor();
    assert.equal(domainCalls, 2);
    await checkLayout("shield");
    assert.deepEqual(errors, []);
    report.push({
      theme,
      viewport: "390×844",
      pageerrors: errors,
      search: "passed",
      favorites: "passed",
      shieldTimeoutAndRetry: "passed",
    });
    await context.close();

    async function checkLayout(name) {
      await page.waitForFunction(
        (dark) => document.documentElement.classList.contains("waha-dark") === dark,
        theme === "dark",
      );
      assert.equal(await page.evaluate(() => document.documentElement.dir), "rtl");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
      assert.equal(
        await page.evaluate(() => document.documentElement.classList.contains("waha-dark")),
        theme === "dark",
      );
      await page.screenshot({ path: `${output}/${theme}-${name}.png`, fullPage: true });
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
