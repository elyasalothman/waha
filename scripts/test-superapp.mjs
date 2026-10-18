import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/waha-superapp-interactions";
await mkdir(out, { recursive: true });
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
  const browser = await launcher.launch({
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
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const check = async (name, fn) => {
    try {
      await fn();
      results.push({ engine, name, pass: true });
      console.log("PASS", engine, name);
    } catch (e) {
      results.push({ engine, name, pass: false, error: e.message });
      console.log("FAIL", engine, name, e.message);
      await page
        .screenshot({ path: `${out}/${engine}-failure-${results.length}.png` })
        .catch(() => {});
    }
    await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
  };
  await check("home and native-feeling navigation", async () => {
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.locator("[data-superapp]").waitFor();
    assert.equal(await page.locator("nav.native-safe-bottom a").count(), 4);
    assert.deepEqual(await page.locator("nav.native-safe-bottom a").allTextContents(), [
      "الرئيسية",
      "الخدمات",
      "اسأل",
      "أنا",
    ]);
    assert.equal(await page.locator("input[type=search]").count(), 1);
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-home-sections="day-shadow house-doors square"] article')
          .length >= 40,
    );
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 393);
  });
  await check("Arabic service search and internal Hissati encyclopedia", async () => {
    await page.getByRole("searchbox").fill("حِصّتي");
    await page.locator('section[aria-label="خدمات واحة"] a').filter({ hasText: "حصتي" }).click();
    await page.waitForURL("**/app/hissati");
    await page.getByRole("heading", { name: "حصتي", exact: true }).waitFor();
    await page.getByRole("button", { name: "ابدأ حصتي داخل واحة", exact: true }).click();
    await page.locator("iframe").waitFor();
    assert.equal(
      await page.locator("iframe").getAttribute("src"),
      "https://hissati.alhajda.com/explore",
    );
  });
  await check("resume history survives reload", async () => {
    await page.goto(base + "/today", { waitUntil: "networkidle" });
    await page.getByRole("region", { name: "تابع من حيث توقفت" }).waitFor();
    assert.match(await page.getByRole("region", { name: "تابع من حيث توقفت" }).innerText(), /حصتي/);
  });
  await check("daily XP awarded once and persists", async () => {
    await page.evaluate(() => localStorage.removeItem("waha:superapp:progress:v1"));
    await page.reload({ waitUntil: "networkidle" });
    const b = page.getByRole("button", { name: "أتممت خطوة اليوم", exact: true });
    await b.click();
    await page.getByRole("button", { name: "✓ أنجزت اليوم", exact: true }).waitFor();
    assert.match(await page.getByRole("region", { name: "تقدمك المحلي" }).innerText(), /10 XP/);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.getByRole("button", { name: "✓ أنجزت اليوم", exact: true }).isDisabled(),
      true,
    );
    assert.match(await page.getByRole("region", { name: "تقدمك المحلي" }).innerText(), /10 XP/);
  });
  await check("dark mode persists", async () => {
    await page.getByRole("button", { name: "تبديل الوضع الداكن" }).click();
    assert.equal(await page.locator("html.waha-dark").count(), 1);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html.waha-dark").count(), 1);
    await page.screenshot({ path: `${out}/${engine}-dark.png` });
    await page.getByRole("button", { name: "تبديل الوضع الداكن" }).click();
  });
  await check("omnibox searches house services without hidden second filter", async () => {
    await page.getByRole("button", { name: "ابحث في واحة…", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").fill("١٦ مسار");
    await dialog.getByRole("option").filter({ hasText: "حصتي" }).click();
    await page.waitForURL("**/app/hissati");
    await page.getByRole("heading", { name: "حصتي", exact: true }).waitFor();
  });
  await check("Dallah and open-world games stay in Waha", async () => {
    for (const [game, src] of [
      ["dallah", "qafz-dallah"],
      ["hayat-world", "https://hayat.alhajda.com/"],
    ]) {
      await page.goto(base + "/play/" + game, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "ابدأ اللعب", exact: true }).click();
      assert.equal(
        await page.locator("iframe").getAttribute("src"),
        src.startsWith("https://") ? src : `https://games.alhajda.com/${src}/`,
      );
      await page.getByRole("button", { name: "ملء الشاشة", exact: true }).click();
      await page.getByRole("button", { name: "رجوع لواحة", exact: true }).click();
      assert.equal(new URL(page.url()).origin, new URL(base).origin);
    }
  });
  await check("ask answers today and prayer questions", async () => {
    await page.goto(base + "/ask", { waitUntil: "networkidle" });
    for (const question of ["وش صار اليوم؟", "متى صلاة العصر؟"]) {
      await page.locator("textarea:not(:disabled)").fill(question);
      await page.getByRole("button", { name: "إرسال", exact: true }).click();
      await page.waitForFunction(() =>
        document.querySelector("[role=log]")?.textContent?.includes("التالية"),
      );
      await page.locator("textarea:not(:disabled)").waitFor();
    }
    assert.match(await page.getByRole("log").innerText(), /الرياض/);
  });
  await check("catalog and profile navigation", async () => {
    await page.locator("nav.native-safe-bottom a").filter({ hasText: "الخدمات" }).click();
    await page.waitForURL("**/more");
    await page.waitForFunction(
      () => document.querySelectorAll('section[aria-label="خدمات واحة"] a').length > 60,
    );
    await page.locator("nav.native-safe-bottom a").filter({ hasText: "أنا" }).click();
    await page.waitForURL("**/me");
    await page.getByText("واحة 1.2.0", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "تخصيص البطاقات والمظهر" }).count(), 0);
  });
  await check("RTL, LTR and horizontal overflow", async () => {
    await page.goto(base + "/today", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dir === "ltr");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 393);
    await page.screenshot({ path: `${out}/${engine}-english.png` });
  });
  await check("no uncaught JavaScript errors", async () => assert.deepEqual(errors, []));
  await browser.close();
}
console.log(JSON.stringify({ total: results.length, failed: results.filter((r) => !r.pass) }));
if (results.some((r) => !r.pass)) process.exitCode = 1;
