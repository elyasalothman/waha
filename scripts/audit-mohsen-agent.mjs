import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:8080",
  output = process.argv[3] || "/tmp/mohsen-agent.json";
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  args: ["--no-sandbox"],
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
const report = { base, at: new Date().toISOString(), checks: [], errors: [], network: [] };
await mkdir("/tmp/mohsen-agent-shots", { recursive: true });
let currentPage;
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 800 },
      ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
    });
    const page = await context.newPage();
    currentPage = page;
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) report.network.push({ url: r.url(), status: r.status() });
    });
    await page.goto(base);
    await page.getByRole("button", { name: "فتح محسن", exact: true }).click();
    const dialog = page.getByRole("dialog");
    async function send(text, expected, confirm = false) {
      const before = confirm
        ? await page.evaluate(() =>
            Object.fromEntries(
              Object.entries(localStorage).filter(
                ([k]) => k.startsWith("waha-agent-") || k === "waha:settings:v1",
              ),
            ),
          )
        : null;
      await dialog.getByRole("textbox", { name: "طلبك من محسن" }).fill(text);
      await dialog.getByRole("button", { name: "نفّذ", exact: true }).click();
      if (confirm) {
        await dialog.getByRole("button", { name: "تأكيد التغيير", exact: true }).waitFor();
        assert.deepEqual(
          await page.evaluate(() =>
            Object.fromEntries(
              Object.entries(localStorage).filter(
                ([k]) => k.startsWith("waha-agent-") || k === "waha:settings:v1",
              ),
            ),
          ),
          before,
          "mutation before confirmation",
        );
        await dialog.getByRole("button", { name: "تأكيد التغيير", exact: true }).click();
      }

      await dialog
        .locator('div[role="status"]')
        .filter({ hasText: new RegExp(expected) })
        .waitFor({ timeout: 40000 });
      await dialog.getByRole("button", { name: "نفّذ", exact: true }).waitFor({ state: "visible" });
      await page.waitForFunction(() => {
        const b = [...document.querySelectorAll('[role="dialog"] button')].find(
          (x) => x.textContent === "نفّذ",
        );
        return b && !b.disabled;
      });
      await writeFile(output, JSON.stringify(report, null, 2));
      report.checks.push({
        width,
        text,
        ok: true,
        result: await dialog.locator('div[role="status"]').innerText(),
        url: page.url(),
      });
    }
    await send("كم ٢٥×٤", "100");
    await send("كم ١٥٪ من ٢٤٠", "36");
    await send("خصم ٣٠٪ على ٤٥٠", "315");
    await send("حل ٢س+٣=٧", "2");
    await send("حل x^2-5x+6=0", "2");
    await send("x^2-5x+6=0", "2");
    await send("حول ١ كم الى ميل", "0.621");
    await send("جذر ٨١", "9");
    await send("كم ٢^٣", "8");
    await send("مدينتي جدة", "تذكّرت", true);
    await send("وش تذكر عني", "مدينتي جدة");
    await send("تذكر أن اسمي مستخدم الفحص", "تذكّرت", true);
    await send("انس مدينتي", "تم نسيان", true);
    await send("اضف ملاحظة تجربة محسن", "حُفظت الملاحظة", true);
    await send("اعرض ملاحظاتي", "تجربة محسن");
    await send("ذكرني بعد ساعتين أشرب موية", "حُفظ التذكير", true);
    await send("اعرض تذكيراتي", "أشرب موية");
    await send("ذكرني يوم الخميس ٥ العصر أشرب موية", "حُفظ التذكير", true);
    assert.equal(
      await page.evaluate(() =>
        new Date(JSON.parse(localStorage.getItem("waha-agent-reminders")).at(-1).dueAt).getHours(),
      ),
      17,
    );
    await send("الوضع الليلي", "تم تطبيق الإعداد", true);
    await dialog.getByRole("button", { name: "تراجع", exact: true }).click();
    await send("افتح الحاسبة", "تم فتح");
    await send("افتح الملاحظات", "تم فتح");
    await send("افتح كتاب الهجدة", "تم فتح");
    await send("كمل الكتاب", "عدت|اختر");
    await send("دمج ملفات PDF", "تم فتح استوديو");
    await send("افتح السيرة الذاتية", "تم فتح منشئ");
    await send("شغل البث", "تم فتح البث");
    await send("ودني الأخبار", "عناوين|العناوين");
    await send("وش الجو بجدة", "جدة|تعذّر جلب الطقس");
    await send("كم الساعة", "ص|م");
    await send("التاريخ الهجري", "14");
    await send("افتح الحاسبة ثم ذكرني بعد ساعتين أشرب موية", "حُفظ التذكير", true);
    await send("اسأل محسن ما هي عملية عاصفة الحزم؟", "موثّق ✓");
    assert.ok(await dialog.locator('a[href^="https://"]').count());
    await dialog.getByRole("button", { name: "إجابة غير مفيدة" }).click();
    await dialog.getByRole("button", { name: "ما فهمني — احفظ العبارة" }).click();
    assert.ok(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("waha-agent-feedback") || "[]").some(
          (x) => x.misunderstood,
        ),
      ),
    );
    assert.equal(await page.evaluate(() => localStorage.getItem("waha-agent-improve")), null);
    assert.ok(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("waha-agent-reminders") || "[]").every((x) => x.dueAt),
      ),
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.keyboard.press("Control+k");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("textbox", { name: "طلبك من محسن" }).waitFor();
    const small = await dialog.locator("button,a,input").evaluateAll((nodes) =>
      nodes
        .filter((n) => n.getClientRects().length)
        .map((n) => ({
          text: n.textContent || n.getAttribute("aria-label"),
          rect: n.getBoundingClientRect(),
        }))
        .filter((n) => n.rect.height < 43.5),
    );
    assert.deepEqual(small, []);
    await page.screenshot({ path: `/tmp/mohsen-agent-shots/${width}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
  }
  assert.deepEqual(report.errors, []);
} catch (e) {
  report.failure = String(e);
  if (currentPage) {
    report.failureText = await currentPage
      .locator('[role="dialog"]')
      .innerText()
      .catch(() => "no dialog");
    await currentPage.screenshot({ path: "/tmp/mohsen-agent-shots/failure.png" }).catch(() => {});
  }
  process.exitCode = 1;
} finally {
  await writeFile(output, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ checks: report.checks.length, failure: report.failure }));
