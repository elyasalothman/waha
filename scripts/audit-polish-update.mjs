/** Real worker update on an isolated local origin; only a test revision comment changes. */
import { createServer } from "node:http";
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
let revision = 0;
const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const report = {
  test: "isolated real Service Worker update, synthetic revision comment",
  checks: [],
};
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/sw.js") {
      res.writeHead(200, { "content-type": "application/javascript", "cache-control": "no-store" });
      res.end(worker + "\n// audit revision " + revision);
      return;
    }
    const response = await fetch("http://127.0.0.1:8081" + req.url, { redirect: "manual" });
    const headers = Object.fromEntries(response.headers);
    for (const h of ["content-encoding", "content-length", "transfer-encoding", "connection"])
      delete headers[h];
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(502);
    res.end(String(e));
  }
});
await new Promise((resolve) => server.listen(8082, "127.0.0.1", resolve));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8082/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => !!navigator.serviceWorker.controller)) break;
    await page.waitForTimeout(250);
  }
  assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller));
  report.checks.push("initial worker controls page");
  revision++;
  await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    await r.update();
  });
  await page.getByRole("button", { name: "تحديث متاح", exact: true }).waitFor({ timeout: 30000 });
  report.checks.push("waiting worker offers explicit update");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.getByRole("button", { name: "تحديث متاح", exact: true }).click(),
  ]);
  assert.equal(await page.getByRole("button", { name: "تحديث متاح", exact: true }).count(), 0);
  assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller));
  report.checks.push("accepting update activates worker and reloads");
  console.log(JSON.stringify(report));
} catch (e) {
  report.failure = String(e);
  process.exitCode = 1;
  console.error(String(e));
} finally {
  await writeFile("/tmp/polish-update.json", JSON.stringify(report, null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
