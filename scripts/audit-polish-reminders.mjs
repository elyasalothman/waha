import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:8081",
  out = process.argv[3] || "/tmp/polish-reminders.json";
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
  fixture:
    "Synthetic reminders in isolated browser storage only; no system notification permission.",
};
const reminder = {
  id: "polish-regression",
  text: "تذكير فحص التحميل المؤجل",
  createdAt: new Date().toISOString(),
  dueAt: new Date(Date.now() - 60000).toISOString(),
};
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await context.addInitScript((item) => {
    if (!sessionStorage.getItem("polish-seeded")) {
      localStorage.setItem("waha-agent-reminders", JSON.stringify([item]));
      sessionStorage.setItem("polish-seeded", "1");
    }
  }, reminder);
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .getByText("تذكير من محسن: " + reminder.text, { exact: true })
    .waitFor({ timeout: 12000 });
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.ok(
    await page.evaluate(() => JSON.parse(localStorage.getItem("waha-agent-reminders"))[0].notified),
  );
  report.checks.push("saved due reminder appears without opening conversation");
  await page.getByRole("button", { name: "إغلاق التذكير", exact: true }).click();
  await context.close();
  const fresh = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  const p = await fresh.newPage();
  const loaded = [];
  p.on("pageerror", (e) => report.errors.push(e.message));
  p.on("request", (r) => {
    if (/\/waha-agent-[^/]+\.js/.test(r.url())) loaded.push(r.url());
  });
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  assert.deepEqual(loaded, []);
  report.checks.push("conversation remains lazy when no reminders exist");
  const other = await fresh.newPage();
  await other.goto(base, { waitUntil: "networkidle" });
  await other.evaluate(
    (item) => localStorage.setItem("waha-agent-reminders", JSON.stringify([item])),
    { ...reminder, id: "polish-other-tab" },
  );
  await p.getByText("تذكير من محسن: " + reminder.text, { exact: true }).waitFor({ timeout: 20000 });
  assert.equal(await p.getByRole("dialog").count(), 0);
  report.checks.push("storage event restores reminder watcher from another tab");
  await fresh.close();
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} catch (e) {
  report.failure = String(e);
  process.exitCode = 1;
  console.error(String(e));
} finally {
  await writeFile(out, JSON.stringify(report, null, 2));
  await browser.close();
}
