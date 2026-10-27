import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  ...(proxy
    ? {
        proxy: {
          server: proxy.origin,
          username: decodeURIComponent(proxy.username),
          password: decodeURIComponent(proxy.password),
        },
      }
    : {}),
});
const result = {
  source: "real live UI, synthetic non-personal input; no image generation",
  checks: [],
  errors: [],
  console: [],
};
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  page.on("pageerror", (e) => result.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") result.console.push(m.text());
  });
  await page.goto("https://waha.hajdah.com/mohsen", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  for (const [mode, text, job] of [
    [
      "سيرتي",
      "خبرة تجريبية لمتقدم افتراضي: عمل في خدمة العملاء وتنظيم المهام، ويجيد استخدام الجداول الإلكترونية وكتابة التقارير. الهدف تطوير سيرة واضحة دون إضافة مؤهلات.",
      "منسق خدمة عملاء وتنظيم تقارير",
    ],
    [
      "المقابلة",
      "خلفية تجريبية: خبرة في الرد على العملاء وتنظيم ملفات الفريق وكتابة ملخصات العمل اليومية.",
      "منسق خدمة عملاء في فريق صغير",
    ],
    [
      "خطتي",
      "أريد تعلم أساسيات الجداول الإلكترونية خلال أسبوعين",
      "ضيق الوقت، لدي عشرون دقيقة يوميًا",
    ],
  ]) {
    try {
      await page.getByRole("button", { name: mode, exact: true }).click();
      await page.locator("form textarea").first().fill(job);
      await page.locator("#mohsen-message").fill(text);
      const count = await page.locator('article[data-role="assistant"]').count();
      await page.getByRole("button", { name: "إرسال", exact: true }).click();
      await page.waitForFunction(
        (n) => document.querySelectorAll('article[data-role="assistant"]').length > n,
        count,
        { timeout: 95000 },
      );
      const reply = await page.locator('article[data-role="assistant"]').last().innerText();
      if (reply.length < 60) throw new Error("short reply");
      result.checks.push({ mode, ok: true, reply: reply.slice(0, 700) });
    } catch (e) {
      result.checks.push({ mode, ok: false, error: e.message });
      await page
        .getByRole("button", { name: "إيقاف", exact: true })
        .click()
        .catch(() => {});
    }
  }
} finally {
  await browser.close();
  await writeFile("docs/audits/leap-haqqiq-live.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
if (result.checks.some((c) => !c.ok) || result.errors.length) process.exitCode = 1;
