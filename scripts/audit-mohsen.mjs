import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:8080";
const output = process.argv[3] || "/tmp/waha-mohsen-live.json";
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
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
try {
  await page.goto(base);
  await page.getByRole("button", { name: "فتح وكيل واحة", exact: true }).click();
  async function send(message) {
    await page.getByRole("textbox", { name: "طلبك من واحة" }).fill(message);
    await page.getByRole("button", { name: "نفّذ", exact: true }).click();
  }
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/agent") && r.request().method() === "POST",
    { timeout: 45000 },
  );
  await send("ما عاصمة السعودية؟");
  const response = await responsePromise;
  const body = await response.json();
  assert.equal(response.status(), 200);
  assert.equal(body.unavailable, undefined);
  assert.match(body.reply, /الرياض/);
  await page.getByRole("dialog").getByText(body.reply, { exact: true }).waitFor();
  checks.push({ name: "رد محسن الحقيقي في اللوحة", status: response.status(), body });
  await page.route("**/api/agent", (route) => route.abort());
  await send("سؤال لا يفهم محليًا");
  await page
    .getByRole("dialog")
    .getByText(/محسن غير متاح الآن/)
    .waitFor();
  checks.push({ name: "انقطاع API محاكى ورسالة لطيفة", ok: true });
  await send("كم ٢٥×٤");
  await page.getByRole("dialog").getByText("الناتج: 100", { exact: true }).waitFor();
  checks.push({ name: "الحساب المحلي يعمل بعد الانقطاع", ok: true });
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "/tmp/waha-mohsen.png" });
} finally {
  await writeFile(output, JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
console.log(JSON.stringify(checks));
