import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const base = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, ""),
  output = process.argv[3] || "docs/audits/agent-local.json";
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
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
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const checks = [],
  failures = [],
  errors = [],
  network = [],
  consoleErrors = [],
  requestFailures = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("requestfailed", (r) =>
  requestFailures.push({ url: r.url(), error: r.failure()?.errorText }),
);
page.on("response", (r) => {
  if (r.status() >= 400) network.push({ url: r.url(), status: r.status() });
});
await mkdir("/tmp/waha-agent-audit", { recursive: true });
async function check(name, fn) {
  try {
    const detail = await fn();
    checks.push({ name, detail });
    console.log("PASS", name);
  } catch (e) {
    failures.push({ name, error: String(e) });
    console.log("FAIL", name, String(e));
    await page.screenshot({ path: `/tmp/waha-agent-audit/fail-${failures.length}.png` });
  }
}
async function home() {
  await page.goto(base);
  await page.waitForFunction(() => !!document.documentElement.dataset.density);
  await page.getByRole("button", { name: "✦ اطلب من واحة ⌘K", exact: true }).waitFor();
}
async function open() {
  if (!(await page.getByRole("dialog").isVisible()))
    await page.getByRole("button", { name: "فتح وكيل واحة", exact: true }).click();
}
async function send(text) {
  await open();
  await page.getByRole("textbox", { name: "طلبك من واحة" }).fill(text);
  await page.getByRole("button", { name: "نفّذ", exact: true }).click();
}
async function close() {
  await page.getByRole("button", { name: "إغلاق الوكيل" }).click();
}
await check("الرئيسية والودجات و390px", async () => {
  await home();
  await page.getByRole("region", { name: "آخر الأخبار" }).waitFor();
  assert((await page.getByText("الطقس ·").count()) > 0);
  assert(await page.getByText("موجز عناوين مسموع").isVisible());
  await page.screenshot({ path: "/tmp/waha-agent-audit/home.png", fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
await check("أمر الحساب المحلي بلا خادم", async () => {
  let requests = 0;
  const listener = (r) => {
    if (r.url().endsWith("/api/agent")) requests++;
  };
  page.on("request", listener);
  await send("كم ٢٥×٤");
  await page.getByText("الناتج: 100", { exact: true }).waitFor();
  assert.equal(requests, 0);
  await page.screenshot({ path: "/tmp/waha-agent-audit/agent.png" });
  page.off("request", listener);
});
await check("بحث واحة ونتائج قابلة للفتح", async () => {
  await send("ابحث عن القرآن");
  await page.getByText(/وجدت \d+ خدمات/).waitFor();
  assert((await page.getByRole("dialog").getByRole("button").count()) > 3);
});
await check("فتح الحاسبة فعليًا", async () => {
  await send("افتح الحاسبة");
  await page.waitForURL("**/app/calc");
  await page.getByText(/تم فتح/).waitFor();
  await close();
  await page.getByRole("heading", { name: /حاسبة/ }).first().waitFor();
});
await check("الملاحظة تتطلب تأكيدًا وتُحفظ ويمكن التراجع", async () => {
  await send("أضف ملاحظة اختبار وكيل واحة");
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:notes") || "[]").length),
    0,
  );
  await page.getByRole("button", { name: "تأكيد التغيير" }).click();
  await page.getByText("حُفظت الملاحظة محليًا").waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("waha:notes")).length), 1);
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("waha:notes")).length), 0);
});
await check("الوضع الليلي تأكيد وتراجع", async () => {
  await send("الوضع الليلي");
  await page.getByRole("button", { name: "تأكيد التغيير" }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("waha-dark"));
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await page.getByText("تم التراجع", { exact: true }).waitFor();
});
await check("فتح القرآن بالسورة والآية", async () => {
  await send("افتح سورة ٢ آية ٥");
  await page.waitForURL("**/quran?surah=2&ayah=5");
  await close();
  await page.locator("#ayah-5").waitFor();
});
await check("فتح البث عند المشغل", async () => {
  await send("شغل البث");
  await page.waitForURL("**/news#live-bulletin");
  await close();
  await page.locator("#live-bulletin").waitFor();
  assert(await page.getByRole("heading", { name: "بث واحة المباشر" }).isVisible());
});
await check("إعدادات المظهر والتخصيص والاستعادة", async () => {
  await page.goto(`${base}/settings`);
  await page.getByText("المظهر", { exact: true }).first().click();
  await page.getByLabel("المظهر", { exact: true }).selectOption("dark");
  await page.getByLabel("اللون المميز").selectOption("blue");
  await page.getByText("تخصيص الرئيسية", { exact: true }).click();
  await page.getByLabel("إظهار الطقس", { exact: true }).uncheck();
  await page.getByRole("button", { name: "رفع quran", exact: true }).click();
  await page.reload();
  await page.waitForFunction(() => document.documentElement.classList.contains("waha-dark"));
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).shortcuts[0]),
    "quran",
  );
  await home();
  assert.equal(await page.getByText("الطقس ·").count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "/tmp/waha-agent-audit/customized.png", fullPage: true });
});
await check("تغيير اللغة بالوكيل وتراجع RTL/LTR", async () => {
  await send("غير اللغة انجليزي");
  await page.getByRole("button", { name: "تأكيد التغيير" }).click();
  await page.waitForFunction(() => document.documentElement.dir === "ltr");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dir === "rtl");
  await close();
});
await check("set_setting عبر مسار بديل محاكى يطلب تأكيدًا", async () => {
  await page.route("**/api/agent", (route) =>
    route.fulfill({
      json: { command: { tool: "set_setting", args: { key: "accent", value: "purple" } } },
    }),
  );
  await send("أريد لونًا مختلفًا لو سمحت");
  await page.getByRole("button", { name: "تأكيد التغيير" }).waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).accent),
    "blue",
  );
  await page.getByRole("button", { name: "تأكيد التغيير" }).click();
  await page.getByRole("button", { name: "تراجع", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).accent),
    "purple",
  );
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await close();
  await page.unroute("**/api/agent");
});
await check("رد نموذج محاكى بأداة حذف يُرفض دون تنفيذ", async () => {
  await page.route("**/api/agent", (route) =>
    route.fulfill({ json: { command: { tool: "delete_data", args: {} } } }),
  );
  await send("نفذ عملية خاصة");
  await page.getByRole("dialog").getByRole("status").waitFor();
  assert.equal(await page.getByRole("button", { name: "تأكيد التغيير" }).count(), 0);
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).theme),
    "dark",
  );
  await close();
  await page.unroute("**/api/agent");
});
await check("الاستيراد التالف يُرفض دون فقد الإعدادات", async () => {
  await page.goto(`${base}/settings`);
  await page.getByText("الخصوصية والبيانات", { exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ theme: "pink" })),
  });
  await page.getByText("ملف إعدادات غير صالح؛ لم تُغيّر إعداداتك").waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha:settings:v1")).theme),
    "dark",
  );
  await home();
});
await check("تفضيل الليل للقراءة الجديدة والوكيل يحترم الغمر", async () => {
  await page.goto(`${base}/settings`);
  await page.getByText("القراءة", { exact: true }).click();
  await page.getByLabel("الوضع الليلي الافتراضي للكتب الجديدة").check();
  await page.goto(`${base}/books/alhajda`);
  await page.locator('[data-reader-theme="night"]').waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.readerControls === "hidden");
  assert.equal(
    await page.getByRole("button", { name: "فتح وكيل واحة", exact: true }).isVisible(),
    false,
  );
  await home();
});
await check("اختصار لوحة المفاتيح وEscape وحبس التركيز", async () => {
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Tab");
  assert(await page.evaluate(() => !!document.activeElement.closest("[role=dialog]")));
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
});
await check("حدود API: رفض الأصل والطلب التالف", async () => {
  const status = await page.evaluate(async () => {
    const r = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    return r.status;
  });
  assert.equal(status, 400);
  const r = await context.request.post(`${base}/api/agent`, {
    data: { message: "hello" },
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(r.status(), 403);
});
const realFallback = await page.evaluate(async () => {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "من فضلك خذني للآلة الحاسبة الموجودة في واحة" }),
      signal: AbortSignal.timeout(30000),
    });
    return { status: response.status, body: await response.json() };
  } catch (error) {
    return { error: String(error) };
  }
});
await check("عدم وجود استثناءات JavaScript", async () => assert.deepEqual(errors, []));
await mkdir(output.slice(0, output.lastIndexOf("/")) || ".", { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    {
      base,
      at: new Date().toISOString(),
      viewport: "390x844",
      checks,
      failures,
      errors,
      network,
      realFallback,
      consoleErrors,
      requestFailures,
      testProxyTLSException: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
      limitations:
        "متصفح Chromium محاكى؛ لا إثبات iPhone أو ميكروفون فعلي. لم تُحاكَ بيانات الطقس والأخبار.",
    },
    null,
    2,
  ),
);
await browser.close();
if (failures.length) process.exitCode = 1;
