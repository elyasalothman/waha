import { webkit, chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8081";
const out = process.argv[3] || "/tmp/waha-store-qa";
await mkdir(out, { recursive: true });
const proxy = new URL(process.env.HTTPS_PROXY || "http://localhost");
const engine = process.env.STORE_ENGINE || "webkit";
const browser = await (engine === "chromium" ? chromium : webkit).launch({
  headless: true,
  ...(process.env.HTTPS_PROXY
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
const results = [];
try {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: true,
      colorScheme: theme,
    });
    await context.addInitScript(
      ({ theme }) => {
        if (!localStorage.getItem("waha:prefs"))
          localStorage.setItem(
            "waha:prefs",
            JSON.stringify({ lang: "ar", audience: "personal", segment: "all", sliceChosen: true }),
          );
        localStorage.setItem("waha:theme", theme);
      },
      { theme },
    );
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/store`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "شيء تتعلّمه. كتاب تقرؤه. لعبة تحبّها." }).waitFor();
    assert.equal(await page.locator('section[aria-label="متجر واحة"]').getAttribute("dir"), "rtl");
    await page.screenshot({ path: `${out}/${theme}-catalog.png`, fullPage: false });
    await page.getByRole("button", { name: "كتب", exact: true }).click();
    const first = page.getByRole("button", { name: /^عرض / }).first();
    const name = (await first.getAttribute("aria-label")).replace("عرض ", "");
    await first.click();
    await page.getByRole("heading", { name, exact: true }).waitFor();
    await page.screenshot({ path: `${out}/${theme}-product.png` });
    await page.getByRole("button", { name: "احصل عليه مجانًا", exact: true }).click();
    await page.waitForURL(/\/books\/library\//);
    await page.waitForLoadState("networkidle");
    const productUrl = page.url();
    await page.locator("[data-paragraph]").first().waitFor();
    await page.goto(`${base}/store`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^مكتبتي/ }).click();
    await page.getByRole("heading", { name: "مكتبتك، على هذا الجهاز", exact: true }).waitFor();
    await page.waitForFunction(
      () => document.querySelectorAll('button[aria-label^="عرض "]').length === 1,
    );
    await page.getByRole("button", { name: `عرض ${name}`, exact: true }).click();
    await page.getByText("حصل عليه على هذا الجهاز: 1", { exact: true }).waitFor();
    await page.getByRole("button", { name: "افتح من مكتبتي", exact: true }).click();
    await page.waitForURL(productUrl);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem("waha:store:library:v1")).length),
      1,
    );
    await page.goto(`${base}/store`, { waitUntil: "networkidle" });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    assert.ok(
      await page.evaluate(async () => {
        const cache = await caches.open("waha-public-v5");
        return !!(await cache.match(location.origin + "/store"));
      }),
      "public catalog cached",
    );
    await context.setOffline(true);
    if (engine === "chromium") await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "تعلّم", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('button[aria-label^="عرض "]').length === 16,
    );
    await page.getByRole("searchbox", { name: "ابحث في المتجر" }).fill("البرمجة");
    await page.waitForFunction(
      () => document.querySelectorAll('button[aria-label^="عرض "]').length === 1,
    );
    await page.getByRole("button", { name: "عرض البرمجة", exact: true }).click();
    await page.getByRole("heading", { name: "البرمجة", exact: true }).waitFor();
    await context.setOffline(false);
    await page.goto(`${base}/more`, { waitUntil: "networkidle" });
    await page.getByRole("searchbox").fill("المتجر");
    await page
      .locator('section[aria-label="خدمات واحة"]')
      .getByRole("link", { name: /المتجر/ })
      .click();
    await page.waitForURL(/\/store$/);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "mobile overflow",
    );
    await page.evaluate(() =>
      localStorage.setItem(
        "waha:prefs",
        JSON.stringify({ lang: "ar", audience: "personal", segment: "child", sliceChosen: true }),
      ),
    );
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch (e) {
      console.log("OFFLINE", e.message, await page.locator("body").innerText());
      throw e;
    }
    await page.getByRole("button", { name: "تعلّم", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('button[aria-label^="عرض "]').length === 12,
    );
    assert.equal(
      await page.getByRole("button", { name: "عرض الأسهم والاستثمار", exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    results.push({
      theme,
      viewport: "393x852",
      engine,
      pass: true,
      checks: [
        "catalog",
        "category",
        "product",
        "acquire and internal reader",
        "library after navigation",
        "deduplication",
        engine === "chromium" ? "offline reload and search" : "cached catalog and offline search",
        "services entry",
        "RTL and overflow",
        "child filter",
        "no page errors",
      ],
    });
    await context.close();
  }
  await writeFile(`${out}/results.json`, JSON.stringify({ base, results }, null, 2));
  console.log(JSON.stringify({ base, results }, null, 2));
} finally {
  await browser.close();
}
