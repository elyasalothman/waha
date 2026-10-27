import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const out = "/workspace/work/waha-leap-shots";
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
const rows = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: true,
      locale: "ar-SA",
    });
    await context.addInitScript((t) => {
      localStorage.setItem("waha:settings:v1", JSON.stringify({ theme: t }));
    }, theme);
    const page = await context.newPage();
    const errors = [],
      consoleErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    for (const route of ["/", "/mohsen"]) {
      const response = await page.goto("https://waha.hajdah.com" + route, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.scrollingElement.scrollTop = 0;
      });
      await page.waitForTimeout(250);
      const file = `production-${route === "/" ? "home" : "mohsen"}-${theme}-390x844.png`;
      await page.screenshot({ path: `${out}/${file}`, fullPage: false });
      rows.push({
        route,
        theme,
        file,
        status: response.status(),
        errors: [...errors],
        consoleErrors: [...consoleErrors],
        ...(await page.evaluate(() => ({
          scrollY,
          scrollWidth: document.documentElement.scrollWidth,
          viewport: innerWidth,
          dark: document.documentElement.classList.contains("waha-dark"),
          header: document.querySelector("header")?.getBoundingClientRect().toJSON(),
        }))),
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${out}/production-shots.json`, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows));
}
