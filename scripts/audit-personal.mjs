import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:8081";
const out = process.argv[3] || "/tmp/waha-personal";
await mkdir(out, { recursive: true });
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
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const errors = [];
const checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
try {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("personal-seeded")) {
      localStorage.setItem("waha-quran-position", JSON.stringify({ surah: 20, ayah: 114 }));
      localStorage.setItem("waha:curated:alhajda:edition1", JSON.stringify({ chapter: 2 }));
      sessionStorage.setItem("personal-seeded", "1");
    }
  });
  assert.equal((await page.goto(base + "/today", { waitUntil: "networkidle" })).status(), 200);
  assert.deepEqual(
    await page.locator("[data-pillar]").evaluateAll((els) => els.map((e) => e.dataset.pillar)),
    ["faith", "news", "fun", "learn"],
  );
  pass("Four fixed ordered pillars");
  await page.getByRole("link", { name: "تابع وردك · 20:114", exact: true }).waitFor();
  await page.getByRole("link", { name: "تابع من موضعك", exact: true }).waitFor();
  pass("Real saved Quran and book positions");
  const h = page.locator('[data-hissati="weekly"]');
  assert.equal(await h.getAttribute("href"), "https://hissati.alhajda.com/app/weekly");
  assert.equal(await page.locator("iframe").count(), 0);
  pass("Hissati teacher entry uses existing external browser, no iframe");
  await page.getByRole("button", { name: "تخصيص البطاقات والمظهر", exact: true }).click();
  await page.getByLabel("سمة يومي", { exact: true }).selectOption("night");
  await page.getByLabel("حجم خط يومي", { exact: true }).selectOption("20");
  await page.getByRole("button", { name: "تثبيت حصص هذا الأسبوع", exact: true }).click();
  await page.getByRole("button", { name: "إخفاء حياة", exact: true }).click();
  assert.equal(await page.locator('[data-day-card="hayat"]').count(), 0);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-day-theme="night"]').waitFor();
  assert.equal(
    await page.locator(".personal-day").evaluate((el) => getComputedStyle(el).fontSize),
    "20px",
  );
  assert.equal(
    await page
      .locator('[data-pillar="learn"] [data-day-card]')
      .first()
      .getAttribute("data-day-card"),
    "hissati",
  );
  assert.equal(await page.locator('[data-day-card="hayat"]').count(), 0);
  pass("Theme, font, pins and hiding survive reload");
  await page.getByRole("button", { name: "تخصيص البطاقات والمظهر", exact: true }).click();
  await page.getByRole("button", { name: "إظهار حياة", exact: true }).click();
  await page.getByRole("button", { name: "استعادة الافتراضي", exact: true }).click();
  await page.getByRole("button", { name: "خفض متابعة القراءة", exact: true }).click();
  assert.equal(
    await page
      .locator('[data-pillar="learn"] [data-day-card]')
      .first()
      .getAttribute("data-day-card"),
    "knowledge",
  );
  pass("Touch reorder and restore hidden cards");
  await page.getByRole("button", { name: "أتممت التحدي", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "✓ أتممت ومضة اليوم", exact: true }).waitFor();
  pass("Wamda completion persisted");
  assert.equal(await page.locator('[aria-label="أهم ثلاثة عناوين"] li').count(), 3);
  pass("Three real news headlines");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: `${out}/today-${width}.png`, fullPage: true });
  }
  pass("Mobile and desktop without overflow");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "تخصيص البطاقات والمظهر", exact: true }).click();
  await page.getByLabel("سمة يومي", { exact: true }).selectOption("gold");
  await page.screenshot({ path: `${out}/gold.png`, fullPage: true });
  await page.getByLabel("سمة يومي", { exact: true }).selectOption("night");
  await page.screenshot({ path: `${out}/night.png`, fullPage: true });
  await page.getByRole("button", { name: "تخصيص البطاقات والمظهر", exact: true }).click();
  await page.evaluate(() => {
    document.documentElement.dir = "ltr";
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  pass("LTR layout without overflow");
  const links = await page.locator("[data-house-site]").count();
  assert.equal(links, 19);
  pass("Nineteen categorized house sites");
  assert.deepEqual(errors, []);
  pass("No uncaught JavaScript errors");
  await writeFile(
    out + "/report.json",
    JSON.stringify({ base, time: new Date().toISOString(), checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
