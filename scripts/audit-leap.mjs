import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:8082",
  stage = process.argv[3] || "local";
const out = "/workspace/work/waha-leap-shots";
await mkdir(out, { recursive: true });
await mkdir("docs/audits", { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  args: base.startsWith("https://localhost")
    ? ["--host-resolver-rules=MAP localhost:443 127.0.0.1:8443", "--ignore-certificate-errors"]
    : [],
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
  stage,
  date: new Date().toISOString(),
  checks: [],
  pages: [],
  errors: [],
  console: [],
  failures: [],
  requests: [],
};
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: true,
  locale: "ar-SA",
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.console.push(m.text());
});
page.on("requestfailed", (r) =>
  report.requests.push({ url: r.url(), error: r.failure()?.errorText }),
);
async function check(name, fn) {
  try {
    await fn();
    report.checks.push({ name, ok: true });
    console.log("PASS", name);
  } catch (e) {
    report.checks.push({ name, ok: false, error: e.message });
    report.failures.push(name);
    console.log("FAIL", name, e.message);
  }
}
async function visit(path) {
  const r = await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, 0));
  return r;
}
try {
  for (const theme of ["light", "dark"]) {
    await context.addInitScript((t) => {
      localStorage.setItem("waha:onboarding:done", "1");
      const raw = JSON.parse(localStorage.getItem("waha:settings:v1") || "{}");
      raw.theme = t;
      localStorage.setItem("waha:settings:v1", JSON.stringify(raw));
    }, theme);
    for (const route of [
      "/",
      "/mohsen",
      "/services",
      "/service/phones",
      "/service/bench",
      "/service/wiki",
      "/analysts",
      "/service/hissati-explore",
      "/privacy",
      "/delete-account",
      "/settings",
      "/books",
      "/games",
    ]) {
      await check(`${theme} ${route}`, async () => {
        const r = await visit(route);
        if (r.status() !== 200) throw new Error(`HTTP ${r.status()}`);
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          viewport: innerWidth,
          height: document.documentElement.scrollHeight,
          dark: document.documentElement.classList.contains("waha-dark"),
          small: [
            ...document.querySelectorAll(
              "main button,main a,main input:not([type=checkbox]),main select",
            ),
          ]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return (
                !e.classList.contains("sr-only") &&
                r.width &&
                r.height &&
                getComputedStyle(e).visibility !== "hidden" &&
                (r.width < 43.5 || r.height < 43.5)
              );
            })
            .map((e) => ({
              text: (e.textContent || e.getAttribute("aria-label") || "").slice(0, 45),
              width: e.getBoundingClientRect().width,
              height: e.getBoundingClientRect().height,
            })),
        }));
        report.pages.push({ route, theme, ...metrics });
        if (metrics.width > 390) throw new Error(`overflow ${metrics.width}`);
        if (["/", "/mohsen"].includes(route))
          await page.screenshot({
            path: `${out}/${stage}-${route === "/" ? "home" : "mohsen"}-${theme}-390.png`,
            fullPage: true,
          });
      });
    }
  }
  await check("خمسة تبويبات سفلية", async () => {
    await visit("/");
    const links = page.locator("nav.fixed a");
    if ((await links.count()) !== 5) throw new Error(`count ${await links.count()}`);
  });
  await check("بحث الخدمات والمفضلة وحفظها", async () => {
    await visit("/services");
    await page.getByRole("searchbox").fill("جوالات");
    await page.getByRole("link", { name: /مقارنة الجوالات/ }).waitFor();
    await page.getByRole("button", { name: /مفضلة مقارنة الجوالات/ }).click();
    await page.reload();
    await page.getByRole("searchbox").fill("جوالات");
    if (
      (await page
        .getByRole("button", { name: /مفضلة مقارنة الجوالات/ })
        .getAttribute("aria-pressed")) !== "true"
    )
      throw new Error("favorite lost");
  });
  await check("بحث الموسوعة من API الحي", async () => {
    await visit("/service/wiki");
    await page.getByRole("textbox", { name: "موضوع البحث" }).fill("نجد");
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await page.getByRole("link", { name: "المقال ومصادره ↗" }).first().waitFor({ timeout: 20000 });
  });
  await check("مقارنة جوالين من API الحي", async () => {
    await visit("/service/phones");
    await page.waitForFunction(
      () => document.querySelectorAll('select[aria-label="الجوال 1"] option').length > 2,
      null,
      { timeout: 20000 },
    );
    const options = await page
      .locator('select[aria-label="الجوال 1"] option')
      .evaluateAll((es) => es.slice(1, 3).map((e) => e.value));
    await page.getByLabel("الجوال 1", { exact: true }).selectOption(options[0]);
    await page.getByLabel("الجوال 2", { exact: true }).selectOption(options[1]);
    if ((await page.getByRole("link", { name: "مصدر المواصفات ↗" }).count()) !== 2)
      throw new Error("comparison unavailable");
  });
  await check("حصتي تفتح مسار الاستكشاف الحقيقي", async () => {
    await visit("/service/hissati-explore");
    const pending = page.waitForEvent("popup");
    await page.getByRole("link", { name: /فتح حصتي/ }).click();
    const popup = await pending;
    await popup.waitForLoadState("domcontentloaded", { timeout: 40000 });
    if (!popup.url().includes("hissati.alhajda.com/explore")) throw new Error(popup.url());
    await popup.screenshot({ path: `${out}/${stage}-hissati-390.png` });
    await popup.close();
  });
  await check("المحللون من المصدر الحي", async () => {
    await visit("/analysts");
    await page
      .getByRole("link", { name: "التغريدة الأصلية ↗" })
      .first()
      .waitFor({ timeout: 25000 });
    if (
      !(
        await page.getByRole("link", { name: "التغريدة الأصلية ↗" }).first().getAttribute("href")
      )?.startsWith("https://x.com/")
    )
      throw new Error("missing source");
  });
  await check("الخصوصية والحذف عامة وقابلة للفهرسة", async () => {
    for (const path of ["/privacy", "/delete-account"]) {
      await visit(path);
      if (await page.locator('meta[name="robots"][content*="noindex"]').count())
        throw new Error("noindex");
      await page.getByRole("heading", { level: 1 }).waitFor();
    }
  });
  await check("سؤال حقيقي من الرئيسية وإرسال تلقائي", async () => {
    await visit("/");
    await page.getByRole("textbox", { name: "اسأل محسن", exact: true }).fill("ما عاصمة السعودية؟");
    await page.getByRole("button", { name: /اسأل محسن/ }).click();
    await page.locator('article[data-role="assistant"]').last().waitFor({ timeout: 65000 });
    const text = await page.locator('article[data-role="assistant"]').last().innerText();
    report.chat = text;
    if (!text.includes("الرياض")) throw new Error("unrelated reply: " + text.slice(0, 300));
    await page.screenshot({ path: `${out}/${stage}-mohsen-answer-390.png`, fullPage: true });
  });
  await check("تحليل ملف نصي حقيقي مباشر من المتصفح", async () => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "waha-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "تقرير تجريبي لا يتضمن بيانات شخصية. اسم المشروع واحة. عدد الكتب في هذا التقرير سبعة كتب فقط. الهدف تسهيل القراءة والتعلم.",
      ),
    });
    await page
      .getByRole("textbox", { name: "سؤالك لمحسن", exact: true })
      .fill("كم عدد الكتب في هذا الملف؟");
    const before = await page.locator('article[data-role="assistant"]').count();
    await page.getByRole("button", { name: "إرسال", exact: true }).click();
    await page.waitForFunction(
      (n) => document.querySelectorAll('article[data-role="assistant"]').length > n,
      before,
      { timeout: 100000 },
    );
    const text = await page.locator('article[data-role="assistant"]').last().innerText();
    report.analysis = text;
    if (!text.includes("من ملفك") || !/[٧7]|سبعة|سبع/.test(text))
      throw new Error(text.slice(0, 300));
  });
  if (stage === "live" && !existsSync(`${out}/image-attempt.json`))
    await check("صورة واحدة حقيقية فقط", async () => {
      await writeFile(
        `${out}/image-attempt.json`,
        JSON.stringify({ at: new Date().toISOString(), base, attempts: 1 }),
      );
      await page.getByRole("button", { name: "صورة", exact: true }).click();
      await page
        .getByRole("textbox", { name: "سؤالك لمحسن", exact: true })
        .fill("A watercolor painting of a palm tree beside a quiet oasis, no text");
      await page.getByRole("button", { name: "إرسال", exact: true }).click();
      await page.getByAltText("صورة مولّدة من وصفك").waitFor({ timeout: 110000 });
      await page.screenshot({ path: `${out}/live-mohsen-generated-image-390.png`, fullPage: true });
    });
  await check("السجل يستعاد بعد إعادة التحميل", async () => {
    const n = await page.locator('article[data-role="assistant"]').count();
    await page.reload();
    await page.waitForTimeout(1000);
    if ((await page.locator('article[data-role="assistant"]').count()) !== n)
      throw new Error("history lost");
  });
  await check("أوفلاين الرئيسية واستبعاد APIs", async () => {
    await visit("/");
    await page.evaluate(() =>
      Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("service worker ready timeout")), 15000),
        ),
      ]),
    );
    await page.reload();
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "وش ودّك تنجز اليوم؟" }).waitFor();
    await context.setOffline(false);
    const keys = await page.evaluate(async () => {
      const all = [];
      for (const k of await caches.keys())
        for (const r of await (await caches.open(k)).keys()) all.push(new URL(r.url).pathname);
      return all;
    });
    if (keys.some((k) => k.startsWith("/api/"))) throw new Error("API cached");
    report.cache = keys;
  });
} catch (e) {
  report.failures.push(e.message);
} finally {
  await context.setOffline(false);
  await browser.close();
  await writeFile(`docs/audits/leap-${stage}.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        checks: report.checks,
        errors: report.errors,
        console: report.console,
        failures: report.failures,
      },
      null,
      2,
    ),
  );
}
if (report.failures.length || report.errors.length) process.exitCode = 1;
