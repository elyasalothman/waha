import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8181",
  out = process.argv[3] || "/tmp/waha-offline";
await mkdir(out, { recursive: true });
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
  const browser = await launcher.launch({
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
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    ignoreHTTPSErrors: true,
    hasTouch: true,
    isMobile: true,
  });
  const p = await context.newPage();
  p.setDefaultTimeout(20000);
  try {
    await p.goto(base + "/more", { waitUntil: "networkidle" });
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.getByRole("searchbox").waitFor();
    await p.getByRole("searchbox").fill("حصتي");
    await p.waitForFunction(() =>
      document.querySelector('section[aria-label="خدمات واحة"]')?.textContent?.includes("حصتي"),
    );
    results.push({
      engine,
      name: "visited public services catalog and search offline",
      pass: true,
    });
    await p.goto(base + "/", { waitUntil: "domcontentloaded" });
    assert.match(await p.locator("body").innerText(), /اتصال|إنترنت/);
    results.push({ engine, name: "uncached root shows offline fallback", pass: true });
    await p.screenshot({ path: `${out}/${engine}-offline.png` });
    await context.setOffline(false);
    await p.route("**/api/rates", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "unavailable" }),
      }),
    );
    await p.goto(base + "/app/currency", { waitUntil: "networkidle" });
    await p.getByText("تعذّر تحديث أسعار العملات.", { exact: true }).waitFor();
    assert.equal(await p.getByLabel("المبلغ", { exact: true }).count(), 0);
    results.push({
      engine,
      name: "unavailable exchange feed shows error, no fabricated price",
      pass: true,
    });
  } catch (e) {
    results.push({ engine, pass: false, error: e.message });
  } finally {
    await browser.close();
    await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
  }
}
console.log(JSON.stringify(results));
if (results.some((r) => !r.pass)) process.exitCode = 1;
