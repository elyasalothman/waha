import { webkit } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/waha-round2";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await webkit.launch({
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
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: true,
  serviceWorkers: "block",
});
await context.addInitScript(() => localStorage.setItem("waha:theme", "dark"));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(15000);
const results = [];
async function check(name, fn) {
  try {
    await fn();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 393), true);
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message });
  }
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(results.at(-1));
}
await page.route("**/api.open-meteo.com/**", (route) =>
  route.fulfill({
    json: {
      current: {
        temperature_2m: 28,
        apparent_temperature: 29,
        relative_humidity_2m: 30,
        wind_speed_10m: 10,
        weather_code: 0,
      },
      hourly: {
        time: [new Date().toISOString().slice(0, 13) + ":00"],
        temperature_2m: [28],
        weather_code: [0],
      },
      daily: {
        time: Array.from({ length: 7 }, (_, i) => `2026-10-${18 + i}`),
        weather_code: Array(7).fill(0),
        temperature_2m_max: Array(7).fill(30),
        temperature_2m_min: Array(7).fill(20),
      },
    },
  }),
);
await check("home", async () => {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator("[data-superapp]").waitFor();
  await page.getByRole("button", { name: "صفحة 2", exact: true }).click();
  await page.getByRole("button", { name: "صفحة 1", exact: true }).click();
  await page.getByRole("searchbox").first().fill("حاسبة");
  await page.getByRole("link", { name: "الحاسبة", exact: true }).waitFor();
});
await check("weather", async () => {
  await page.goto(base + "/app/weather", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "سبعة أيام" }).waitFor();
  assert.equal((await page.getByText("صافٍ", { exact: true }).count()) >= 7, true);
});
await check("calculator", async () => {
  await page.goto(base + "/app/calc", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("textbox", { name: "العملية الحسابية" });
  await input.fill("٢+٣×٤");
  await input.press("Enter");
  await page.waitForFunction(
    () => document.querySelector('input[aria-label="العملية الحسابية"]')?.value === "14",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("٢+٣×٤ = 14", { exact: true }).waitFor();
});
await check("search", async () => {
  await page.route("**/ar.wikipedia.org/w/api.php*", (r) =>
    r.fulfill({ json: ["واحة", ["واحة"], [""], ["https://ar.wikipedia.org/wiki/واحة"]] }),
  );
  await page.goto(base + "/app/search", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "بحث واحة", exact: true }).fill("حصتي");
  await page.getByRole("link").filter({ hasText: "موسوعة" }).first().waitFor();
  await page.getByRole("button", { name: "بحث", exact: true }).click();
  await page.getByRole("link").filter({ hasText: "افتح في متصفح واحة" }).first().click();
  await page.getByRole("textbox", { name: "عنوان الموقع" }).waitFor();
});
await check("browser", async () => {
  await page.goto(base + "/app/browser", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("textbox", { name: "عنوان الموقع" });
  await input.fill("https://example.com");
  await page.getByRole("button", { name: "اذهب", exact: true }).click();
  await page.getByRole("button", { name: "☆ حفظ", exact: true }).click();
  await input.fill("https://example.org");
  await page.getByRole("button", { name: "اذهب", exact: true }).click();
  await page.getByRole("button", { name: "رجوع", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('input[aria-label="عنوان الموقع"]')?.value === "https://example.com/",
  );
  await page.getByRole("button", { name: "تبويب جديد +", exact: true }).click();
  await page.getByRole("button", { name: "تبويب 2", exact: true }).waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "المفضلة", exact: true }).click();
  await page.getByRole("button", { name: "https://example.com/", exact: true }).waitFor();
});
await check("camera", async () => {
  await page.goto(base + "/app/camera", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "فتح الكاميرا", exact: true }).waitFor();
  await page.getByRole("button", { name: "فتح الكاميرا", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "تعذر فتح الكاميرا" }).waitFor();
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("waha-camera", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").put({
          id: "webkit-fixture",
          at: "2026-10-18T12:00:00Z",
          data: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        });
        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "المعرض المحلي · 1" }).waitFor();
  await page.getByRole("link", { name: "تنزيل", exact: true }).waitFor();
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("heading", { name: "المعرض المحلي · 0" }).waitFor();
});
await writeFile(
  `${out}/report.json`,
  JSON.stringify(
    {
      base,
      viewport: "393x852",
      engine: "webkit",
      network:
        "weather/search mocked; camera permission denied and seeded IndexedDB restore/delete; dark mode; no real iPhone",
      results,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
process.exitCode = results.some((r) => !r.pass) || errors.length ? 1 : 0;
