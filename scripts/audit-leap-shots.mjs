import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const base = process.argv[2] || "https://waha.hajdah.com";
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
const result = { base, pages: [], errors: [], console: [] };
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: true,
      locale: "ar-SA",
    });
    await context.addInitScript(
      (t) => localStorage.setItem("waha:settings:v1", JSON.stringify({ theme: t })),
      theme,
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") result.console.push(m.text());
    });
    for (const route of ["/", "/mohsen"]) {
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
      await page.waitForTimeout(250);
      const metrics = await page.evaluate(() => ({
        scrollY,
        headerTop: document.querySelector("header.sticky")?.getBoundingClientRect().top,
        width: document.documentElement.scrollWidth,
      }));
      result.pages.push({ theme, route, ...metrics });
      await page.screenshot({
        path: `/workspace/work/waha-leap-shots/live-${route === "/" ? "home" : "mohsen"}-${theme}-viewport-390.png`,
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile("docs/audits/leap-online-shots.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
if (
  result.errors.length ||
  result.console.length ||
  result.pages.some((p) => p.width > 390 || p.headerTop !== 0)
)
  process.exitCode = 1;
