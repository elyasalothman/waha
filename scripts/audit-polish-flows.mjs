import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
const base = process.argv[2] || "http://localhost:8081",
  out = process.argv[3] || "/tmp/polish-flows";
await mkdir(out, { recursive: true });
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
const report = {
  base,
  checks: [],
  errors: [],
  network: [],
  limits: [
    "Browser emulation only; microphone, notifications and iPhone/VoiceOver not tested.",
    "Saved device book is reopened through the cached home in-app; private HTML is never cached.",
  ],
};
let page;
function check(name, details = {}) {
  report.checks.push({ name, ...details });
  console.log(name, JSON.stringify(details));
}
async function send(text, expected) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "طلبك من محسن" }).fill(text);
  await dialog.getByRole("button", { name: "نفّذ", exact: true }).click();
  await dialog
    .locator('div[role="status"]')
    .filter({ hasText: new RegExp(expected) })
    .last()
    .waitFor({ timeout: 30000 });
}
try {
  for (const width of process.env.FLOW_WIDTHS
    ? process.env.FLOW_WIDTHS.split(",").map(Number)
    : [390, 1280])
    for (const theme of process.env.FLOW_THEMES
      ? process.env.FLOW_THEMES.split(",")
      : ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 800 },
        colorScheme: theme,
        ignoreHTTPSErrors: true,
      });
      page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.on("pageerror", (e) => report.errors.push({ width, theme, error: e.message }));
      page.on("response", (r) => {
        if (r.status() >= 400) report.network.push({ url: r.url(), status: r.status() });
      });
      await page.goto(base + "/onboarding", { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "التالي", exact: true }).click();
      await page.getByLabel("مدينتك للطقس والصلاة").selectOption("jeddah");
      await page.getByRole("checkbox").first().check();
      await page.getByRole("button", { name: "التالي", exact: true }).click();
      await page.getByRole("heading", { name: "تعرّف على محسن" }).waitFor();
      await page.getByRole("button", { name: "ابدأ يومك", exact: true }).click();
      await page.waitForURL(base + "/");
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem("waha:onboarding:v1")), "done");
      assert.equal(
        await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).city),
        "jeddah",
      );
      assert.equal(await page.getByRole("link", { name: "خصّص واحتك", exact: true }).count(), 0);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(
        (dark) =>
          document.documentElement.style.fontSize !== "" &&
          document.documentElement.classList.contains("waha-dark") === dark,
        theme === "dark",
        { timeout: 20000 },
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.classList.contains("waha-dark")),
        theme === "dark",
      );
      check("onboarding-city-interests-once-system-theme", { width, theme });
      await page.goto(base + "/settings", { waitUntil: "networkidle" });
      await page.getByRole("link", { name: "إعادة جولة الترحيب والتخصيص ←" }).click();
      await page.getByRole("button", { name: "تخطي", exact: true }).click();
      await page.waitForURL(base + "/");
      check("onboarding-replay-skip", { width, theme });
      await page.getByRole("button", { name: "فتح محسن", exact: true }).click();
      await send("كم ٢٥×٤", "100");
      await send("كم ١٥٪ من ٢٤٠", "36");
      await send("خصم ٣٠٪ على ٤٥٠", "315");
      await send("حل ٢س+٣=٧", "2");
      await send("جذر ٨١", "9");
      const dialog = page.getByRole("dialog");
      await page.keyboard.press("Tab");
      assert.ok(await dialog.evaluate((d) => d.contains(document.activeElement)));
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await page.keyboard.press("Control+k");
      await dialog.waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      check("agent-five-commands-focus-escape-shortcut", { width, theme });
      await page.goto(base + "/pro/pdf", { waitUntil: "networkidle" });
      const pdf = await PDFDocument.create();
      pdf.addPage([200, 300]);
      const bytes = Buffer.from(await pdf.save());
      await page
        .getByLabel("اختر ملفات PDF أو صور", { exact: true })
        .setInputFiles({ name: "polish-original.pdf", mimeType: "application/pdf", buffer: bytes });
      await page.getByRole("list", { name: "صفحات المستند" }).waitFor({ timeout: 60000 });
      assert.equal(await page.getByRole("button", { name: "صفحة 1", exact: true }).count(), 1);
      check("pdf-real-import-preview", { width, theme });
      await page.goto(base + "/books/alhajda", { waitUntil: "networkidle" });
      await page.locator('[data-curated-book="alhajda"] article').waitFor();
      const controls = page.getByRole("button", {
        name: /إظهار أدوات القراءة|إخفاء أدوات القراءة/,
      });
      if ((await controls.getAttribute("aria-expanded")) !== "true") await controls.click();
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/chapters/search.json") && r.status() === 200,
        ),
        page.getByLabel("بحث في الكتاب").fill("العدالة"),
      ]);
      await page.waitForTimeout(400);
      const results = page.locator("button").filter({ hasText: "العدالة" });
      assert.ok((await results.count()) > 0);
      await results.first().click();
      await page.locator("article").waitFor();
      await page.waitForTimeout(600);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("article").waitFor();
      assert.ok(await page.locator("article").innerText());
      check("reader-lazy-search-chapter-restore", { width, theme });
      for (const route of process.env.SKIP_ZOOM
        ? []
        : [
            "/",
            "/tools",
            "/games",
            "/me",
            "/settings",
            "/onboarding",
            "/pro/pdf",
            "/books/alhajda",
          ]) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `200% overflow ${route} ${width}`,
        );
      }
      if (!process.env.SKIP_ZOOM) check("font-200-percent-no-overflow", { width, theme });
      await page.goto(base + "/studio", { waitUntil: "networkidle" });
      await page.getByLabel("عنوان الكتاب", { exact: true }).fill("كتاب فحص أوفلاين");
      await page.getByLabel("المؤلف", { exact: true }).fill("نص أصلي للفحص");
      await page
        .getByLabel("أو الصق النص")
        .fill("# فصل أصلي\nهذه فقرة أصلية لاختبار القراءة المحلية دون اتصال.");
      await page.getByRole("button", { name: "حفظ مسودة ومعاينة" }).click();
      await page.getByRole("link", { name: "معاينة المسودة", exact: true }).click();
      await page.locator("[data-platform-reader]").waitFor();
      const draft = page.url();
      await page.goto(base + "/app/calc", { waitUntil: "networkidle" });
      await page.goto(base + "/app/notes", { waitUntil: "networkidle" });
      await page.goto(base + "/app/letters", { waitUntil: "networkidle" });
      await page.goto(base + "/", { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      for (let n = 0; n < 40; n++) {
        if (await page.evaluate(async () => !!(await caches.match(location.origin + "/")))) break;
        await page.waitForTimeout(250);
      }
      assert.ok(await page.evaluate(async () => !!(await caches.match(location.origin + "/"))));
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.getByRole("button", { name: "فتح محسن", exact: true }).click();
      await send("كم ٢٥×٤", "100");
      await page.keyboard.press("Escape");
      await page.getByRole("link", { name: /كمل القراءة/ }).click();
      await page.locator("[data-platform-reader]").waitFor();
      assert.equal(page.url(), draft);
      assert.match(await page.locator("article").innerText(), /فقرة أصلية/);
      await page.goto(base + "/app/calc", { waitUntil: "domcontentloaded" });
      await page
        .getByRole("button", { name: /^(1|١)$/, exact: true })
        .first()
        .waitFor();
      await page.goto(base + "/app/letters", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "الحروف للأطفال", exact: true }).waitFor();
      const cacheUrls = await page.evaluate(async () => {
        const all = [];
        for (const key of await caches.keys()) {
          const c = await caches.open(key);
          for (const r of await c.keys()) all.push(new URL(r.url).pathname);
        }
        return all;
      });
      assert.ok(
        !cacheUrls.some(
          (x) =>
            x.startsWith("/api/") ||
            x === "/books" ||
            x.startsWith("/books/library/") ||
            x.startsWith("/books/read/") ||
            x === "/me" ||
            x === "/register",
        ),
      );
      check("offline-home-agent-calculator-device-book-private-cache-exclusions", {
        width,
        theme,
        cached: cacheUrls.length,
      });
      await context.setOffline(false);
      await page.goto(base + "/", { waitUntil: "networkidle" });
      await page.screenshot({ path: `${out}/${width}-${theme}-home.png`, fullPage: true });
      await context.close();
    }
  assert.deepEqual(report.errors, []);
} catch (e) {
  report.failure = String(e);
  if (page) {
    report.failureUrl = page.url();
    report.failureText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    await page.screenshot({ path: out + "/failure.png", fullPage: true }).catch(() => {});
  }
  process.exitCode = 1;
  console.error(String(e));
} finally {
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
