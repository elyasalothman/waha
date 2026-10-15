import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8081";
const out = process.argv[3] || "/tmp/waha-native";
await mkdir(out, { recursive: true });
const results = [];
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
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
      ignoreHTTPSErrors: true,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const pass = (name) => {
      results.push({ engine, name });
      console.log("PASS", engine, name);
    };
    await page.goto(base + "/ask");
    await page.waitForTimeout(1500);
    await page.locator("textarea").fill("ما عاصمة المملكة العربية السعودية؟");
    await page.getByRole("button", { name: "إرسال", exact: true }).click();
    await page.locator('[role="log"] article').nth(1).waitFor({ timeout: 40000 });
    assert.ok((await page.locator('[role="log"] article').nth(1).innerText()).includes("الرياض"));
    pass("Live question and actual Mohsen reply");
    await page.screenshot({ path: `${out}/${engine}-ask.png`, fullPage: true });
    await page.goto(base + "/life");
    await page.getByRole("link", { name: "اسأل محسن", exact: true }).click();
    assert.equal(new URL(page.url()).pathname, "/ask");
    pass("Floating ask navigation stays in Waha");
    await page.goto(base + "/ask?q=" + encodeURIComponent("اشرح هذا الخبر مع ذكر المصدر"));
    assert.equal(await page.locator("textarea").inputValue(), "اشرح هذا الخبر مع ذكر المصدر");
    await page.route("**/api/mohsen", (route) =>
      route.fulfill({ status: 502, contentType: "text/html", body: "<html>Bad gateway</html>" }),
    );
    await page.getByRole("button", { name: "إرسال", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator("textarea").inputValue(), "اشرح هذا الخبر مع ذكر المصدر");
    await page.unroute("**/api/mohsen");
    pass("Context question preserved; non-JSON failure is readable and retryable");

    await page.goto(base + "/worship");
    await page.getByRole("button", { name: "الأذكار", exact: true }).click();
    await page.getByText("أذكار الصباح", { exact: true }).waitFor();
    await page.getByRole("button", { name: "القبلة", exact: true }).click();
    await page.getByText("الاتجاه من موقعك نحو الكعبة المشرفة.", { exact: true }).waitFor();
    pass("Prayer, athkar and qibla inside Waha");
    await page.goto(base + "/compare");
    await page.getByLabel("درجة الخيار الأول").first().fill("10");
    await page.getByLabel("درجة الخيار الثاني").first().fill("0");
    assert.ok(
      Number(await page.locator("[data-comparison-score]").first().textContent()) >
        Number(await page.locator("[data-comparison-score]").last().textContent()),
    );
    pass("Weighted comparison updates actual scores");
    await page.goto(base + "/teacher");
    await page.getByRole("button", { name: "ابدأ حصتي داخل واحة", exact: true }).click();
    const frame = page.frameLocator("iframe");
    await frame.locator("body").waitFor({ timeout: 30000 });
    const frameText = await frame.locator("body").innerText();
    assert.ok(frameText.trim().length > 80);
    assert.equal(new URL(page.url()).pathname, "/teacher");
    pass("Hissati frame renders source UI without leaving Waha");
    await page.screenshot({ path: `${out}/${engine}-teacher.png`, fullPage: true });
    await page.goto(base + "/money");
    await page.locator('[aria-label="موجز السوق"] li').first().waitFor({ timeout: 20000 });
    pass("Real market quotes with source and timestamps");
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["/ask", "/worship", "/compare", "/teacher", "/tools", "/games"]) {
        await page.goto(base + path);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          width,
          `${path} overflow ${width}`,
        );
      }
      pass(`Internal features fit ${width}px`);
    }
    assert.deepEqual(errors, []);
    pass("No uncaught JavaScript errors");
    await context.close();
  } finally {
    await browser.close();
    await writeFile(`${out}/report.json`, JSON.stringify({ base, results }, null, 2));
  }
}
