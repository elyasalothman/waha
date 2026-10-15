import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:8080";
const out = process.argv[3] || "/tmp/waha-news-audit";
await mkdir(out, { recursive: true });
const proxyUrl = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  ...(proxyUrl
    ? {
        proxy: {
          server: proxyUrl.origin,
          username: decodeURIComponent(proxyUrl.username),
          password: decodeURIComponent(proxyUrl.password),
          bypass: "localhost,127.0.0.1",
        },
      }
    : {}),
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
const check = (name, data = true) => {
  checks.push({ name, data });
  console.log("PASS", name);
};
try {
  for (const path of ["/", "/news", "/quran", "/ask"]) {
    const r = await page.goto(base + path, { waitUntil: "networkidle" });
    assert.equal(r.status(), 200);
    await page.waitForTimeout(600);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.equal(w, 390, `overflow ${path}`);
    assert.ok(await page.title());
    check(`HTTP/SEO/390px ${path}`, { status: r.status(), width: w, title: await page.title() });
    await page.screenshot({ path: out + "/" + (path.slice(1) || "home") + ".png", fullPage: true });
  }
  const feed = await context.request.get(base + "/api/news");
  assert.equal(feed.status(), 200);
  const data = await feed.json();
  assert.ok(data.items.length > 0);
  assert.equal(data.bulletin.mode, "extractive");
  assert.ok(data.bulletin.items.every((i) => data.bulletin.text.includes(i.source)));
  check("Live RSS and attributed bulletin", {
    items: data.items.length,
    sources: data.sources,
    updatedAt: data.bulletin.updatedAt,
  });
  const second = await (await context.request.get(base + "/api/news")).json();
  assert.equal(second.fetchedAt, data.fetchedAt);
  assert.equal(second.bulletin.updatedAt, data.bulletin.updatedAt);
  check("RSS cache and hourly bulletin stable");
  await page.goto(base + "/news", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "رياضة", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "رياضة", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  check("Category filter");
  await page.getByRole("button", { name: "الكل", exact: true }).click();
  await page.getByRole("link", { name: "اسأل محسن عن هذا الخبر" }).first().click();
  await page.waitForURL("**/ask?**");
  assert.ok((await page.getByLabel("سؤالك لمحسن").inputValue()).includes("https://"));
  check("News context reaches Mohsen");
  await page.getByLabel("سؤالك لمحسن").fill("مرحبا");
  await page.getByRole("button", { name: "إرسال", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('[role="log"] article').length >= 2,
    {},
    { timeout: 35000 },
  );
  assert.ok((await page.locator('[role="log"] article').last().innerText()).length > 10);
  check("Real guest Mohsen chat");
  const denied = await context.request.post(base + "/api/mohsen", {
    headers: { Origin: "https://evil.example" },
    data: { message: "hi" },
  });
  assert.equal(denied.status(), 403);
  check("Mohsen rejects foreign origins");
  await page.goto(base + "/quran", { waitUntil: "networkidle" });
  await page.getByLabel("السورة", { exact: true }).selectOption("112");
  await page.waitForURL("**surah=112**");
  await page.getByRole("button", { name: "حفظ الموضع · 2", exact: true }).click();
  await page.getByRole("button", { name: "قرأت آية +", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /متابعة آخر موضع/ }).waitFor();
  assert.ok(
    (await page.getByRole("button", { name: /متابعة آخر موضع/ }).innerText()).includes("2"),
  );
  assert.match(
    (await page.locator('[role="status"]').allTextContents()).join(" "),
    /1\s*\/\s*10\s*آيات/,
  );
  check("Quran position and daily wird survive reload");
  await page.getByRole("button", { name: /متابعة آخر موضع/ }).click();
  await page.waitForTimeout(400);
  assert.equal(
    await page
      .getByRole("button", { name: "حفظ الموضع · 2", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  check("Resume exact verse");
  await page.getByLabel("القارئ · حفص عن عاصم").selectOption("1");
  const audio = await page.locator("audio").getAttribute("src");
  assert.ok(audio.includes("112.mp3"));
  check("Reciter changes audio URL", audio);
  await page.getByRole("link", { name: "اسأل محسن عن التفسير" }).click();
  await page.waitForURL("**/ask?**");
  assert.ok((await page.getByLabel("سؤالك لمحسن").inputValue()).includes("أهل العلم"));
  check("Quran context and scholar reminder");
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "أتممت التحدي", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByRole("button", { name: "✓ أتممت ومضة اليوم", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  check("Daily challenge saved");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.locator(".news-ticker-track").evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  check("Reduced motion ticker");
  for (const path of ["/news", "/quran", "/ask"]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.evaluate(() => (document.documentElement.dir = "ltr"));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    check("LTR width " + path);
  }
  assert.deepEqual(errors, []);
  check("No uncaught JavaScript errors");
  await writeFile(
    out + "/report.json",
    JSON.stringify({ base, at: new Date().toISOString(), checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, out }, null, 2));
} catch (e) {
  await writeFile(
    out + "/report.json",
    JSON.stringify({ base, checks, errors, failure: String(e) }, null, 2),
  );
  throw e;
} finally {
  await browser.close();
}
